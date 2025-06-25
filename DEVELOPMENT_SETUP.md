# Trend Backend - Development Setup Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Development Workflow](#development-workflow)
6. [Testing Setup](#testing-setup)
7. [Code Quality Tools](#code-quality-tools)
8. [IDE Configuration](#ide-configuration)
9. [Debugging](#debugging)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

#### Node.js and npm
```bash
# Install Node.js 18+ (LTS recommended)
# Download from: https://nodejs.org/

# Verify installation
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

#### PostgreSQL
```bash
# Option 1: Install locally
# macOS (using Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# Windows
# Download from: https://www.postgresql.org/download/windows/

# Option 2: Use Docker (recommended for development)
docker pull postgres:15
```

#### Git
```bash
# Verify Git installation
git --version

# Configure Git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Optional Tools

#### Docker & Docker Compose
```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop/

# Verify installation
docker --version
docker-compose --version
```

#### VS Code Extensions (Recommended)
- **Prisma** (for schema syntax highlighting)
- **ESLint** (for code linting)
- **Prettier** (for code formatting)
- **Thunder Client** (for API testing)
- **GitLens** (for Git integration)

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd trend-backend

# Install dependencies
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env  # or use your preferred editor
```

**Required Environment Variables:**
```bash
# Database
DATABASE_URL="postgresql://trend_user:trend_password@localhost:5432/trend_dev"

# JWT Authentication
JWT_SECRET="your-development-jwt-secret"
JWT_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
PORT=3001
API_PREFIX="api/v1"
```

### 3. Database Setup
```bash
# Option 1: Using Docker (Recommended)
docker-compose up -d postgres

# Option 2: Local PostgreSQL
createdb trend_dev

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed system categories
npm run seed:categories
```

### 4. Start Development Server
```bash
npm run start:dev
```

🎉 **Success!** API available at: `http://localhost:3001/api/v1`

## Environment Configuration

### Development Environment Variables

Create `.env` file in project root:

```bash
# ==============================================
# DATABASE CONFIGURATION
# ==============================================
DATABASE_URL="postgresql://trend_user:trend_password@localhost:5432/trend_dev"

# ==============================================
# JWT CONFIGURATION  
# ==============================================
JWT_SECRET="dev-jwt-secret-change-in-production"
JWT_EXPIRES_IN="7d"

# ==============================================
# APPLICATION CONFIGURATION
# ==============================================
NODE_ENV="development"
PORT=3001
API_PREFIX="api/v1"

# ==============================================
# OPTIONAL DEVELOPMENT SETTINGS
# ==============================================
# Enable detailed Prisma logging
DATABASE_LOGGING="true"

# CORS settings for frontend development
CORS_ORIGIN="http://localhost:3000"

# Rate limiting (development)
THROTTLE_TTL=60000
THROTTLE_LIMIT=1000

# Logging level
LOG_LEVEL="debug"
```

### Environment Validation

The application validates required environment variables at startup:

```typescript
// Validated variables
- DATABASE_URL: Must be valid PostgreSQL connection string
- JWT_SECRET: Required for authentication
- NODE_ENV: Determines application behavior
- PORT: Application port (defaults to 3001)
```

## Database Setup

### Using Docker (Recommended)

#### 1. Start Database Services
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Check services status
docker-compose ps

# View logs
docker-compose logs -f postgres
```

#### 2. Database Management
```bash
# Stop services
docker-compose down

# Remove data (⚠️ destroys all data)
docker-compose down -v

# Restart specific service
docker-compose restart postgres
```

### Local PostgreSQL Setup

#### 1. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE trend_dev;
CREATE USER trend_user WITH PASSWORD 'trend_password';
GRANT ALL PRIVILEGES ON DATABASE trend_dev TO trend_user;
\q
```

#### 2. Update Connection String
```bash
DATABASE_URL="postgresql://trend_user:trend_password@localhost:5432/trend_dev"
```

### Prisma Operations

#### Essential Commands
```bash
# Generate Prisma client (after schema changes)
npm run db:generate

# Create and apply migration
npm run db:migrate

# Open Prisma Studio (Database GUI)
npm run db:studio

# Reset database (⚠️ Development only)
npm run db:reset

# Seed system categories
npm run seed:categories
```

#### Advanced Operations
```bash
# Deploy migrations (production)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Create migration without applying
npx prisma migrate dev --create-only

# Pull database schema to Prisma
npx prisma db pull
```

## Development Workflow

### Daily Development Process

#### 1. Start Development Environment
```bash
# Start database services
docker-compose up -d postgres

# Start development server with hot reload
npm run start:dev
```

#### 2. Making Changes

**Code Changes:**
- Edit TypeScript files in `/src`
- Hot reload automatically restarts server
- Check console for compilation errors

**Database Schema Changes:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npm run db:migrate
# 3. Regenerate client
npm run db:generate
```

**Adding New Dependencies:**
```bash
# Install package
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Update package.json scripts if needed
```

#### 3. Testing Changes
```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e
```

### API Testing

#### Using Thunder Client (VS Code)
1. Install Thunder Client extension
2. Create new request
3. Set URL: `http://localhost:3001/api/v1/health`
4. Test authentication endpoints first

#### Using curl
```bash
# Health check
curl http://localhost:3001/api/v1/health

# Register user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "password123"
  }'

# Login and get token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Use authenticated endpoint
curl -X GET http://localhost:3001/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing Setup

### Test Configuration

The project uses **Jest** for testing with the following configuration:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

### Running Tests

#### Unit Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run specific test file
npm run test -- auth.service.spec.ts

# Run tests with coverage report
npm run test:cov
```

#### End-to-End Tests
```bash
# Run e2e tests
npm run test:e2e

# Run e2e tests with debugging
npm run test:e2e -- --runInBand
```

#### Test Database Setup
For integration tests, you may want a separate test database:

```bash
# Create test database
createdb trend_test

# Set test environment variable
TEST_DATABASE_URL="postgresql://trend_user:trend_password@localhost:5432/trend_test"
```

### Writing Tests

#### Example Service Test
```typescript
// auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## Code Quality Tools

### ESLint Configuration

The project includes ESLint for code quality:

```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Lint specific files
npx eslint src/auth/**/*.ts
```

### Prettier Configuration

Code formatting with Prettier:

```bash
# Format all files
npm run format

# Check formatting
npx prettier --check "src/**/*.ts"

# Format specific files
npx prettier --write src/auth/auth.service.ts
```

### Git Hooks (Optional)

Set up pre-commit hooks for code quality:

```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run test"
```

## IDE Configuration

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

### Recommended Extensions

Install these VS Code extensions:

```bash
# Prisma support
code --install-extension Prisma.prisma

# ESLint
code --install-extension dbaeumer.vscode-eslint

# Prettier
code --install-extension esbenp.prettier-vscode

# Thunder Client (API testing)
code --install-extension rangav.vscode-thunder-client

# GitLens
code --install-extension eamodio.gitlens
```

### Debugging Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug NestJS",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/main.ts",
      "args": [],
      "runtimeArgs": ["-r", "ts-node/register"],
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal"
    }
  ]
}
```

## Debugging

### Application Debugging

#### 1. Debug Mode
```bash
# Start with debugging enabled
npm run start:debug

# Attach debugger on port 9229
```

#### 2. Prisma Query Debugging
```bash
# Enable Prisma query logging
DATABASE_URL="postgresql://user:pass@localhost:5432/db?logging=true"

# Or in code
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

#### 3. Database Debugging
```bash
# Open Prisma Studio
npm run db:studio

# Connect directly to database
psql -h localhost -U trend_user -d trend_dev

# View table structure
\d+ users
\d+ transactions
```

### Common Debug Scenarios

#### Authentication Issues
```bash
# Check JWT token
node -e "console.log(require('jsonwebtoken').decode('YOUR_TOKEN'))"

# Verify user exists
psql -d trend_dev -c "SELECT id, email, isActive FROM users WHERE email='test@example.com';"
```

#### Database Connection Issues
```bash
# Test connection
npx prisma db push --preview-feature

# Check Docker container
docker-compose ps
docker-compose logs postgres
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Use different port
PORT=3002 npm run start:dev
```

#### Prisma Client Issues
```bash
# Regenerate Prisma client
npm run db:generate

# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run db:generate
```

#### Database Migration Issues
```bash
# Check migration status
npx prisma migrate status

# Reset database (development only)
npm run db:reset

# Manual migration resolution
npx prisma migrate resolve --applied <migration-name>
```

#### Environment Variable Issues
```bash
# Check loaded environment variables
node -e "console.log(process.env)" | grep -E "(DATABASE_URL|JWT_SECRET)"

# Verify .env file exists and is properly formatted
cat .env
```

### Getting Help

#### Health Checks
```bash
# Check application health
curl http://localhost:3001/api/v1/health

# Check database connectivity
curl http://localhost:3001/api/v1/health/ping
```

#### Log Analysis
```bash
# Check application logs
# Logs are output to console in development mode

# Check Docker logs
docker-compose logs -f postgres
```

#### Database Inspection
```bash
# Open Prisma Studio
npm run db:studio

# Connect to database directly
psql -h localhost -U trend_user -d trend_dev

# Check table contents
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM categories WHERE "isSystem" = true;
```

## Additional Resources

### Documentation
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

### Development Tools
- [Prisma Studio](https://www.prisma.io/studio)
- [Thunder Client](https://www.thunderclient.com/)
- [Postman](https://www.postman.com/)
- [pgAdmin](https://www.pgadmin.org/) (PostgreSQL GUI)

### Community
- [NestJS Discord](https://discord.gg/G7Qnnhy)
- [Prisma Community](https://www.prisma.io/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/nestjs)

---

**Happy Development!** 🚀

**Last Updated**: January 2025  
**Version**: 1.0.0
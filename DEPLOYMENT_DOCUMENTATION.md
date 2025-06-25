# Trend Backend - Environment Configuration & Deployment Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Environment Variables](#environment-variables)
3. [Development Setup](#development-setup)
4. [Database Configuration](#database-configuration)
5. [Docker Configuration](#docker-configuration)
6. [Production Deployment](#production-deployment)
7. [Available NPM Scripts](#available-npm-scripts)
8. [Configuration Management](#configuration-management)
9. [Health Monitoring](#health-monitoring)
10. [Security Configurations](#security-configurations)
11. [Performance Optimizations](#performance-optimizations)
12. [Troubleshooting](#troubleshooting)

## Project Overview

**Trend Backend** is an AI-powered budget and expense tracking API built with:
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **Cache**: Redis (configured in docker-compose)
- **Language**: TypeScript
- **API Documentation**: Swagger/OpenAPI

### Key Features
- User authentication and authorization with JWT
- Budget management with comprehensive analytics
- Transaction tracking with AI categorization support and subcategories
- Hierarchical category system (8 main + 30+ subcategories)
- Discretionary spending analysis with insights
- User onboarding with tutorial progress tracking
- Health monitoring and diagnostics
- Rate limiting with throttling

## Environment Variables

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://trend_user:trend_password@localhost:5432/trend_dev"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Application Configuration
NODE_ENV="development"
PORT=3001
API_PREFIX="api/v1"
```

### Environment Variable Descriptions

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `JWT_SECRET` | Secret key for JWT token signing | - | ✅ |
| `JWT_EXPIRES_IN` | JWT token expiration time | "7d" | ✅ |
| `NODE_ENV` | Application environment | "development" | ✅ |
| `PORT` | Application port | 3001 | ✅ |
| `API_PREFIX` | API route prefix | "api/v1" | ✅ |

### Environment-Specific Configurations

#### Development Environment
```bash
NODE_ENV="development"
PORT=3001
DATABASE_URL="postgresql://trend_user:trend_password@localhost:5432/trend_dev"
JWT_SECRET="dev-jwt-secret-key"
```

#### Production Environment
```bash
NODE_ENV="production"
PORT=3001
DATABASE_URL="postgresql://prod_user:secure_password@prod-db:5432/trend_prod"
JWT_SECRET="your-highly-secure-production-jwt-secret-key-with-256-bits"
```

## Development Setup

### Prerequisites
- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **PostgreSQL**: >= 15.x
- **Docker & Docker Compose**: (optional, for containerized setup)

### Quick Start

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd trend-backend
npm install
```

2. **Setup Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Database Services**
```bash
docker-compose up -d postgres redis
```

4. **Setup Database**
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed system categories
npm run seed:categories
```

5. **Start Development Server**
```bash
npm run start:dev
```

The application will be available at `http://localhost:3001/api/v1`

### Development Workflow

1. **Code Changes**: Use `npm run start:dev` for hot reload
2. **Database Changes**: 
   - Modify `prisma/schema.prisma`
   - Run `npm run db:migrate`
   - Run `npm run db:generate`
3. **Testing**: Use `npm run test` or `npm run test:watch`
4. **Linting**: Use `npm run lint` to fix code style issues

## Database Configuration

### Database Schema

The application uses **PostgreSQL** with **Prisma ORM**. Key models include:

- **User**: User accounts with authentication and profile data
- **Budget**: Budget management with analytics
- **Category**: Hierarchical expense/income categories
- **Transaction**: Financial transactions with AI categorization

### Database Management Commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create and apply new migration
npm run db:migrate

# Open Prisma Studio (Database GUI)
npm run db:studio

# Reset database (⚠️ Destructive)
npm run db:reset

# Seed system categories
npm run seed:categories
```

### Migration Strategy

1. **Development**: Use `npm run db:migrate` for automatic migrations
2. **Production**: Use `npx prisma migrate deploy` for production deployments
3. **Rollback**: Use Prisma's migration system for safe rollbacks

### Database Connection Health

The application includes database health checks:
- Health endpoint: `GET /api/v1/health`
- Database connectivity monitoring
- Connection pooling through Prisma

## Docker Configuration

### Services Overview

The `docker-compose.yml` configures two services:

#### PostgreSQL Database
```yaml
postgres:
  image: postgres:15
  container_name: trend-db
  environment:
    POSTGRES_DB: trend_dev
    POSTGRES_USER: trend_user
    POSTGRES_PASSWORD: trend_password
  ports:
    - "5432:5432"
```

#### Redis Cache
```yaml
redis:
  image: redis:7-alpine
  container_name: trend-redis
  ports:
    - "6379:6379"
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres

# View logs
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Remove volumes (⚠️ Data loss)
docker-compose down -v
```

### Containerizing the Application

Create a `Dockerfile` for the application:

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

## Production Deployment

### Production Checklist

#### Security
- [ ] Change JWT_SECRET to a secure 256-bit key
- [ ] Use secure database credentials
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Use environment variables for secrets

#### Database
- [ ] Use managed PostgreSQL service (AWS RDS, Google Cloud SQL)
- [ ] Configure connection pooling
- [ ] Set up database backups
- [ ] Configure read replicas (if needed)

#### Performance
- [ ] Enable Redis caching
- [ ] Configure rate limiting
- [ ] Set up CDN for static assets
- [ ] Configure compression middleware

#### Monitoring
- [ ] Set up application monitoring (New Relic, DataDog)
- [ ] Configure log aggregation
- [ ] Set up health check endpoints
- [ ] Configure alerting

### Deployment Strategies

#### 1. Traditional Server Deployment

```bash
# On production server
git clone <repository>
cd trend-backend
npm ci --production
npm run build
npm run db:migrate
npm run start:prod
```

#### 2. Docker Deployment

```bash
# Build and run with Docker
docker build -t trend-backend .
docker run -d \
  --name trend-api \
  -p 3001:3001 \
  --env-file .env.production \
  trend-backend
```

#### 3. Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trend-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: trend-backend
  template:
    metadata:
      labels:
        app: trend-backend
    spec:
      containers:
      - name: trend-backend
        image: trend-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: trend-secrets
              key: database-url
```

### Environment-Specific Configurations

#### Production Environment Variables
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://prod_user:secure_pass@prod-db:5432/trend_prod
JWT_SECRET=your-256-bit-production-secret
JWT_EXPIRES_IN=7d
API_PREFIX=api/v1

# Additional production configs
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100
LOG_LEVEL=info
```

## Available NPM Scripts

### Development Scripts
| Script | Purpose | Usage |
|--------|---------|-------|
| `start:dev` | Start with hot reload | Development |
| `start:debug` | Start with debugging | Debugging |
| `build` | Compile TypeScript | Build process |
| `start` | Start without watch | Testing build |
| `start:prod` | Start production build | Production |

### Database Scripts
| Script | Purpose | Usage |
|--------|---------|-------|
| `db:generate` | Generate Prisma client | After schema changes |
| `db:migrate` | Run database migrations | Development |
| `db:studio` | Open Prisma Studio | Database GUI |
| `db:seed` | Run database seeding | Initial setup |
| `db:reset` | Reset database | ⚠️ Development only |
| `seed:categories` | Seed system categories | Setup |

### Testing Scripts
| Script | Purpose | Usage |
|--------|---------|-------|
| `test` | Run all tests | CI/CD |
| `test:watch` | Run tests in watch mode | Development |
| `test:cov` | Run tests with coverage | Quality checks |
| `test:debug` | Debug tests | Debugging |
| `test:e2e` | Run end-to-end tests | Integration testing |

### Code Quality Scripts
| Script | Purpose | Usage |
|--------|---------|-------|
| `lint` | Lint and fix code | Code quality |
| `format` | Format code with Prettier | Code formatting |

## Configuration Management

### NestJS Configuration

The application uses NestJS ConfigModule for configuration management:

```typescript
// app.module.ts
ConfigModule.forRoot({
  isGlobal: true, // Makes config available globally
})
```

### Configuration Structure

```typescript
// Configuration access pattern
constructor(private configService: ConfigService) {}

// Usage
const jwtSecret = this.configService.get<string>('JWT_SECRET');
const dbUrl = this.configService.get<string>('DATABASE_URL');
```

### Validation

Environment variables are validated at startup:
- Required variables cause startup failure if missing
- Type validation ensures correct data types
- Default values provided where appropriate

## Health Monitoring

### Health Check Endpoints

#### Basic Health Check
```
GET /api/v1/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": {
    "status": "connected",
    "responseTime": 15
  },
  "memory": {
    "used": 45,
    "total": 128,
    "percentage": 35
  }
}
```

#### Ping Endpoint
```
GET /api/v1/health/ping
```

Response:
```json
{
  "message": "pong",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Monitoring Metrics

The health service provides:
- **Database connectivity**: Connection status and response time
- **Memory usage**: Heap usage and percentages
- **Application uptime**: Process uptime tracking
- **Response times**: Database query performance

### Logging Configuration

```typescript
// Prisma logging configuration
new PrismaClient({
  log: ['error', 'warn'], // Production logging
  // log: ['query', 'info', 'warn', 'error'], // Development logging
})
```

## Security Configurations

### Authentication & Authorization

#### JWT Configuration
```typescript
// JWT Strategy configuration
{
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: process.env.JWT_SECRET,
}
```

#### JWT Token Structure
```typescript
interface JwtPayload {
  sub: string;      // User ID
  email: string;    // User email
  username?: string; // Optional username
  iat?: number;     // Issued at
  exp?: number;     // Expiration
}
```

### Rate Limiting

```typescript
// Throttling configuration
ThrottlerModule.forRoot([{
  ttl: 60000,    // 1 minute window
  limit: 100,    // 100 requests per window
}])
```

### CORS Configuration

```typescript
// In main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Data Validation

```typescript
// Global validation pipe
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,    // Strip unknown properties
    transform: true,    // Transform to DTO types
  })
);
```

### Security Headers

Recommended security headers for production:

```typescript
// Install helmet: npm install helmet
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
```

## Performance Optimizations

### Database Optimizations

#### Connection Pooling
```typescript
// Prisma connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

#### Query Optimization
- **Indexes**: Applied on frequently queried fields
- **Eager Loading**: Using Prisma's `include` strategically
- **Pagination**: Implemented cursor-based pagination
- **Query batching**: Using Prisma's batch operations

### Application Optimizations

#### Memory Management
- Proper connection cleanup in `onModuleDestroy`
- Efficient data transformation
- Proper error handling to prevent memory leaks

#### Caching Strategy
- Redis integration for session caching
- Application-level caching for frequent queries
- HTTP caching headers for static responses

### Production Optimizations

```bash
# Build optimization
npm run build

# Process management with PM2
npm install -g pm2
pm2 start dist/main.js --name trend-api
pm2 startup
pm2 save
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Issues

**Problem**: `Can't reach database server`

**Solutions**:
```bash
# Check database status
docker-compose ps

# Restart database
docker-compose restart postgres

# Check connection string
echo $DATABASE_URL

# Test connection
npx prisma db push --preview-feature
```

#### 2. Prisma Client Issues

**Problem**: `PrismaClientInitializationError`

**Solutions**:
```bash
# Regenerate Prisma client
npm run db:generate

# Reset database schema
npm run db:reset

# Apply pending migrations
npm run db:migrate
```

#### 3. JWT Authentication Issues

**Problem**: `UnauthorizedException`

**Solutions**:
- Verify JWT_SECRET is set correctly
- Check token expiration
- Ensure Bearer token format: `Authorization: Bearer <token>`
- Verify user exists and is active

#### 4. Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::3001`

**Solutions**:
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Use different port
PORT=3002 npm run start:dev
```

#### 5. Migration Issues

**Problem**: Migration fails or database out of sync

**Solutions**:
```bash
# Check migration status
npx prisma migrate status

# Resolve conflicts
npx prisma migrate resolve --applied <migration-name>

# Force reset (⚠️ Development only)
npm run db:reset
```

### Debugging Techniques

#### 1. Enable Detailed Logging
```bash
# Set log level
LOG_LEVEL=debug npm run start:dev

# Enable Prisma query logging
DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public&logging=true"
```

#### 2. Health Check Debugging
```bash
# Check application health
curl http://localhost:3001/api/v1/health

# Check database connectivity
curl http://localhost:3001/api/v1/health/ping
```

#### 3. Database Debugging
```bash
# Open Prisma Studio
npm run db:studio

# Check database directly
psql -h localhost -U trend_user -d trend_dev
```

### Performance Issues

#### Memory Leaks
- Monitor memory usage via health endpoint
- Use `process.memoryUsage()` for debugging
- Check for unclosed database connections

#### Slow Queries
- Enable Prisma query logging
- Use database query analysis tools
- Implement proper indexing

#### High CPU Usage
- Profile with Node.js built-in profiler
- Check for infinite loops or heavy computations
- Optimize expensive operations

### Deployment Issues

#### Environment Variables
```bash
# Verify all required env vars are set
node -e "console.log(process.env)" | grep -E "(DATABASE_URL|JWT_SECRET|NODE_ENV)"
```

#### Docker Issues
```bash
# Check container logs
docker-compose logs -f trend-backend

# Check container status
docker-compose ps

# Rebuild containers
docker-compose build --no-cache
```

### Getting Help

1. **Check Logs**: Always check application and database logs first
2. **Health Endpoints**: Use `/health` and `/health/ping` for diagnostics
3. **Database Studio**: Use Prisma Studio for database inspection
4. **Environment Check**: Verify all environment variables are set correctly
5. **Documentation**: Refer to NestJS, Prisma, and PostgreSQL documentation

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)

---

**Last Updated**: June 2024
**Version**: 1.0.0
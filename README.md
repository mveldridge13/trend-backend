# Trend Backend API

> **AI-Powered Budget and Expense Tracking API** built with NestJS, TypeScript, and PostgreSQL

A comprehensive financial management backend that provides sophisticated transaction tracking, budgeting, hierarchical category management, and user onboarding features designed for mobile-first applications.

---

## 🌟 Features

### 💰 **Financial Management**
- **Transaction Tracking**: Complete CRUD operations with advanced filtering and analytics
- **Budget Management**: Create, track, and analyze budgets with real-time performance metrics
- **Goals System**: Comprehensive goal tracking with smart suggestions, progress analytics, and automated contributions
- **Category System**: Hierarchical categories (30+ predefined subcategories across 8 main categories)
- **Multi-Currency Support**: USD with extensible currency framework
- **AI-Ready**: Prepared for AI categorization with confidence tracking

### 🔐 **Authentication & Security**
- **JWT Authentication**: Secure token-based authentication with 7-day expiration
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Rate Limiting**: 100 requests per minute protection
- **User Management**: Registration, login, profile management, and account deactivation

### 📱 **Mobile-Optimized**
- **User Onboarding**: Progressive tutorial system with completion tracking
- **CORS Enabled**: Ready for React Native integration
- **Comprehensive API**: RESTful endpoints with consistent response formats
- **Real-time Analytics**: Financial insights and spending patterns

### 🏗️ **Architecture**
- **NestJS Framework**: Modular, scalable, and maintainable architecture
- **PostgreSQL + Prisma**: Type-safe database operations with migrations
- **Docker Support**: Containerized development environment
- **Health Monitoring**: Application and database health endpoints

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Docker (optional, for containerized development)

### 1. Clone and Install
```bash
git clone <repository-url>
cd trend-backend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your database and JWT configuration
```

### 3. Database Setup
```bash
# Start PostgreSQL with Docker (optional)
docker-compose up -d

# Run database migrations and seed data
npm run db:migrate
npm run db:seed
```

### 4. Start Development Server
```bash
npm run start:dev
```

The API will be available at `http://localhost:3001`

**API Documentation**: `http://localhost:3001/api` (Swagger UI)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[API Documentation](./API_DOCUMENTATION.md)** | Complete API reference with endpoints, schemas, and examples |
| **[Database Schema](./DATABASE_DOCUMENTATION.md)** | Comprehensive database models, relationships, and design patterns |
| **[Authentication Guide](./AUTHENTICATION_DOCUMENTATION.md)** | Security implementation, JWT flow, and auth endpoints |
| **[Deployment Guide](./DEPLOYMENT_DOCUMENTATION.md)** | Environment setup, deployment strategies, and configuration |
| **[Day-Time Patterns Guide](./DAY_TIME_PATTERNS_DOCUMENTATION.md)** | Comprehensive guide to spending pattern analysis and behavioral insights |
| **[Goals System Guide](./GOALS_SYSTEM_DOCUMENTATION.md)** | Complete guide to financial goals, debt payoff tracking, and AI-powered suggestions |

---

## 🛠️ Available Scripts

### Development
```bash
npm run start:dev      # Start development server with hot reload
npm run start:debug    # Start with debugging enabled
npm run build          # Build for production
npm run start:prod     # Start production server
```

### Database
```bash
npm run db:migrate     # Run Prisma migrations
npm run db:seed        # Seed database with system categories
npm run db:studio      # Open Prisma Studio (database GUI)
npm run db:generate    # Generate Prisma client
```

### Testing & Quality
```bash
npm run test           # Run unit tests
npm run test:e2e       # Run end-to-end tests
npm run test:cov       # Run tests with coverage
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

---

## 🏗️ Architecture Overview

### Technology Stack
- **Backend**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport.js
- **Validation**: class-validator/class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

### Project Structure
```
src/
├── auth/              # Authentication module (JWT, guards, strategies)
├── users/             # User management (profiles, onboarding)
├── transactions/      # Transaction CRUD and analytics
├── budgets/           # Budget management and tracking
├── goals/             # Goals system with smart suggestions and analytics
├── categories/        # Hierarchical category system
├── database/          # Prisma service and base repository
└── health/            # Application health monitoring
```

### Core Modules
- **Auth Module**: JWT authentication, user registration/login
- **Users Module**: Profile management, onboarding flow
- **Transactions Module**: Financial transaction CRUD with analytics
- **Budgets Module**: Budget lifecycle management
- **Goals Module**: Financial goal tracking with AI-powered suggestions and progress analytics
- **Categories Module**: Hierarchical expense categorization
- **Database Module**: Prisma ORM with custom repository pattern

---

## 🔌 API Overview

### Base URL
```
http://localhost:3001/api/v1
```

### Key Endpoints

#### Authentication
```bash
POST /auth/register     # User registration
POST /auth/login        # User authentication
GET  /auth/profile      # Get user profile (protected)
PUT  /auth/profile      # Update user profile (protected)
```

#### Transactions
```bash
GET  /transactions                        # List with filtering
POST /transactions                        # Create transaction
GET  /transactions/analytics              # Financial analytics
GET  /transactions/discretionary-breakdown # Discretionary spending analysis
GET  /transactions/day-time-patterns      # Day/time spending pattern analysis
GET  /transactions/summary                # Transaction summary
```

#### Budgets
```bash
GET  /budgets           # List user budgets
POST /budgets           # Create budget
GET  /budgets/:id/analytics # Budget performance
```

#### Goals
```bash
GET  /goals             # List user goals with filtering
POST /goals             # Create new goal
GET  /goals/:id         # Get specific goal details
POST /goals/:id/contribute # Add contribution to goal
GET  /goals/suggestions # Get AI-powered goal suggestions
GET  /goals/analytics   # Goals progress analytics
```

#### Categories
```bash
GET  /categories        # List categories
GET  /categories/system # System categories
GET  /categories/:id/analytics # Category analytics
```

---

## 💾 Database Design

### Core Models
- **User**: Authentication, profile, onboarding status
- **Transaction**: Financial transactions with rich metadata
- **Budget**: Budget management with status tracking
- **Goal**: Financial goals with progress tracking, contributions, and reminders
- **Category**: Hierarchical categorization (system + user-defined)

### Key Features
- **Hierarchical Categories**: 8 main categories with 30+ subcategories
- **Multi-Currency**: Extensible currency support
- **Audit Trail**: Created/updated timestamps on all models
- **Soft Deletes**: Category archiving preserves transaction history
- **Performance Optimized**: Strategic indexing for common queries

---

## 🔐 Security Features

### Authentication
- **JWT Tokens**: 7-day expiration with secure signing
- **Password Hashing**: bcrypt with 12 salt rounds
- **Protected Routes**: Guards on all authenticated endpoints

### Security Measures
- **Rate Limiting**: 100 requests per minute per IP
- **Input Validation**: Comprehensive DTO validation
- **CORS Enabled**: Configured for cross-origin requests
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

---

## 🚀 Deployment

### Environment Variables
```bash
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/trend"
JWT_SECRET="your-secure-jwt-secret"

# Optional
NODE_ENV="development"
PORT=3000
```

### Production Deployment

#### Traditional Deployment
```bash
npm run build
npm run start:prod
```

#### Docker Deployment
```bash
docker-compose up -d
```

### Health Monitoring
- **Health Endpoint**: `/health` - Application status
- **Database Health**: Automatic connectivity checks
- **Graceful Shutdown**: Proper resource cleanup

---

## 📊 Features in Detail

### Transaction Management
- **CRUD Operations**: Create, read, update, delete transactions
- **Advanced Filtering**: Date ranges, categories, amounts, types
- **Analytics**: Spending patterns, category breakdowns, trends
- **Search**: Comprehensive transaction search functionality
- **AI Integration**: Ready for automated categorization

### Budget System
- **Flexible Budgets**: Date ranges, recurring budgets, multiple currencies
- **Status Tracking**: Draft, active, paused, completed, archived
- **Performance Analytics**: Spending vs. budget with percentage tracking
- **Transaction Integration**: Link transactions to budgets

### Category Hierarchy
- **System Categories**: Pre-defined 8 main + 30 subcategories
- **Custom Categories**: User-defined categories and subcategories
- **Visual Customization**: Icons and colors for categories
- **Analytics**: Most-used categories, spending by category

### User Onboarding
- **Progressive Setup**: Multi-step profile completion with income frequency tracking
- **Tutorial Tracking**: Mobile app feature introductions (Balance Card, Add Transaction, Transaction Swipe)
- **Welcome Flows**: First-time user experience with completion tracking
- **Setup Validation**: Required information completion including income, fixed expenses, and pay dates

---

## 🧪 Testing

### Test Coverage
- Unit tests for services and controllers
- Integration tests for API endpoints
- Database testing with test database
- Authentication flow testing

```bash
npm run test        # Unit tests
npm run test:e2e    # End-to-end tests
npm run test:cov    # Coverage report
```

---

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** your changes
5. **Submit** a pull request

### Code Standards
- **TypeScript**: Strict typing required
- **ESLint**: Code linting enforcement
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Commit message standards

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Documentation
- **API Reference**: Complete endpoint documentation
- **Database Schema**: Model relationships and design patterns
- **Authentication Guide**: Security implementation details
- **Deployment Guide**: Production deployment strategies

### Getting Help
- **Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Documentation**: Comprehensive guides for all features

---

## 🎯 Roadmap

### Upcoming Features
- **Enhanced AI Categorization**: Machine learning transaction categorization (foundation already implemented)
- **Recurring Transactions**: Automated recurring expense tracking (basic recurrence field implemented)
- **Budget Alerts**: Spending limit notifications and velocity warnings
- **Goal Reminders**: Automated goal reminder notifications (foundation implemented)
- **Export Features**: CSV/PDF financial reports
- **Multi-Currency**: Enhanced currency conversion support (basic multi-currency already supported)

### Performance Improvements
- **Caching Layer**: Redis integration for improved performance
- **Database Optimization**: Query performance enhancements
- **API Rate Limiting**: Advanced rate limiting strategies
- **Real-time Updates**: WebSocket integration for live updates

---

**Built with ❤️ using NestJS, TypeScript, and PostgreSQL**

*Ready for AI-powered financial insights and mobile-first experiences*
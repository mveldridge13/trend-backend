# Trend Backend - Database Schema Documentation

## Overview

The Trend Backend uses **PostgreSQL** with **Prisma ORM** for type-safe database operations. The database schema is designed to support a comprehensive financial management system with hierarchical categories, user onboarding, and advanced analytics.

## Table of Contents

1. [Database Models](#database-models)
2. [Relationships](#relationships)
3. [Enums](#enums)
4. [Indexes and Performance](#indexes-and-performance)
5. [Data Types and Constraints](#data-types-and-constraints)
6. [Migration Strategy](#migration-strategy)
7. [Seed Data](#seed-data)

## Database Models

### User Model

The User model stores authentication data, profile information, and onboarding progress.

```prisma
model User {
  id             String        @id @default(cuid())
  email          String        @unique
  username       String?       @unique
  firstName      String
  lastName       String
  passwordHash   String?
  currency       String        @default("USD")
  timezone       String        @default("UTC")
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  isActive       Boolean       @default(true)
  
  // Financial setup fields
  income              Decimal?         @db.Decimal(12, 2)
  incomeFrequency     IncomeFrequency?
  nextPayDate         DateTime?
  fixedExpenses       Decimal?         @db.Decimal(12, 2)
  setupComplete       Boolean          @default(false)
  hasSeenWelcome      Boolean          @default(false)
  
  // Tutorial onboarding fields
  hasSeenBalanceCardTour     Boolean @default(false)
  hasSeenAddTransactionTour   Boolean @default(false)
  hasSeenTransactionSwipeTour Boolean @default(false)
  
  // Relations
  budgets        Budget[]
  categories     Category[]
  goals          Goal[]
  transactions   Transaction[]

  @@map("users")
}
```

#### Key Features:
- **Authentication**: Email/password with bcrypt hashing
- **Profile Management**: Name, currency, timezone preferences
- **Financial Setup**: Income tracking with frequency and fixed expenses
- **Onboarding**: Progressive tutorial completion tracking
- **Soft Delete**: Using `isActive` flag for data retention

### Budget Model

Manages budget creation, tracking, and lifecycle with status-based workflow.

```prisma
model Budget {
  id           String        @id @default(cuid())
  userId       String
  name         String
  description  String?
  totalAmount  Decimal       @db.Decimal(12, 2)
  currency     String        @default("USD")
  startDate    DateTime
  endDate      DateTime?
  isRecurring  Boolean       @default(true)
  status       BudgetStatus  @default(ACTIVE)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  
  // Relations
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@map("budgets")
}
```

#### Key Features:
- **Flexible Duration**: Optional end date for ongoing budgets
- **Status Management**: Draft, Active, Paused, Completed, Archived
- **Multi-Currency**: Per-budget currency support
- **Transaction Linking**: Direct association with transactions

### Category Model

Hierarchical category system supporting both system-defined and user-created categories.

```prisma
model Category {
  id                      String        @id @default(cuid())
  userId                  String?
  name                    String
  description             String?
  icon                    String?
  color                   String?
  type                    CategoryType  @default(EXPENSE)
  parentId                String?
  isSystem                Boolean       @default(false)
  isActive                Boolean       @default(true)
  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt
  
  // Relations
  parent                  Category?     @relation("CategoryHierarchy", fields: [parentId], references: [id])
  subcategories           Category[]    @relation("CategoryHierarchy")
  user                    User?         @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions            Transaction[]
  subcategoryTransactions Transaction[] @relation("TransactionSubcategory")

  @@unique([name, isSystem])
  @@map("categories")
}
```

#### Key Features:
- **Hierarchical Structure**: Parent-child relationships for subcategories
- **System Categories**: Pre-defined categories available to all users
- **Visual Customization**: Icons and colors for UI representation
- **Type-Based**: Income, Expense, Transfer, Investment categories
- **Soft Delete**: Maintains transaction history when archived

### Transaction Model

Core transaction recording with rich metadata and AI categorization support.

```prisma
model Transaction {
  id              String          @id @default(cuid())
  userId          String
  budgetId        String?
  categoryId      String?
  subcategoryId   String?
  description     String
  amount          Decimal         @db.Decimal(12, 2)
  currency        String          @default("USD")
  date            DateTime
  type            TransactionType
  recurrence      String?
  isAICategorized Boolean         @default(false)
  aiConfidence    Float?
  notes           String?
  location        String?
  merchantName    String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  // Relations
  budget          Budget?         @relation(fields: [budgetId], references: [id])
  category        Category?       @relation(fields: [categoryId], references: [id])
  subcategory     Category?       @relation("TransactionSubcategory", fields: [subcategoryId], references: [id])
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, date])
  @@index([categoryId])
  @@index([subcategoryId])
  @@map("transactions")
}
```

#### Key Features:
- **Comprehensive Metadata**: Description, amount, date, type, currency
- **AI Ready**: Fields for AI categorization and confidence scoring
- **Flexible Categorization**: Optional category and subcategory
- **Budget Integration**: Optional budget association
- **Rich Data**: Notes, location, merchant information
- **Performance Optimized**: Strategic indexing for common queries

### Goal Model

Financial goal tracking with progress analytics, contributions, and automated suggestions.

```prisma
model Goal {
  id             String      @id @default(cuid())
  userId         String
  name           String
  description    String?
  targetAmount   Decimal     @db.Decimal(12, 2)
  currentAmount  Decimal     @default(0) @db.Decimal(12, 2)
  currency       String      @default("USD")
  targetDate     DateTime?
  category       GoalCategory
  type           GoalType
  priority       GoalPriority
  autoContribute Boolean     @default(false)
  monthlyTarget  Decimal?    @db.Decimal(12, 2)
  isCompleted    Boolean     @default(false)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  // Relations
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  contributions  GoalContribution[]
  reminders      GoalReminder[]

  @@index([userId, category])
  @@index([userId, isCompleted])
  @@map("goals")
}
```

#### Key Features:
- **Smart Categorization**: Pre-defined goal categories for common financial objectives
- **Progress Tracking**: Automatic calculation of completion percentage and remaining amounts
- **Flexible Timeline**: Optional target dates with progress projection
- **Priority System**: Four-tier priority system for goal management
- **Auto-Contribution**: Support for automated contribution scheduling
- **Multi-Currency**: Per-goal currency support

### GoalContribution Model

Tracks individual contributions made toward financial goals with detailed metadata.

```prisma
model GoalContribution {
  id            String           @id @default(cuid())
  goalId        String
  amount        Decimal          @db.Decimal(12, 2)
  currency      String
  date          DateTime         @default(now())
  description   String?
  type          ContributionType
  transactionId String?
  createdAt     DateTime         @default(now())
  
  // Relations
  goal          Goal             @relation(fields: [goalId], references: [id], onDelete: Cascade)

  @@index([goalId, date])
  @@map("goal_contributions")
}
```

#### Key Features:
- **Detailed Tracking**: Amount, date, description, and type for each contribution
- **Transaction Linking**: Optional connection to related transactions
- **Contribution Types**: Manual, automatic, transfer, and interest contributions
- **Performance Optimized**: Indexed for goal-based queries and date filtering

### GoalReminder Model

Manages automated reminders and notifications for goal progress and contributions.

```prisma
model GoalReminder {
  id         String            @id @default(cuid())
  goalId     String
  type       ReminderType
  frequency  ReminderFrequency
  message    String?
  isActive   Boolean           @default(true)
  lastSent   DateTime?
  nextSend   DateTime?
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
  
  // Relations
  goal       Goal              @relation(fields: [goalId], references: [id], onDelete: Cascade)

  @@index([goalId, isActive])
  @@map("goal_reminders")
}
```

#### Key Features:
- **Flexible Scheduling**: Multiple frequency options for reminder delivery
- **Reminder Types**: Contribution reminders, progress updates, and deadline alerts
- **Smart Timing**: Automatic calculation of next reminder dates
- **Status Management**: Active/inactive control for reminder management

## Relationships

### User Relationships
- **One-to-Many**: User → Budgets
- **One-to-Many**: User → Categories (user-defined)
- **One-to-Many**: User → Goals
- **One-to-Many**: User → Transactions

### Category Relationships
- **Self-Referencing**: Category → Subcategories (parent-child)
- **One-to-Many**: Category → Transactions (primary categorization)
- **One-to-Many**: Category → Transactions (subcategorization)

### Budget Relationships
- **Many-to-One**: Budget → User
- **One-to-Many**: Budget → Transactions

### Goal Relationships
- **Many-to-One**: Goal → User
- **One-to-Many**: Goal → GoalContributions
- **One-to-Many**: Goal → GoalReminders

### GoalContribution Relationships
- **Many-to-One**: GoalContribution → Goal

### GoalReminder Relationships
- **Many-to-One**: GoalReminder → Goal

### Transaction Relationships
- **Many-to-One**: Transaction → User
- **Many-to-One**: Transaction → Budget (optional)
- **Many-to-One**: Transaction → Category (optional)
- **Many-to-One**: Transaction → Subcategory (optional)

## Enums

### BudgetStatus
```prisma
enum BudgetStatus {
  DRAFT      // Initial creation state
  ACTIVE     // Currently tracking
  PAUSED     // Temporarily stopped
  COMPLETED  // Period ended
  ARCHIVED   // Historical record
}
```

### CategoryType
```prisma
enum CategoryType {
  INCOME     // Revenue and income categories
  EXPENSE    // Cost and expense categories
  TRANSFER   // Money movement categories
  INVESTMENT // Investment and savings categories
}
```

### TransactionType
```prisma
enum TransactionType {
  INCOME   // Money received
  EXPENSE  // Money spent
  TRANSFER // Money moved between accounts
  REFUND   // Money returned
}
```

### IncomeFrequency
```prisma
enum IncomeFrequency {
  WEEKLY      // Every week
  FORTNIGHTLY // Every two weeks
  MONTHLY     // Every month
}
```

### GoalCategory
```prisma
enum GoalCategory {
  EMERGENCY_FUND  // Emergency fund goals
  VACATION        // Vacation and travel goals
  HOME_PURCHASE   // Home purchase and real estate goals
  CAR_PURCHASE    // Vehicle purchase goals
  DEBT_PAYOFF     // Debt payoff goals
  EDUCATION       // Education and learning goals
  RETIREMENT      // Retirement savings goals
  INVESTMENT      // Investment and portfolio goals
  GENERAL_SAVINGS // General savings goals
}
```

### GoalType
```prisma
enum GoalType {
  SAVINGS        // Savings accumulation goals
  SPENDING_LIMIT // Spending limit goals
  DEBT_PAYOFF    // Debt reduction goals
  INVESTMENT     // Investment growth goals
}
```

### GoalPriority
```prisma
enum GoalPriority {
  LOW      // Low priority goals
  MEDIUM   // Medium priority goals
  HIGH     // High priority goals
  CRITICAL // Critical priority goals
}
```

### ContributionType
```prisma
enum ContributionType {
  MANUAL    // Manual contributions
  AUTOMATIC // Automatic contributions
  TRANSFER  // Transfer contributions
  INTEREST  // Interest earnings contributions
}
```

### ReminderType
```prisma
enum ReminderType {
  CONTRIBUTION_DUE // Contribution reminder
  PROGRESS_UPDATE  // Progress milestone reminder
  DEADLINE_ALERT   // Target date approaching reminder
  GOAL_ACHIEVED    // Goal completion notification
}
```

### ReminderFrequency
```prisma
enum ReminderFrequency {
  DAILY    // Daily reminders
  WEEKLY   // Weekly reminders
  MONTHLY  // Monthly reminders
  CUSTOM   // Custom frequency
}
```

## Indexes and Performance

### Primary Indexes
- All models have auto-generated primary key indexes (`@id`)
- Unique constraints on email and username fields
- Composite unique constraint on category name and system flag

### Performance Indexes
```prisma
// Transaction performance indexes
@@index([userId, date])    // User transaction queries by date
@@index([categoryId])      // Category-based filtering
@@index([subcategoryId])   // Subcategory-based filtering

// Goal performance indexes
@@index([userId, category])   // User goal queries by category
@@index([userId, isCompleted]) // User goal filtering by completion status

// Goal contribution performance indexes
@@index([goalId, date])    // Goal contribution queries by date

// Goal reminder performance indexes
@@index([goalId, isActive]) // Active reminder queries
```

### Query Optimization Patterns
- **User Isolation**: All queries filtered by userId for security
- **Date Range Queries**: Optimized for transaction and contribution date filtering
- **Category Analytics**: Fast category and subcategory aggregations
- **Budget Tracking**: Efficient budget-transaction associations
- **Goal Analytics**: Optimized goal progress calculations and contribution tracking
- **Reminder Management**: Efficient active reminder queries and scheduling

## Data Types and Constraints

### Decimal Precision
- **Financial Amounts**: `@db.Decimal(12, 2)` for precise currency calculations
- **Supports**: Up to 10 digits before decimal, 2 after (max: $99,999,999.99)

### String Constraints
- **IDs**: CUID format for globally unique identifiers
- **Currency**: 3-character ISO codes (USD, EUR, etc.)
- **Timezone**: Standard timezone identifiers

### DateTime Handling
- **UTC Storage**: All timestamps stored in UTC
- **Automatic Timestamps**: `createdAt` and `updatedAt` managed by Prisma
- **User Timezone**: Handled in application layer

### Boolean Defaults
- **User Active**: `isActive: true` (soft delete support)
- **Setup States**: All onboarding flags default to `false`
- **Budget Recurring**: `isRecurring: true` (most budgets repeat)

## Migration Strategy

### Development Migrations
```bash
# Create new migration
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Reset database (development only)
npm run db:reset
```

### Production Migrations
```bash
# Deploy migrations to production
npx prisma migrate deploy

# Validate migration status
npx prisma migrate status
```

### Migration Best Practices
1. **Backwards Compatibility**: Ensure migrations don't break existing data
2. **Data Preservation**: Use Prisma's migration system for schema changes
3. **Validation**: Test migrations on staging environment first
4. **Rollback Planning**: Maintain rollback scripts for critical changes

## Seed Data

### System Categories
The application includes a comprehensive seeding system for categories:

```bash
# Seed system categories
npm run seed:categories
```

#### Category Hierarchy (8 Main + 30+ Subcategories)
1. **Food** → Coffee, Dining Out, Groceries, Take Out
2. **Transport** → Fuel, Car Insurance, Maintenance, Parking, Public Transport, Registration
3. **Bills** → Rent/Mortgage, Home Insurance, Internet, Phone, Water
4. **Health** → Health & Fitness
5. **Shopping** → Beauty & Personal Care, BNPL, Clothing, Electronics, Home & Furniture
6. **Entertainment** → Hobby, Movies, Social Event, Subscriptions
7. **Other** → Account Transfer, Debt Payment, Goal Contribution, Investments, Savings
8. **Income** → Business Income, Freelance, Investment Income, Other Income, Salary

### System Category Features
- **Pre-configured Colors**: Each category has optimized colors for UI
- **Icon Integration**: Ionicon names for consistent mobile UI
- **Type Classification**: Proper categorization by income/expense/transfer/investment
- **Hierarchical Structure**: Main categories with logical subcategories

## Database Health and Monitoring

### Health Checks
The application includes database connectivity monitoring:
- **Connection Status**: Real-time database connection validation
- **Query Performance**: Response time tracking
- **Connection Pooling**: Prisma-managed connection optimization

### Maintenance Commands
```bash
# Open database GUI
npm run db:studio

# Check database status
npx prisma db pull

# Backup database (PostgreSQL)
pg_dump DATABASE_URL > backup.sql

# Restore database
psql DATABASE_URL < backup.sql
```

## Security Considerations

### Data Protection
- **User Isolation**: All queries filtered by userId
- **Password Security**: Bcrypt hashing with 12 salt rounds
- **Soft Deletes**: Data retention through `isActive` flags
- **Audit Trail**: Automatic timestamps on all models

### Access Control
- **Ownership Validation**: Users can only access their own data
- **Cascade Deletes**: Proper cleanup when users are deleted
- **Foreign Key Constraints**: Referential integrity maintenance

### Performance Security
- **Query Optimization**: Indexed common query patterns
- **Connection Limits**: Prisma connection pooling prevents overload
- **SQL Injection Prevention**: Prisma ORM provides protection

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Design Best Practices](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate)

**Last Updated**: January 2025  
**Schema Version**: Current
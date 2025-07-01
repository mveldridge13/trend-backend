# Trend Backend - Goals System Documentation

## Overview

The Goals System is a comprehensive financial goal tracking and management feature that enables users to create, track, and achieve their financial objectives. The system includes intelligent goal suggestions, progress analytics, contribution tracking, and automated reminders to help users stay on track with their financial goals.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Core Features](#core-features)
3. [Goal Categories and Types](#goal-categories-and-types)
4. [Smart Suggestions Engine](#smart-suggestions-engine)
5. [Progress Tracking and Analytics](#progress-tracking-and-analytics)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Business Logic](#business-logic)
9. [Integration Points](#integration-points)
10. [Usage Examples](#usage-examples)

## System Architecture

### Module Structure
```
src/goals/
├── goals.module.ts           # Main module configuration
├── goals.controller.ts       # REST API endpoints
├── goals.service.ts          # Business logic and goal management
├── repositories/
│   └── goals.repository.ts   # Data access layer
└── dto/
    ├── create-goal.dto.ts           # Goal creation validation
    ├── update-goal.dto.ts           # Goal update validation
    ├── goal-response.dto.ts         # Response DTOs
    ├── goal-filters.dto.ts          # Query filtering
    ├── create-goal-contribution.dto.ts  # Contribution creation
    └── goal-suggestions.dto.ts      # Smart suggestions DTOs
```

### Technology Stack
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: class-validator and class-transformer
- **Authentication**: JWT with Passport.js guards

## Core Features

### 1. Goal Creation and Management
- **CRUD Operations**: Create, read, update, delete financial goals
- **Flexible Configuration**: Optional target dates, monthly targets, and auto-contribution settings
- **Priority System**: Four-tier priority system (Low, Medium, High, Critical)
- **Status Tracking**: Active/completed status with automatic completion detection

### 2. Goal Contributions
- **Multiple Contribution Types**: Manual, automatic, transfer, and interest contributions
- **Transaction Linking**: Optional connection to related transactions
- **Contribution History**: Complete audit trail of all contributions
- **Flexible Dating**: Backdate contributions or schedule future ones

### 3. Smart Goal Suggestions
- **AI-Powered Recommendations**: Analyze user spending patterns to suggest relevant goals
- **Emergency Fund Priority**: Intelligent emergency fund recommendations based on expenses
- **Spending Analysis**: Discretionary spending analysis for vacation and entertainment goals
- **Personalized Amounts**: Suggested amounts based on user's financial capacity

### 4. Progress Analytics
- **Real-time Progress**: Automatic calculation of completion percentages
- **Projection Analysis**: Estimate completion dates based on current contribution patterns
- **Monthly Tracking**: Month-by-month progress visualization
- **Performance Insights**: On-track/behind schedule analysis

### 5. Reminder System (Foundation)
- **Flexible Scheduling**: Daily, weekly, monthly, or custom reminder frequencies
- **Reminder Types**: Contribution reminders, progress updates, deadline alerts
- **Smart Timing**: Automatic calculation of next reminder dates
- **Status Management**: Active/inactive control for each reminder

## Goal Categories and Types

### Goal Categories
The system supports nine predefined goal categories that cover common financial objectives:

1. **EMERGENCY_FUND**
   - Emergency savings for unexpected expenses
   - Typically 3-6 months of expenses
   - High priority recommendation

2. **VACATION**
   - Travel and vacation savings
   - Based on discretionary spending analysis
   - Flexible timeframes

3. **HOME_PURCHASE**
   - Down payment and closing costs
   - Long-term savings goals
   - Large target amounts

4. **CAR_PURCHASE**
   - Vehicle down payment or full purchase
   - Medium to long-term timeline
   - Variable amounts based on preferences

5. **DEBT_PAYOFF**
   - Credit card, loan, or other debt elimination
   - Progress tracking with balance reduction
   - High priority for financial health

6. **EDUCATION**
   - Tuition, courses, certification costs
   - Investment in personal development
   - Variable timelines

7. **RETIREMENT**
   - Long-term retirement savings
   - Compound interest considerations
   - Automated contribution recommendations

8. **INVESTMENT**
   - Portfolio building and investment goals
   - Growth-oriented objectives
   - Risk tolerance considerations

9. **GENERAL_SAVINGS**
   - Flexible savings for unspecified purposes
   - Catch-all category for custom goals
   - User-defined objectives

### Goal Types
Goals are classified into four types based on their purpose:

1. **SAVINGS**: Accumulation goals for future purchases or security
2. **SPENDING_LIMIT**: Budget-based goals to control expenses
3. **DEBT_PAYOFF**: Debt reduction and elimination goals
4. **INVESTMENT**: Investment growth and portfolio building goals

## Smart Suggestions Engine

### Suggestion Algorithm
The smart suggestions system analyzes user financial data to provide personalized goal recommendations:

#### 1. Emergency Fund Analysis
```typescript
// Emergency fund calculation
const monthlyExpenses = averageMonthlyExpenses;
const recommendedAmount = monthlyExpenses * 6; // 6 months of expenses
const currentEmergencyFund = getCurrentEmergencyFundAmount();
const urgency = currentEmergencyFund < monthlyExpenses ? "HIGH" : "MEDIUM";
```

#### 2. Spending Pattern Analysis
- Analyzes transaction history for spending patterns
- Identifies discretionary spending opportunities
- Calculates available savings capacity
- Suggests realistic contribution amounts

#### 3. Income-Based Recommendations
- Uses income frequency and amount for contribution suggestions
- Applies 20% savings rate recommendations
- Considers fixed expenses and discretionary spending
- Adjusts for user's current financial situation

### Suggestion Confidence Scoring
Each suggestion includes a confidence score (0.0-1.0) based on:
- **Data Quality**: Amount and recency of transaction data
- **Pattern Consistency**: Regularity of income and expenses
- **Financial Health**: Emergency fund status and debt levels
- **Goal Feasibility**: Realistic timeline and amount assessments

## Progress Tracking and Analytics

### Real-time Calculations
The system automatically calculates:

1. **Progress Percentage**: `(currentAmount / targetAmount) * 100`
2. **Remaining Amount**: `targetAmount - currentAmount`
3. **Monthly Progress Needed**: `remainingAmount / monthsRemaining`
4. **Projected Completion**: Based on average contribution rate

### Analytics Features

#### Goal-Level Analytics
- Contribution frequency analysis
- Progress trend visualization
- Source breakdown (manual vs. automatic contributions)
- Performance against target timeline

#### User-Level Analytics
- Portfolio overview across all goals
- Category distribution analysis
- Monthly contribution trends
- Top-performing goals identification

#### Insights Generation
The system generates actionable insights:
- **Success Indicators**: Goals ahead of schedule
- **Warning Alerts**: Goals falling behind target
- **Optimization Suggestions**: Reallocation recommendations
- **Completion Celebrations**: Achievement recognition

## API Endpoints

### Goal Management Endpoints

#### Create Goal
```http
POST /api/v1/goals
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Emergency Fund",
  "description": "Build 6 months of expenses",
  "targetAmount": 15000.00,
  "category": "EMERGENCY_FUND",
  "type": "SAVINGS",
  "priority": "CRITICAL",
  "targetDate": "2025-12-31T23:59:59.999Z",
  "monthlyTarget": 1250.00
}
```

#### Get All Goals
```http
GET /api/v1/goals?category=EMERGENCY_FUND&isCompleted=false&page=1&limit=10
Authorization: Bearer <token>
```

#### Add Contribution
```http
POST /api/v1/goals/{goalId}/contribute
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 500.00,
  "description": "Monthly contribution",
  "type": "MANUAL",
  "date": "2025-01-15T10:00:00.000Z"
}
```

### Analytics Endpoints

#### Goal Suggestions
```http
GET /api/v1/goals/suggestions?includeEmergencyFund=true&analyzePeriodMonths=6
Authorization: Bearer <token>
```

#### Goal Analytics
```http
GET /api/v1/goals/{goalId}/analytics
Authorization: Bearer <token>
```

#### System-wide Analytics
```http
GET /api/v1/goals/analytics?period=month&category=EMERGENCY_FUND
Authorization: Bearer <token>
```

## Database Schema

### Core Tables

#### Goals Table
```sql
CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    target_date TIMESTAMP,
    category goal_category NOT NULL,
    type goal_type NOT NULL,
    priority goal_priority NOT NULL,
    auto_contribute BOOLEAN DEFAULT false,
    monthly_target DECIMAL(12,2),
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_goals_user_category ON goals(user_id, category);
CREATE INDEX idx_goals_user_completed ON goals(user_id, is_completed);
```

#### Goal Contributions Table
```sql
CREATE TABLE goal_contributions (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL,
    date TIMESTAMP DEFAULT now(),
    description TEXT,
    type contribution_type NOT NULL,
    transaction_id TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_goal_contributions_goal_date ON goal_contributions(goal_id, date);
```

#### Goal Reminders Table
```sql
CREATE TABLE goal_reminders (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    type reminder_type NOT NULL,
    frequency reminder_frequency NOT NULL,
    message TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sent TIMESTAMP,
    next_send TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_goal_reminders_goal_active ON goal_reminders(goal_id, is_active);
```

## Business Logic

### Goal Creation Rules
1. **Target Amount**: Must be greater than $0.01
2. **Target Date**: Must be in the future (if specified)
3. **Monthly Target**: Must be realistic based on target amount and timeline
4. **Currency**: Must match user's default currency or be explicitly specified
5. **Category Validation**: Must be one of the predefined categories

### Contribution Rules
1. **Amount Validation**: Must be greater than $0.01
2. **Currency Matching**: Must match goal currency
3. **Date Validation**: Cannot be in the future for manual contributions
4. **Completion Detection**: Automatically marks goal as completed when target is reached
5. **Progress Updates**: Real-time recalculation of progress metrics

### Smart Suggestions Logic

#### Emergency Fund Calculation
```typescript
const calculateEmergencyFundSuggestion = (userFinancialData) => {
  const monthlyExpenses = userFinancialData.averageMonthlyExpenses;
  const currentEmergencyFund = userFinancialData.currentEmergencyFund || 0;
  const recommendedAmount = monthlyExpenses * 6;
  const suggestedMonthlyContribution = Math.min(
    userFinancialData.savingsCapacity * 0.6, // 60% of savings capacity
    (recommendedAmount - currentEmergencyFund) / 12 // 12-month timeline
  );
  
  return {
    targetAmount: recommendedAmount,
    monthlyContribution: suggestedMonthlyContribution,
    reasoning: `Based on your average monthly expenses of $${monthlyExpenses}, we recommend saving 6 months of expenses`,
    confidence: currentEmergencyFund < monthlyExpenses ? 0.95 : 0.80
  };
};
```

#### Vacation Fund Calculation
```typescript
const calculateVacationSuggestion = (userFinancialData) => {
  const discretionarySpending = userFinancialData.averageDiscretionarySpending;
  const suggestedVacationBudget = discretionarySpending * 4; // 4 months of discretionary spending
  const timelineMonths = 12; // 1-year timeline
  const monthlyContribution = suggestedVacationBudget / timelineMonths;
  
  return {
    targetAmount: suggestedVacationBudget,
    monthlyContribution: monthlyContribution,
    reasoning: "Based on your discretionary spending patterns, you can comfortably save for a vacation",
    confidence: 0.75
  };
};
```

## Integration Points

### Transaction System Integration
- **Automatic Categorization**: Goals can be linked to "Goal Contribution" transactions
- **Spending Analysis**: Transaction data feeds into suggestion algorithms
- **Progress Tracking**: Contributions can be automatically created from transactions

### Budget System Integration
- **Budget Allocation**: Goals can influence budget creation suggestions
- **Performance Correlation**: Budget adherence affects goal suggestion confidence
- **Expense Analysis**: Budget data enhances spending pattern analysis

### User Profile Integration
- **Income Data**: Salary and frequency information drives contribution suggestions
- **Currency Preferences**: Goal currencies default to user preferences
- **Onboarding Status**: Goal suggestions adapt to user setup completion

### Notification System (Future)
- **Reminder Delivery**: Integration with email/push notification services
- **Progress Alerts**: Automated notifications for milestones and deadlines
- **Achievement Celebrations**: Success notifications and celebrations

## Usage Examples

### Example 1: Creating an Emergency Fund Goal
```typescript
// User wants to build a $10,000 emergency fund
const emergencyFundGoal = {
  name: "Emergency Fund",
  description: "6 months of living expenses for financial security",
  targetAmount: 10000.00,
  category: "EMERGENCY_FUND",
  type: "SAVINGS",
  priority: "CRITICAL",
  targetDate: "2025-12-31T23:59:59.999Z",
  monthlyTarget: 833.33,
  autoContribute: false
};

// System calculates:
// - 12-month timeline
// - $833.33 monthly target
// - High priority due to emergency fund importance
// - Progress tracking and projections
```

### Example 2: Vacation Savings with Smart Suggestions
```typescript
// System analyzes user data and suggests vacation goal
const suggestionAnalysis = {
  averageMonthlyExpenses: 3500.00,
  averageDiscretionarySpending: 800.00,
  monthlyIncome: 5000.00,
  savingsCapacity: 700.00
};

// Suggestion generated:
const vacationSuggestion = {
  name: "Vacation Fund",
  suggestedAmount: 3200.00, // 4 months of discretionary spending
  suggestedMonthlyContribution: 267.00, // 12-month timeline
  reasoning: "Based on your discretionary spending of $800/month, you can comfortably save for a $3,200 vacation",
  confidence: 0.75
};
```

### Example 3: Goal Progress Analytics
```typescript
// Real-time analytics for a goal in progress
const goalAnalytics = {
  goalId: "goal_123",
  goalName: "Emergency Fund",
  targetAmount: 10000.00,
  currentAmount: 3500.00,
  progressPercentage: 35.0,
  remainingAmount: 6500.00,
  
  // Timeline analysis
  daysToTarget: 280, // Based on target date
  monthlyProgressNeeded: 722.22, // To stay on track
  actualMonthlyAverage: 583.33, // Based on contribution history
  isOnTrack: false, // Behind schedule
  
  // Projections
  projectedCompletionDate: "2026-03-15T00:00:00.000Z",
  atCurrentRate: {
    months: 11.1,
    date: "2026-01-01T00:00:00.000Z"
  },
  
  // Insights
  insights: [
    {
      type: "warning",
      message: "You're $139 behind your monthly target. Consider increasing contributions to stay on track."
    }
  ]
};
```

## Performance Considerations

### Database Optimization
- **Indexed Queries**: Strategic indexes on user_id, category, and completion status
- **Efficient Aggregations**: Optimized queries for progress calculations
- **Connection Pooling**: Prisma connection management for concurrent requests

### Caching Strategy
- **Goal Analytics**: Cache expensive analytics calculations
- **Suggestion Results**: Cache suggestion analysis for recent periods
- **Progress Calculations**: Cache frequently accessed progress metrics

### Scalability Features
- **User Isolation**: All queries filtered by user_id for data security
- **Pagination**: Efficient pagination for large goal lists
- **Batch Operations**: Support for bulk contribution imports

## Security and Privacy

### Data Protection
- **User Isolation**: Goals are strictly user-scoped with database-level enforcement
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Prevention**: Prisma ORM provides built-in protection

### Authentication and Authorization
- **JWT Authentication**: All endpoints require valid authentication
- **Resource Ownership**: Users can only access their own goals
- **Audit Trail**: Complete history of all goal and contribution changes

## Monitoring and Analytics

### System Metrics
- **Goal Creation Rate**: Track user adoption of goal features
- **Completion Rate**: Monitor goal achievement success
- **Suggestion Accuracy**: Measure suggestion acceptance and success rates
- **User Engagement**: Track goal interaction patterns

### Performance Monitoring
- **Response Times**: Monitor API endpoint performance
- **Database Query Performance**: Track slow queries and optimization opportunities
- **Error Rates**: Monitor system reliability and error patterns

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**System Status**: Production Ready (Reminders feature foundation implemented, full implementation pending)
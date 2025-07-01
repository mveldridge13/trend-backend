# Trend Backend API Documentation

## Overview

The Trend Backend API is a RESTful API built with NestJS that provides financial tracking and budgeting functionality. The API uses JWT authentication and supports comprehensive transaction, budget, and category management.

**Base URL:** `http://localhost:3001/api/v1`

## Authentication

The API uses JWT Bearer token authentication. All endpoints except authentication endpoints require a valid JWT token.

### Authentication Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Obtaining a Token
Tokens are obtained through the `/auth/login` or `/auth/register` endpoints and have an expiration time.

---

## API Endpoints

### Authentication Endpoints

#### Register User
- **Endpoint:** `POST /auth/register`
- **Description:** Register a new user account
- **Authentication:** Not required
- **Request Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "securePassword123",
  "username": "john_doe", // optional
  "currency": "USD", // optional, defaults to USD
  "timezone": "America/New_York" // optional, defaults to UTC
}
```
- **Response:** `201 Created`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmbziufnk0000inr580736p8",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "john_doe",
    "currency": "USD",
    "timezone": "America/New_York",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "income": null,
    "setupComplete": false,
    "hasSeenBalanceCardTour": false,
    "hasSeenAddTransactionTour": false,
    "hasSeenTransactionSwipeTour": false
  }
}
```

#### Login User
- **Endpoint:** `POST /auth/login`
- **Description:** Authenticate a user and obtain a JWT token
- **Authentication:** Not required
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
- **Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cmbziufnk0000inr580736p8",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "john_doe",
    "currency": "USD",
    "timezone": "America/New_York",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "income": 5000.00,
    "setupComplete": true,
    "hasSeenBalanceCardTour": true,
    "hasSeenAddTransactionTour": false,
    "hasSeenTransactionSwipeTour": false
  }
}
```

#### Get User Profile (Auth)
- **Endpoint:** `GET /auth/profile`
- **Description:** Get current user's profile information
- **Authentication:** Required
- **Response:** `200 OK`
```json
{
  "id": "cmbziufnk0000inr580736p8",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "username": "john_doe",
  "currency": "USD",
  "timezone": "America/New_York",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "income": 5000.00,
  "setupComplete": true,
  "hasSeenWelcome": true,
  "hasSeenBalanceCardTour": true,
  "hasSeenAddTransactionTour": false,
  "hasSeenTransactionSwipeTour": false
}
```

#### Update User Profile (Auth)
- **Endpoint:** `PUT /auth/profile`
- **Description:** Update current user's profile information
- **Authentication:** Required
- **Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "john_doe",
  "currency": "USD",
  "timezone": "America/New_York",
  "income": 5000.00,
  "setupComplete": true,
  "hasSeenWelcome": true,
  "hasSeenBalanceCardTour": true,
  "hasSeenAddTransactionTour": false,
  "hasSeenTransactionSwipeTour": false
}
```
- **Response:** `200 OK` - Returns updated user profile

---

### User Management Endpoints

#### Get User Profile
- **Endpoint:** `GET /users/profile`
- **Description:** Get current user's profile information
- **Authentication:** Required
- **Response:** `200 OK` - Returns UserDto object

#### Update User Profile
- **Endpoint:** `PUT /users/profile`
- **Description:** Update current user's profile information
- **Authentication:** Required
- **Request Body:** All fields are optional
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "john_doe",
  "currency": "USD", // Must be one of: USD, EUR, GBP, CAD, AUD, JPY
  "timezone": "America/New_York",
  "isActive": true,
  "income": 5000.00,
  "incomeFrequency": "MONTHLY", // WEEKLY, FORTNIGHTLY, MONTHLY
  "nextPayDate": "2025-02-01T00:00:00.000Z",
  "fixedExpenses": 2500.00,
  "setupComplete": true,
  "hasSeenWelcome": true,
  "hasSeenBalanceCardTour": true,
  "hasSeenAddTransactionTour": false,
  "hasSeenTransactionSwipeTour": false
}
```
- **Validation:**
  - `firstName`: 1-50 characters
  - `lastName`: 1-50 characters
  - `username`: 3-30 characters
  - `currency`: Must be one of the supported currencies
  - `income`: Must be >= 0
  - `incomeFrequency`: Must be one of: WEEKLY, FORTNIGHTLY, MONTHLY
  - `nextPayDate`: Must be a valid ISO date string
  - `fixedExpenses`: Must be >= 0

#### Update Onboarding Status
- **Endpoint:** `PATCH /users/onboarding`
- **Description:** Update user's onboarding tutorial status
- **Authentication:** Required
- **Request Body:**
```json
{
  "hasSeenBalanceCardTour": true,
  "hasSeenAddTransactionTour": true,
  "hasSeenTransactionSwipeTour": true
}
```

#### Deactivate Account
- **Endpoint:** `DELETE /users/profile`
- **Description:** Deactivate current user's account
- **Authentication:** Required
- **Response:** `204 No Content`

---

### Transaction Endpoints

#### Create Transaction
- **Endpoint:** `POST /transactions`
- **Description:** Create a new transaction
- **Authentication:** Required
- **Request Body:**
```json
{
  "description": "Grocery shopping",
  "amount": 75.50,
  "currency": "USD", // optional, defaults to USD
  "date": "2025-01-15T10:30:00.000Z",
  "type": "EXPENSE", // INCOME, EXPENSE, TRANSFER, REFUND
  "budgetId": "budget_id", // optional
  "categoryId": "category_id", // optional
  "subcategoryId": "subcategory_id", // optional - must belong to the specified category
  "recurrence": "none", // optional - "none", "weekly", "fortnightly", "monthly", "yearly"
  "notes": "Additional notes", // optional
  "location": "Store location", // optional  
  "merchantName": "Merchant name" // optional
}
```
- **Validation:**
  - `description`: Required, non-empty string
  - `amount`: Required, 0.01-999999.99 with max 2 decimal places
  - `date`: Required, valid ISO date string
  - `type`: Required, must be valid TransactionType enum
- **Response:** `201 Created` - Returns created transaction with related data

#### Get All Transactions
- **Endpoint:** `GET /transactions`
- **Description:** Get paginated list of user's transactions with optional filtering
- **Authentication:** Required
- **Query Parameters:**
  - `startDate` (optional): ISO date string
  - `endDate` (optional): ISO date string
  - `categoryId` (optional): Filter by category ID
  - `subcategoryId` (optional): Filter by subcategory ID
  - `budgetId` (optional): Filter by budget ID
  - `type` (optional): INCOME, EXPENSE, TRANSFER, REFUND
  - `recurrence` (optional): Filter by recurrence pattern
  - `search` (optional): Search in description/merchant name
  - `limit` (optional): 1-100, default 20
  - `offset` (optional): >= 0, default 0
  - `sortBy` (optional): Sort field, default "date"
  - `sortOrder` (optional): "asc" or "desc", default "desc"
- **Response:** `200 OK`
```json
{
  "transactions": [
    {
      "id": "transaction_id",
      "description": "Grocery shopping",
      "amount": 75.50,
      "currency": "USD",
      "date": "2025-01-15T10:30:00.000Z",
      "type": "EXPENSE",
      "recurrence": "MONTHLY",
      "isAICategorized": false,
      "aiConfidence": null,
      "notes": null,
      "location": null,
      "merchantName": null,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "budget": {
        "id": "budget_id",
        "name": "Groceries Budget"
      },
      "category": {
        "id": "category_id",
        "name": "Food",
        "icon": "🍕",
        "color": "#FF6B6B",
        "type": "EXPENSE"
      },
      "subcategory": {
        "id": "subcategory_id",
        "name": "Groceries",
        "icon": "🛒",
        "color": "#4ECDC4"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

#### Get Transaction Analytics
- **Endpoint:** `GET /transactions/analytics`
- **Description:** Get comprehensive transaction analytics
- **Authentication:** Required
- **Query Parameters:** Same as transaction filtering
- **Response:** `200 OK`
```json
{
  "totalIncome": 5000.00,
  "totalExpenses": 3500.00,
  "netIncome": 1500.00,
  "transactionCount": 45,
  "averageTransaction": 77.78,
  "categoryBreakdown": [
    {
      "categoryId": "category_id",
      "categoryName": "Food",
      "categoryIcon": "🍕",
      "categoryColor": "#FF6B6B",
      "amount": 800.00,
      "transactionCount": 12,
      "percentage": 22.86
    }
  ],
  "monthlyTrends": [
    {
      "month": "2025-01",
      "income": 5000.00,
      "expenses": 3500.00,
      "net": 1500.00,
      "transactionCount": 45
    }
  ],
  "recentTransactions": {
    "totalAmount": 500.00,
    "count": 10,
    "topCategories": ["Food", "Transportation", "Entertainment"]
  },
  "budgetPerformance": [
    {
      "budgetId": "budget_id",
      "budgetName": "Monthly Budget",
      "allocated": 2000.00,
      "spent": 1500.00,
      "remaining": 500.00,
      "percentageUsed": 75.0
    }
  ]
}
```

#### Get Transaction Summary
- **Endpoint:** `GET /transactions/summary`
- **Description:** Get summarized transaction analytics
- **Authentication:** Required
- **Query Parameters:** Same as transaction filtering
- **Response:** `200 OK`
```json
{
  "totalIncome": 5000.00,
  "totalExpenses": 3500.00,
  "netIncome": 1500.00,
  "transactionCount": 45,
  "recentTransactions": {
    "totalAmount": 500.00,
    "count": 10,
    "topCategories": ["Food", "Transportation", "Entertainment"]
  }
}
```

#### Get Discretionary Breakdown
- **Endpoint:** `GET /transactions/discretionary-breakdown`
- **Description:** Get comprehensive discretionary spending analysis with category breakdowns, insights, and spending patterns
- **Authentication:** Required
- **Query Parameters:** Same as transaction filtering (startDate, endDate, etc.)
- **Response:** `200 OK`
```json
{
  "selectedDate": "2025-01-15",
  "selectedPeriod": "daily",
  "totalDiscretionaryAmount": 150.75,
  "transactions": [
    {
      "id": "transaction_id",
      "date": "2025-01-15T10:30:00.000Z",
      "amount": 45.50,
      "description": "Coffee shop visit",
      "merchant": "Starbucks",
      "categoryId": "category_id",
      "categoryName": "Food",
      "subcategoryId": "subcategory_id",
      "subcategoryName": "Coffee"
    }
  ],
  "categoryBreakdown": [
    {
      "categoryId": "category_id",
      "categoryName": "Food",
      "categoryIcon": "restaurant-outline",
      "categoryColor": "#FF6B6B",
      "amount": 75.25,
      "transactionCount": 3,
      "percentage": 49.9,
      "subcategories": [
        {
          "subcategoryId": "subcategory_id",
          "subcategoryName": "Coffee",
          "amount": 45.50,
          "transactionCount": 2,
          "percentage": 60.5,
          "transactions": [...]
        }
      ],
      "transactions": [...]
    }
  ],
  "previousPeriod": {
    "date": "2025-01-14",
    "totalDiscretionaryAmount": 120.00,
    "percentageChange": 25.6,
    "topCategories": [
      {
        "categoryName": "Food",
        "amount": 60.00
      }
    ]
  },
  "insights": [
    {
      "type": "warning",
      "category": "Food",
      "title": "High Category Concentration",
      "message": "Food accounts for 49.9% of your discretionary spending.",
      "suggestion": "Consider setting a specific budget for this category.",
      "amount": 75.25
    }
  ],
  "summary": {
    "transactionCount": 5,
    "averageTransactionAmount": 30.15,
    "largestTransaction": {
      "id": "transaction_id",
      "amount": 45.50,
      "description": "Coffee shop visit",
      "categoryName": "Food"
    },
    "topSpendingCategory": {
      "categoryName": "Food",
      "amount": 75.25,
      "percentage": 49.9
    },
    "spendingDistribution": {
      "morning": 45.50,
      "afternoon": 30.25,
      "evening": 75.00,
      "night": 0.00
    }
  }
}
```

#### Get Day-Time Spending Patterns
- **Endpoint:** `GET /transactions/day-time-patterns`
- **Description:** Get comprehensive analysis of spending patterns by day of week and time of day, including behavioral insights
- **Authentication:** Required
- **Query Parameters:** Same as transaction filtering (startDate, endDate, categoryId, subcategoryId, type, includePreviousPeriod)
- **Response:** `200 OK`
```json
{
  "selectedPeriod": "weekly",
  "startDate": "2025-01-15T00:00:00.000Z",
  "endDate": "2025-01-22T00:00:00.000Z",
  "weekdayVsWeekend": {
    "weekdays": {
      "amount": 750.00,
      "averagePerDay": 150.00,
      "transactionCount": 25,
      "percentage": 75.0
    },
    "weekends": {
      "amount": 250.00,
      "averagePerDay": 125.00,
      "transactionCount": 10,
      "percentage": 25.0
    }
  },
  "dayOfWeekBreakdown": [
    {
      "day": "Monday",
      "dayIndex": 1,
      "amount": 180.00,
      "transactionCount": 6,
      "averageTransaction": 30.00,
      "percentage": 18.0
    },
    {
      "day": "Sunday",
      "dayIndex": 0,
      "amount": 150.00,
      "transactionCount": 5,
      "averageTransaction": 30.00,
      "percentage": 15.0
    }
  ],
  "timeOfDayBreakdown": [
    {
      "period": "Morning",
      "hours": "6:00 AM - 12:00 PM",
      "startHour": 6,
      "endHour": 12,
      "amount": 200.00,
      "transactionCount": 8,
      "averageTransaction": 25.00,
      "percentage": 20.0
    },
    {
      "period": "Afternoon",
      "hours": "12:00 PM - 6:00 PM",
      "startHour": 12,
      "endHour": 18,
      "amount": 400.00,
      "transactionCount": 15,
      "averageTransaction": 26.67,
      "percentage": 40.0
    },
    {
      "period": "Evening",
      "hours": "6:00 PM - 10:00 PM",
      "startHour": 18,
      "endHour": 22,
      "amount": 350.00,
      "transactionCount": 10,
      "averageTransaction": 35.00,
      "percentage": 35.0
    },
    {
      "period": "Night",
      "hours": "10:00 PM - 6:00 AM",
      "startHour": 22,
      "endHour": 6,
      "amount": 50.00,
      "transactionCount": 2,
      "averageTransaction": 25.00,
      "percentage": 5.0
    }
  ],
  "hourlyBreakdown": [
    {
      "hour": 9,
      "amount": 45.00,
      "transactionCount": 2,
      "averageTransaction": 22.50
    },
    {
      "hour": 12,
      "amount": 85.00,
      "transactionCount": 3,
      "averageTransaction": 28.33
    }
  ],
  "transactions": [
    {
      "id": "transaction_id",
      "date": "2025-01-15T09:30:00.000Z",
      "amount": 45.00,
      "description": "Coffee and pastry",
      "merchantName": "Local Café",
      "categoryId": "category_id",
      "categoryName": "Food",
      "subcategoryId": "subcategory_id",
      "subcategoryName": "Coffee"
    }
  ],
  "summary": {
    "totalAmount": 1000.00,
    "totalTransactions": 35,
    "averageTransaction": 28.57,
    "mostActiveDay": {
      "day": "Monday",
      "amount": 180.00,
      "transactionCount": 6
    },
    "mostActivePeriod": {
      "period": "Afternoon",
      "amount": 400.00,
      "transactionCount": 15
    },
    "peakSpendingHour": {
      "hour": 12,
      "hourFormatted": "12:00 PM",
      "amount": 85.00,
      "transactionCount": 3
    },
    "weekdayVsWeekendPreference": "weekdays",
    "impulsePurchaseIndicator": {
      "eveningSpendingPercentage": 35.0,
      "weekendSpendingPercentage": 25.0,
      "isHighImpulse": false
    }
  },
  "insights": [
    {
      "type": "info",
      "title": "Peak Spending Time",
      "message": "Your highest spending occurs during afternoon hours (12-6 PM)",
      "suggestion": "Consider setting spending alerts during your peak spending times",
      "amount": 400.00,
      "dayOrTime": "Afternoon"
    },
    {
      "type": "tip",
      "title": "Weekday Focus",
      "message": "75% of your spending happens on weekdays",
      "suggestion": "Plan weekend activities that align with your spending patterns",
      "amount": 750.00,
      "dayOrTime": "Weekdays"
    },
    {
      "type": "warning",
      "title": "Evening Spending Alert",
      "message": "35% of spending occurs in evening hours, which may indicate impulse purchases",
      "suggestion": "Review evening transactions for discretionary spending opportunities",
      "amount": 350.00,
      "dayOrTime": "Evening"
    }
  ],
  "previousPeriod": {
    "startDate": "2025-01-08T00:00:00.000Z",
    "endDate": "2025-01-15T00:00:00.000Z",
    "totalAmount": 900.00,
    "totalTransactions": 30,
    "weekdayVsWeekendChange": {
      "weekdaysChange": 11.1,
      "weekendsChange": -10.7
    },
    "mostActiveDay": {
      "day": "Tuesday",
      "amount": 160.00
    },
    "keyChanges": [
      "Increased weekday spending by 11.1%",
      "Reduced weekend spending by 10.7%",
      "Most active day shifted from Tuesday to Monday"
    ]
  }
}
```

#### Get Recent Transactions
- **Endpoint:** `GET /transactions/recent`
- **Description:** Get 10 most recent transactions
- **Authentication:** Required
- **Response:** `200 OK` - Returns array of recent transactions

#### Get Transaction by ID
- **Endpoint:** `GET /transactions/:id`
- **Description:** Get a specific transaction by ID
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Transaction ID
- **Response:** `200 OK` - Returns transaction with related data

#### Update Transaction
- **Endpoint:** `PATCH /transactions/:id`
- **Description:** Update a specific transaction
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Transaction ID
- **Request Body:** All fields are optional (same as create transaction)
- **Response:** `200 OK` - Returns updated transaction

#### Delete Transaction
- **Endpoint:** `DELETE /transactions/:id`
- **Description:** Delete a specific transaction
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Transaction ID
- **Response:** `204 No Content`

#### Get Transactions by Category
- **Endpoint:** `GET /transactions/by-category/:categoryId`
- **Description:** Get transactions filtered by category
- **Authentication:** Required
- **Path Parameters:**
  - `categoryId`: Category ID
- **Query Parameters:** Same as transaction filtering
- **Response:** `200 OK` - Returns filtered transactions

#### Get Transactions by Budget
- **Endpoint:** `GET /transactions/by-budget/:budgetId`
- **Description:** Get transactions filtered by budget
- **Authentication:** Required
- **Path Parameters:**
  - `budgetId`: Budget ID
- **Query Parameters:** Same as transaction filtering
- **Response:** `200 OK` - Returns filtered transactions

#### Search Transactions
- **Endpoint:** `POST /transactions/search`
- **Description:** Search transactions with advanced filtering
- **Authentication:** Required
- **Request Body:**
```json
{
  "query": "grocery",
  "filters": {
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-01-31T23:59:59.999Z",
    "type": "EXPENSE",
    "limit": 20,
    "offset": 0,
    "sortBy": "date",
    "sortOrder": "desc"
  }
}
```
- **Response:** `200 OK` - Returns filtered transactions

---

### Budget Endpoints

#### Create Budget
- **Endpoint:** `POST /budgets`
- **Description:** Create a new budget
- **Authentication:** Required
- **Request Body:**
```json
{
  "name": "Monthly Budget",
  "description": "My monthly spending budget", // optional
  "totalAmount": 2000.00,
  "currency": "USD", // optional, defaults to USD
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-01-31T23:59:59.999Z", // optional
  "isRecurring": true, // optional, defaults to true
  "status": "ACTIVE" // optional, defaults to ACTIVE
}
```
- **Validation:**
  - `name`: Required, 1-100 characters
  - `description`: Optional, max 500 characters
  - `totalAmount`: Required, 0.01-999999999.99
  - `currency`: Optional, 3 characters
  - `startDate`: Required, valid ISO date string
  - `status`: Optional, must be valid BudgetStatus enum (DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED)
- **Response:** `201 Created` - Returns created budget

#### Get All Budgets
- **Endpoint:** `GET /budgets`
- **Description:** Get paginated list of user's budgets
- **Authentication:** Required
- **Query Parameters:**
  - `page` (optional): Page number >= 1, default 1
  - `limit` (optional): Items per page 1-100, default 10
- **Response:** `200 OK`
```json
{
  "budgets": [
    {
      "id": "budget_id",
      "name": "Monthly Budget",
      "description": "My monthly spending budget",
      "totalAmount": 2000.00,
      "currency": "USD",
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-01-31T23:59:59.999Z",
      "isRecurring": true,
      "status": "ACTIVE",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "spentAmount": 1500.00,
      "remainingAmount": 500.00,
      "spentPercentage": 75.0,
      "transactionCount": 25,
      "daysRemaining": 15,
      "isOverBudget": false
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### Get Budget by ID
- **Endpoint:** `GET /budgets/:id`
- **Description:** Get a specific budget by ID
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Budget ID
- **Response:** `200 OK` - Returns budget with analytics

#### Update Budget
- **Endpoint:** `PUT /budgets/:id`
- **Description:** Update a specific budget
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Budget ID
- **Request Body:** All fields are optional (same as create budget)
- **Response:** `200 OK` - Returns updated budget

#### Delete Budget
- **Endpoint:** `DELETE /budgets/:id`
- **Description:** Delete a specific budget
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Budget ID
- **Response:** `204 No Content`

#### Get Budget Analytics
- **Endpoint:** `GET /budgets/:id/analytics`
- **Description:** Get detailed analytics for a specific budget
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Budget ID
- **Response:** `200 OK`
```json
{
  "budgetId": "budget_id",
  "budgetName": "Monthly Budget",
  "totalAmount": 2000.00,
  "spentAmount": 1500.00,
  "remainingAmount": 500.00,
  "spentPercentage": 75.0,
  "transactionCount": 25,
  "daysTotal": 31,
  "daysElapsed": 16,
  "daysRemaining": 15,
  "dailyBudget": 64.52,
  "dailyAverageSpending": 93.75,
  "projectedTotalSpending": 2906.25,
  "isOverBudget": false,
  "isOnTrack": false,
  "categoryBreakdown": [
    {
      "categoryId": "category_id",
      "categoryName": "Food",
      "amount": 800.00,
      "percentage": 53.33,
      "transactionCount": 12
    }
  ],
  "spendingTrend": [
    {
      "date": "2025-01-01",
      "dailySpent": 50.00,
      "cumulativeSpent": 50.00
    }
  ]
}
```

---

### Category Endpoints

#### Create Category
- **Endpoint:** `POST /categories`
- **Description:** Create a new category
- **Authentication:** Required
- **Request Body:**
```json
{
  "name": "Food",
  "description": "Food and dining expenses", // optional
  "icon": "🍕", // optional
  "color": "#FF6B6B", // optional, hex color code
  "type": "EXPENSE", // INCOME, EXPENSE, TRANSFER, INVESTMENT
  "parentId": "parent_category_id", // optional, for subcategories
  "isActive": true // optional, defaults to true
}
```
- **Validation:**
  - `name`: Required, 1-50 characters
  - `description`: Optional, max 200 characters
  - `icon`: Optional, max 50 characters
  - `color`: Optional, max 7 characters (hex color)
  - `type`: Required, must be valid CategoryType enum
- **Response:** `201 Created` - Returns created category

#### Get All Categories
- **Endpoint:** `GET /categories`
- **Description:** Get paginated list of user's categories with filtering
- **Authentication:** Required
- **Query Parameters:**
  - `type` (optional): INCOME, EXPENSE, TRANSFER, INVESTMENT
  - `isSystem` (optional): "true" or "false" to filter system categories
  - `parentId` (optional): Filter by parent category ID
  - `search` (optional): Search in category names
  - `includeArchived` (optional): "true" or "false" to include archived categories
  - `page` (optional): Page number >= 1, default 1
  - `limit` (optional): Items per page 1-50, default 50
- **Response:** `200 OK`
```json
{
  "categories": [
    {
      "id": "category_id",
      "name": "Food",
      "description": "Food and dining expenses",
      "icon": "🍕",
      "color": "#FF6B6B",
      "type": "EXPENSE",
      "parentId": null,
      "isSystem": false,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "subcategories": [
        {
          "id": "subcategory_id",
          "name": "Groceries",
          "icon": "🛒",
          "color": "#4ECDC4",
          "type": "EXPENSE",
          "parentId": "category_id",
          "isSystem": false,
          "isActive": true
        }
      ],
      "transactionCount": 25,
      "totalSpent": 800.00,
      "budgetAllocated": 1000.00,
      "lastUsed": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

#### Get System Categories
- **Endpoint:** `GET /categories/system`
- **Description:** Get all system-defined categories
- **Authentication:** Required
- **Response:** `200 OK` - Returns array of system categories

#### Get Popular Categories
- **Endpoint:** `GET /categories/popular`
- **Description:** Get most frequently used categories
- **Authentication:** Required
- **Query Parameters:**
  - `limit` (optional): Number of categories to return, default 10
- **Response:** `200 OK` - Returns array of popular categories

#### Get Archived Categories
- **Endpoint:** `GET /categories/archived`
- **Description:** Get all archived categories
- **Authentication:** Required
- **Response:** `200 OK` - Returns array of archived categories

#### Get Category by ID
- **Endpoint:** `GET /categories/:id`
- **Description:** Get a specific category by ID
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Category ID
- **Response:** `200 OK` - Returns category with related data

#### Get Category Analytics
- **Endpoint:** `GET /categories/:id/analytics`
- **Description:** Get detailed analytics for a specific category
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Category ID
- **Query Parameters:**
  - `startDate` (optional): ISO date string for analytics period
  - `endDate` (optional): ISO date string for analytics period
- **Response:** `200 OK`
```json
{
  "categoryId": "category_id",
  "categoryName": "Food",
  "categoryType": "EXPENSE",
  "totalSpent": 800.00,
  "averageTransaction": 32.00,
  "transactionCount": 25,
  "currency": "USD",
  "lastUsed": "2025-01-15T10:30:00.000Z",
  "firstUsed": "2024-12-01T00:00:00.000Z",
  "usageFrequency": "WEEKLY",
  "budgetAllocated": 1000.00,
  "budgetUsedPercentage": 80.0,
  "isOverBudget": false,
  "monthlySpending": [
    {
      "month": "2025-01",
      "amount": 500.00
    },
    {
      "month": "2024-12",
      "amount": 300.00
    }
  ],
  "percentageOfTotalSpending": 22.86,
  "rankAmongCategories": 1,
  "relatedGoals": []
}
```

#### Update Category
- **Endpoint:** `PATCH /categories/:id`
- **Description:** Update a specific category
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Category ID
- **Request Body:** All fields are optional (same as create category)
- **Response:** `200 OK` - Returns updated category

#### Delete Category
- **Endpoint:** `DELETE /categories/:id`
- **Description:** Delete or archive a specific category
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Category ID
- **Query Parameters:**
  - `permanent` (optional): "true" for permanent deletion, default false (archive)
  - `force` (optional): "true" to force deletion even if category has transactions
- **Response:** `200 OK` - Returns result of deletion/archival

#### Restore Category
- **Endpoint:** `POST /categories/:id/restore`
- **Description:** Restore an archived category
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Category ID
- **Response:** `200 OK` - Returns restored category

---

### Goals Endpoints

#### Create Goal
- **Endpoint:** `POST /goals`
- **Description:** Create a new financial goal
- **Authentication:** Required
- **Request Body:**
```json
{
  "name": "Emergency Fund",
  "description": "Build an emergency fund for unexpected expenses", // optional
  "targetAmount": 10000.00,
  "currency": "USD", // optional, defaults to USD
  "targetDate": "2025-12-31T23:59:59.999Z", // optional
  "category": "EMERGENCY_FUND", // EMERGENCY_FUND, VACATION, HOME_PURCHASE, CAR_PURCHASE, DEBT_PAYOFF, EDUCATION, RETIREMENT, INVESTMENT, GENERAL_SAVINGS
  "type": "SAVINGS", // SAVINGS, SPENDING_LIMIT, DEBT_PAYOFF, INVESTMENT
  "priority": "HIGH", // LOW, MEDIUM, HIGH, CRITICAL
  "autoContribute": false, // optional, defaults to false
  "monthlyTarget": 833.33, // optional
  "isCompleted": false // optional, defaults to false
}
```
- **Validation:**
  - `name`: Required, 1-100 characters
  - `description`: Optional, max 500 characters
  - `targetAmount`: Required, 0.01-999999999.99
  - `currency`: Optional, 3 characters
  - `targetDate`: Optional, valid ISO date string
  - `category`: Required, must be valid GoalCategory enum
  - `type`: Required, must be valid GoalType enum
  - `priority`: Required, must be valid GoalPriority enum
  - `monthlyTarget`: Optional, must be >= 0
- **Response:** `201 Created` - Returns created goal with analytics

#### Get All Goals
- **Endpoint:** `GET /goals`
- **Description:** Get paginated list of user's goals with filtering and analytics
- **Authentication:** Required
- **Query Parameters:**
  - `category` (optional): Filter by goal category
  - `type` (optional): Filter by goal type
  - `priority` (optional): Filter by priority level
  - `isCompleted` (optional): "true" or "false" to filter by completion status
  - `startDate` (optional): Filter goals created after this date
  - `endDate` (optional): Filter goals created before this date
  - `targetDateStart` (optional): Filter goals with target date after this date
  - `targetDateEnd` (optional): Filter goals with target date before this date
  - `search` (optional): Search in goal names and descriptions
  - `sortBy` (optional): Sort field - "name", "targetAmount", "progress", "createdAt", "targetDate"
  - `sortOrder` (optional): "asc" or "desc", default "desc"
  - `page` (optional): Page number >= 1, default 1
  - `limit` (optional): Items per page 1-50, default 10
- **Response:** `200 OK`
```json
{
  "goals": [
    {
      "id": "goal_id",
      "name": "Emergency Fund",
      "description": "Build an emergency fund for unexpected expenses",
      "targetAmount": 10000.00,
      "currentAmount": 2500.00,
      "currency": "USD",
      "targetDate": "2025-12-31T23:59:59.999Z",
      "category": "EMERGENCY_FUND",
      "type": "SAVINGS",
      "priority": "HIGH",
      "autoContribute": false,
      "monthlyTarget": 833.33,
      "isCompleted": false,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "progressPercentage": 25.0,
      "remainingAmount": 7500.00,
      "daysToTarget": 350,
      "monthlyProgressNeeded": 625.00,
      "isOnTrack": false,
      "contributionCount": 5,
      "lastContributionDate": "2025-01-10T00:00:00.000Z",
      "projectedCompletionDate": "2026-02-15T00:00:00.000Z"
    }
  ],
  "summary": {
    "totalGoals": 5,
    "completedGoals": 1,
    "activeGoals": 4,
    "totalTargetAmount": 50000.00,
    "totalCurrentAmount": 12500.00,
    "overallProgress": 25.0
  },
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### Get Goal by ID
- **Endpoint:** `GET /goals/:id`
- **Description:** Get detailed information for a specific goal
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Goal ID
- **Response:** `200 OK` - Returns detailed goal information with analytics and recent contributions

#### Update Goal
- **Endpoint:** `PUT /goals/:id`
- **Description:** Update a specific goal
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Goal ID
- **Request Body:** All fields are optional (same as create goal)
- **Response:** `200 OK` - Returns updated goal with analytics

#### Delete Goal
- **Endpoint:** `DELETE /goals/:id`
- **Description:** Delete a specific goal and all its contributions
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Goal ID
- **Response:** `204 No Content`

#### Add Goal Contribution
- **Endpoint:** `POST /goals/:id/contribute`
- **Description:** Add a contribution to a specific goal
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Goal ID
- **Request Body:**
```json
{
  "amount": 500.00,
  "currency": "USD", // optional, defaults to goal currency
  "date": "2025-01-15T10:30:00.000Z", // optional, defaults to current date
  "description": "Monthly contribution", // optional
  "type": "MANUAL", // MANUAL, AUTOMATIC, TRANSFER, INTEREST
  "transactionId": "transaction_id" // optional, link to related transaction
}
```
- **Validation:**
  - `amount`: Required, 0.01-999999999.99
  - `currency`: Optional, must match goal currency or be convertible
  - `date`: Optional, valid ISO date string
  - `description`: Optional, max 200 characters
  - `type`: Required, must be valid ContributionType enum
- **Response:** `201 Created` - Returns created contribution and updated goal analytics

#### Get Goal Contributions
- **Endpoint:** `GET /goals/:id/contributions`
- **Description:** Get paginated list of contributions for a specific goal
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Goal ID
- **Query Parameters:**
  - `startDate` (optional): Filter contributions after this date
  - `endDate` (optional): Filter contributions before this date
  - `type` (optional): Filter by contribution type
  - `page` (optional): Page number >= 1, default 1
  - `limit` (optional): Items per page 1-50, default 20
- **Response:** `200 OK` - Returns paginated list of contributions with analytics

#### Get Goal Analytics
- **Endpoint:** `GET /goals/:id/analytics`
- **Description:** Get detailed analytics for a specific goal
- **Authentication:** Required
- **Path Parameters:**
  - `id`: Goal ID
- **Response:** `200 OK`
```json
{
  "goalId": "goal_id",
  "goalName": "Emergency Fund",
  "targetAmount": 10000.00,
  "currentAmount": 2500.00,
  "progressPercentage": 25.0,
  "remainingAmount": 7500.00,
  "monthlyTarget": 833.33,
  "actualMonthlyAverage": 416.67,
  "isOnTrack": false,
  "daysToTarget": 350,
  "projectedCompletionDate": "2026-02-15T00:00:00.000Z",
  "contributionAnalytics": {
    "totalContributions": 5,
    "averageContribution": 500.00,
    "largestContribution": 1000.00,
    "smallestContribution": 100.00,
    "lastContributionDate": "2025-01-10T00:00:00.000Z",
    "contributionFrequency": "MONTHLY"
  },
  "monthlyProgress": [
    {
      "month": "2025-01",
      "contributionAmount": 1500.00,
      "contributionCount": 3,
      "targetAmount": 833.33,
      "progressMade": 15.0
    },
    {
      "month": "2024-12",
      "contributionAmount": 1000.00,
      "contributionCount": 2,
      "targetAmount": 833.33,
      "progressMade": 10.0
    }
  ],
  "contributionSources": [
    {
      "type": "MANUAL",
      "amount": 2000.00,
      "percentage": 80.0,
      "count": 4
    },
    {
      "type": "TRANSFER",
      "amount": 500.00,
      "percentage": 20.0,
      "count": 1
    }
  ],
  "timeToCompletion": {
    "atCurrentRate": {
      "months": 18,
      "projectedDate": "2026-07-15T00:00:00.000Z"
    },
    "atTargetRate": {
      "months": 9,
      "projectedDate": "2025-10-15T00:00:00.000Z"
    }
  }
}
```

#### Get Goal Suggestions
- **Endpoint:** `GET /goals/suggestions`
- **Description:** Get AI-powered goal suggestions based on user's financial data
- **Authentication:** Required
- **Query Parameters:**
  - `includeEmergencyFund` (optional): "true" or "false", default true
  - `analyzePeriodMonths` (optional): Number of months to analyze, 1-12, default 6
- **Response:** `200 OK`
```json
{
  "suggestions": [
    {
      "id": "suggestion_1",
      "name": "Emergency Fund",
      "description": "Build 6 months of expenses as emergency fund",
      "category": "EMERGENCY_FUND",
      "type": "SAVINGS",
      "priority": "CRITICAL",
      "suggestedAmount": 15000.00,
      "suggestedMonthlyContribution": 625.00,
      "suggestedTargetDate": "2026-12-31T23:59:59.999Z",
      "reasoning": "Based on your average monthly expenses of $2,500, we recommend saving 6 months of expenses",
      "confidence": 0.95,
      "basedOnData": {
        "averageMonthlyExpenses": 2500.00,
        "monthsOfExpensesRecommended": 6,
        "currentEmergencyFund": 1000.00
      }
    },
    {
      "id": "suggestion_2",
      "name": "Vacation Fund",
      "description": "Save for your next vacation",
      "category": "VACATION",
      "type": "SAVINGS",
      "priority": "MEDIUM",
      "suggestedAmount": 3000.00,
      "suggestedMonthlyContribution": 250.00,
      "suggestedTargetDate": "2025-12-31T23:59:59.999Z",
      "reasoning": "Based on your discretionary spending patterns, you can comfortably save for a vacation",
      "confidence": 0.75,
      "basedOnData": {
        "averageDiscretionarySpending": 800.00,
        "recommendedVacationBudget": 3000.00,
        "availableForSaving": 300.00
      }
    }
  ],
  "spendingAnalysis": {
    "averageMonthlyIncome": 5000.00,
    "averageMonthlyExpenses": 3500.00,
    "averageDiscretionarySpending": 800.00,
    "savingsCapacity": 700.00,
    "recommendedSavingsRate": 0.20,
    "currentSavingsRate": 0.14,
    "topSpendingCategories": [
      {
        "categoryName": "Food",
        "monthlyAverage": 600.00,
        "percentage": 17.14
      },
      {
        "categoryName": "Transportation",
        "monthlyAverage": 400.00,
        "percentage": 11.43
      }
    ]
  },
  "emergencyFundAnalysis": {
    "currentAmount": 1000.00,
    "recommendedAmount": 15000.00,
    "monthsOfExpensesCovered": 0.4,
    "recommendedMonths": 6,
    "urgency": "HIGH"
  }
}
```

#### Get Goals Analytics Summary
- **Endpoint:** `GET /goals/analytics`
- **Description:** Get comprehensive analytics across all user goals
- **Authentication:** Required
- **Query Parameters:**
  - `period` (optional): "month", "quarter", "year", "all", default "all"
  - `category` (optional): Filter analytics by goal category
- **Response:** `200 OK`
```json
{
  "overview": {
    "totalGoals": 8,
    "activeGoals": 6,
    "completedGoals": 2,
    "totalTargetAmount": 75000.00,
    "totalCurrentAmount": 18500.00,
    "overallProgress": 24.67,
    "totalContributions": 42,
    "totalContributionAmount": 18500.00
  },
  "goalsByCategory": [
    {
      "category": "EMERGENCY_FUND",
      "goalCount": 1,
      "totalTarget": 15000.00,
      "totalCurrent": 5000.00,
      "progress": 33.33,
      "priorityDistribution": {
        "CRITICAL": 1,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0
      }
    },
    {
      "category": "VACATION",
      "goalCount": 2,
      "totalTarget": 8000.00,
      "totalCurrent": 3500.00,
      "progress": 43.75,
      "priorityDistribution": {
        "CRITICAL": 0,
        "HIGH": 1,
        "MEDIUM": 1,
        "LOW": 0
      }
    }
  ],
  "goalsByType": [
    {
      "type": "SAVINGS",
      "goalCount": 6,
      "totalTarget": 65000.00,
      "totalCurrent": 16000.00,
      "progress": 24.62
    },
    {
      "type": "DEBT_PAYOFF",
      "goalCount": 2,
      "totalTarget": 10000.00,
      "totalCurrent": 2500.00,
      "progress": 25.0
    }
  ],
  "monthlyContributionTrends": [
    {
      "month": "2025-01",
      "totalContributions": 2500.00,
      "contributionCount": 8,
      "goalsContributedTo": 5
    },
    {
      "month": "2024-12",
      "totalContributions": 3000.00,
      "contributionCount": 12,
      "goalsContributedTo": 6
    }
  ],
  "topPerformingGoals": [
    {
      "goalId": "goal_1",
      "goalName": "Vacation Fund",
      "progress": 75.0,
      "monthlyProgress": 12.5,
      "isOnTrack": true
    },
    {
      "goalId": "goal_2",
      "goalName": "Car Down Payment",
      "progress": 45.0,
      "monthlyProgress": 8.3,
      "isOnTrack": true
    }
  ],
  "insights": [
    {
      "type": "success",
      "title": "Strong Emergency Fund Progress",
      "message": "Your emergency fund is 33% complete, putting you ahead of schedule",
      "goalId": "goal_emergency",
      "amount": 5000.00
    },
    {
      "type": "warning",
      "title": "Goal Behind Schedule",
      "message": "Your home down payment goal needs $1,200/month to stay on track",
      "goalId": "goal_home",
      "amount": 1200.00
    }
  ]
}
```

---

### Health Check Endpoints

#### Health Check
- **Endpoint:** `GET /health`
- **Description:** Check API health status
- **Authentication:** Not required
- **Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "memory": {
    "used": "50MB",
    "total": "100MB"
  }
}
```

#### Ping
- **Endpoint:** `GET /health/ping`
- **Description:** Simple ping endpoint
- **Authentication:** Not required
- **Response:** `200 OK`
```json
{
  "message": "pong",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Data Models

### Enums

#### BudgetStatus
- `DRAFT`: Budget is in draft state
- `ACTIVE`: Budget is active and tracking
- `PAUSED`: Budget is temporarily paused
- `COMPLETED`: Budget period has ended
- `ARCHIVED`: Budget is archived

#### CategoryType
- `INCOME`: Income categories
- `EXPENSE`: Expense categories
- `TRANSFER`: Transfer categories
- `INVESTMENT`: Investment categories

#### TransactionType
- `INCOME`: Income transactions
- `EXPENSE`: Expense transactions
- `TRANSFER`: Transfer transactions
- `REFUND`: Refund transactions

#### GoalCategory
- `EMERGENCY_FUND`: Emergency fund goals
- `VACATION`: Vacation and travel goals
- `HOME_PURCHASE`: Home purchase and real estate goals
- `CAR_PURCHASE`: Vehicle purchase goals
- `DEBT_PAYOFF`: Debt payoff goals
- `EDUCATION`: Education and learning goals
- `RETIREMENT`: Retirement savings goals
- `INVESTMENT`: Investment and portfolio goals
- `GENERAL_SAVINGS`: General savings goals

#### GoalType
- `SAVINGS`: Savings accumulation goals
- `SPENDING_LIMIT`: Spending limit goals
- `DEBT_PAYOFF`: Debt reduction goals
- `INVESTMENT`: Investment growth goals

#### GoalPriority
- `LOW`: Low priority goals
- `MEDIUM`: Medium priority goals
- `HIGH`: High priority goals
- `CRITICAL`: Critical priority goals

#### ContributionType
- `MANUAL`: Manual contributions
- `AUTOMATIC`: Automatic contributions
- `TRANSFER`: Transfer contributions
- `INTEREST`: Interest earnings contributions

### Supported Currencies
- `USD`: US Dollar
- `EUR`: Euro
- `GBP`: British Pound
- `CAD`: Canadian Dollar
- `AUD`: Australian Dollar
- `JPY`: Japanese Yen

---

## Error Handling

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "amount",
      "message": "amount must be greater than 0.01"
    }
  ]
}
```

### Common HTTP Status Codes
- `200 OK`: Successful GET, PUT, PATCH requests
- `201 Created`: Successful POST requests
- `204 No Content`: Successful DELETE requests
- `400 Bad Request`: Invalid request data or validation errors
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Business logic validation errors
- `500 Internal Server Error`: Server errors

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **General endpoints**: 100 requests per minute per IP
- **Authentication endpoints**: 10 requests per minute per IP
- **Rate limit headers** are included in responses:
  - `X-RateLimit-Limit`: Request limit per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

---

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default varies by endpoint, max 100)

Pagination responses include:
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## Validation Rules

### Input Validation
- All DTOs use `class-validator` decorators
- Global validation pipe transforms and validates all inputs
- Whitelist mode prevents extra properties
- Transform mode converts strings to appropriate types

### Common Validation Rules
- **Strings**: Min/max length constraints
- **Numbers**: Min/max value constraints, decimal precision
- **Dates**: Must be valid ISO date strings
- **Enums**: Must be valid enum values
- **Emails**: Must be valid email format
- **Currency codes**: Must be 3-character codes
- **Colors**: Must be valid hex color codes

---

## Security Features

### Authentication & Authorization
- JWT tokens with configurable expiration
- Secure password hashing with bcrypt
- Role-based access control (user-specific data)
- Request validation and sanitization

### API Security
- CORS enabled for cross-origin requests
- Input validation and sanitization
- SQL injection prevention via Prisma ORM
- Rate limiting to prevent abuse
- Secure headers configuration

### Data Protection
- User data isolation (users can only access their own data)
- Soft delete for sensitive operations
- Audit trails with created/updated timestamps
- Environment-based configuration

---

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/trend_db"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
PORT=3001
```

### Optional Environment Variables
```bash
# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# CORS
CORS_ORIGIN="http://localhost:3000"

# Logging
LOG_LEVEL="info"
```

---

## Database Schema

The API uses PostgreSQL with Prisma ORM. Key tables include:

### Users Table
- User authentication and profile information
- Onboarding and tutorial status tracking
- Financial settings (currency, timezone, income)

### Transactions Table
- Financial transaction records
- Categorization and budgeting associations
- AI categorization support
- Comprehensive indexing for performance

### Categories Table
- Hierarchical category system (categories and subcategories)
- System and user-defined categories
- Soft delete support

### Budgets Table
- Budget tracking and management
- Recurring budget support
- Status-based budget lifecycle

---

## Development Notes

### Getting Started
1. Install dependencies: `npm install`
2. Set up environment variables
3. Run database migrations: `npm run db:migrate`
4. Seed system categories: `npm run seed:categories`
5. Start development server: `npm run start:dev`

### Available Scripts
- `npm run start:dev`: Start development server with watch mode
- `npm run build`: Build for production
- `npm run start:prod`: Start production server
- `npm run db:migrate`: Run database migrations
- `npm run db:studio`: Open Prisma Studio
- `npm run test`: Run tests

### API Testing
- Use the provided example requests for testing
- JWT tokens are required for most endpoints
- Validate responses against the documented schemas
- Test pagination and filtering parameters

---

## Support

For API support and documentation updates, please refer to the project repository or contact the development team.

**API Version:** 1.0.0  
**Last Updated:** January 2025
# Day-Time Patterns Analysis Documentation

## Overview

The Day-Time Patterns feature provides comprehensive analysis of spending behaviors based on temporal patterns, including day of the week and time of day insights. This feature helps users understand their spending habits and make informed financial decisions.

## Key Features

### 1. Temporal Analysis
- **Weekday vs Weekend Breakdown**: Compare spending patterns between weekdays and weekends
- **Day of Week Analysis**: Individual analysis for each day of the week (Monday-Sunday)
- **Time Period Breakdown**: Spending analysis across four time periods (Morning, Afternoon, Evening, Night)
- **Hourly Breakdown**: Detailed hour-by-hour spending patterns

### 2. Behavioral Insights
- **Peak Spending Time Detection**: Identifies when users spend the most
- **Impulse Purchase Indicators**: Detects potential impulse buying patterns
- **Spending Pattern Recommendations**: Actionable insights based on spending behavior
- **Period Comparisons**: Compare current period with previous period for trends

### 3. Data Structures

#### Core Interfaces

```typescript
// Main response structure
interface DayTimePatternsResponseDto {
  selectedPeriod: string;
  startDate: string;
  endDate: string;
  weekdayVsWeekend: WeekdayVsWeekendBreakdown;
  dayOfWeekBreakdown: DayOfWeekBreakdown[];
  timeOfDayBreakdown: TimeOfDayBreakdown[];
  hourlyBreakdown: HourlyBreakdown[];
  transactions: DayTimePatternTransaction[];
  summary: DayTimePatternSummary;
  insights: SpendingPatternInsight[];
  previousPeriod?: PreviousPeriodComparison;
}

// Weekday vs Weekend comparison
interface WeekdayVsWeekendBreakdown {
  weekdays: {
    amount: number;
    averagePerDay: number;
    transactionCount: number;
    percentage: number;
  };
  weekends: {
    amount: number;
    averagePerDay: number;
    transactionCount: number;
    percentage: number;
  };
}

// Individual day analysis
interface DayOfWeekBreakdown {
  day: string; // Monday, Tuesday, etc.
  dayIndex: number; // 0 = Sunday, 1 = Monday, etc.
  amount: number;
  transactionCount: number;
  averageTransaction: number;
  percentage: number;
}

// Time period analysis
interface TimeOfDayBreakdown {
  period: string; // Morning, Afternoon, Evening, Night
  hours: string; // "6-12", "12-18", etc.
  startHour: number;
  endHour: number;
  amount: number;
  transactionCount: number;
  averageTransaction: number;
  percentage: number;
}
```

### 4. Time Period Definitions

The system uses the following time period definitions:

- **Morning**: 6:00 AM - 12:00 PM (6-12)
- **Afternoon**: 12:00 PM - 6:00 PM (12-18)
- **Evening**: 6:00 PM - 10:00 PM (18-22)
- **Night**: 10:00 PM - 6:00 AM (22-6)

### 5. Insight Generation

The system generates three types of insights:

#### Info Insights
- Neutral information about spending patterns
- Peak spending time identification
- General spending distribution facts

#### Warning Insights
- Potential impulse purchase indicators
- High concentration spending alerts
- Unusual spending pattern warnings

#### Tip Insights
- Actionable recommendations for better financial management
- Spending optimization suggestions
- Budget planning tips

### 6. Analysis Features

#### Impulse Purchase Detection
The system analyzes spending patterns to identify potential impulse purchases based on:
- **Evening Spending Percentage**: High evening spending may indicate impulse purchases
- **Weekend Spending Patterns**: Unusual weekend spending compared to weekdays
- **Time-based Spending Spikes**: Unusual spending during typically low-activity periods

#### Spending Pattern Recognition
- **Most Active Day**: Day with highest spending amount and transaction count
- **Most Active Period**: Time period with highest activity
- **Peak Spending Hour**: Specific hour with highest spending
- **Weekday vs Weekend Preference**: User's spending tendency preference

### 7. Usage Examples

#### Basic Day-Time Analysis
```bash
GET /transactions/day-time-patterns?startDate=2025-01-15&endDate=2025-01-22
```

#### Category-Specific Analysis
```bash
GET /transactions/day-time-patterns?categoryId=food_category&startDate=2025-01-01&endDate=2025-01-31
```

#### With Previous Period Comparison
```bash
GET /transactions/day-time-patterns?startDate=2025-01-15&endDate=2025-01-22&includePreviousPeriod=true
```

### 8. Business Logic

#### Percentage Calculations
- All percentages are calculated relative to the total spending amount in the selected period
- Day percentages sum to 100% across all days of the week
- Time period percentages sum to 100% across all time periods

#### Average Calculations
- **Average per Day**: Total amount divided by number of days in the period
- **Average Transaction**: Total amount divided by total transaction count
- **Daily Average Spending**: Calculated separately for weekdays and weekends

#### Comparison Logic
- Previous period comparisons use the same date range length as the selected period
- Percentage changes are calculated as: ((current - previous) / previous) * 100
- Key changes are automatically detected and summarized

### 9. Integration Points

#### Mobile App Integration
- Optimized data structure for mobile consumption
- Behavioral insights suitable for push notifications
- Time-based spending alerts integration ready

#### Analytics Dashboard
- Chart-ready data formats
- Multiple visualization support (bar charts, pie charts, line graphs)
- Comparative analysis support

### 10. Performance Considerations

#### Database Optimization
- Indexes on date and user_id fields for efficient querying
- Optimized SQL queries for large datasets
- Efficient aggregation operations

#### Caching Strategy
- Results suitable for caching based on date ranges
- Cache invalidation on new transactions
- User-specific caching support

## Implementation Notes

### Utility Functions
The module includes several utility functions:
- `formatHour()`: Converts 24-hour format to readable time
- `isWeekend()`: Determines if a day index represents a weekend
- `getTimePeriod()`: Maps hour to time period category

### Constants
- `TIME_PERIODS`: Defines all time period configurations
- `DAYS_OF_WEEK`: Array of day names for consistent ordering

This feature provides deep insights into user spending behavior and supports data-driven financial decision making.
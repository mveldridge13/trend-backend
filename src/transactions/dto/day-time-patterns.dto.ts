export interface DayTimePatternTransaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  merchantName?: string;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
}

export interface WeekdayVsWeekendBreakdown {
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

export interface DayOfWeekBreakdown {
  day: string; // Monday, Tuesday, etc.
  dayIndex: number; // 0 = Sunday, 1 = Monday, etc.
  amount: number;
  transactionCount: number;
  averageTransaction: number;
  percentage: number;
}

export interface TimeOfDayBreakdown {
  period: string; // Morning, Afternoon, Evening, Night
  hours: string; // "6-12", "12-18", etc.
  startHour: number;
  endHour: number;
  amount: number;
  transactionCount: number;
  averageTransaction: number;
  percentage: number;
}

export interface HourlyBreakdown {
  hour: number; // 0-23
  amount: number;
  transactionCount: number;
  averageTransaction: number;
}

export interface SpendingPatternInsight {
  type: "info" | "warning" | "tip";
  title: string;
  message: string;
  suggestion?: string;
  amount?: number;
  dayOrTime?: string;
}

export interface DayTimePatternSummary {
  totalAmount: number;
  totalTransactions: number;
  averageTransaction: number;
  mostActiveDay: {
    day: string;
    amount: number;
    transactionCount: number;
  };
  mostActivePeriod: {
    period: string;
    amount: number;
    transactionCount: number;
  };
  peakSpendingHour: {
    hour: number;
    hourFormatted: string; // "2:00 PM"
    amount: number;
    transactionCount: number;
  };
  weekdayVsWeekendPreference: "weekdays" | "weekends" | "balanced";
  impulsePurchaseIndicator: {
    eveningSpendingPercentage: number;
    weekendSpendingPercentage: number;
    isHighImpulse: boolean;
  };
}

export interface DayTimePatternsResponseDto {
  // Date range info
  selectedPeriod: string;
  startDate: string;
  endDate: string;

  // Core breakdowns
  weekdayVsWeekend: WeekdayVsWeekendBreakdown;
  dayOfWeekBreakdown: DayOfWeekBreakdown[];
  timeOfDayBreakdown: TimeOfDayBreakdown[];
  hourlyBreakdown: HourlyBreakdown[];

  // Transaction details
  transactions: DayTimePatternTransaction[];

  // Analytics summary
  summary: DayTimePatternSummary;

  // Insights and recommendations
  insights: SpendingPatternInsight[];

  // Comparison with previous period
  previousPeriod?: {
    startDate: string;
    endDate: string;
    totalAmount: number;
    totalTransactions: number;
    weekdayVsWeekendChange: {
      weekdaysChange: number; // percentage change
      weekendsChange: number;
    };
    mostActiveDay: {
      day: string;
      amount: number;
    };
    keyChanges: string[]; // Array of notable changes
  };
}

// Helper type for service method parameters
export interface DayTimePatternsFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  subcategoryId?: string;
  type?: "EXPENSE" | "INCOME";
  includePreviousPeriod?: boolean;
}

// Constants for time periods
export const TIME_PERIODS = {
  MORNING: { name: "Morning", start: 6, end: 12, hours: "6:00 AM - 12:00 PM" },
  AFTERNOON: {
    name: "Afternoon",
    start: 12,
    end: 18,
    hours: "12:00 PM - 6:00 PM",
  },
  EVENING: { name: "Evening", start: 18, end: 22, hours: "6:00 PM - 10:00 PM" },
  NIGHT: { name: "Night", start: 22, end: 6, hours: "10:00 PM - 6:00 AM" },
} as const;

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// Utility function to format hour as readable time
export function formatHour(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour === 12) return "12:00 PM";
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

// Utility function to determine if day is weekend
export function isWeekend(dayIndex: number): boolean {
  return dayIndex === 0 || dayIndex === 6; // Sunday or Saturday
}

// Utility function to get time period for hour
export function getTimePeriod(hour: number): keyof typeof TIME_PERIODS {
  if (hour >= 6 && hour < 12) return "MORNING";
  if (hour >= 12 && hour < 18) return "AFTERNOON";
  if (hour >= 18 && hour < 22) return "EVENING";
  return "NIGHT";
}

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
    day: string;
    dayIndex: number;
    amount: number;
    transactionCount: number;
    averageTransaction: number;
    percentage: number;
}
export interface TimeOfDayBreakdown {
    period: string;
    hours: string;
    startHour: number;
    endHour: number;
    amount: number;
    transactionCount: number;
    averageTransaction: number;
    percentage: number;
}
export interface HourlyBreakdown {
    hour: number;
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
        hourFormatted: string;
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
    previousPeriod?: {
        startDate: string;
        endDate: string;
        totalAmount: number;
        totalTransactions: number;
        weekdayVsWeekendChange: {
            weekdaysChange: number;
            weekendsChange: number;
        };
        mostActiveDay: {
            day: string;
            amount: number;
        };
        keyChanges: string[];
    };
}
export interface DayTimePatternsFilters {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    subcategoryId?: string;
    type?: "EXPENSE" | "INCOME";
    includePreviousPeriod?: boolean;
}
export declare const TIME_PERIODS: {
    readonly MORNING: {
        readonly name: "Morning";
        readonly start: 6;
        readonly end: 12;
        readonly hours: "6:00 AM - 12:00 PM";
    };
    readonly AFTERNOON: {
        readonly name: "Afternoon";
        readonly start: 12;
        readonly end: 18;
        readonly hours: "12:00 PM - 6:00 PM";
    };
    readonly EVENING: {
        readonly name: "Evening";
        readonly start: 18;
        readonly end: 22;
        readonly hours: "6:00 PM - 10:00 PM";
    };
    readonly NIGHT: {
        readonly name: "Night";
        readonly start: 22;
        readonly end: 6;
        readonly hours: "10:00 PM - 6:00 AM";
    };
};
export declare const DAYS_OF_WEEK: readonly ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export declare function formatHour(hour: number): string;
export declare function isWeekend(dayIndex: number): boolean;
export declare function getTimePeriod(hour: number): keyof typeof TIME_PERIODS;

import { IncomeFrequency } from '@prisma/client';
export interface PayPeriodBoundaries {
    start: Date;
    end: Date;
    frequency: IncomeFrequency;
    daysRemaining: number;
    daysTotal: number;
}
export declare class DateService {
    toUtc(dateString: string, userTimezone: string): Date;
    toUserTimezone(utcDate: Date, userTimezone: string): Date;
    formatInUserTimezone(utcDate: Date, userTimezone: string, formatString?: string): string;
    getNowInUserTimezone(userTimezone: string): Date;
    getTodayInUserTimezone(userTimezone: string): Date;
    getDayBoundariesInUserTimezone(dateString: string, userTimezone: string): {
        start: Date;
        end: Date;
    };
    getWeekBoundariesInUserTimezone(dateString: string, userTimezone: string): {
        start: Date;
        end: Date;
    };
    getMonthBoundariesInUserTimezone(dateString: string, userTimezone: string): {
        start: Date;
        end: Date;
    };
    convertDateRangeToUtc(startDateString: string, endDateString: string, userTimezone: string): {
        start: Date;
        end: Date;
    };
    validateTransactionDate(dateString: string, userTimezone: string): void;
    isToday(utcDate: Date, userTimezone: string): boolean;
    getRelativeDateRange(days: number, userTimezone: string): {
        start: Date;
        end: Date;
    };
    isValidTimezone(timezone: string): boolean;
    getValidTimezone(userTimezone?: string): string;
    calculatePreviousPayDate(nextPayDate: Date, frequency: IncomeFrequency): Date;
    calculateNextPayDateFromCurrent(currentPayDate: Date, frequency: IncomeFrequency): Date;
    calculatePayPeriodBoundaries(nextPayDate: Date, frequency: IncomeFrequency, userTimezone?: string): PayPeriodBoundaries;
    isWithinPayPeriod(date: Date, periodStart: Date, periodEnd: Date): boolean;
    shouldTransitionPayPeriod(nextPayDate: Date, userTimezone?: string): boolean;
    getPayPeriodMultiplier(frequency: IncomeFrequency): number;
    prorateMonthlyAmount(monthlyAmount: number, frequency: IncomeFrequency): number;
}

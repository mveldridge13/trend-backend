import { Injectable } from '@nestjs/common';
import { TZDate, tz } from '@date-fns/tz';
import { 
  parseISO, 
  startOfDay, 
  endOfDay, 
  isValid,
  differenceInDays,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format
} from 'date-fns';

@Injectable()
export class DateService {
  /**
   * Convert a date string from user's timezone to UTC for database storage
   */
  toUtc(dateString: string, userTimezone: string): Date {
    if (!dateString) {
      throw new Error('Date string is required');
    }

    // Parse the date string as if it's in the user's timezone
    const parsedDate = parseISO(dateString);
    if (!isValid(parsedDate)) {
      throw new Error('Invalid date string provided');
    }

    // Create a TZDate in the user's timezone and convert to UTC
    const tzDate = new TZDate(parsedDate, userTimezone);
    return new Date(tzDate.getTime());
  }

  /**
   * Convert a UTC date to user's timezone for display
   */
  toUserTimezone(utcDate: Date, userTimezone: string): Date {
    if (!utcDate) {
      throw new Error('UTC date is required');
    }

    // Create a TZDate in the user's timezone
    return new TZDate(utcDate, userTimezone);
  }

  /**
   * Format a UTC date as ISO string in user's timezone
   */
  formatInUserTimezone(utcDate: Date, userTimezone: string, formatString: string = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"): string {
    const zonedDate = this.toUserTimezone(utcDate, userTimezone);
    return format(zonedDate, formatString);
  }

  /**
   * Get current date/time in user's timezone
   */
  getNowInUserTimezone(userTimezone: string): Date {
    return this.toUserTimezone(new Date(), userTimezone);
  }

  /**
   * Get "today" (start of day) in user's timezone as UTC
   */
  getTodayInUserTimezone(userTimezone: string): Date {
    const nowInUserTz = this.getNowInUserTimezone(userTimezone);
    const startOfTodayInUserTz = startOfDay(nowInUserTz);
    // Convert back to UTC for storage/comparison
    const tzDate = new TZDate(startOfTodayInUserTz, userTimezone);
    return new Date(tzDate.getTime());
  }

  /**
   * Get start and end of day in user's timezone, returned as UTC dates
   */
  getDayBoundariesInUserTimezone(dateString: string, userTimezone: string): { start: Date; end: Date } {
    const userDate = parseISO(dateString);
    if (!isValid(userDate)) {
      throw new Error('Invalid date string provided');
    }

    const startOfDayInUserTz = startOfDay(userDate);
    const endOfDayInUserTz = endOfDay(userDate);

    return {
      start: new Date(new TZDate(startOfDayInUserTz, userTimezone).getTime()),
      end: new Date(new TZDate(endOfDayInUserTz, userTimezone).getTime())
    };
  }

  /**
   * Get week boundaries in user's timezone, returned as UTC dates
   */
  getWeekBoundariesInUserTimezone(dateString: string, userTimezone: string): { start: Date; end: Date } {
    const userDate = parseISO(dateString);
    if (!isValid(userDate)) {
      throw new Error('Invalid date string provided');
    }

    const startOfWeekInUserTz = startOfWeek(userDate);
    const endOfWeekInUserTz = endOfWeek(userDate);

    return {
      start: new Date(new TZDate(startOfWeekInUserTz, userTimezone).getTime()),
      end: new Date(new TZDate(endOfWeekInUserTz, userTimezone).getTime())
    };
  }

  /**
   * Get month boundaries in user's timezone, returned as UTC dates
   */
  getMonthBoundariesInUserTimezone(dateString: string, userTimezone: string): { start: Date; end: Date } {
    const userDate = parseISO(dateString);
    if (!isValid(userDate)) {
      throw new Error('Invalid date string provided');
    }

    const startOfMonthInUserTz = startOfMonth(userDate);
    const endOfMonthInUserTz = endOfMonth(userDate);

    return {
      start: new Date(new TZDate(startOfMonthInUserTz, userTimezone).getTime()),
      end: new Date(new TZDate(endOfMonthInUserTz, userTimezone).getTime())
    };
  }

  /**
   * Convert date range from user timezone to UTC for database queries
   */
  convertDateRangeToUtc(
    startDateString: string,
    endDateString: string,
    userTimezone: string
  ): { start: Date; end: Date } {
    const startDate = parseISO(startDateString);
    const endDate = parseISO(endDateString);

    if (!isValid(startDate) || !isValid(endDate)) {
      throw new Error('Invalid date range provided');
    }

    // Convert start of start date and end of end date to ensure full day coverage
    const startOfStartDay = startOfDay(startDate);
    const endOfEndDay = endOfDay(endDate);

    return {
      start: new Date(new TZDate(startOfStartDay, userTimezone).getTime()),
      end: new Date(new TZDate(endOfEndDay, userTimezone).getTime())
    };
  }

  /**
   * Validate if a transaction date is within acceptable range
   * Checks against user's timezone "today"
   */
  validateTransactionDate(dateString: string, userTimezone: string): void {
    const transactionDateUtc = parseISO(dateString);
    if (!isValid(transactionDateUtc)) {
      throw new Error('Invalid transaction date');
    }

    // Get current date/time in user's timezone
    const nowInUserTz = this.getNowInUserTimezone(userTimezone);
    const todayStartInUserTz = startOfDay(nowInUserTz);
    
    // Convert the UTC transaction date to user's timezone for comparison
    const transactionDateInUserTz = this.toUserTimezone(transactionDateUtc, userTimezone);
    const transactionDateStartInUserTz = startOfDay(transactionDateInUserTz);

    // Transaction cannot be in the future (based on user's timezone)
    if (transactionDateStartInUserTz > todayStartInUserTz) {
      throw new Error('Transaction date cannot be in the future');
    }

    // Transaction cannot be older than 5 years
    const fiveYearsAgo = subDays(todayStartInUserTz, 365 * 5);
    if (transactionDateStartInUserTz < fiveYearsAgo) {
      throw new Error('Transaction date cannot be older than 5 years');
    }
  }

  /**
   * Check if a transaction is from "today" in user's timezone
   */
  isToday(utcDate: Date, userTimezone: string): boolean {
    const dateInUserTz = this.toUserTimezone(utcDate, userTimezone);
    const todayInUserTz = this.getNowInUserTimezone(userTimezone);
    
    return format(dateInUserTz, 'yyyy-MM-dd') === 
           format(todayInUserTz, 'yyyy-MM-dd');
  }

  /**
   * Get relative date ranges (e.g., last 30 days) in user timezone
   */
  getRelativeDateRange(
    days: number,
    userTimezone: string
  ): { start: Date; end: Date } {
    const nowInUserTz = this.getNowInUserTimezone(userTimezone);
    const startDateInUserTz = subDays(startOfDay(nowInUserTz), days - 1);
    const endDateInUserTz = endOfDay(nowInUserTz);

    return {
      start: new Date(new TZDate(startDateInUserTz, userTimezone).getTime()),
      end: new Date(new TZDate(endDateInUserTz, userTimezone).getTime())
    };
  }

  /**
   * Parse and validate timezone string
   */
  isValidTimezone(timezone: string): boolean {
    try {
      // Try to create a TZDate with the timezone
      new TZDate(new Date(), timezone);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get default timezone if user timezone is invalid
   */
  getValidTimezone(userTimezone?: string): string {
    if (!userTimezone || !this.isValidTimezone(userTimezone)) {
      return 'UTC';
    }
    return userTimezone;
  }
}
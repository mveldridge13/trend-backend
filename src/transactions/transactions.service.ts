import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { TransactionsRepository } from "./repositories/transactions.repository";
import { UsersRepository } from "../users/repositories/users.repository";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionDto } from "./dto/transaction.dto";
import { TransactionFilterDto } from "./dto/transaction-filter.dto";
import { TransactionAnalyticsDto } from "./dto/transaction-analytics.dto";
import {
  DayTimePatternsResponseDto,
  DayTimePatternsFilters,
  DayTimePatternTransaction,
  WeekdayVsWeekendBreakdown,
  DayOfWeekBreakdown,
  TimeOfDayBreakdown,
  HourlyBreakdown,
  DayTimePatternSummary,
  SpendingPatternInsight,
  TIME_PERIODS,
  DAYS_OF_WEEK,
  formatHour,
  isWeekend,
  getTimePeriod,
} from "./dto/day-time-patterns.dto";
//import { DiscretionaryBreakdownDto } from "./dto/discretionary-breakdown.dto";
import { Transaction, TransactionType, IncomeFrequency } from "@prisma/client";
import { DateService } from "../common/services/date.service";

// ✅ Inline interface definition for discretionary breakdown
interface DiscretionaryBreakdownDto {
  selectedDate: string;
  selectedPeriod: "daily" | "weekly" | "monthly";
  totalDiscretionaryAmount: number;
  transactions: {
    id: string;
    date: string;
    amount: number;
    description: string;
    merchant?: string;
    categoryId: string;
    categoryName: string;
    subcategoryId?: string;
    subcategoryName?: string;
  }[];
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    categoryIcon?: string;
    categoryColor?: string;
    amount: number;
    transactionCount: number;
    percentage: number;
    subcategories: {
      subcategoryId?: string;
      subcategoryName: string;
      amount: number;
      transactionCount: number;
      percentage: number;
      transactions: {
        id: string;
        date: string;
        amount: number;
        description: string;
        merchant?: string;
      }[];
    }[];
    transactions: {
      id: string;
      date: string;
      amount: number;
      description: string;
      merchant?: string;
      subcategoryId?: string;
      subcategoryName?: string;
    }[];
  }[];
  previousPeriod?: {
    date: string;
    totalDiscretionaryAmount: number;
    percentageChange: number;
    topCategories: {
      categoryName: string;
      amount: number;
    }[];
  };
  insights: {
    type: "info" | "warning" | "success" | "error";
    category?: string;
    title: string;
    message: string;
    suggestion?: string;
    amount?: number;
  }[];
  summary: {
    transactionCount: number;
    averageTransactionAmount: number;
    largestTransaction: {
      id: string;
      amount: number;
      description: string;
      categoryName: string;
    };
    topSpendingCategory: {
      categoryName: string;
      amount: number;
      percentage: number;
    };
    spendingDistribution: {
      morning: number;
      afternoon: number;
      evening: number;
      night: number;
    };
  };
}

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly dateService: DateService,
  ) {}

  async create(
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionDto> {
    // Get user's timezone for proper date validation
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const userTimezone = this.dateService.getValidTimezone(user.timezone);
    
    this.validateTransactionAmount(createTransactionDto.amount);
    this.dateService.validateTransactionDate(createTransactionDto.date, userTimezone);

    // Date is already in UTC format from frontend, no conversion needed
    const transaction = await this.transactionsRepository.create(
      userId,
      {
        ...createTransactionDto,
        date: createTransactionDto.date,
      },
    );
    return await this.mapToDto(transaction, userTimezone);
  }

  async findAll(
    userId: string,
    filters: TransactionFilterDto,
  ): Promise<{
    transactions: TransactionDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [transactions, total] = await Promise.all([
      this.transactionsRepository.findMany(userId, filters),
      this.transactionsRepository.count(userId, filters),
    ]);

    // Get user timezone for date conversion
    const user = await this.usersRepository.findById(userId);
    const userTimezone = this.dateService.getValidTimezone(user?.timezone);

    const page = Math.floor(filters.offset / filters.limit) + 1;
    const totalPages = Math.ceil(total / filters.limit);

    return {
      transactions: await Promise.all(transactions.map(t => this.mapToDto(t, userTimezone))),
      total,
      page,
      limit: filters.limit,
      totalPages,
    };
  }

  async findOne(id: string, userId: string): Promise<TransactionDto> {
    const transaction = await this.transactionsRepository.findById(id, userId);
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return await this.mapToDto(transaction);
  }

  async update(
    id: string,
    userId: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    const existingTransaction = await this.transactionsRepository.findById(
      id,
      userId,
    );
    if (!existingTransaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (
      updateTransactionDto.amount !== undefined &&
      updateTransactionDto.type !== undefined
    ) {
      this.validateTransactionAmount(updateTransactionDto.amount);
    } else if (updateTransactionDto.amount !== undefined) {
      this.validateTransactionAmount(updateTransactionDto.amount);
    } else if (updateTransactionDto.type !== undefined) {
      this.validateTransactionAmount(Number(existingTransaction.amount));
    }

    // Get user's timezone for proper date validation and response conversion
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const userTimezone = this.dateService.getValidTimezone(user.timezone);

    if (updateTransactionDto.date !== undefined) {
      this.dateService.validateTransactionDate(updateTransactionDto.date, userTimezone);
      
      // Convert date from user timezone to UTC for storage
      const utcDate = this.dateService.toUtc(updateTransactionDto.date, userTimezone);
      updateTransactionDto.date = utcDate.toISOString();
    }

    const updatedTransaction = await this.transactionsRepository.update(
      id,
      userId,
      updateTransactionDto,
    );

    return await this.mapToDto(updatedTransaction, userTimezone);
  }

  async remove(id: string, userId: string): Promise<void> {
    const transaction = await this.transactionsRepository.findById(id, userId);
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    await this.transactionsRepository.delete(id, userId);
  }

  async getAnalytics(
    userId: string,
    filters: Partial<TransactionFilterDto> = {},
  ): Promise<TransactionAnalyticsDto> {
    const userProfile = await this.usersRepository.findById(userId);
    const transactions = await this.transactionsRepository.findMany(userId, {
      ...filters,
      limit: 10000,
      offset: 0,
      sortBy: "date",
      sortOrder: "desc",
    } as TransactionFilterDto);

    return this.calculateAnalytics(transactions, filters, userProfile);
  }

  // ✅ FIXED: Get discretionary breakdown for daily spending analysis
  async getDiscretionaryBreakdown(
    userId: string,
    filters: Partial<TransactionFilterDto> = {},
  ): Promise<DiscretionaryBreakdownDto> {
    // Get user timezone for proper date handling
    const user = await this.usersRepository.findById(userId);
    const userTimezone = this.dateService.getValidTimezone(user?.timezone);

    // Use timezone-aware date range
    const defaultRange = this.dateService.getRelativeDateRange(30, userTimezone);
    const startDate = filters.startDate || defaultRange.start.toISOString();
    const endDate = filters.endDate || defaultRange.end.toISOString();
    const selectedDate = filters.endDate || this.dateService.formatInUserTimezone(defaultRange.end, userTimezone, 'yyyy-MM-dd');
    const selectedPeriod = this.determinePeriodType(startDate, endDate);

    const transactions = await this.transactionsRepository.findMany(userId, {
      startDate,
      endDate,
      type: TransactionType.EXPENSE,
      limit: 10000,
      offset: 0,
      sortBy: "date",
      sortOrder: "desc",
    } as TransactionFilterDto);

    const discretionaryTransactions = transactions.filter((t) => {
      return t.recurrence === "none" || !t.recurrence;
    });

    const targetTransactions = this.filterTransactionsForPeriod(
      discretionaryTransactions,
      selectedDate,
      selectedPeriod,
    );

    const totalDiscretionaryAmount = targetTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    const categoryBreakdown = this.calculateCategoryBreakdown(
      targetTransactions,
      totalDiscretionaryAmount,
    );

    const mappedTransactions = targetTransactions.map((t) => ({
      id: t.id,
      date: t.date,
      amount: Number(t.amount),
      description: t.description,
      merchant: t.merchantName,
      categoryId: t.category?.id || "unknown",
      categoryName: t.category?.name || "Other",
      subcategoryId: t.subcategory?.id,
      subcategoryName: t.subcategory?.name,
    }));

    const previousPeriod = this.calculatePreviousPeriodComparison(
      discretionaryTransactions,
      selectedDate,
      selectedPeriod,
    );

    const insights = this.generateDiscretionaryInsights(
      categoryBreakdown,
      totalDiscretionaryAmount,
      previousPeriod,
      selectedPeriod,
    );

    const summary = this.calculateDiscretionarySummary(
      targetTransactions,
      categoryBreakdown,
    );

    return {
      selectedDate,
      selectedPeriod,
      totalDiscretionaryAmount,
      transactions: mappedTransactions,
      categoryBreakdown,
      previousPeriod,
      insights,
      summary,
    };
  }

  // ✅ NEW: Get bills analytics
  async getBillsAnalytics(
    userId: string,
    filters: Partial<TransactionFilterDto> = {},
  ): Promise<any> {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Support custom date range from filters, default to current month
      let startDate: Date;
      let endDate: Date;

      if (filters.startDate && filters.endDate) {
        startDate = new Date(filters.startDate);
        endDate = new Date(filters.endDate);

        // Validate date range
        if (startDate > endDate) {
          throw new BadRequestException("Start date cannot be after end date");
        }

        // Limit to reasonable range (max 1 year)
        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
        if (endDate.getTime() - startDate.getTime() > oneYearInMs) {
          throw new BadRequestException("Date range cannot exceed one year");
        }
      } else {
        // Default to current month
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
      }

      const allBills = await this.transactionsRepository.findMany(userId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 10000,
        offset: 0,
        sortBy: "dueDate",
        sortOrder: "asc",
      } as TransactionFilterDto);

      // Filter to only include bills (transactions with dueDate OR recurrence)
      const bills = allBills.filter((t) => {
        return t.dueDate !== null || (t.recurrence && t.recurrence !== "none");
      });

      // Early return for no bills found
      if (bills.length === 0) {
        return {
          totalBills: 0,
          paidBills: 0,
          unpaidBills: 0,
          overdueBills: 0,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          overdueAmount: 0,
          progress: 0,
          upcomingBills: [],
          paidBillsList: [],
          unpaidBillsList: [],
          overdueBillsList: [],
        };
      }

      // Calculate summary counts and amounts
      const totalBills = bills.length;
      const paidBills = bills.filter((t) => t.status === "PAID").length;
      const unpaidBills = bills.filter((t) => t.status === "UPCOMING").length;
      const overdueBills = bills.filter(
        (t) => t.status !== "PAID" && t.dueDate && new Date(t.dueDate) < now,
      ).length;

      // Calculate financial totals (use absolute amounts as bills are typically negative)
      const totalAmount = bills.reduce((sum, t) => {
        const amount = Number(t.amount);
        return sum + (isNaN(amount) ? 0 : Math.abs(amount));
      }, 0);

      const paidAmount = bills
        .filter((t) => t.status === "PAID")
        .reduce((sum, t) => {
          const amount = Number(t.amount);
          return sum + (isNaN(amount) ? 0 : Math.abs(amount));
        }, 0);

      const unpaidAmount = bills
        .filter((t) => t.status === "UPCOMING")
        .reduce((sum, t) => {
          const amount = Number(t.amount);
          return sum + (isNaN(amount) ? 0 : Math.abs(amount));
        }, 0);

      const overdueAmount = bills
        .filter(
          (t) => t.status !== "PAID" && t.dueDate && new Date(t.dueDate) < now,
        )
        .reduce((sum, t) => {
          const amount = Number(t.amount);
          return sum + (isNaN(amount) ? 0 : Math.abs(amount));
        }, 0);

      // Calculate progress percentage
      const progress =
        totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

      // Helper function to map transaction to bill format with error handling
      const mapToBill = (t: any) => {
        try {
          return {
            id: t.id,
            description: t.description || "Unknown",
            amount: Number(t.amount) || 0,
            dueDate: t.dueDate,
            status: t.status || "UPCOMING",
            category: t.category
              ? { name: t.category.name || "Unknown" }
              : null,
            recurrence: t.recurrence || "none",
          };
        } catch (error) {
          return {
            id: t.id || "unknown",
            description: "Error loading bill details",
            amount: 0,
            dueDate: null,
            status: "UPCOMING",
            category: null,
            recurrence: "none",
          };
        }
      };

      // Categorized bill lists with proper sorting and error handling
      const upcomingBills = bills
        .filter((t) => {
          try {
            return (
              t.status === "UPCOMING" &&
              t.dueDate &&
              new Date(t.dueDate) >= now &&
              new Date(t.dueDate) <= oneWeekFromNow
            );
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          try {
            return (
              new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
            );
          } catch {
            return 0;
          }
        })
        .map(mapToBill);

      const paidBillsList = bills
        .filter((t) => t.status === "PAID")
        .sort((a, b) => {
          try {
            const dateA = new Date(b.dueDate || b.date);
            const dateB = new Date(a.dueDate || a.date);
            return dateA.getTime() - dateB.getTime();
          } catch {
            return 0;
          }
        })
        .map(mapToBill);

      const unpaidBillsList = bills
        .filter((t) => t.status === "UPCOMING")
        .sort((a, b) => {
          try {
            const dateA = new Date(a.dueDate || a.date);
            const dateB = new Date(b.dueDate || b.date);
            return dateA.getTime() - dateB.getTime();
          } catch {
            return 0;
          }
        })
        .map(mapToBill);

      const overdueBillsList = bills
        .filter((t) => {
          try {
            return (
              t.status !== "PAID" && t.dueDate && new Date(t.dueDate) < now
            );
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          try {
            return (
              new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
            );
          } catch {
            return 0;
          }
        })
        .map(mapToBill);

      return {
        // Summary counts
        totalBills,
        paidBills,
        unpaidBills,
        overdueBills,

        // Financial totals
        totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimal places
        paidAmount: Math.round(paidAmount * 100) / 100,
        unpaidAmount: Math.round(unpaidAmount * 100) / 100,
        overdueAmount: Math.round(overdueAmount * 100) / 100,

        // Progress calculation
        progress,

        // Categorized bill lists (sorted)
        upcomingBills,
        paidBillsList,
        unpaidBillsList,
        overdueBillsList,
      };
    } catch (error) {
      // Log error for debugging

      // Return empty structure with error indication
      if (error instanceof BadRequestException) {
        throw error; // Re-throw validation errors
      }

      // For other errors, return empty structure
      return {
        totalBills: 0,
        paidBills: 0,
        unpaidBills: 0,
        overdueBills: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        overdueAmount: 0,
        progress: 0,
        upcomingBills: [],
        paidBillsList: [],
        unpaidBillsList: [],
        overdueBillsList: [],
        error: "Failed to load bills analytics",
      };
    }
  }

  // ✅ NEW: Get day/time spending patterns analysis
  async getDayTimePatterns(
    userId: string,
    filters: Partial<TransactionFilterDto> = {},
  ): Promise<DayTimePatternsResponseDto> {
    const now = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(now.getDate() - 30);

    const startDate = filters.startDate || defaultStartDate.toISOString();
    const endDate = filters.endDate || now.toISOString();
    const selectedPeriod = this.determinePeriodType(startDate, endDate);

    // Get transactions for analysis - EXCLUDE recurring transactions (bills/obligations)
    const transactions = await this.transactionsRepository.findMany(userId, {
      startDate,
      endDate,
      type: TransactionType.EXPENSE,
      limit: 10000,
      offset: 0,
      sortBy: "date",
      sortOrder: "desc",
    } as TransactionFilterDto);

    // ✅ FILTER: Only include non-recurring transactions (discretionary spending)
    const discretionaryTransactions = transactions.filter((t) => {
      return t.recurrence === "none" || !t.recurrence;
    });

    // Map transactions to DTO format (using filtered discretionary transactions)
    const mappedTransactions: DayTimePatternTransaction[] =
      discretionaryTransactions.map((t: any) => ({
        id: t.id,
        date: t.date,
        amount: Number(t.amount),
        description: t.description,
        merchantName: t.merchantName || undefined,
        categoryId: t.category?.id,
        categoryName: t.category?.name,
        subcategoryId: t.subcategory?.id,
        subcategoryName: t.subcategory?.name,
      }));

    // Calculate all breakdowns (using discretionary transactions only)
    const weekdayVsWeekend =
      this.calculateWeekdayVsWeekendBreakdown(mappedTransactions);
    const dayOfWeekBreakdown =
      this.calculateDayOfWeekBreakdown(mappedTransactions);
    const timeOfDayBreakdown =
      this.calculateTimeOfDayBreakdown(mappedTransactions);
    const hourlyBreakdown = this.calculateHourlyBreakdown(mappedTransactions);
    const summary = this.calculateDayTimePatternSummary(
      mappedTransactions,
      weekdayVsWeekend,
      dayOfWeekBreakdown,
      timeOfDayBreakdown,
      hourlyBreakdown,
    );
    const insights = this.generateDayTimePatternInsights(
      weekdayVsWeekend,
      dayOfWeekBreakdown,
      timeOfDayBreakdown,
      summary,
    );

    // Calculate previous period comparison by default
    let previousPeriod = undefined;
    try {
      previousPeriod = await this.calculateDayTimePreviousPeriod(
        userId,
        startDate,
        endDate,
        selectedPeriod,
      );
    } catch (error) {
      // Continue without previous period data
    }

    return {
      selectedPeriod,
      startDate: startDate.split("T")[0],
      endDate: endDate.split("T")[0],
      weekdayVsWeekend,
      dayOfWeekBreakdown,
      timeOfDayBreakdown,
      hourlyBreakdown,
      transactions: mappedTransactions,
      summary,
      insights,
      previousPeriod,
    };
  }

  // ✅ Helper methods for day/time patterns analysis

  private calculateWeekdayVsWeekendBreakdown(
    transactions: DayTimePatternTransaction[],
  ): WeekdayVsWeekendBreakdown {
    let weekdayAmount = 0;
    let weekendAmount = 0;
    let weekdayCount = 0;
    let weekendCount = 0;

    const weekdayDays = new Set<string>();
    const weekendDays = new Set<string>();

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const dayIndex = date.getDay();
      const dateStr = date.toISOString().split("T")[0];

      if (isWeekend(dayIndex)) {
        weekendAmount += t.amount;
        weekendCount += 1;
        weekendDays.add(dateStr);
      } else {
        weekdayAmount += t.amount;
        weekdayCount += 1;
        weekdayDays.add(dateStr);
      }
    });

    const totalAmount = weekdayAmount + weekendAmount;
    const weekdayAverage =
      weekdayDays.size > 0 ? weekdayAmount / weekdayDays.size : 0;
    const weekendAverage =
      weekendDays.size > 0 ? weekendAmount / weekendDays.size : 0;

    return {
      weekdays: {
        amount: weekdayAmount,
        averagePerDay: weekdayAverage,
        transactionCount: weekdayCount,
        percentage: totalAmount > 0 ? (weekdayAmount / totalAmount) * 100 : 0,
      },
      weekends: {
        amount: weekendAmount,
        averagePerDay: weekendAverage,
        transactionCount: weekendCount,
        percentage: totalAmount > 0 ? (weekendAmount / totalAmount) * 100 : 0,
      },
    };
  }

  private calculateDayOfWeekBreakdown(
    transactions: DayTimePatternTransaction[],
  ): DayOfWeekBreakdown[] {
    const dayTotals = new Map<number, { amount: number; count: number }>();

    // Initialize all days
    for (let i = 0; i < 7; i++) {
      dayTotals.set(i, { amount: 0, count: 0 });
    }

    transactions.forEach((t) => {
      const dayIndex = new Date(t.date).getDay();
      const dayData = dayTotals.get(dayIndex)!;
      dayData.amount += t.amount;
      dayData.count += 1;
    });

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    return Array.from(dayTotals.entries()).map(([dayIndex, data]) => ({
      day: DAYS_OF_WEEK[dayIndex],
      dayIndex,
      amount: data.amount,
      transactionCount: data.count,
      averageTransaction: data.count > 0 ? data.amount / data.count : 0,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    }));
  }

  private calculateTimeOfDayBreakdown(
    transactions: DayTimePatternTransaction[],
  ): TimeOfDayBreakdown[] {
    const periodTotals = new Map<string, { amount: number; count: number }>();

    // Initialize all periods
    Object.keys(TIME_PERIODS).forEach((period) => {
      periodTotals.set(period, { amount: 0, count: 0 });
    });

    transactions.forEach((t) => {
      const hour = new Date(t.date).getHours();
      const period = getTimePeriod(hour);
      const periodData = periodTotals.get(period)!;
      periodData.amount += t.amount;
      periodData.count += 1;
    });

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    return Object.entries(TIME_PERIODS).map(([periodKey, periodInfo]) => {
      const data = periodTotals.get(periodKey)!;
      return {
        period: periodInfo.name,
        hours: periodInfo.hours,
        startHour: periodInfo.start,
        endHour: periodInfo.end,
        amount: data.amount,
        transactionCount: data.count,
        averageTransaction: data.count > 0 ? data.amount / data.count : 0,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      };
    });
  }

  private calculateHourlyBreakdown(
    transactions: DayTimePatternTransaction[],
  ): HourlyBreakdown[] {
    const hourlyTotals = new Map<number, { amount: number; count: number }>();

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyTotals.set(i, { amount: 0, count: 0 });
    }

    transactions.forEach((t) => {
      const hour = new Date(t.date).getHours();
      const hourData = hourlyTotals.get(hour)!;
      hourData.amount += t.amount;
      hourData.count += 1;
    });

    return Array.from(hourlyTotals.entries()).map(([hour, data]) => ({
      hour,
      amount: data.amount,
      transactionCount: data.count,
      averageTransaction: data.count > 0 ? data.amount / data.count : 0,
    }));
  }

  private calculateDayTimePatternSummary(
    transactions: DayTimePatternTransaction[],
    weekdayVsWeekend: WeekdayVsWeekendBreakdown,
    dayOfWeekBreakdown: DayOfWeekBreakdown[],
    timeOfDayBreakdown: TimeOfDayBreakdown[],
    hourlyBreakdown: HourlyBreakdown[],
  ): DayTimePatternSummary {
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalTransactions = transactions.length;
    const averageTransaction =
      totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Find most active day
    const mostActiveDay = dayOfWeekBreakdown.reduce((max, current) =>
      current.amount > max.amount ? current : max,
    );

    // Find most active period
    const mostActivePeriod = timeOfDayBreakdown.reduce((max, current) =>
      current.amount > max.amount ? current : max,
    );

    // Find peak spending hour
    const peakHour = hourlyBreakdown.reduce((max, current) =>
      current.amount > max.amount ? current : max,
    );

    // Determine weekday vs weekend preference
    let weekdayVsWeekendPreference: "weekdays" | "weekends" | "balanced";
    const weekdayPercentage = weekdayVsWeekend.weekdays.percentage;
    const weekendPercentage = weekdayVsWeekend.weekends.percentage;

    if (Math.abs(weekdayPercentage - weekendPercentage) < 10) {
      weekdayVsWeekendPreference = "balanced";
    } else if (weekdayPercentage > weekendPercentage) {
      weekdayVsWeekendPreference = "weekdays";
    } else {
      weekdayVsWeekendPreference = "weekends";
    }

    // Calculate impulse purchase indicators
    const eveningPeriod = timeOfDayBreakdown.find(
      (p) => p.period === "Evening",
    );
    const eveningSpendingPercentage = eveningPeriod
      ? eveningPeriod.percentage
      : 0;
    const isHighImpulse =
      eveningSpendingPercentage > 30 || weekendPercentage > 40;

    return {
      totalAmount,
      totalTransactions,
      averageTransaction,
      mostActiveDay: {
        day: mostActiveDay.day,
        amount: mostActiveDay.amount,
        transactionCount: mostActiveDay.transactionCount,
      },
      mostActivePeriod: {
        period: mostActivePeriod.period,
        amount: mostActivePeriod.amount,
        transactionCount: mostActivePeriod.transactionCount,
      },
      peakSpendingHour: {
        hour: peakHour.hour,
        hourFormatted: formatHour(peakHour.hour),
        amount: peakHour.amount,
        transactionCount: peakHour.transactionCount,
      },
      weekdayVsWeekendPreference,
      impulsePurchaseIndicator: {
        eveningSpendingPercentage,
        weekendSpendingPercentage: weekendPercentage,
        isHighImpulse,
      },
    };
  }

  private generateDayTimePatternInsights(
    weekdayVsWeekend: WeekdayVsWeekendBreakdown,
    dayOfWeekBreakdown: DayOfWeekBreakdown[],
    timeOfDayBreakdown: TimeOfDayBreakdown[],
    summary: DayTimePatternSummary,
  ): SpendingPatternInsight[] {
    const insights: SpendingPatternInsight[] = [];

    // Weekend vs weekday insights
    if (weekdayVsWeekend.weekends.percentage > 40) {
      insights.push({
        type: "warning",
        title: "High Weekend Spending",
        message: `${weekdayVsWeekend.weekends.percentage.toFixed(1)}% of your spending occurs on weekends.`,
        suggestion:
          "Consider planning weekend activities with a set budget to avoid overspending.",
        amount: weekdayVsWeekend.weekends.amount,
      });
    }

    // Evening spending patterns
    const eveningPeriod = timeOfDayBreakdown.find(
      (p) => p.period === "Evening",
    );
    if (eveningPeriod && eveningPeriod.percentage > 35) {
      insights.push({
        type: "info",
        title: "Evening Spending Pattern",
        message: `You spend most (${eveningPeriod.percentage.toFixed(1)}%) in the evening hours.`,
        suggestion:
          "Evening purchases are often impulse buys. Try planning purchases during daytime hours.",
        dayOrTime: "Evening",
      });
    }

    // Peak day insights
    const peakDay = dayOfWeekBreakdown.reduce((max, current) =>
      current.amount > max.amount ? current : max,
    );
    if (peakDay.percentage > 25) {
      insights.push({
        type: "tip",
        title: `${peakDay.day} Spending Peak`,
        message: `${peakDay.day} is your highest spending day with ${peakDay.percentage.toFixed(1)}% of weekly expenses.`,
        suggestion: `Be extra mindful of spending on ${peakDay.day}s.`,
        dayOrTime: peakDay.day,
        amount: peakDay.amount,
      });
    }

    // Impulse purchase indicator
    if (summary.impulsePurchaseIndicator.isHighImpulse) {
      insights.push({
        type: "warning",
        title: "Impulse Purchase Pattern Detected",
        message:
          "High evening and weekend spending may indicate impulse purchases.",
        suggestion:
          "Try implementing a 24-hour wait rule for non-essential purchases.",
      });
    }

    // Balanced spending insight
    if (summary.weekdayVsWeekendPreference === "balanced") {
      insights.push({
        type: "info",
        title: "Balanced Spending Pattern",
        message:
          "Your spending is well-distributed between weekdays and weekends.",
        suggestion: "Great job maintaining consistent spending habits!",
      });
    }

    return insights;
  }

  private async calculateDayTimePreviousPeriod(
    userId: string,
    startDate: string,
    endDate: string,
    selectedPeriod: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Calculate previous period dates
    const previousStart = new Date(start);
    previousStart.setDate(start.getDate() - daysDiff);
    const previousEnd = new Date(end);
    previousEnd.setDate(end.getDate() - daysDiff);

    // Get previous period transactions
    const previousTransactions = await this.transactionsRepository.findMany(
      userId,
      {
        startDate: previousStart.toISOString(),
        endDate: previousEnd.toISOString(),
        type: TransactionType.EXPENSE,
        limit: 10000,
        offset: 0,
        sortBy: "date",
        sortOrder: "desc",
      } as TransactionFilterDto,
    );

    const previousMapped: DayTimePatternTransaction[] =
      previousTransactions.map((t: any) => ({
        id: t.id,
        date: t.date,
        amount: Number(t.amount),
        description: t.description,
        merchantName: t.merchantName || undefined,
        categoryId: t.category?.id,
        categoryName: t.category?.name,
        subcategoryId: t.subcategory?.id,
        subcategoryName: t.subcategory?.name,
      }));

    const previousWeekdayVsWeekend =
      this.calculateWeekdayVsWeekendBreakdown(previousMapped);
    const previousDayOfWeek = this.calculateDayOfWeekBreakdown(previousMapped);
    const previousTotal = previousMapped.reduce((sum, t) => sum + t.amount, 0);
    const currentTotal = previousTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    const mostActiveDay = previousDayOfWeek.reduce((max, current) =>
      current.amount > max.amount ? current : max,
    );

    // Calculate key changes
    const keyChanges: string[] = [];

    if (Math.abs(previousWeekdayVsWeekend.weekdays.percentage - 50) > 10) {
      const preference =
        previousWeekdayVsWeekend.weekdays.percentage > 50
          ? "weekdays"
          : "weekends";
      keyChanges.push(
        `Previous period showed ${preference} spending preference`,
      );
    }

    return {
      startDate: previousStart.toISOString().split("T")[0],
      endDate: previousEnd.toISOString().split("T")[0],
      totalAmount: previousTotal,
      totalTransactions: previousMapped.length,
      weekdayVsWeekendChange: {
        weekdaysChange: 0, // Would need current period data to calculate
        weekendsChange: 0,
      },
      mostActiveDay: {
        day: mostActiveDay.day,
        amount: mostActiveDay.amount,
      },
      keyChanges,
    };
  }

  private determinePeriodType(
    startDate: string,
    endDate: string,
  ): "daily" | "weekly" | "monthly" {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff <= 1) {
      return "daily";
    } else if (daysDiff <= 7) {
      return "weekly";
    } else {
      return "monthly";
    }
  }

  // ✅ FIXED: More lenient daily filtering with better timezone handling
  private filterTransactionsForPeriod(
    transactions: any[],
    selectedDate: string,
    selectedPeriod: "daily" | "weekly" | "monthly",
  ): any[] {
    const targetDate = new Date(selectedDate);

    if (selectedPeriod === "daily") {
      // ✅ FIXED: More lenient daily filtering with proper timezone handling
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      const filtered = transactions.filter((t) => {
        const transactionDate = new Date(t.date);

        // ✅ FIXED: Also check by date string for timezone issues
        const transactionDateStr = transactionDate.toISOString().split("T")[0];
        const targetDateStr = targetDate.toISOString().split("T")[0];

        const isInRange =
          transactionDate >= dayStart && transactionDate <= dayEnd;
        const isInDateStr = transactionDateStr === targetDateStr;

        const matches = isInRange || isInDateStr;

        return matches;
      });

      return filtered;
    } else if (selectedPeriod === "weekly") {
      const weekStart = new Date(targetDate);
      weekStart.setDate(targetDate.getDate() - targetDate.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      return transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= weekStart && transactionDate <= weekEnd;
      });
    } else {
      const monthStart = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        1,
      );
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0,
      );
      monthEnd.setHours(23, 59, 59, 999);

      return transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
    }
  }

  // ✅ FIXED: Create separate subcategory entries instead of grouping by name
  private calculateCategoryBreakdown(transactions: any[], totalAmount: number) {
    const categoryMap = new Map();

    // ✅ DEFAULT CATEGORY COLORS - Fallback when database colors are missing
    const defaultCategoryColors = {
      Food: "#FF6B6B",
      Shopping: "#FFB84D",
      Transport: "#4ECDC4",
      Entertainment: "#96CEB4",
      Health: "#FF9FF3",
      Home: "#FECA57",
      Education: "#A8A8A8",
      Travel: "#FF8C42",
      Gifts: "#6C5CE7",
      Coffee: "#FD79A8",
      Clothing: "#FFB84D",
      Groceries: "#FF6B6B",
      Takeout: "#FF6B6B",
      "Take Out": "#FF6B6B",
      Dining: "#FF6B6B",
      Restaurant: "#FF6B6B",
    };

    transactions.forEach((transaction) => {
      const category = transaction.category;
      if (!category) return;

      const categoryId = category.id;
      if (!categoryMap.has(categoryId)) {
        // ✅ FIXED: Use database color first, then fallback to default colors, then gray
        const categoryColor =
          category.color ||
          defaultCategoryColors[category.name] ||
          defaultCategoryColors[category.name?.toLowerCase()] ||
          "#CCCCCC";

        categoryMap.set(categoryId, {
          categoryId,
          categoryName: category.name,
          categoryIcon: category.icon,
          categoryColor: categoryColor, // ✅ Enhanced color logic
          amount: 0,
          transactionCount: 0,
          subcategories: new Map(),
          transactions: [],
        });
      }

      const categoryData = categoryMap.get(categoryId);
      const amount = Number(transaction.amount);

      categoryData.amount += amount;
      categoryData.transactionCount += 1;
      categoryData.transactions.push({
        id: transaction.id,
        date: transaction.date,
        amount: amount,
        description: transaction.description,
        merchant: transaction.merchantName,
        subcategoryId: transaction.subcategory?.id,
        subcategoryName: transaction.subcategory?.name,
      });

      const subcategoryName =
        transaction.subcategory?.name ||
        this.matchSubcategory(transaction.description, category.name);

      // ✅ FIXED: Create unique key for each transaction to avoid grouping
      const uniqueSubcategoryKey = `${subcategoryName}_${transaction.id}`;

      // ✅ This ensures each transaction gets its own subcategory entry
      categoryData.subcategories.set(uniqueSubcategoryKey, {
        subcategoryId: transaction.subcategory?.id,
        subcategoryName,
        amount: amount, // ✅ Individual transaction amount
        transactionCount: 1, // ✅ Always 1 per transaction
        percentage: 0, // Will be calculated later
        transactions: [
          {
            id: transaction.id,
            date: transaction.date,
            amount: amount,
            description: transaction.description,
            merchant: transaction.merchantName,
          },
        ],
      });
    });

    return Array.from(categoryMap.values())
      .map((category) => {
        const percentage =
          totalAmount > 0 ? (category.amount / totalAmount) * 100 : 0;

        // ✅ FIXED: Convert Map values to array - now each transaction is separate
        const subcategories = Array.from(category.subcategories.values())
          .map((sub: any) => {
            return {
              subcategoryId: sub.subcategoryId,
              subcategoryName: sub.subcategoryName,
              amount: sub.amount,
              transactionCount: sub.transactionCount,
              percentage:
                category.amount > 0 ? (sub.amount / category.amount) * 100 : 0,
              transactions: sub.transactions,
            };
          })
          .sort((a, b) => b.amount - a.amount);

        return {
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          categoryIcon: category.categoryIcon,
          categoryColor: category.categoryColor, // ✅ This should now have proper colors
          amount: category.amount,
          transactionCount: category.transactionCount,
          percentage,
          subcategories,
          transactions: category.transactions,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  private matchSubcategory(description: string, categoryName: string): string {
    const desc = (description || "").toLowerCase();
    const category = categoryName.toLowerCase();

    if (category.includes("food") || category.includes("dining")) {
      if (
        desc.includes("uber") ||
        desc.includes("doordash") ||
        desc.includes("delivery")
      ) {
        return "Takeout & Delivery";
      }
      if (
        desc.includes("woolworth") ||
        desc.includes("coles") ||
        desc.includes("supermarket") ||
        desc.includes("grocery")
      ) {
        return "Groceries";
      }
      if (
        desc.includes("starbucks") ||
        desc.includes("cafe") ||
        desc.includes("coffee")
      ) {
        return "Coffee & Cafes";
      }
      if (desc.includes("restaurant") || desc.includes("dining")) {
        return "Restaurants";
      }
    }

    if (category.includes("transport") || category.includes("car")) {
      if (
        desc.includes("gas") ||
        desc.includes("petrol") ||
        desc.includes("shell") ||
        desc.includes("bp")
      ) {
        return "Fuel";
      }
      if (
        desc.includes("uber") ||
        desc.includes("taxi") ||
        desc.includes("rideshare")
      ) {
        return "Rideshare";
      }
      if (desc.includes("parking")) {
        return "Parking";
      }
    }

    if (category.includes("health") || category.includes("medical")) {
      if (
        desc.includes("chemist") ||
        desc.includes("pharmacy") ||
        desc.includes("medication")
      ) {
        return "Pharmacy";
      }
      if (
        desc.includes("doctor") ||
        desc.includes("medical") ||
        desc.includes("clinic")
      ) {
        return "Medical Services";
      }
    }

    if (category.includes("entertainment")) {
      if (
        desc.includes("netflix") ||
        desc.includes("spotify") ||
        desc.includes("subscription")
      ) {
        return "Streaming & Subscriptions";
      }
      if (desc.includes("movie") || desc.includes("cinema")) {
        return "Movies & Cinema";
      }
    }

    return "General";
  }

  private calculatePreviousPeriodComparison(
    allTransactions: any[],
    selectedDate: string,
    selectedPeriod: "daily" | "weekly" | "monthly",
  ) {
    const targetDate = new Date(selectedDate);
    let previousDate: Date;

    if (selectedPeriod === "daily") {
      previousDate = new Date(targetDate);
      previousDate.setDate(targetDate.getDate() - 1);
    } else if (selectedPeriod === "weekly") {
      previousDate = new Date(targetDate);
      previousDate.setDate(targetDate.getDate() - 7);
    } else {
      previousDate = new Date(targetDate);
      previousDate.setMonth(targetDate.getMonth() - 1);
    }

    const previousTransactions = this.filterTransactionsForPeriod(
      allTransactions,
      previousDate.toISOString().split("T")[0],
      selectedPeriod,
    );

    const previousAmount = previousTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const currentAmount = this.filterTransactionsForPeriod(
      allTransactions,
      selectedDate,
      selectedPeriod,
    ).reduce((sum, t) => sum + Number(t.amount), 0);

    const percentageChange =
      previousAmount > 0
        ? ((currentAmount - previousAmount) / previousAmount) * 100
        : 0;

    const previousCategoryBreakdown = this.calculateCategoryBreakdown(
      previousTransactions,
      previousAmount,
    );
    const topCategories = previousCategoryBreakdown.slice(0, 3).map((cat) => ({
      categoryName: cat.categoryName,
      amount: cat.amount,
    }));

    return {
      date: previousDate.toISOString().split("T")[0],
      totalDiscretionaryAmount: previousAmount,
      percentageChange,
      topCategories,
    };
  }

  private generateDiscretionaryInsights(
    categoryBreakdown: any[],
    totalAmount: number,
    previousPeriod: any,
    selectedPeriod: "daily" | "weekly" | "monthly",
  ) {
    const insights: any[] = [];

    if (categoryBreakdown.length > 0) {
      const topCategory = categoryBreakdown[0];
      if (topCategory.percentage > 40) {
        insights.push({
          type: "warning",
          category: topCategory.categoryName,
          title: "High Category Concentration",
          message: `${topCategory.categoryName} accounts for ${topCategory.percentage.toFixed(1)}% of your discretionary spending.`,
          suggestion:
            "Consider diversifying your spending or setting a specific budget for this category.",
          amount: topCategory.amount,
        });
      }
    }

    if (previousPeriod && previousPeriod.totalDiscretionaryAmount > 0) {
      const changePercent = Math.abs(previousPeriod.percentageChange);
      if (changePercent > 20) {
        insights.push({
          type: previousPeriod.percentageChange > 0 ? "warning" : "success",
          title: `${selectedPeriod === "daily" ? "Daily" : selectedPeriod === "weekly" ? "Weekly" : "Monthly"} Spending Change`,
          message: `Your discretionary spending has ${previousPeriod.percentageChange > 0 ? "increased" : "decreased"} by ${changePercent.toFixed(1)}% compared to the previous ${selectedPeriod}.`,
          suggestion:
            previousPeriod.percentageChange > 0
              ? "Consider reviewing your recent purchases to identify areas for reduction."
              : "Great job managing your discretionary spending!",
        });
      }
    }

    const totalTransactions = categoryBreakdown.reduce(
      (sum, cat) => sum + cat.transactionCount,
      0,
    );
    if (selectedPeriod === "daily" && totalTransactions > 5) {
      insights.push({
        type: "info",
        title: "High Transaction Frequency",
        message: `You made ${totalTransactions} discretionary purchases today.`,
        suggestion:
          "Consider consolidating purchases or planning ahead to reduce transaction frequency.",
      });
    }

    const averageTransaction = totalAmount / Math.max(totalTransactions, 1);
    if (averageTransaction < 10 && totalTransactions > 3) {
      insights.push({
        type: "info",
        title: "Frequent Small Purchases",
        message: `Your average transaction is ${averageTransaction.toFixed(2)} with ${totalTransactions} purchases.`,
        suggestion:
          "Small purchases can add up quickly. Consider tracking them more closely.",
      });
    }

    return insights;
  }

  private calculateDiscretionarySummary(
    transactions: any[],
    categoryBreakdown: any[],
  ) {
    const transactionCount = transactions.length;
    const totalAmount = transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const averageTransactionAmount =
      transactionCount > 0 ? totalAmount / transactionCount : 0;

    const largestTransaction = transactions.reduce(
      (largest, current) => {
        return Number(current.amount) > Number(largest.amount)
          ? current
          : largest;
      },
      transactions[0] || { amount: 0, description: "", category: { name: "" } },
    );

    const topSpendingCategory = categoryBreakdown[0] || {
      categoryName: "",
      amount: 0,
      percentage: 0,
    };

    const spendingDistribution = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };

    transactions.forEach((t) => {
      const hour = new Date(t.date).getHours();
      const amount = Number(t.amount);

      if (hour >= 6 && hour < 12) {
        spendingDistribution.morning += amount;
      } else if (hour >= 12 && hour < 18) {
        spendingDistribution.afternoon += amount;
      } else if (hour >= 18 && hour < 24) {
        spendingDistribution.evening += amount;
      } else {
        spendingDistribution.night += amount;
      }
    });

    return {
      transactionCount,
      averageTransactionAmount,
      largestTransaction: {
        id: largestTransaction.id,
        amount: Number(largestTransaction.amount),
        description: largestTransaction.description,
        categoryName: largestTransaction.category?.name || "Other",
      },
      topSpendingCategory: {
        categoryName: topSpendingCategory.categoryName,
        amount: topSpendingCategory.amount,
        percentage: topSpendingCategory.percentage,
      },
      spendingDistribution,
    };
  }

  private validateTransactionAmount(amount: number): void {
    if (amount <= 0) {
      throw new BadRequestException(
        "Transaction amount must be greater than 0",
      );
    }
    if (amount > 999999.99) {
      throw new BadRequestException(
        "Transaction amount cannot exceed $999,999.99",
      );
    }
  }


  private async mapToDto(transaction: any, userTimezone?: string): Promise<TransactionDto> {
    // Get user timezone if not provided
    if (!userTimezone) {
      const user = await this.usersRepository.findById(transaction.userId);
      userTimezone = this.dateService.getValidTimezone(user?.timezone);
    }

    return {
      id: transaction.id,
      userId: transaction.userId,
      budgetId: transaction.budgetId,
      categoryId: transaction.categoryId,
      subcategoryId: transaction.subcategoryId,
      description: transaction.description,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      date: this.dateService.toUserTimezone(transaction.date, userTimezone),
      dueDate: transaction.dueDate ? this.dateService.toUserTimezone(transaction.dueDate, userTimezone) : transaction.dueDate,
      type: transaction.type,
      status: transaction.status,
      recurrence: transaction.recurrence || "none",
      isAICategorized: transaction.isAICategorized,
      aiConfidence: transaction.aiConfidence,
      notes: transaction.notes || null,
      location: transaction.location || null,
      merchantName: transaction.merchantName || null,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      budget: transaction.budget
        ? {
            id: transaction.budget.id,
            name: transaction.budget.name,
          }
        : undefined,
      category: transaction.category
        ? {
            id: transaction.category.id,
            name: transaction.category.name,
            icon: transaction.category.icon,
            color: transaction.category.color,
            type: transaction.category.type,
          }
        : undefined,
      subcategory: transaction.subcategory
        ? {
            id: transaction.subcategory.id,
            name: transaction.subcategory.name,
            icon: transaction.subcategory.icon,
            color: transaction.subcategory.color,
          }
        : undefined,
    };
  }

  private calculateDailyBurnRate(
    transactions: any[],
    userProfile: any,
  ): {
    currentDailyBurnRate: number;
    sustainableDailyRate: number;
    daysUntilBudgetExceeded: number | null;
    recommendedDailySpending: number;
    burnRateStatus: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
    weeklyTrend: number[];
    weeklyTrendWithLabels: { day: string; amount: number; isToday: boolean }[];
    projectedMonthlySpending: number;
    monthlyIncomeCapacity: number;
  } {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const recentTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate >= sevenDaysAgo &&
        transactionDate <= now &&
        t.type === "EXPENSE" &&
        (t.recurrence === "none" || !t.recurrence)
      );
    });

    const weeklySpending = recentTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const currentDailyBurnRate = weeklySpending / 7;

    let sustainableDailyRate = 0;
    let monthlyIncomeCapacity = 0;

    if (userProfile?.income && userProfile?.incomeFrequency) {
      const income = Number(userProfile.income);
      const frequency = userProfile.incomeFrequency as IncomeFrequency;

      switch (frequency) {
        case IncomeFrequency.WEEKLY:
          monthlyIncomeCapacity = (income * 52) / 12;
          break;
        case IncomeFrequency.FORTNIGHTLY:
          monthlyIncomeCapacity = (income * 26) / 12;
          break;
        case IncomeFrequency.MONTHLY:
          monthlyIncomeCapacity = income;
          break;
        default:
          monthlyIncomeCapacity = income;
      }

      const monthlyRecurringExpenses =
        this.calculateMonthlyRecurringExpenses(transactions);
      const userFixedExpenses = Number(userProfile.fixedExpenses) || 0;
      monthlyIncomeCapacity -= userFixedExpenses + monthlyRecurringExpenses;
      sustainableDailyRate = (monthlyIncomeCapacity * 0.8) / 30;
    }

    const weeklyTrend: number[] = [];
    const weeklyTrendWithLabels: {
      day: string;
      amount: number;
      isToday: boolean;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(now.getDate() - i);

      const dayStart = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
      );
      const dayEnd = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate() + 1,
      );

      const daySpending = transactions
        .filter((t) => {
          const transactionDate = new Date(t.date);
          return (
            transactionDate >= dayStart &&
            transactionDate < dayEnd &&
            t.type === "EXPENSE" &&
            (t.recurrence === "none" || !t.recurrence)
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const dayLabel = day.toLocaleDateString("en-US", { weekday: "short" });
      const isToday = i === 0;

      weeklyTrend.push(daySpending);
      weeklyTrendWithLabels.push({
        day: dayLabel,
        amount: daySpending,
        isToday: isToday,
      });
    }

    const projectedMonthlySpending = currentDailyBurnRate * 30;

    let burnRateStatus: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
    let daysUntilBudgetExceeded: number | null = null;

    if (sustainableDailyRate > 0) {
      const burnRatio = currentDailyBurnRate / sustainableDailyRate;

      if (burnRatio <= 0.7) {
        burnRateStatus = "LOW";
      } else if (burnRatio <= 1.0) {
        burnRateStatus = "NORMAL";
      } else if (burnRatio <= 1.5) {
        burnRateStatus = "HIGH";
      } else {
        burnRateStatus = "CRITICAL";
      }

      if (currentDailyBurnRate > sustainableDailyRate) {
        const excessDailySpending = currentDailyBurnRate - sustainableDailyRate;
        const remainingDays = Math.floor(
          monthlyIncomeCapacity / excessDailySpending,
        );
        daysUntilBudgetExceeded = Math.max(0, remainingDays);
      }
    } else {
      burnRateStatus = currentDailyBurnRate > 50 ? "HIGH" : "NORMAL";
    }

    const recommendedDailySpending =
      sustainableDailyRate > 0
        ? Math.min(sustainableDailyRate, sustainableDailyRate * 0.9)
        : currentDailyBurnRate * 0.8;

    return {
      currentDailyBurnRate,
      sustainableDailyRate,
      daysUntilBudgetExceeded,
      recommendedDailySpending,
      burnRateStatus,
      weeklyTrend,
      weeklyTrendWithLabels,
      projectedMonthlySpending,
      monthlyIncomeCapacity,
    };
  }

  private calculateMonthlyRecurringExpenses(transactions: any[]): number {
    const now = new Date();
    const lastThreeMonths = new Date();
    lastThreeMonths.setMonth(now.getMonth() - 3);

    const recurringTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate >= lastThreeMonths &&
        transactionDate <= now &&
        t.type === "EXPENSE" &&
        t.recurrence &&
        t.recurrence !== "none"
      );
    });

    let monthlyRecurringTotal = 0;

    const recurrenceGroups = {
      weekly: [],
      fortnightly: [],
      monthly: [],
      sixmonths: [],
      yearly: [],
    };

    recurringTransactions.forEach((t) => {
      if (recurrenceGroups[t.recurrence]) {
        recurrenceGroups[t.recurrence].push(t);
      }
    });

    const weeklyMonthly =
      recurrenceGroups.weekly.reduce((sum, t) => sum + Number(t.amount), 0) *
      (52 / 12);
    const fortnightlyMonthly =
      recurrenceGroups.fortnightly.reduce(
        (sum, t) => sum + Number(t.amount),
        0,
      ) *
      (26 / 12);
    const monthlyMonthly = recurrenceGroups.monthly.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const sixMonthsMonthly =
      recurrenceGroups.sixmonths.reduce((sum, t) => sum + Number(t.amount), 0) /
      6;
    const yearlyMonthly =
      recurrenceGroups.yearly.reduce((sum, t) => sum + Number(t.amount), 0) /
      12;

    monthlyRecurringTotal =
      weeklyMonthly +
      fortnightlyMonthly +
      monthlyMonthly +
      sixMonthsMonthly +
      yearlyMonthly;

    return monthlyRecurringTotal;
  }

  private calculateDiscretionaryTrends(
    transactions: any[],
    startDate?: string,
    endDate?: string,
  ): Array<{
    month: string;
    discretionaryExpenses: number;
  }> {
    if (!startDate || !endDate) {
      return [];
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    const discretionaryTransactions = transactions.filter((t) => {
      return t.type === "EXPENSE" && (t.recurrence === "none" || !t.recurrence);
    });

    let periodType: "daily" | "weekly" | "monthly";
    if (daysDiff <= 14) {
      periodType = "daily";
    } else if (daysDiff <= 84) {
      periodType = "weekly";
    } else {
      periodType = "monthly";
    }

    const discretionaryTrends: Array<{
      month: string;
      discretionaryExpenses: number;
    }> = [];

    if (periodType === "daily") {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayStr = d.toISOString().split("T")[0];
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

        const dayDiscretionaryExpenses = discretionaryTransactions
          .filter((t) => {
            const transactionDate = new Date(t.date);
            return transactionDate >= dayStart && transactionDate < dayEnd;
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);

        discretionaryTrends.push({
          month: dayStr,
          discretionaryExpenses: dayDiscretionaryExpenses,
        });
      }
    } else if (periodType === "weekly") {
      const current = new Date(start);
      while (current <= end) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);

        if (weekEnd > end) {
          weekEnd.setTime(end.getTime());
        }

        const weekDiscretionaryExpenses = discretionaryTransactions
          .filter((t) => {
            const transactionDate = new Date(t.date);
            return transactionDate >= weekStart && transactionDate <= weekEnd;
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);

        discretionaryTrends.push({
          month: weekStart.toISOString().split("T")[0],
          discretionaryExpenses: weekDiscretionaryExpenses,
        });

        current.setDate(current.getDate() + 7);
      }
    } else {
      const months = new Set<string>();
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();

      for (let year = startYear; year <= endYear; year++) {
        const monthStart = year === startYear ? startMonth : 0;
        const monthEnd = year === endYear ? endMonth : 11;

        for (let month = monthStart; month <= monthEnd; month++) {
          const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
          months.add(monthStr);
        }
      }

      months.forEach((monthStr) => {
        const monthDiscretionaryExpenses = discretionaryTransactions
          .filter((t) => {
            const transactionMonth = new Date(t.date)
              .toISOString()
              .substring(0, 7);
            return transactionMonth === monthStr;
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);

        discretionaryTrends.push({
          month: monthStr,
          discretionaryExpenses: monthDiscretionaryExpenses,
        });
      });
    }

    return discretionaryTrends.sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateSpendingVelocity(
    transactions: any[],
    userMonthlyBudget?: number,
  ): {
    currentMonthSpent: number;
    daysElapsed: number;
    daysInMonth: number;
    dailyAverage: number;
    projectedMonthlySpending: number;
    monthlyBudget?: number;
    velocityStatus: "ON_TRACK" | "SLIGHTLY_HIGH" | "HIGH" | "VERY_HIGH";
    daysToOverspend?: number;
    recommendedDailySpending: number;
  } {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const daysElapsed = now.getDate();

    const currentMonthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate >= monthStart &&
        transactionDate <= now &&
        t.type === "EXPENSE"
      );
    });

    const currentMonthSpent = currentMonthTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const dailyAverage = daysElapsed > 0 ? currentMonthSpent / daysElapsed : 0;
    const projectedMonthlySpending = dailyAverage * daysInMonth;

    let velocityStatus: "ON_TRACK" | "SLIGHTLY_HIGH" | "HIGH" | "VERY_HIGH";
    let daysToOverspend: number | undefined;

    if (userMonthlyBudget) {
      const spendingRatio = projectedMonthlySpending / userMonthlyBudget;

      if (spendingRatio <= 1.0) {
        velocityStatus = "ON_TRACK";
      } else if (spendingRatio <= 1.2) {
        velocityStatus = "SLIGHTLY_HIGH";
      } else if (spendingRatio <= 1.5) {
        velocityStatus = "HIGH";
      } else {
        velocityStatus = "VERY_HIGH";
      }

      if (dailyAverage > 0 && currentMonthSpent < userMonthlyBudget) {
        const remainingBudget = userMonthlyBudget - currentMonthSpent;
        daysToOverspend = Math.floor(remainingBudget / dailyAverage);
      }
    } else {
      const lastMonth = new Date(currentYear, currentMonth - 1, 1);
      const lastMonthEnd = new Date(currentYear, currentMonth, 0);

      const lastMonthTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate >= lastMonth &&
          transactionDate <= lastMonthEnd &&
          t.type === "EXPENSE"
        );
      });

      const lastMonthSpent = lastMonthTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0,
      );

      if (lastMonthSpent > 0) {
        const spendingRatio = projectedMonthlySpending / lastMonthSpent;

        if (spendingRatio <= 1.1) {
          velocityStatus = "ON_TRACK";
        } else if (spendingRatio <= 1.3) {
          velocityStatus = "SLIGHTLY_HIGH";
        } else if (spendingRatio <= 1.6) {
          velocityStatus = "HIGH";
        } else {
          velocityStatus = "VERY_HIGH";
        }
      } else {
        velocityStatus = "ON_TRACK";
      }
    }

    const remainingDays = daysInMonth - daysElapsed;
    const targetBudget = userMonthlyBudget || projectedMonthlySpending * 0.9;
    const remainingBudget = Math.max(0, targetBudget - currentMonthSpent);
    const recommendedDailySpending =
      remainingDays > 0 ? remainingBudget / remainingDays : 0;

    return {
      currentMonthSpent,
      daysElapsed,
      daysInMonth,
      dailyAverage,
      projectedMonthlySpending,
      monthlyBudget: userMonthlyBudget,
      velocityStatus,
      daysToOverspend,
      recommendedDailySpending,
    };
  }

  private calculateTrends(
    transactions: any[],
    startDate?: string,
    endDate?: string,
  ): Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
    transactionCount: number;
  }> {
    if (!startDate || !endDate) {
      return [];
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    let periodType: "daily" | "weekly" | "monthly";
    if (daysDiff <= 14) {
      periodType = "daily";
    } else if (daysDiff <= 84) {
      periodType = "weekly";
    } else {
      periodType = "monthly";
    }

    const trends: Array<{
      month: string;
      income: number;
      expenses: number;
      net: number;
      transactionCount: number;
    }> = [];

    if (periodType === "daily") {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayStr = d.toISOString().split("T")[0];

        const dayTransactions = transactions.filter((t) => {
          const transactionDate = new Date(t.date).toISOString().split("T")[0];
          return transactionDate === dayStr;
        });

        const dayIncome = dayTransactions
          .filter((t) => t.type === "INCOME")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const dayExpenses = dayTransactions
          .filter((t) => t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        trends.push({
          month: dayStr,
          income: dayIncome,
          expenses: dayExpenses,
          net: dayIncome - dayExpenses,
          transactionCount: dayTransactions.length,
        });
      }
    } else if (periodType === "weekly") {
      const current = new Date(start);
      while (current <= end) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);

        if (weekEnd > end) {
          weekEnd.setTime(end.getTime());
        }

        const weekTransactions = transactions.filter((t) => {
          const transactionDate = new Date(t.date);
          return transactionDate >= weekStart && transactionDate <= weekEnd;
        });

        const weekIncome = weekTransactions
          .filter((t) => t.type === "INCOME")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const weekExpenses = weekTransactions
          .filter((t) => t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        trends.push({
          month: weekStart.toISOString().split("T")[0],
          income: weekIncome,
          expenses: weekExpenses,
          net: weekIncome - weekExpenses,
          transactionCount: weekTransactions.length,
        });

        current.setDate(current.getDate() + 7);
      }
    } else {
      const months = new Set<string>();
      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();

      for (let year = startYear; year <= endYear; year++) {
        const monthStart = year === startYear ? startMonth : 0;
        const monthEnd = year === endYear ? endMonth : 11;

        for (let month = monthStart; month <= monthEnd; month++) {
          const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
          months.add(monthStr);
        }
      }

      months.forEach((monthStr) => {
        const monthTransactions = transactions.filter((t) => {
          const transactionMonth = new Date(t.date)
            .toISOString()
            .substring(0, 7);
          return transactionMonth === monthStr;
        });

        const monthIncome = monthTransactions
          .filter((t) => t.type === "INCOME")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const monthExpenses = monthTransactions
          .filter((t) => t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        trends.push({
          month: monthStr,
          income: monthIncome,
          expenses: monthExpenses,
          net: monthIncome - monthExpenses,
          transactionCount: monthTransactions.length,
        });
      });
    }

    return trends.sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateAnalytics(
    transactions: any[],
    filters: Partial<TransactionFilterDto> = {},
    userProfile?: any,
  ): TransactionAnalyticsDto {
    const income = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const transactionCount = transactions.length;
    const averageTransaction =
      transactionCount > 0 ? (income + expenses) / transactionCount : 0;

    const categoryMap = new Map();
    transactions.forEach((transaction) => {
      const categoryToUse = transaction.subcategory || transaction.category;

      if (categoryToUse) {
        const categoryId = categoryToUse.id;
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            categoryId,
            categoryName: categoryToUse.name,
            categoryIcon: categoryToUse.icon,
            categoryColor: categoryToUse.color,
            amount: 0,
            transactionCount: 0,
          });
        }
        const category = categoryMap.get(categoryId);
        category.amount += Number(transaction.amount);
        category.transactionCount += 1;
      }
    });

    const categoryBreakdown = Array.from(categoryMap.values()).map(
      (category) => ({
        ...category,
        percentage: expenses > 0 ? (category.amount / expenses) * 100 : 0,
      }),
    );

    const monthlyTrends = this.calculateTrends(
      transactions,
      filters.startDate,
      filters.endDate,
    );
    const discretionaryTrends = this.calculateDiscretionaryTrends(
      transactions,
      filters.startDate,
      filters.endDate,
    );

    const enhancedMonthlyTrends = monthlyTrends.map((trend) => {
      const discretionaryTrend = discretionaryTrends.find(
        (dt) => dt.month === trend.month,
      );

      return {
        ...trend,
        discretionaryExpenses: discretionaryTrend?.discretionaryExpenses || 0,
      };
    });

    const spendingVelocity = this.calculateSpendingVelocity(transactions);
    const dailyBurnRate = this.calculateDailyBurnRate(
      transactions,
      userProfile,
    );

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      transactionCount,
      averageTransaction,
      categoryBreakdown,
      monthlyTrends: enhancedMonthlyTrends,
      spendingVelocity,
      dailyBurnRate,
      recentTransactions: {
        totalAmount: transactions
          .slice(0, 10)
          .reduce((sum, t) => sum + Number(t.amount), 0),
        count: Math.min(10, transactions.length),
        topCategories: categoryBreakdown.slice(0, 3).map((c) => c.categoryName),
      },
      budgetPerformance: [],
    };
  }

  async getIncomeAnalytics(
    userId: string,
    filters: Partial<TransactionFilterDto> = {},
  ): Promise<any> {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Get user profile for income settings
      const userProfile = await this.usersRepository.findById(userId);
      if (!userProfile) {
        throw new NotFoundException("User not found");
      }

      // Support custom date range from filters, default to current month
      let startDate: Date;
      let endDate: Date;

      if (filters.startDate && filters.endDate) {
        startDate = new Date(filters.startDate);
        endDate = new Date(filters.endDate);

        if (startDate > endDate) {
          throw new BadRequestException("Start date cannot be after end date");
        }

        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
        if (endDate.getTime() - startDate.getTime() > oneYearInMs) {
          throw new BadRequestException("Date range cannot exceed one year");
        }
      } else {
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
      }

      // Calculate previous month for comparison
      const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const prevMonthEnd = new Date(currentYear, currentMonth, 0);

      // Fetch current month income transactions
      const currentIncomeTransactions =
        await this.transactionsRepository.findMany(userId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: TransactionType.INCOME,
          limit: 10000,
          offset: 0,
          sortBy: "date",
          sortOrder: "desc",
        } as TransactionFilterDto);

      // Fetch previous month income for comparison
      const previousIncomeTransactions =
        await this.transactionsRepository.findMany(userId, {
          startDate: prevMonthStart.toISOString(),
          endDate: prevMonthEnd.toISOString(),
          type: TransactionType.INCOME,
          limit: 10000,
          offset: 0,
        } as TransactionFilterDto);

      // Calculate total income metrics from transactions
      const transactionIncomeThisMonth = currentIncomeTransactions.reduce(
        (sum, t) => {
          const amount = Number(t.amount);
          return sum + (isNaN(amount) ? 0 : Math.abs(amount));
        },
        0,
      );

      const transactionIncomePreviousMonth = previousIncomeTransactions.reduce(
        (sum, t) => {
          const amount = Number(t.amount);
          return sum + (isNaN(amount) ? 0 : Math.abs(amount));
        },
        0,
      );

      // Calculate projected income from user profile
      let projectedMonthlyIncome = 0;
      if (userProfile.income && userProfile.incomeFrequency) {
        const profileIncome = Number(userProfile.income);
        switch (userProfile.incomeFrequency) {
          case IncomeFrequency.WEEKLY:
            projectedMonthlyIncome = (profileIncome * 52) / 12;
            break;
          case IncomeFrequency.FORTNIGHTLY:
            projectedMonthlyIncome = (profileIncome * 26) / 12;
            break;
          case IncomeFrequency.MONTHLY:
            projectedMonthlyIncome = profileIncome;
            break;
        }
      }

      // ✅ FIX: Always include both profile and transaction income (additive)
      const totalIncomeThisMonth =
        transactionIncomeThisMonth + projectedMonthlyIncome;

      const previousMonthIncome =
        transactionIncomePreviousMonth + projectedMonthlyIncome;

      // Calculate month change percentage
      const monthChangePercentage =
        previousMonthIncome > 0
          ? ((totalIncomeThisMonth - previousMonthIncome) /
              previousMonthIncome) *
            100
          : 0;

      // Calculate pay period income
      let totalIncomeThisPayPeriod = 0;
      let totalIncomeThisWeek = 0;

      if (userProfile.nextPayDate && userProfile.incomeFrequency) {
        const nextPayDate = new Date(userProfile.nextPayDate);
        let currentPeriodStart: Date;

        switch (userProfile.incomeFrequency) {
          case IncomeFrequency.WEEKLY:
            currentPeriodStart = new Date(
              nextPayDate.getTime() - 7 * 24 * 60 * 60 * 1000,
            );
            break;
          case IncomeFrequency.FORTNIGHTLY:
            currentPeriodStart = new Date(
              nextPayDate.getTime() - 14 * 24 * 60 * 60 * 1000,
            );
            break;
          case IncomeFrequency.MONTHLY:
            currentPeriodStart = new Date(
              nextPayDate.getFullYear(),
              nextPayDate.getMonth() - 1,
              nextPayDate.getDate(),
            );
            break;
          default:
            currentPeriodStart = startDate;
        }

        const payPeriodTransactions = currentIncomeTransactions.filter((t) => {
          const transactionDate = new Date(t.date);
          return (
            transactionDate >= currentPeriodStart &&
            transactionDate <= nextPayDate
          );
        });

        totalIncomeThisPayPeriod = payPeriodTransactions.reduce((sum, t) => {
          const amount = Number(t.amount);
          return sum + (isNaN(amount) ? 0 : Math.abs(amount));
        }, 0);
      }

      // Calculate this week's income
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisWeekTransactions = currentIncomeTransactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= oneWeekAgo;
      });

      totalIncomeThisWeek = thisWeekTransactions.reduce((sum, t) => {
        const amount = Number(t.amount);
        return sum + (isNaN(amount) ? 0 : Math.abs(amount));
      }, 0);

      // Group income by source (category) - enhanced with profile data
      const incomeBySourceMap = new Map();

      // Add transaction-based income sources
      currentIncomeTransactions.forEach((t) => {
        const categoryId = t.categoryId || "uncategorized";
        const categoryName = (t as any).category?.name || "Uncategorized";
        const amount = Math.abs(Number(t.amount)) || 0;

        if (incomeBySourceMap.has(categoryId)) {
          const existing = incomeBySourceMap.get(categoryId);
          existing.totalAmount += amount;
          existing.transactionCount += 1;
        } else {
          incomeBySourceMap.set(categoryId, {
            source: categoryName,
            categoryId,
            categoryName,
            totalAmount: amount,
            percentage: 0,
            color: this.generateCategoryColor(categoryName),
            transactionCount: 1,
          });
        }
      });

      // ✅ FIX: Always add profile income as "Primary Income" when it exists
      if (projectedMonthlyIncome > 0) {
        incomeBySourceMap.set("profile_income", {
          source: "Primary Income",
          categoryId: "profile_income",
          categoryName: "Primary Income",
          totalAmount: projectedMonthlyIncome,
          percentage: 0, // Will be calculated later based on total income
          color: this.generateCategoryColor("Primary Income"),
          transactionCount: 0, // Profile-based, not transactions
        });
      }

      // Calculate percentages and convert to array
      const incomeBySource = Array.from(incomeBySourceMap.values())
        .map((item) => ({
          ...item,
          percentage:
            totalIncomeThisMonth > 0
              ? (item.totalAmount / totalIncomeThisMonth) * 100
              : 0,
          totalAmount: Math.round(item.totalAmount * 100) / 100,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);

      // Detect recurring vs ad-hoc income (enhanced with profile data)
      const recurringIncome = currentIncomeTransactions.filter(
        (t) => t.recurrence && t.recurrence !== "none",
      );
      const adhocIncome = currentIncomeTransactions.filter(
        (t) => !t.recurrence || t.recurrence === "none",
      );

      let recurringAmount = recurringIncome.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount)),
        0,
      );
      let adhocAmount = adhocIncome.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount)),
        0,
      );

      // ✅ FIX: Always add profile income to recurring amount when it exists
      if (projectedMonthlyIncome > 0) {
        recurringAmount += projectedMonthlyIncome;
      }

      const incomeBreakdown = {
        recurring: {
          amount: Math.round(recurringAmount * 100) / 100,
          percentage:
            totalIncomeThisMonth > 0
              ? (recurringAmount / totalIncomeThisMonth) * 100
              : 0,
          transactionCount: recurringIncome.length,
        },
        adhoc: {
          amount: Math.round(adhocAmount * 100) / 100,
          percentage:
            totalIncomeThisMonth > 0
              ? (adhocAmount / totalIncomeThisMonth) * 100
              : 0,
          transactionCount: adhocIncome.length,
        },
      };

      // Recent income entries (last 10)
      const recentIncomeEntries = currentIncomeTransactions
        .slice(0, 10)
        .map((t) => ({
          id: t.id,
          description: t.description || "Income",
          categoryName: (t as any).category?.name || "Uncategorized",
          amount: Math.abs(Number(t.amount)) || 0,
          date: t.date,
          isRecurring: Boolean(t.recurrence && t.recurrence !== "none"),
        }));

      // Pay period info
      const payPeriodInfo = this.calculatePayPeriodInfo(userProfile);

      // Generate insights (enhanced with profile data awareness)
      const insights = this.generateIncomeInsights(
        currentIncomeTransactions,
        monthChangePercentage,
        incomeBySource,
        incomeBreakdown,
        projectedMonthlyIncome > 0, // hasProfileData
      );

      return {
        totalIncomeThisMonth: Math.round(totalIncomeThisMonth * 100) / 100,
        totalIncomeThisPayPeriod:
          Math.round(totalIncomeThisPayPeriod * 100) / 100,
        totalIncomeThisWeek: Math.round(totalIncomeThisWeek * 100) / 100,
        previousMonthIncome: Math.round(previousMonthIncome * 100) / 100,
        monthChangePercentage: Math.round(monthChangePercentage * 100) / 100,
        incomeBySource,
        incomeBreakdown,
        recentIncomeEntries,
        payPeriodInfo,
        insights,
        // Enhanced: Indicate data source (updated for hybrid approach)
        dataSource:
          transactionIncomeThisMonth > 0 && projectedMonthlyIncome > 0
            ? "hybrid"
            : transactionIncomeThisMonth > 0
              ? "transactions"
              : projectedMonthlyIncome > 0
                ? "profile"
                : "none",
        hasTransactionData: transactionIncomeThisMonth > 0,
        hasProfileData: projectedMonthlyIncome > 0,
      };
    } catch (error) {

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      return {
        totalIncomeThisMonth: 0,
        totalIncomeThisPayPeriod: 0,
        totalIncomeThisWeek: 0,
        previousMonthIncome: 0,
        monthChangePercentage: 0,
        incomeBySource: [],
        incomeBreakdown: {
          recurring: { amount: 0, percentage: 0, transactionCount: 0 },
          adhoc: { amount: 0, percentage: 0, transactionCount: 0 },
        },
        recentIncomeEntries: [],
        payPeriodInfo: null,
        insights: {
          consistencyScore: 0,
          growthTrend: "stable",
          primaryIncomeSource: "Unknown",
          savingsPotential: 0,
        },
        error: "Failed to load income analytics",
      };
    }
  }

  private calculatePayPeriodInfo(userProfile: any) {
    if (!userProfile.nextPayDate || !userProfile.incomeFrequency) {
      return null;
    }

    const nextPayDate = new Date(userProfile.nextPayDate);
    const now = new Date();
    const daysUntilNextPay = Math.ceil(
      (nextPayDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );

    let currentPeriodStart: Date;
    let frequency: string;

    switch (userProfile.incomeFrequency) {
      case IncomeFrequency.WEEKLY:
        currentPeriodStart = new Date(
          nextPayDate.getTime() - 7 * 24 * 60 * 60 * 1000,
        );
        frequency = "weekly";
        break;
      case IncomeFrequency.FORTNIGHTLY:
        currentPeriodStart = new Date(
          nextPayDate.getTime() - 14 * 24 * 60 * 60 * 1000,
        );
        frequency = "fortnightly";
        break;
      case IncomeFrequency.MONTHLY:
        currentPeriodStart = new Date(
          nextPayDate.getFullYear(),
          nextPayDate.getMonth() - 1,
          nextPayDate.getDate(),
        );
        frequency = "monthly";
        break;
      default:
        return null;
    }

    return {
      frequency,
      nextPayDate: nextPayDate.toISOString(),
      daysUntilNextPay: Math.max(0, daysUntilNextPay),
      currentPeriodStart: currentPeriodStart.toISOString(),
      currentPeriodEnd: nextPayDate.toISOString(),
    };
  }

  private generateIncomeInsights(
    transactions: any[],
    changePercentage: number,
    incomeBySource: any[],
    incomeBreakdown: any,
    hasProfileData: boolean = false,
  ) {
    const transactionCount = transactions.length;
    const sourceCount = incomeBySource.length;

    // Consistency score based on regularity of income (enhanced for profile data)
    let consistencyScore = Math.min(
      95,
      Math.max(
        0,
        incomeBreakdown.recurring.percentage +
          (transactionCount > 0 ? 20 : 0) +
          (sourceCount > 1 ? 10 : 0),
      ),
    );

    // If using profile data, boost consistency score since it's predictable
    if (hasProfileData) {
      consistencyScore = Math.min(95, consistencyScore + 25);
    }

    // Growth trend analysis
    let growthTrend = "stable";
    if (changePercentage > 5) growthTrend = "growing";
    else if (changePercentage < -5) growthTrend = "declining";

    // Primary income source
    const primaryIncomeSource =
      incomeBySource.length > 0 ? incomeBySource[0].categoryName : "Unknown";

    // Savings potential (simplified calculation)
    const savingsPotential = Math.min(
      30,
      Math.max(0, consistencyScore > 80 ? 20 : 10),
    );

    return {
      consistencyScore: Math.round(consistencyScore),
      growthTrend,
      primaryIncomeSource,
      savingsPotential: Math.round(savingsPotential),
    };
  }

  private generateCategoryColor(categoryName: string): string {
    const colors = [
      "#6366F1",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#06B6D4",
      "#84CC16",
      "#F97316",
      "#EC4899",
      "#14B8A6",
    ];

    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }
}

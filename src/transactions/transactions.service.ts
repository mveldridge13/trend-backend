import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from "@nestjs/common";
import { TransactionsRepository } from "./repositories/transactions.repository";
import { UsersRepository } from "../users/repositories/users.repository";
import { GoalsService } from "../goals/goals.service";
import { ContributionType } from "@prisma/client";
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
import { Transaction, TransactionType, IncomeFrequency, PaymentStatus } from "@prisma/client";
import { DateService } from "../common/services/date.service";
import { CurrencyService } from "../common/services/currency.service";
import { PrismaService } from "../database/prisma.service";

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
    private readonly currencyService: CurrencyService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => GoalsService))
    private readonly goalsService: GoalsService,
  ) {}

  /**
   * Verify an incomeSourceId attribution references a source owned by the user
   */
  private async validateIncomeSourceOwnership(
    userId: string,
    incomeSourceId?: string,
  ): Promise<void> {
    if (!incomeSourceId) return;
    const source = await this.prisma.incomeSource.findFirst({
      where: { id: incomeSourceId, userId },
      select: { id: true },
    });
    if (!source) {
      throw new NotFoundException("Income source not found");
    }
  }

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
    await this.validateIncomeSourceOwnership(
      userId,
      createTransactionDto.incomeSourceId,
    );

    // Skip date validation for UPCOMING/OVERDUE transactions (bills with future due dates)
    const isScheduledTransaction = createTransactionDto.status === 'UPCOMING' || createTransactionDto.status === 'OVERDUE';
    if (!isScheduledTransaction) {
      this.dateService.validateTransactionDate(createTransactionDto.date, userTimezone);
    }

    // Detect user's currency if not provided
    let currency = createTransactionDto.currency;
    if (!currency) {
      const detectedCurrency = this.currencyService.detectCurrencyFromUser(
        user.timezone,
        user.currency?.substring(0, 2) // Extract country code if currency exists
      );
      currency = detectedCurrency.code;
    }

    // Date is already in UTC format from frontend, no conversion needed
    const transaction = await this.transactionsRepository.create(
      userId,
      {
        ...createTransactionDto,
        currency,
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

    await this.validateIncomeSourceOwnership(
      userId,
      updateTransactionDto.incomeSourceId ?? undefined,
    );

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

    // FIX: When marking a bill as PAID, update the date to today if not explicitly provided
    // This prevents double-counting: the bill was counted by dueDate in future period,
    // and would be counted again by original date in past period
    if (
      updateTransactionDto.status === 'PAID' &&
      existingTransaction.status !== 'PAID' &&
      updateTransactionDto.date === undefined
    ) {
      // Set the payment date to now (in UTC)
      updateTransactionDto.date = new Date().toISOString();
    }

    const updatedTransaction = await this.transactionsRepository.update(
      id,
      userId,
      updateTransactionDto,
    );

    // Auto-create next recurring transaction when marked as PAID
    if (
      updateTransactionDto.status === 'PAID' &&
      existingTransaction.status !== 'PAID' &&
      existingTransaction.recurrence &&
      existingTransaction.recurrence !== 'none' &&
      existingTransaction.dueDate
    ) {
      await this.createNextRecurringTransaction(existingTransaction, userId);
    }

    // Auto-create goal contribution when a linked debt payment is marked as PAID
    if (
      updateTransactionDto.status === 'PAID' &&
      existingTransaction.status !== 'PAID' &&
      existingTransaction.linkedGoalId
    ) {
      await this.createGoalContributionFromPayment(updatedTransaction, userId);
    }

    return await this.mapToDto(updatedTransaction, userTimezone);
  }

  /**
   * Creates a goal contribution when a linked debt payment transaction is marked as PAID.
   * This automatically updates the debt goal's balance.
   */
  private async createGoalContributionFromPayment(
    transaction: any,
    userId: string,
  ): Promise<void> {
    try {
      await this.goalsService.addContribution(
        userId,
        transaction.linkedGoalId,
        {
          amount: Number(transaction.amount),
          currency: transaction.currency || 'USD',
          date: new Date().toISOString(),
          description: `Payment: ${transaction.description}`,
          type: ContributionType.TRANSACTION,
          transactionId: transaction.id,
        },
      );
    } catch (error) {
      // Log but don't fail the transaction update if contribution creation fails
      console.error('Failed to create goal contribution from payment:', error);
    }
  }

  /**
   * Creates the next occurrence of a recurring transaction when the current one is marked as PAID.
   * Calculates the next due date based on the recurrence pattern and creates a new UPCOMING transaction.
   */
  private async createNextRecurringTransaction(
    paidTransaction: any,
    userId: string,
  ): Promise<void> {
    const currentDueDate = new Date(paidTransaction.dueDate);
    const nextDueDate = this.calculateNextDueDate(currentDueDate, paidTransaction.recurrence);

    // Create the next recurring transaction
    await this.transactionsRepository.create(userId, {
      description: paidTransaction.description,
      amount: Number(paidTransaction.amount),
      currency: paidTransaction.currency || 'USD',
      date: nextDueDate.toISOString(),
      dueDate: nextDueDate.toISOString(),
      type: paidTransaction.type,
      status: 'UPCOMING' as PaymentStatus,
      budgetId: paidTransaction.budgetId || undefined,
      categoryId: paidTransaction.categoryId || undefined,
      subcategoryId: paidTransaction.subcategoryId || undefined,
      recurrence: paidTransaction.recurrence,
      linkedGoalId: paidTransaction.linkedGoalId || undefined,
    });
  }

  /**
   * Calculates the next due date based on the recurrence pattern.
   */
  private calculateNextDueDate(currentDueDate: Date, recurrence: string): Date {
    const nextDate = new Date(currentDueDate);

    switch (recurrence) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'fortnightly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'sixmonths':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        // If unknown recurrence, default to monthly
        nextDate.setMonth(nextDate.getMonth() + 1);
    }

    return nextDate;
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

    // Calculate previous period date range for comparison
    let previousPeriodTransactions: any[] = [];
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      const periodLengthMs = endDate.getTime() - startDate.getTime();

      const previousEndDate = new Date(startDate.getTime() - 1); // Day before current start
      const previousStartDate = new Date(previousEndDate.getTime() - periodLengthMs);

      previousPeriodTransactions = await this.transactionsRepository.findMany(userId, {
        startDate: previousStartDate.toISOString(),
        endDate: previousEndDate.toISOString(),
        limit: 10000,
        offset: 0,
        sortBy: "date",
        sortOrder: "desc",
      } as TransactionFilterDto);
    }

    return this.calculateAnalytics(transactions, filters, userProfile, previousPeriodTransactions);
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
      userTimezone,
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
      userTimezone,
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

  // ✅ UPDATED: Get bills analytics with pay period filtering
  async getBillsAnalytics(
    userId: string,
    filters: Partial<TransactionFilterDto> = {},
  ): Promise<any> {
    try {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Get user's pay period info for proper filtering
      const user = await this.usersRepository.findById(userId);
      const userTimezone = user?.timezone || 'UTC';

      let startDate: Date;
      let endDate: Date;
      let usePayPeriod = false;

      // Priority 1: Use explicit date range from filters
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
      }
      // Priority 2: Use pay period if user has income settings configured
      else if (user?.nextPayDate && user?.incomeFrequency) {
        const periodBoundaries = this.dateService.calculatePayPeriodBoundaries(
          new Date(user.nextPayDate),
          user.incomeFrequency as IncomeFrequency,
          userTimezone
        );
        startDate = periodBoundaries.start;
        endDate = periodBoundaries.end;
        usePayPeriod = true;
      }
      // Priority 3: Fall back to current calendar month
      else {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
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
        // Pay period info (for display purposes)
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          isPayPeriod: usePayPeriod,
          frequency: usePayPeriod ? user?.incomeFrequency : null,
        },

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

  // Filter to the period (day/week/month) that contains selectedDate, scoped in
  // the user's timezone so it agrees with how transactions are grouped for display.
  private filterTransactionsForPeriod(
    transactions: any[],
    selectedDate: string,
    selectedPeriod: "daily" | "weekly" | "monthly",
    userTimezone = "UTC",
  ): any[] {
    if (selectedPeriod === "daily") {
      const targetKey = this.userLocalDayKey(
        new Date(selectedDate),
        userTimezone,
      );
      return transactions.filter(
        (t) => this.userLocalDayKey(new Date(t.date), userTimezone) === targetKey,
      );
    }

    const { start, end } =
      selectedPeriod === "weekly"
        ? this.dateService.getWeekBoundariesInUserTimezone(
            selectedDate,
            userTimezone,
          )
        : this.dateService.getMonthBoundariesInUserTimezone(
            selectedDate,
            userTimezone,
          );

    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });
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
    userTimezone = "UTC",
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
      userTimezone,
    );

    const previousAmount = previousTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const currentAmount = this.filterTransactionsForPeriod(
      allTransactions,
      selectedDate,
      selectedPeriod,
      userTimezone,
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


  /**
   * Dynamically calculates the correct transaction status based on current date and due date.
   * - PAID transactions remain PAID
   * - Transactions with dueDate in the past (and not PAID) are marked OVERDUE
   * - Transactions with dueDate or existing status keep their status (typically UPCOMING)
   * - Discretionary transactions (no status, no dueDate) return null
   */
  private calculateTransactionStatus(transaction: any): PaymentStatus | null {
    // If already paid, keep it as PAID
    if (transaction.status === 'PAID') {
      return 'PAID';
    }

    // If has a due date and it's in the past, mark as OVERDUE
    if (transaction.dueDate && new Date(transaction.dueDate) < new Date()) {
      return 'OVERDUE';
    }

    // If has an existing status, return it
    if (transaction.status) {
      return transaction.status;
    }

    // If has a due date but no status, it's a bill - default to UPCOMING
    if (transaction.dueDate) {
      return 'UPCOMING';
    }

    // If it's a recurring transaction (not 'none'), default to UPCOMING
    // This ensures recurring transactions are excluded from "left to spend" until PAID
    const isRecurring = transaction.recurrence && transaction.recurrence !== 'none';
    if (isRecurring) {
      return 'UPCOMING';
    }

    // Discretionary transactions (no status, no dueDate, no recurrence) - return null
    return null;
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
      status: this.calculateTransactionStatus(transaction),
      recurrence: transaction.recurrence || "none",
      isAICategorized: transaction.isAICategorized,
      aiConfidence: transaction.aiConfidence,
      notes: transaction.notes || null,
      location: transaction.location || null,
      merchantName: transaction.merchantName || null,
      incomeSourceId: transaction.incomeSourceId || undefined,
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

      // Only subtract user's fixed expenses from setup
      // Recurring transactions are counted individually when PAID through normal transaction flow
      // (Removed monthlyRecurringExpenses to avoid double-counting with frontend expense calculation)
      const userFixedExpenses = Number(userProfile.fixedExpenses) || 0;
      monthlyIncomeCapacity -= userFixedExpenses;
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


  private calculateDiscretionaryTrends(
    transactions: any[],
    startDate?: string,
    endDate?: string,
    userTimezone = "UTC",
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

    // Same thresholds as calculateTrends so the two line up key-for-key when
    // merged into monthlyTrends (otherwise discretionary reads as 0).
    let periodType: "daily" | "weekly" | "monthly";
    if (daysDiff <= 31) {
      periodType = "daily";
    } else if (daysDiff <= 84) {
      periodType = "weekly";
    } else {
      periodType = "monthly";
    }

    // Bucket discretionary spend by user-local period key, then emit one entry
    // per period in the range (timezone-correct, matches calculateTrends).
    const byPeriod = new Map<string, number>();
    for (const t of discretionaryTransactions) {
      const key = this.periodKeyFromDayKey(
        this.userLocalDayKey(new Date(t.date), userTimezone),
        periodType,
      );
      byPeriod.set(key, (byPeriod.get(key) || 0) + Number(t.amount));
    }

    return this.enumeratePeriodKeys(start, end, periodType, userTimezone).map(
      (key) => ({
        month: key,
        discretionaryExpenses: byPeriod.get(key) || 0,
      }),
    );
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

  /**
   * Format a transaction's timestamp as its calendar day (yyyy-MM-dd) in the
   * user's timezone — matches how the app groups transactions for display.
   */
  private userLocalDayKey(date: Date, userTimezone: string): string {
    return this.dateService.formatInUserTimezone(date, userTimezone, "yyyy-MM-dd");
  }

  /**
   * Enumerate the continuous list of user-local calendar days (yyyy-MM-dd)
   * spanning [start, end]. Day strings are stepped in UTC so timezone/DST
   * offsets can't skip or duplicate a day.
   */
  private enumerateUserLocalDayKeys(
    start: Date,
    end: Date,
    userTimezone: string,
  ): string[] {
    const startKey = this.userLocalDayKey(start, userTimezone);
    const endKey = this.userLocalDayKey(end, userTimezone);
    const keys: string[] = [];
    const cursor = new Date(`${startKey}T00:00:00Z`);
    const last = new Date(`${endKey}T00:00:00Z`);
    while (cursor <= last) {
      keys.push(cursor.toISOString().split("T")[0]);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return keys;
  }

  /**
   * Reduce a user-local day key (yyyy-MM-dd) to its period bucket key:
   *  - daily   → the day itself (yyyy-MM-dd)
   *  - weekly  → the containing week's Sunday (yyyy-MM-dd)
   *  - monthly → the calendar month (yyyy-MM)
   */
  private periodKeyFromDayKey(
    dayKey: string,
    periodType: "daily" | "weekly" | "monthly",
  ): string {
    if (periodType === "monthly") return dayKey.slice(0, 7);
    if (periodType === "weekly") {
      const d = new Date(`${dayKey}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - d.getUTCDay()); // back to Sunday
      return d.toISOString().slice(0, 10);
    }
    return dayKey;
  }

  /**
   * Ordered, de-duplicated list of period bucket keys spanning [start, end],
   * computed in the user's timezone.
   */
  private enumeratePeriodKeys(
    start: Date,
    end: Date,
    periodType: "daily" | "weekly" | "monthly",
    userTimezone: string,
  ): string[] {
    const keys: string[] = [];
    const seen = new Set<string>();
    for (const dayKey of this.enumerateUserLocalDayKeys(
      start,
      end,
      userTimezone,
    )) {
      const key = this.periodKeyFromDayKey(dayKey, periodType);
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
    return keys;
  }

  private calculateTrends(
    transactions: any[],
    startDate?: string,
    endDate?: string,
    userTimezone = "UTC",
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
    // Up to a ~month → one point per day (the Cash Flow card uses a rolling
    // 30-day window and expects a daily timeline).
    if (daysDiff <= 31) {
      periodType = "daily";
    } else if (daysDiff <= 84) {
      periodType = "weekly";
    } else {
      periodType = "monthly";
    }

    // Bucket every transaction by its user-local period key, then emit one entry
    // per period in the range. Keeps daily/weekly/monthly consistent and
    // timezone-correct.
    const byPeriod = new Map<
      string,
      { income: number; expenses: number; transactionCount: number }
    >();
    for (const t of transactions) {
      const key = this.periodKeyFromDayKey(
        this.userLocalDayKey(new Date(t.date), userTimezone),
        periodType,
      );
      const bucket = byPeriod.get(key) ?? {
        income: 0,
        expenses: 0,
        transactionCount: 0,
      };
      if (t.type === "INCOME") bucket.income += Number(t.amount);
      else if (t.type === "EXPENSE") bucket.expenses += Number(t.amount);
      bucket.transactionCount += 1;
      byPeriod.set(key, bucket);
    }

    return this.enumeratePeriodKeys(start, end, periodType, userTimezone).map(
      (key) => {
        const bucket = byPeriod.get(key) ?? {
          income: 0,
          expenses: 0,
          transactionCount: 0,
        };
        return {
          month: key,
          income: bucket.income,
          expenses: bucket.expenses,
          net: bucket.income - bucket.expenses,
          transactionCount: bucket.transactionCount,
        };
      },
    );
  }

  private calculateAnalytics(
    transactions: any[],
    filters: Partial<TransactionFilterDto> = {},
    userProfile?: any,
    previousPeriodTransactions: any[] = [],
  ): TransactionAnalyticsDto {
    const income = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate current period discretionary (non-recurring expenses)
    const discretionaryExpenses = transactions
      .filter((t) => t.type === TransactionType.EXPENSE && (t.recurrence === "none" || !t.recurrence))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate previous period totals
    const previousPeriodExpenses = previousPeriodTransactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const previousPeriodDiscretionary = previousPeriodTransactions
      .filter((t) => t.type === TransactionType.EXPENSE && (t.recurrence === "none" || !t.recurrence))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate percentage change
    const expensesPercentageChange = previousPeriodExpenses > 0
      ? ((expenses - previousPeriodExpenses) / previousPeriodExpenses) * 100
      : 0;

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

    const userTimezone = this.dateService.getValidTimezone(
      userProfile?.timezone,
    );
    const monthlyTrends = this.calculateTrends(
      transactions,
      filters.startDate,
      filters.endDate,
      userTimezone,
    );
    const discretionaryTrends = this.calculateDiscretionaryTrends(
      transactions,
      filters.startDate,
      filters.endDate,
      userTimezone,
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

    // Average spend per period point in the range (per day for daily ranges,
    // per month for monthly ranges). Counts every point, including zero-spend
    // periods, so it reflects true average spending over the window.
    const averagePeriodSpending =
      enhancedMonthlyTrends.length > 0
        ? expenses / enhancedMonthlyTrends.length
        : 0;

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
      averagePeriodSpending,
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
      previousPeriodExpenses,
      previousPeriodDiscretionary,
      expensesPercentageChange,
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

      // Calculate pay period income with period-over-period comparison
      let totalIncomeThisPayPeriod = 0;
      let totalIncomePreviousPayPeriod = 0;
      let payPeriodChangePercentage = 0;
      let totalIncomeThisWeek = 0;
      let proratedPayPeriodIncome = 0;
      let payPeriodTransactions: typeof currentIncomeTransactions = [];
      // Distinct from `payPeriodTransactions.length > 0`: a user can have a
      // pay period configured but genuinely zero income transactions in it
      // (e.g. no ad-hoc income this period). That's a real "$0", not "no pay
      // period data" - only the latter should fall back to the client's
      // date-range filters below, otherwise the fallback silently pulls in a
      // different window per client (mobile sends no filters -> current
      // calendar month; web sends its selected 7d/30d/12m range), producing
      // different Income by Source / Recurring vs Ad-hoc numbers per platform.
      let hasPayPeriodConfigured = false;

      if (userProfile.nextPayDate && userProfile.incomeFrequency) {
        hasPayPeriodConfigured = true;
        const nextPayDate = new Date(userProfile.nextPayDate);
        const userTimezone = this.dateService.getValidTimezone(userProfile.timezone);

        // Calculate prorated profile income for pay period
        if (projectedMonthlyIncome > 0) {
          proratedPayPeriodIncome = this.dateService.prorateMonthlyAmount(
            projectedMonthlyIncome,
            userProfile.incomeFrequency
          );
        }

        // Current pay period boundaries
        const periodBoundaries = this.dateService.calculatePayPeriodBoundaries(
          nextPayDate,
          userProfile.incomeFrequency,
          userTimezone
        );

        // Previous pay period boundaries (for comparison)
        const previousPeriodBoundaries = this.dateService.calculatePreviousPayPeriodBoundaries(
          nextPayDate,
          userProfile.incomeFrequency,
          userTimezone
        );

        // Get all income transactions that could fall in either period
        const allRelevantTransactions = await this.transactionsRepository.findMany(userId, {
          startDate: previousPeriodBoundaries.start.toISOString(),
          endDate: periodBoundaries.end.toISOString(),
          type: TransactionType.INCOME,
          limit: 10000,
          offset: 0,
          sortBy: "date",
          sortOrder: "desc",
        } as TransactionFilterDto);

        // Filter for current pay period (store in outer scope variable)
        payPeriodTransactions = allRelevantTransactions.filter((t) => {
          const transactionDate = new Date(t.date);
          return (
            transactionDate >= periodBoundaries.start &&
            transactionDate <= periodBoundaries.end
          );
        });

        // Filter for previous pay period
        const previousPayPeriodTransactions = allRelevantTransactions.filter((t) => {
          const transactionDate = new Date(t.date);
          return (
            transactionDate >= previousPeriodBoundaries.start &&
            transactionDate <= previousPeriodBoundaries.end
          );
        });

        const transactionIncomeThisPayPeriod = payPeriodTransactions.reduce((sum, t) => {
          const amount = Number(t.amount);
          return sum + (isNaN(amount) ? 0 : Math.abs(amount));
        }, 0);

        const transactionIncomePreviousPayPeriod = previousPayPeriodTransactions.reduce((sum, t) => {
          const amount = Number(t.amount);
          return sum + (isNaN(amount) ? 0 : Math.abs(amount));
        }, 0);

        // Include prorated profile income in totals
        totalIncomeThisPayPeriod = transactionIncomeThisPayPeriod + proratedPayPeriodIncome;
        totalIncomePreviousPayPeriod = transactionIncomePreviousPayPeriod + proratedPayPeriodIncome;

        // Calculate pay period change percentage
        payPeriodChangePercentage =
          totalIncomePreviousPayPeriod > 0
            ? ((totalIncomeThisPayPeriod - totalIncomePreviousPayPeriod) /
                totalIncomePreviousPayPeriod) *
              100
            : 0;
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

      // Calculate Anniversary Year-to-Date (YTD) income
      // Based on user's signup date, not calendar year
      const userSignupDate = new Date(userProfile.createdAt);
      const signupMonth = userSignupDate.getMonth();
      const signupDay = userSignupDate.getDate();

      // Find the most recent anniversary date
      let currentAnniversaryStart = new Date(currentYear, signupMonth, signupDay);
      if (currentAnniversaryStart > now) {
        // Anniversary hasn't happened yet this year, use last year's
        currentAnniversaryStart = new Date(currentYear - 1, signupMonth, signupDay);
      }

      // Previous anniversary period for comparison
      const previousAnniversaryStart = new Date(
        currentAnniversaryStart.getFullYear() - 1,
        signupMonth,
        signupDay
      );

      // Calculate days elapsed since current anniversary
      const daysIntoCurrentPeriod = Math.floor(
        (now.getTime() - currentAnniversaryStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Same relative point in previous anniversary year
      const previousAnniversaryEnd = new Date(previousAnniversaryStart);
      previousAnniversaryEnd.setDate(previousAnniversaryEnd.getDate() + daysIntoCurrentPeriod);

      // Check if user has been using app for more than 1 year
      const daysSinceSignup = Math.floor(
        (now.getTime() - userSignupDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const hasFullYearData = daysSinceSignup >= 365;

      // Fetch current anniversary period transactions
      const ytdTransactions = await this.transactionsRepository.findMany(userId, {
        startDate: currentAnniversaryStart.toISOString(),
        endDate: now.toISOString(),
        type: TransactionType.INCOME,
        limit: 10000,
        offset: 0,
      } as TransactionFilterDto);

      const transactionIncomeYTD = ytdTransactions.reduce((sum, t) => {
        const amount = Number(t.amount);
        return sum + (isNaN(amount) ? 0 : Math.abs(amount));
      }, 0);

      let transactionIncomeLastYearYTD = 0;
      if (hasFullYearData) {
        // Only fetch comparison data if user has been using app > 1 year
        const lastYearYtdTransactions = await this.transactionsRepository.findMany(userId, {
          startDate: previousAnniversaryStart.toISOString(),
          endDate: previousAnniversaryEnd.toISOString(),
          type: TransactionType.INCOME,
          limit: 10000,
          offset: 0,
        } as TransactionFilterDto);

        transactionIncomeLastYearYTD = lastYearYtdTransactions.reduce((sum, t) => {
          const amount = Number(t.amount);
          return sum + (isNaN(amount) ? 0 : Math.abs(amount));
        }, 0);
      }

      // Calculate months elapsed since anniversary for prorated profile income
      const monthsElapsed = daysIntoCurrentPeriod / 30;
      const proratedYTDProfileIncome = projectedMonthlyIncome * monthsElapsed;

      const totalIncomeYTD = transactionIncomeYTD + proratedYTDProfileIncome;
      const totalIncomeLastYearYTD = hasFullYearData
        ? transactionIncomeLastYearYTD + proratedYTDProfileIncome
        : 0;

      const ytdChangePercentage =
        hasFullYearData && totalIncomeLastYearYTD > 0
          ? ((totalIncomeYTD - totalIncomeLastYearYTD) / totalIncomeLastYearYTD) * 100
          : 0;

      // Group income by source: Primary Income (salary), one row per
      // attributed income source, and one aggregated "Ad-hoc" row (with its
      // own category breakdown for the modal) for everything not attributed
      // to a source - using pay period transactions.
      const incomeBySourceMap = new Map();

      // Once a pay period is configured, always use its (possibly empty)
      // transactions - falling back to currentIncomeTransactions only when
      // there's no pay period concept at all, not just because this period
      // happens to have no income transactions (see hasPayPeriodConfigured).
      const transactionsForBreakdown = hasPayPeriodConfigured
        ? payPeriodTransactions
        : currentIncomeTransactions;

      // Use prorated income for pay period if available, otherwise monthly
      const profileIncomeForBreakdown = proratedPayPeriodIncome > 0
        ? proratedPayPeriodIncome
        : projectedMonthlyIncome;

      // Resolve names for whichever income sources actually appear in this
      // set of transactions (avoids fetching the user's whole source list).
      const incomeSourceIds = Array.from(
        new Set(
          transactionsForBreakdown
            .map((t) => t.incomeSourceId)
            .filter((id): id is string => !!id),
        ),
      );
      const incomeSourceNameById = new Map(
        incomeSourceIds.length > 0
          ? (
              await this.prisma.incomeSource.findMany({
                where: { id: { in: incomeSourceIds }, userId },
                select: { id: true, name: true },
              })
            ).map((s) => [s.id, s.name])
          : [],
      );

      // Ad-hoc transactions (no incomeSourceId) keep their own category
      // breakdown, rolled up into one "Ad-hoc" row below.
      const adhocByCategoryMap = new Map();

      transactionsForBreakdown.forEach((t) => {
        const amount = Math.abs(Number(t.amount)) || 0;
        const sourceName = t.incomeSourceId
          ? incomeSourceNameById.get(t.incomeSourceId)
          : undefined;

        if (sourceName) {
          if (incomeBySourceMap.has(t.incomeSourceId)) {
            const existing = incomeBySourceMap.get(t.incomeSourceId);
            existing.totalAmount += amount;
            existing.transactionCount += 1;
          } else {
            incomeBySourceMap.set(t.incomeSourceId, {
              categoryId: t.incomeSourceId,
              categoryName: sourceName,
              totalAmount: amount,
              percentage: 0,
              color: this.generateCategoryColor(sourceName),
              transactionCount: 1,
            });
          }
          return;
        }

        const categoryId = t.categoryId || "uncategorized";
        const categoryName = (t as any).category?.name || "Uncategorized";
        if (adhocByCategoryMap.has(categoryId)) {
          const existing = adhocByCategoryMap.get(categoryId);
          existing.totalAmount += amount;
          existing.transactionCount += 1;
        } else {
          adhocByCategoryMap.set(categoryId, {
            categoryId,
            categoryName,
            totalAmount: amount,
            color: this.generateCategoryColor(categoryName),
            transactionCount: 1,
          });
        }
      });

      // Add profile income as "Primary Income" (prorated for pay period)
      if (profileIncomeForBreakdown > 0) {
        incomeBySourceMap.set("profile_income", {
          categoryId: "profile_income",
          categoryName: "Primary Income",
          totalAmount: profileIncomeForBreakdown,
          percentage: 0,
          color: this.generateCategoryColor("Primary Income"),
          transactionCount: 0,
        });
      }

      // Roll ad-hoc up into one row, keeping its category breakdown for the
      // "Ad-hoc" modal on the frontend.
      const adhocBreakdownRaw = Array.from(adhocByCategoryMap.values());
      const adhocTotal = adhocBreakdownRaw.reduce(
        (sum, item) => sum + item.totalAmount,
        0,
      );
      if (adhocTotal > 0) {
        incomeBySourceMap.set("adhoc", {
          categoryId: "adhoc",
          categoryName: "Ad-hoc",
          totalAmount: adhocTotal,
          percentage: 0,
          color: this.generateCategoryColor("Ad-hoc"),
          transactionCount: adhocBreakdownRaw.reduce(
            (sum, item) => sum + item.transactionCount,
            0,
          ),
          isAdhoc: true,
          breakdown: adhocBreakdownRaw
            .map((item) => ({
              ...item,
              totalAmount: Math.round(item.totalAmount * 100) / 100,
            }))
            .sort((a, b) => b.totalAmount - a.totalAmount),
        });
      }

      // Calculate percentages based on pay period total
      const incomeBySource = Array.from(incomeBySourceMap.values())
        .map((item) => ({
          ...item,
          percentage:
            totalIncomeThisPayPeriod > 0
              ? (item.totalAmount / totalIncomeThisPayPeriod) * 100
              : 0,
          totalAmount: Math.round(item.totalAmount * 100) / 100,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);

      // Detect recurring vs ad-hoc income - same "attributed to an income
      // source" split as the Ad-hoc row above, not a recurrence flag: income
      // sources are inherently recurring/scheduled, so being attributed to
      // one IS what makes income "recurring" here.
      const recurringIncome = transactionsForBreakdown.filter(
        (t) => !!t.incomeSourceId,
      );
      const adhocIncome = transactionsForBreakdown.filter(
        (t) => !t.incomeSourceId,
      );

      let recurringAmount = recurringIncome.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount)),
        0,
      );
      let adhocAmount = adhocIncome.reduce(
        (sum, t) => sum + Math.abs(Number(t.amount)),
        0,
      );

      // Add prorated profile income to recurring amount
      if (profileIncomeForBreakdown > 0) {
        recurringAmount += profileIncomeForBreakdown;
      }

      const incomeBreakdown = {
        recurring: {
          amount: Math.round(recurringAmount * 100) / 100,
          percentage:
            totalIncomeThisPayPeriod > 0
              ? (recurringAmount / totalIncomeThisPayPeriod) * 100
              : 0,
          transactionCount: recurringIncome.length,
        },
        adhoc: {
          amount: Math.round(adhocAmount * 100) / 100,
          percentage:
            totalIncomeThisPayPeriod > 0
              ? (adhocAmount / totalIncomeThisPayPeriod) * 100
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

      // Highest-earning pay period across the user's history (for the
      // "Highest Earning Period" hero card)
      const highestEarningPeriod = await this.calculateHighestEarningPeriod(
        userId,
        userProfile,
        proratedPayPeriodIncome,
      );

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
        previousPayPeriodIncome: Math.round(totalIncomePreviousPayPeriod * 100) / 100,
        monthChangePercentage: Math.round(monthChangePercentage * 100) / 100,
        payPeriodChangePercentage: Math.round(payPeriodChangePercentage * 100) / 100,
        totalIncomeYTD: Math.round(totalIncomeYTD * 100) / 100,
        totalIncomeLastYearYTD: Math.round(totalIncomeLastYearYTD * 100) / 100,
        ytdChangePercentage: Math.round(ytdChangePercentage * 100) / 100,
        anniversaryStartDate: currentAnniversaryStart.toISOString(),
        hasYearOverYearData: hasFullYearData,
        daysSinceSignup,
        incomeBySource,
        incomeBreakdown,
        recentIncomeEntries,
        payPeriodInfo,
        highestEarningPeriod,
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
        previousPayPeriodIncome: 0,
        monthChangePercentage: 0,
        payPeriodChangePercentage: 0,
        totalIncomeYTD: 0,
        totalIncomeLastYearYTD: 0,
        ytdChangePercentage: 0,
        anniversaryStartDate: null,
        hasYearOverYearData: false,
        daysSinceSignup: 0,
        incomeBySource: [],
        incomeBreakdown: {
          recurring: { amount: 0, percentage: 0, transactionCount: 0 },
          adhoc: { amount: 0, percentage: 0, transactionCount: 0 },
        },
        recentIncomeEntries: [],
        payPeriodInfo: null,
        highestEarningPeriod: null,
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
    const userTimezone = this.dateService.getValidTimezone(userProfile.timezone);

    // Use DateService for consistent pay period calculations
    const periodBoundaries = this.dateService.calculatePayPeriodBoundaries(
      nextPayDate,
      userProfile.incomeFrequency,
      userTimezone
    );

    return {
      frequency: userProfile.incomeFrequency.toLowerCase(),
      nextPayDate: nextPayDate.toISOString(),
      daysUntilNextPay: periodBoundaries.daysRemaining,
      currentPeriodStart: periodBoundaries.start.toISOString(),
      currentPeriodEnd: periodBoundaries.end.toISOString(),
    };
  }

  /**
   * Find the user's highest-earning pay period across their history, for
   * the "Highest Earning Period" insight card.
   *
   * Walks back through real pay periods (capped to ~1 year: 52 weekly / 26
   * fortnightly / 12 monthly, and never before the account existed), sums
   * each period's actual income transactions, and adds the user's current
   * prorated salary to every period uniformly - past salary values aren't
   * tracked, so this is the same "salary + whatever arrived that period"
   * formula already used for the current period's own total, kept
   * apples-to-apples rather than comparing raw transaction sums alone
   * (which would understate periods before any ad-hoc income arrived).
   */
  private async calculateHighestEarningPeriod(
    userId: string,
    userProfile: any,
    proratedPayPeriodIncome: number,
  ): Promise<{
    start: string;
    end: string;
    totalAmount: number;
    percentAboveAverage: number;
    breakdown: {name: string; amount: number; color: string}[];
  } | null> {
    if (!userProfile.nextPayDate || !userProfile.incomeFrequency) {
      return null;
    }

    const frequency = userProfile.incomeFrequency;
    const userTimezone = this.dateService.getValidTimezone(userProfile.timezone);
    const maxPeriods =
      frequency === IncomeFrequency.WEEKLY
        ? 52
        : frequency === IncomeFrequency.MONTHLY
          ? 12
          : 26; // fortnightly (and any other frequency) - ~1 year

    const accountCreatedAt = new Date(userProfile.createdAt);

    const periodBoundaries: {start: Date; end: Date}[] = [];
    let cursor = new Date(userProfile.nextPayDate);
    for (let i = 0; i < maxPeriods; i++) {
      const boundaries = this.dateService.calculatePayPeriodBoundaries(
        cursor,
        frequency,
        userTimezone,
      );
      if (boundaries.end < accountCreatedAt) {
        break;
      }
      periodBoundaries.push({start: boundaries.start, end: boundaries.end});
      cursor = this.dateService.calculatePreviousPayDate(
        new Date(cursor),
        frequency,
      );
    }

    if (periodBoundaries.length === 0) {
      return null;
    }

    const earliestStart = periodBoundaries[periodBoundaries.length - 1].start;
    const latestEnd = periodBoundaries[0].end;

    const allTransactions = await this.transactionsRepository.findMany(userId, {
      startDate: earliestStart.toISOString(),
      endDate: latestEnd.toISOString(),
      type: TransactionType.INCOME,
      limit: 10000,
      offset: 0,
    } as TransactionFilterDto);

    const periodTotals = periodBoundaries.map((period) => {
      const txTotal = allTransactions
        .filter((t) => {
          const d = new Date(t.date);
          return d >= period.start && d <= period.end;
        })
        .reduce((sum, t) => sum + (Math.abs(Number(t.amount)) || 0), 0);
      return {
        start: period.start,
        end: period.end,
        total: txTotal + proratedPayPeriodIncome,
      };
    });

    const highest = periodTotals.reduce(
      (max, p) => (p.total > max.total ? p : max),
      periodTotals[0],
    );
    const average =
      periodTotals.reduce((sum, p) => sum + p.total, 0) / periodTotals.length;
    const percentAboveAverage =
      average > 0 ? ((highest.total - average) / average) * 100 : 0;

    // Breakdown of what made up the winning period - same "Primary Income /
    // named source / Ad-hoc" grouping as the Income by Source card, just
    // scoped to this one historical period instead of the current one.
    const highestPeriodTransactions = allTransactions.filter((t) => {
      const d = new Date(t.date);
      return d >= highest.start && d <= highest.end;
    });

    const incomeSourceIds = Array.from(
      new Set(
        highestPeriodTransactions
          .map((t) => t.incomeSourceId)
          .filter((id): id is string => !!id),
      ),
    );
    const incomeSourceNameById = new Map(
      incomeSourceIds.length > 0
        ? (
            await this.prisma.incomeSource.findMany({
              where: {id: {in: incomeSourceIds}, userId},
              select: {id: true, name: true},
            })
          ).map((s) => [s.id, s.name])
        : [],
    );

    const breakdownMap = new Map<
      string,
      {name: string; amount: number; color: string}
    >();
    if (proratedPayPeriodIncome > 0) {
      breakdownMap.set('primary_income', {
        name: 'Primary Income',
        amount: proratedPayPeriodIncome,
        color: this.generateCategoryColor('Primary Income'),
      });
    }
    let adhocAmount = 0;
    highestPeriodTransactions.forEach((t) => {
      const amount = Math.abs(Number(t.amount)) || 0;
      const sourceName = t.incomeSourceId
        ? incomeSourceNameById.get(t.incomeSourceId)
        : undefined;
      if (sourceName) {
        if (breakdownMap.has(t.incomeSourceId)) {
          breakdownMap.get(t.incomeSourceId).amount += amount;
        } else {
          breakdownMap.set(t.incomeSourceId, {
            name: sourceName,
            amount,
            color: this.generateCategoryColor(sourceName),
          });
        }
      } else {
        adhocAmount += amount;
      }
    });
    if (adhocAmount > 0) {
      breakdownMap.set('adhoc', {
        name: 'Ad-hoc',
        amount: adhocAmount,
        color: this.generateCategoryColor('Ad-hoc'),
      });
    }

    const breakdown = Array.from(breakdownMap.values())
      .map((item) => ({...item, amount: Math.round(item.amount * 100) / 100}))
      .sort((a, b) => b.amount - a.amount);

    return {
      start: highest.start.toISOString(),
      end: highest.end.toISOString(),
      totalAmount: Math.round(highest.total * 100) / 100,
      percentAboveAverage: Math.round(percentAboveAverage * 10) / 10,
      breakdown,
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

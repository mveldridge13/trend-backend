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
import { Transaction, TransactionType, IncomeFrequency } from "@prisma/client";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly usersRepository: UsersRepository
  ) {}

  async create(
    userId: string,
    createTransactionDto: CreateTransactionDto
  ): Promise<TransactionDto> {
    // Validate that the transaction amount is appropriate for the type
    this.validateTransactionAmount(
      createTransactionDto.amount,
      createTransactionDto.type
    );

    // Validate date is not in future (optional business rule)
    this.validateTransactionDate(createTransactionDto.date);

    const transaction = await this.transactionsRepository.create(
      userId,
      createTransactionDto
    );
    return this.mapToDto(transaction);
  }

  async findAll(
    userId: string,
    filters: TransactionFilterDto
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

    const page = Math.floor(filters.offset / filters.limit) + 1;
    const totalPages = Math.ceil(total / filters.limit);

    return {
      transactions: transactions.map(this.mapToDto),
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

    return this.mapToDto(transaction);
  }

  async update(
    id: string,
    userId: string,
    updateTransactionDto: UpdateTransactionDto
  ): Promise<TransactionDto> {
    console.log("🔍 Service UPDATE - Input params:", { id, userId });
    console.log(
      "🔍 Service UPDATE - UpdateTransactionDto:",
      updateTransactionDto
    );

    // Check if transaction exists
    const existingTransaction = await this.transactionsRepository.findById(
      id,
      userId
    );
    if (!existingTransaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    console.log(
      "🔍 Service UPDATE - Existing transaction found:",
      existingTransaction
    );

    // Validate amount and type if being updated
    if (
      updateTransactionDto.amount !== undefined &&
      updateTransactionDto.type !== undefined
    ) {
      this.validateTransactionAmount(
        updateTransactionDto.amount,
        updateTransactionDto.type
      );
    } else if (updateTransactionDto.amount !== undefined) {
      this.validateTransactionAmount(
        updateTransactionDto.amount,
        existingTransaction.type
      );
    } else if (updateTransactionDto.type !== undefined) {
      this.validateTransactionAmount(
        Number(existingTransaction.amount),
        updateTransactionDto.type
      );
    }

    // Validate date if being updated
    if (updateTransactionDto.date !== undefined) {
      this.validateTransactionDate(updateTransactionDto.date);
    }

    console.log("🔍 Service UPDATE - About to call repository update");
    const updatedTransaction = await this.transactionsRepository.update(
      id,
      userId,
      updateTransactionDto
    );

    console.log("🔍 Service UPDATE - Repository result:", updatedTransaction);

    const result = this.mapToDto(updatedTransaction);
    console.log("🔍 Service UPDATE - Final mapped result:", result);

    return result;
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
    filters: Partial<TransactionFilterDto> = {}
  ): Promise<TransactionAnalyticsDto> {
    // Get user profile for income-based calculations
    const userProfile = await this.usersRepository.findById(userId);

    const transactions = await this.transactionsRepository.findMany(userId, {
      ...filters,
      limit: 10000, // Get all transactions for analytics
      offset: 0,
      sortBy: "date",
      sortOrder: "desc",
    } as TransactionFilterDto);

    return this.calculateAnalytics(transactions, filters, userProfile);
  }

  private validateTransactionAmount(
    amount: number,
    type: TransactionType
  ): void {
    if (amount <= 0) {
      throw new BadRequestException(
        "Transaction amount must be greater than 0"
      );
    }

    if (amount > 999999.99) {
      throw new BadRequestException(
        "Transaction amount cannot exceed $999,999.99"
      );
    }
  }

  private validateTransactionDate(dateString: string): void {
    const transactionDate = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (transactionDate > today) {
      throw new BadRequestException("Transaction date cannot be in the future");
    }

    // Don't allow transactions older than 5 years (business rule)
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(today.getFullYear() - 5);

    if (transactionDate < fiveYearsAgo) {
      throw new BadRequestException(
        "Transaction date cannot be more than 5 years in the past"
      );
    }
  }

  private mapToDto(transaction: any): TransactionDto {
    return {
      id: transaction.id,
      userId: transaction.userId,
      budgetId: transaction.budgetId,
      categoryId: transaction.categoryId,
      subcategoryId: transaction.subcategoryId,
      description: transaction.description,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      date: transaction.date,
      type: transaction.type,
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

  // ✅ UPDATED: Calculate Daily Burn Rate excluding recurring transactions
  private calculateDailyBurnRate(
    transactions: any[],
    userProfile: any
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
    console.log(
      "🔥 Calculating Daily Burn Rate (excluding recurring transactions)"
    );

    const now = new Date();

    // Calculate recent 7-day burn rate
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // ✅ FIXED: Only include NON-RECURRING expense transactions in burn rate
    const recentTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate >= sevenDaysAgo &&
        transactionDate <= now &&
        t.type === "EXPENSE" &&
        (t.recurrence === "none" || !t.recurrence) // ✅ Only discretionary spending
      );
    });

    const weeklySpending = recentTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    const currentDailyBurnRate = weeklySpending / 7;
    console.log(
      `🔥 Current 7-day discretionary burn rate: $${currentDailyBurnRate.toFixed(2)}/day`
    );
    console.log(
      `📊 Excluded ${
        transactions.filter(
          (t) =>
            new Date(t.date) >= sevenDaysAgo &&
            new Date(t.date) <= now &&
            t.type === "EXPENSE" &&
            t.recurrence &&
            t.recurrence !== "none"
        ).length
      } recurring transactions from burn rate calculation`
    );

    // Calculate sustainable daily rate based on user's income
    let sustainableDailyRate = 0;
    let monthlyIncomeCapacity = 0;

    if (userProfile?.income && userProfile?.incomeFrequency) {
      const income = Number(userProfile.income);
      const frequency = userProfile.incomeFrequency as IncomeFrequency;

      // Convert income to monthly based on frequency
      switch (frequency) {
        case IncomeFrequency.WEEKLY:
          monthlyIncomeCapacity = (income * 52) / 12; // 52 weeks / 12 months
          break;
        case IncomeFrequency.FORTNIGHTLY:
          monthlyIncomeCapacity = (income * 26) / 12; // 26 fortnights / 12 months
          break;
        case IncomeFrequency.MONTHLY:
          monthlyIncomeCapacity = income;
          break;
        default:
          monthlyIncomeCapacity = income; // Fallback to monthly
      }

      // ✅ UPDATED: Calculate monthly recurring expenses to subtract from income capacity
      const monthlyRecurringExpenses =
        this.calculateMonthlyRecurringExpenses(transactions);
      console.log(
        `💰 Monthly recurring expenses: $${monthlyRecurringExpenses.toFixed(2)}`
      );

      // Subtract fixed expenses from income capacity
      const userFixedExpenses = Number(userProfile.fixedExpenses) || 0;
      monthlyIncomeCapacity -= userFixedExpenses + monthlyRecurringExpenses;

      // Calculate sustainable daily rate (80% of available income for buffer)
      sustainableDailyRate = (monthlyIncomeCapacity * 0.8) / 30;

      console.log(
        `💰 Monthly income capacity after recurring expenses: $${monthlyIncomeCapacity.toFixed(2)}`
      );
      console.log(
        `🎯 Sustainable daily discretionary rate: $${sustainableDailyRate.toFixed(2)}/day`
      );
    }

    // ✅ UPDATED: Calculate weekly trend with correct day labels ending with TODAY (discretionary spending only)
    const weeklyTrend: number[] = [];
    const weeklyTrendWithLabels: {
      day: string;
      amount: number;
      isToday: boolean;
    }[] = [];

    console.log(
      `📅 Today is: ${now.toLocaleDateString("en-US", { weekday: "long" })}`
    );

    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(now.getDate() - i);

      const dayStart = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate()
      );
      const dayEnd = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate() + 1
      );

      // ✅ FIXED: Only include non-recurring expenses in daily spending
      const daySpending = transactions
        .filter((t) => {
          const transactionDate = new Date(t.date);
          return (
            transactionDate >= dayStart &&
            transactionDate < dayEnd &&
            t.type === "EXPENSE" &&
            (t.recurrence === "none" || !t.recurrence) // ✅ Only discretionary spending
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const dayLabel = day.toLocaleDateString("en-US", { weekday: "short" });
      const isToday = i === 0; // Last iteration (i=0) is today

      weeklyTrend.push(daySpending);
      weeklyTrendWithLabels.push({
        day: dayLabel,
        amount: daySpending,
        isToday: isToday,
      });

      console.log(
        `📊 ${dayLabel} (${day.toISOString().split("T")[0]}): $${daySpending.toFixed(2)} discretionary ${isToday ? "← TODAY" : ""}`
      );
    }

    // Calculate projected monthly spending (discretionary only)
    const projectedMonthlySpending = currentDailyBurnRate * 30;

    // Determine burn rate status
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

      // Calculate days until budget exceeded
      if (currentDailyBurnRate > sustainableDailyRate) {
        const excessDailySpending = currentDailyBurnRate - sustainableDailyRate;
        const remainingDays = Math.floor(
          monthlyIncomeCapacity / excessDailySpending
        );
        daysUntilBudgetExceeded = Math.max(0, remainingDays);
      }
    } else {
      // No income data - use spending velocity as fallback
      burnRateStatus = currentDailyBurnRate > 50 ? "HIGH" : "NORMAL";
    }

    // Calculate recommended daily spending
    const remainingDaysInMonth = 30 - now.getDate();
    const recommendedDailySpending =
      sustainableDailyRate > 0
        ? Math.min(sustainableDailyRate, sustainableDailyRate * 0.9) // 10% buffer
        : currentDailyBurnRate * 0.8; // 20% reduction if no income data

    console.log(`🚨 Discretionary burn rate status: ${burnRateStatus}`);
    console.log(
      `📊 Weekly discretionary trend: [${weeklyTrend.map((x) => x.toFixed(0)).join(", ")}]`
    );

    return {
      currentDailyBurnRate,
      sustainableDailyRate,
      daysUntilBudgetExceeded,
      recommendedDailySpending,
      burnRateStatus,
      weeklyTrend,
      weeklyTrendWithLabels, // ✅ NEW: Includes correct day labels
      projectedMonthlySpending,
      monthlyIncomeCapacity,
    };
  }

  // ✅ NEW: Helper method to calculate monthly recurring expenses
  private calculateMonthlyRecurringExpenses(transactions: any[]): number {
    const now = new Date();
    const lastThreeMonths = new Date();
    lastThreeMonths.setMonth(now.getMonth() - 3);

    // Get all recurring expense transactions from last 3 months
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

    console.log(
      `📊 Found ${recurringTransactions.length} recurring transactions in last 3 months`
    );

    // Group by recurrence type and calculate monthly equivalent
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

    // Calculate monthly equivalent for each recurrence type
    // Weekly: multiply by ~4.33 (52 weeks / 12 months)
    const weeklyMonthly =
      recurrenceGroups.weekly.reduce((sum, t) => sum + Number(t.amount), 0) *
      (52 / 12);

    // Fortnightly: multiply by ~2.17 (26 fortnights / 12 months)
    const fortnightlyMonthly =
      recurrenceGroups.fortnightly.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      ) *
      (26 / 12);

    // Monthly: use as is
    const monthlyMonthly = recurrenceGroups.monthly.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // Six months: divide by 6
    const sixMonthsMonthly =
      recurrenceGroups.sixmonths.reduce((sum, t) => sum + Number(t.amount), 0) /
      6;

    // Yearly: divide by 12
    const yearlyMonthly =
      recurrenceGroups.yearly.reduce((sum, t) => sum + Number(t.amount), 0) /
      12;

    monthlyRecurringTotal =
      weeklyMonthly +
      fortnightlyMonthly +
      monthlyMonthly +
      sixMonthsMonthly +
      yearlyMonthly;

    console.log(`💰 Monthly recurring breakdown:`, {
      weekly: weeklyMonthly.toFixed(2),
      fortnightly: fortnightlyMonthly.toFixed(2),
      monthly: monthlyMonthly.toFixed(2),
      sixMonths: sixMonthsMonthly.toFixed(2),
      yearly: yearlyMonthly.toFixed(2),
      total: monthlyRecurringTotal.toFixed(2),
    });

    return monthlyRecurringTotal;
  }

  // ✅ EXISTING: Calculate spending velocity analysis
  private calculateSpendingVelocity(
    transactions: any[],
    userMonthlyBudget?: number
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

    // Get first and last day of current month
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const daysElapsed = now.getDate();

    console.log(
      `🚀 Calculating spending velocity for month: ${currentMonth + 1}/${currentYear}`
    );
    console.log(`📅 Days elapsed: ${daysElapsed}/${daysInMonth}`);

    // Filter transactions for current month
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
      0
    );

    const dailyAverage = daysElapsed > 0 ? currentMonthSpent / daysElapsed : 0;
    const projectedMonthlySpending = dailyAverage * daysInMonth;

    console.log(`💰 Current month spent: $${currentMonthSpent}`);
    console.log(`📊 Daily average: $${dailyAverage.toFixed(2)}`);
    console.log(
      `📈 Projected monthly: $${projectedMonthlySpending.toFixed(2)}`
    );

    // Determine velocity status
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

      // Calculate days until overspending
      if (dailyAverage > 0 && currentMonthSpent < userMonthlyBudget) {
        const remainingBudget = userMonthlyBudget - currentMonthSpent;
        daysToOverspend = Math.floor(remainingBudget / dailyAverage);
      }
    } else {
      // Without budget, use previous month comparison
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
        0
      );

      console.log(`📅 Last month spent: $${lastMonthSpent}`);

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

    // Calculate recommended daily spending
    const remainingDays = daysInMonth - daysElapsed;
    const targetBudget = userMonthlyBudget || projectedMonthlySpending * 0.9; // 10% reduction if no budget
    const remainingBudget = Math.max(0, targetBudget - currentMonthSpent);
    const recommendedDailySpending =
      remainingDays > 0 ? remainingBudget / remainingDays : 0;

    console.log(`🎯 Velocity status: ${velocityStatus}`);
    console.log(
      `💡 Recommended daily spending: $${recommendedDailySpending.toFixed(2)}`
    );

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

  // ✅ EXISTING: Calculate trends based on date range and period type
  private calculateTrends(
    transactions: any[],
    startDate?: string,
    endDate?: string
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
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(
      `📊 Calculating trends for ${daysDiff} days (${startDate} to ${endDate})`
    );

    // Determine period type based on date range
    let periodType: "daily" | "weekly" | "monthly";
    if (daysDiff <= 14) {
      periodType = "daily";
    } else if (daysDiff <= 84) {
      periodType = "weekly";
    } else {
      periodType = "monthly";
    }

    console.log(`📊 Using ${periodType} period type for ${daysDiff} day range`);

    const trends: Array<{
      month: string;
      income: number;
      expenses: number;
      net: number;
      transactionCount: number;
    }> = [];

    if (periodType === "daily") {
      // Generate daily trends
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
      // Generate weekly trends
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
      // Generate monthly trends
      const months = new Set<string>();

      console.log(`📅 Start date: ${start.toISOString()}`);
      console.log(`📅 End date: ${end.toISOString()}`);

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

      console.log(`📅 Months generated:`, Array.from(months));

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

        console.log(
          `📊 Month ${monthStr}: ${monthTransactions.length} transactions, ${monthExpenses} expenses`
        );

        trends.push({
          month: monthStr,
          income: monthIncome,
          expenses: monthExpenses,
          net: monthIncome - monthExpenses,
          transactionCount: monthTransactions.length,
        });
      });
    }

    console.log(`📊 Generated ${trends.length} trend periods:`, trends);
    return trends.sort((a, b) => a.month.localeCompare(b.month));
  }

  // ✅ UPDATED: Calculate analytics with Daily Burn Rate
  private calculateAnalytics(
    transactions: any[],
    filters: Partial<TransactionFilterDto> = {},
    userProfile?: any
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

    // Category breakdown with subcategory support
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
      })
    );

    // Calculate trends
    const monthlyTrends = this.calculateTrends(
      transactions,
      filters.startDate,
      filters.endDate
    );

    // Calculate spending velocity
    const spendingVelocity = this.calculateSpendingVelocity(transactions);

    // ✅ UPDATED: Calculate Daily Burn Rate with recurrence filtering
    const dailyBurnRate = this.calculateDailyBurnRate(
      transactions,
      userProfile
    );

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      transactionCount,
      averageTransaction,
      categoryBreakdown,
      monthlyTrends,
      spendingVelocity,
      dailyBurnRate, // ✅ UPDATED: Now excludes recurring transactions
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
}

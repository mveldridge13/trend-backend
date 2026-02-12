export class TransactionAnalyticsDto {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  averageTransaction: number;

  // Period-to-period comparison
  previousPeriodExpenses: number;
  previousPeriodDiscretionary: number;
  expensesPercentageChange: number;

  // Category breakdown
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    categoryIcon?: string;
    categoryColor?: string;
    amount: number;
    transactionCount: number;
    percentage: number;
  }[];

  // ✅ UPDATED: Monthly trends now include discretionary expenses
  monthlyTrends: {
    month: string;
    income: number;
    expenses: number; // All expenses (existing)
    discretionaryExpenses: number; // ✅ NEW: Non-recurring expenses only
    net: number;
    transactionCount: number;
  }[];

  // Spending velocity analysis
  spendingVelocity: {
    currentMonthSpent: number;
    daysElapsed: number;
    daysInMonth: number;
    dailyAverage: number;
    projectedMonthlySpending: number;
    monthlyBudget?: number;
    velocityStatus: "ON_TRACK" | "SLIGHTLY_HIGH" | "HIGH" | "VERY_HIGH";
    daysToOverspend?: number;
    recommendedDailySpending: number;
  };

  // ✅ UPDATED: Daily Burn Rate analysis with correct day labels
  dailyBurnRate: {
    currentDailyBurnRate: number;
    sustainableDailyRate: number;
    daysUntilBudgetExceeded: number | null;
    recommendedDailySpending: number;
    burnRateStatus: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
    weeklyTrend: number[];
    weeklyTrendWithLabels: { day: string; amount: number; isToday: boolean }[];
    projectedMonthlySpending: number;
    monthlyIncomeCapacity: number;
  };

  // Recent transactions summary
  recentTransactions: {
    totalAmount: number;
    count: number;
    topCategories: string[];
  };

  // Budget performance (if applicable)
  budgetPerformance?: {
    budgetId: string;
    budgetName: string;
    allocated: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
  }[];
}

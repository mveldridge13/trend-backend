export class TransactionAnalyticsDto {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  averageTransaction: number;

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

  // Monthly trends
  monthlyTrends: {
    month: string;
    income: number;
    expenses: number;
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
    weeklyTrendWithLabels: { day: string; amount: number; isToday: boolean }[]; // ✅ NEW: Correct day labels ending with today
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

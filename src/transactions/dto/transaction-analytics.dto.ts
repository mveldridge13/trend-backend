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

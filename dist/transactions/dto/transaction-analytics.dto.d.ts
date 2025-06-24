export declare class TransactionAnalyticsDto {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
    averageTransaction: number;
    categoryBreakdown: {
        categoryId: string;
        categoryName: string;
        categoryIcon?: string;
        categoryColor?: string;
        amount: number;
        transactionCount: number;
        percentage: number;
    }[];
    monthlyTrends: {
        month: string;
        income: number;
        expenses: number;
        net: number;
        transactionCount: number;
    }[];
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
    recentTransactions: {
        totalAmount: number;
        count: number;
        topCategories: string[];
    };
    budgetPerformance?: {
        budgetId: string;
        budgetName: string;
        allocated: number;
        spent: number;
        remaining: number;
        percentageUsed: number;
    }[];
}

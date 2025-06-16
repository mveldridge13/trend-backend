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

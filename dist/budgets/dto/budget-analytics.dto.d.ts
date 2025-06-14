export declare class BudgetAnalyticsDto {
    budgetId: string;
    budgetName: string;
    totalAmount: number;
    spentAmount: number;
    remainingAmount: number;
    spentPercentage: number;
    transactionCount: number;
    daysTotal: number;
    daysElapsed: number;
    daysRemaining: number;
    dailyBudget: number;
    dailyAverageSpending: number;
    projectedTotalSpending: number;
    isOverBudget: boolean;
    isOnTrack: boolean;
    categoryBreakdown: Array<{
        categoryId: string;
        categoryName: string;
        amount: number;
        percentage: number;
        transactionCount: number;
    }>;
    spendingTrend: Array<{
        date: string;
        dailySpent: number;
        cumulativeSpent: number;
    }>;
}

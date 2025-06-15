export declare class CategoryAnalyticsDto {
    categoryId: string;
    categoryName: string;
    categoryType: string;
    totalSpent: number;
    averageTransaction: number;
    transactionCount: number;
    currency: string;
    lastUsed?: Date;
    firstUsed?: Date;
    usageFrequency: "DAILY" | "WEEKLY" | "MONTHLY" | "RARELY";
    budgetAllocated?: number;
    budgetUsedPercentage?: number;
    isOverBudget: boolean;
    monthlySpending: {
        month: string;
        amount: number;
    }[];
    percentageOfTotalSpending: number;
    rankAmongCategories: number;
    relatedGoals?: {
        goalId: string;
        goalName: string;
        impactType: "POSITIVE" | "NEGATIVE";
    }[];
}

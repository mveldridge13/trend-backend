export class CategoryAnalyticsDto {
  categoryId: string;
  categoryName: string;
  categoryType: string;

  // Spending Analytics
  totalSpent: number;
  averageTransaction: number;
  transactionCount: number;
  currency: string;

  // Time-based Analytics
  lastUsed?: Date;
  firstUsed?: Date;
  usageFrequency: "DAILY" | "WEEKLY" | "MONTHLY" | "RARELY";

  // Budget Integration
  budgetAllocated?: number;
  budgetUsedPercentage?: number;
  isOverBudget: boolean;

  // Trends
  monthlySpending: {
    month: string;
    amount: number;
  }[];

  // Comparisons
  percentageOfTotalSpending: number;
  rankAmongCategories: number;

  // Goals Integration (for future)
  relatedGoals?: {
    goalId: string;
    goalName: string;
    impactType: "POSITIVE" | "NEGATIVE"; // Spending vs Saving category
  }[];
}

import { Expose, Transform } from "class-transformer";

export class BudgetAnalyticsDto {
  @Expose()
  budgetId: string;

  @Expose()
  budgetName: string;

  @Expose()
  @Transform(({ value }) => parseFloat(value.toString()))
  totalAmount: number;

  @Expose()
  @Transform(({ value }) => parseFloat(value.toString()))
  spentAmount: number;

  @Expose()
  @Transform(({ value }) => parseFloat(value.toString()))
  remainingAmount: number;

  @Expose()
  spentPercentage: number;

  @Expose()
  transactionCount: number;

  @Expose()
  daysTotal: number;

  @Expose()
  daysElapsed: number;

  @Expose()
  daysRemaining: number;

  @Expose()
  dailyBudget: number;

  @Expose()
  dailyAverageSpending: number;

  @Expose()
  projectedTotalSpending: number;

  @Expose()
  isOverBudget: boolean;

  @Expose()
  isOnTrack: boolean;

  @Expose()
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }>;

  @Expose()
  spendingTrend: Array<{
    date: string;
    dailySpent: number;
    cumulativeSpent: number;
  }>;
}

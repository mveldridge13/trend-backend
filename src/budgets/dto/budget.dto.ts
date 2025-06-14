import { Exclude, Expose, Transform } from "class-transformer";
import { BudgetStatus } from "@prisma/client";

export class BudgetDto {
  @Expose()
  id: string;

  @Exclude()
  userId: string;

  @Expose()
  name: string;

  @Expose()
  description: string | null;

  @Expose()
  @Transform(({ value }) => parseFloat(value.toString()))
  totalAmount: number;

  @Expose()
  currency: string;

  @Expose()
  startDate: Date;

  @Expose()
  endDate: Date | null;

  @Expose()
  isRecurring: boolean;

  @Expose()
  status: BudgetStatus;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // Analytics fields (calculated)
  @Expose()
  @Transform(({ value }) => (value ? parseFloat(value.toString()) : 0))
  spentAmount?: number;

  @Expose()
  @Transform(({ value }) => (value ? parseFloat(value.toString()) : 0))
  remainingAmount?: number;

  @Expose()
  spentPercentage?: number;

  @Expose()
  transactionCount?: number;

  @Expose()
  daysRemaining?: number;

  @Expose()
  isOverBudget?: boolean;
}

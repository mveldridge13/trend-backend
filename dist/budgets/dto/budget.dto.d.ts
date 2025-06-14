import { BudgetStatus } from "@prisma/client";
export declare class BudgetDto {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    totalAmount: number;
    currency: string;
    startDate: Date;
    endDate: Date | null;
    isRecurring: boolean;
    status: BudgetStatus;
    createdAt: Date;
    updatedAt: Date;
    spentAmount?: number;
    remainingAmount?: number;
    spentPercentage?: number;
    transactionCount?: number;
    daysRemaining?: number;
    isOverBudget?: boolean;
}

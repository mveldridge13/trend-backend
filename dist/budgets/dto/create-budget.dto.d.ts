import { BudgetStatus } from "@prisma/client";
export declare class CreateBudgetDto {
    name: string;
    description?: string;
    totalAmount: number;
    currency?: string;
    startDate: string;
    endDate?: string;
    isRecurring?: boolean;
    status?: BudgetStatus;
}

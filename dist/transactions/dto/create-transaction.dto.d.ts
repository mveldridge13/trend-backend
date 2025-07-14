import { TransactionType } from "@prisma/client";
export declare class CreateTransactionDto {
    description: string;
    amount: number;
    currency?: string;
    date: string;
    dueDate?: string;
    type: TransactionType;
    budgetId?: string;
    categoryId?: string;
    subcategoryId?: string;
    recurrence?: string;
}

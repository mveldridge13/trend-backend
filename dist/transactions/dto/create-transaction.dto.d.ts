import { TransactionType, PaymentStatus } from "@prisma/client";
export declare class CreateTransactionDto {
    description: string;
    amount: number;
    currency?: string;
    date: string;
    dueDate?: string;
    type: TransactionType;
    status?: PaymentStatus;
    budgetId?: string;
    categoryId?: string;
    subcategoryId?: string;
    recurrence?: string;
}

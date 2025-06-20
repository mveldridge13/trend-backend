import { TransactionType } from "@prisma/client";
export declare class TransactionFilterDto {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    subcategoryId?: string;
    budgetId?: string;
    type?: TransactionType;
    recurrence?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

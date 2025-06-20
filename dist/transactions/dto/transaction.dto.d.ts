import { TransactionType } from "@prisma/client";
export declare class TransactionDto {
    id: string;
    userId: string;
    budgetId?: string;
    categoryId?: string;
    subcategoryId?: string;
    description: string;
    amount: number;
    currency: string;
    date: Date;
    type: TransactionType;
    recurrence: string;
    isAICategorized: boolean;
    aiConfidence?: number;
    notes?: string;
    location?: string;
    merchantName?: string;
    createdAt: Date;
    updatedAt: Date;
    budget?: {
        id: string;
        name: string;
    };
    category?: {
        id: string;
        name: string;
        icon?: string;
        color?: string;
        type: string;
    };
    subcategory?: {
        id: string;
        name: string;
        icon?: string;
        color?: string;
    };
}

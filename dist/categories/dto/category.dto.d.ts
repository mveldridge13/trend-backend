import { CategoryType } from "@prisma/client";
export declare class CategoryDto {
    id: string;
    userId?: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    type: CategoryType;
    parentId?: string;
    isSystem: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    subcategories?: CategoryDto[];
    parent?: CategoryDto;
    transactionCount?: number;
    totalSpent?: number;
    budgetAllocated?: number;
    lastUsed?: Date;
}

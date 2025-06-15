import { Prisma, Category, CategoryType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
export declare class CategoriesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.CategoryCreateInput): Promise<Category>;
    findById(id: string, userId?: string): Promise<Category | null>;
    findManyByUser(userId: string, filters?: {
        type?: CategoryType;
        isSystem?: boolean;
        isActive?: boolean;
        parentId?: string;
        search?: string;
    }, pagination?: {
        skip: number;
        take: number;
    }): Promise<{
        categories: Category[];
        total: number;
    }>;
    update(id: string, userId: string, data: Prisma.CategoryUpdateInput): Promise<Category>;
    delete(id: string, userId: string): Promise<Category>;
    getSystemCategories(): Promise<Category[]>;
    getCategoryAnalytics(categoryId: string, userId: string, dateRange: {
        startDate: Date;
        endDate: Date;
    }): Promise<any>;
    getMostUsedCategories(userId: string, limit?: number): Promise<Category[]>;
}

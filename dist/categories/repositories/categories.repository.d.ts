import { Prisma, Category, CategoryType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { DateService } from "../../common/services/date.service";
export declare class CategoriesRepository {
    private readonly prisma;
    private readonly dateService;
    constructor(prisma: PrismaService, dateService: DateService);
    create(data: Prisma.CategoryCreateInput): Promise<Category>;
    findById(id: string, userId?: string): Promise<Category | null>;
    findManyByUser(userId: string, filters?: {
        type?: CategoryType;
        isSystem?: boolean;
        isActive?: boolean;
        parentId?: string;
        search?: string;
        includeArchived?: boolean;
    }, pagination?: {
        skip: number;
        take: number;
    }): Promise<{
        categories: Category[];
        total: number;
    }>;
    update(id: string, userId: string, data: Prisma.CategoryUpdateInput): Promise<Category>;
    delete(id: string, userId: string): Promise<Category>;
    countActiveSubcategories(parentId: string, userId: string): Promise<number>;
    archiveWithChildren(parentId: string, userId: string): Promise<void>;
    permanentDelete(parentId: string, userId: string): Promise<void>;
    restoreWithChildren(parentId: string, userId: string): Promise<number>;
    findArchivedById(id: string, userId: string): Promise<Category | null>;
    findArchivedByUser(userId: string): Promise<Category[]>;
    getSystemCategories(): Promise<Category[]>;
    getCategoryAnalytics(categoryId: string, userId: string, dateRange: {
        startDate: Date;
        endDate: Date;
    }): Promise<any>;
    getMostUsedCategories(userId: string, limit?: number): Promise<Category[]>;
}

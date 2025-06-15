import { CategoryType } from "@prisma/client";
import { CategoriesRepository } from "./repositories/categories.repository";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CategoryDto } from "./dto/category.dto";
import { CategoryAnalyticsDto } from "./dto/category-analytics.dto";
export interface DeleteOptions {
    permanent?: boolean;
    force?: boolean;
}
export interface DeleteResult {
    message: string;
    affectedCategories: number;
    subcategoryNames?: string[];
}
export interface RestoreResult {
    message: string;
    restoredCategories: number;
}
export interface DeleteWarning {
    message: string;
    subcategoriesCount: number;
    subcategoryNames: string[];
    action: "archive" | "permanent_delete";
    suggestion: string;
    statusCode: 400;
    error: "Bad Request";
}
export declare class CategoriesService {
    private readonly categoriesRepository;
    constructor(categoriesRepository: CategoriesRepository);
    create(userId: string, createCategoryDto: CreateCategoryDto): Promise<CategoryDto>;
    findAll(userId: string, filters?: {
        type?: CategoryType;
        isSystem?: boolean;
        parentId?: string;
        search?: string;
        includeArchived?: boolean;
    }, page?: number, limit?: number): Promise<{
        categories: CategoryDto[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(userId: string, id: string): Promise<CategoryDto>;
    update(userId: string, id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto>;
    remove(userId: string, id: string, options?: DeleteOptions): Promise<DeleteResult>;
    restore(userId: string, id: string): Promise<RestoreResult>;
    findArchived(userId: string): Promise<CategoryDto[]>;
    getSystemCategories(): Promise<CategoryDto[]>;
    getCategoryAnalytics(userId: string, categoryId: string, startDate?: Date, endDate?: Date): Promise<CategoryAnalyticsDto>;
    getMostUsedCategories(userId: string, limit?: number): Promise<CategoryDto[]>;
    private mapToDto;
}

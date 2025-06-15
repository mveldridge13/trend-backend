import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CategoryType } from "@prisma/client";
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(req: any, createCategoryDto: CreateCategoryDto): Promise<import("./dto/category.dto").CategoryDto>;
    findAll(req: any, type?: CategoryType, isSystem?: string, parentId?: string, search?: string, includeArchived?: string, page?: number, limit?: number): Promise<{
        categories: import("./dto/category.dto").CategoryDto[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getSystemCategories(): Promise<import("./dto/category.dto").CategoryDto[]>;
    getMostUsedCategories(req: any, limit?: number): Promise<import("./dto/category.dto").CategoryDto[]>;
    getArchivedCategories(req: any): Promise<import("./dto/category.dto").CategoryDto[]>;
    findOne(req: any, id: string): Promise<import("./dto/category.dto").CategoryDto>;
    getCategoryAnalytics(req: any, id: string, startDate?: string, endDate?: string): Promise<import("./dto/category-analytics.dto").CategoryAnalyticsDto>;
    update(req: any, id: string, updateCategoryDto: UpdateCategoryDto): Promise<import("./dto/category.dto").CategoryDto>;
    remove(req: any, id: string, permanent?: string, force?: string): Promise<import("./categories.service").DeleteResult>;
    restore(req: any, id: string): Promise<import("./categories.service").RestoreResult>;
}

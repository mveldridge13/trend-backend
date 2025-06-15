import { CategoryType } from "@prisma/client";
import { CategoriesRepository } from "./repositories/categories.repository";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CategoryDto } from "./dto/category.dto";
import { CategoryAnalyticsDto } from "./dto/category-analytics.dto";
export declare class CategoriesService {
    private readonly categoriesRepository;
    constructor(categoriesRepository: CategoriesRepository);
    create(userId: string, createCategoryDto: CreateCategoryDto): Promise<CategoryDto>;
    findAll(userId: string, filters?: {
        type?: CategoryType;
        isSystem?: boolean;
        parentId?: string;
        search?: string;
    }, page?: number, limit?: number): Promise<{
        categories: CategoryDto[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(userId: string, id: string): Promise<CategoryDto>;
    update(userId: string, id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto>;
    remove(userId: string, id: string): Promise<void>;
    getSystemCategories(): Promise<CategoryDto[]>;
    getCategoryAnalytics(userId: string, categoryId: string, startDate?: Date, endDate?: Date): Promise<CategoryAnalyticsDto>;
    getMostUsedCategories(userId: string, limit?: number): Promise<CategoryDto[]>;
    private mapToDto;
}

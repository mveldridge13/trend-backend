import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { CategoryType } from "@prisma/client";
import { CategoriesRepository } from "./repositories/categories.repository";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CategoryDto } from "./dto/category.dto";
import { CategoryAnalyticsDto } from "./dto/category-analytics.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async create(
    userId: string,
    createCategoryDto: CreateCategoryDto
  ): Promise<CategoryDto> {

    // Check if category name already exists for this user
    const existingCategories = await this.categoriesRepository.findManyByUser(
      userId,
      { search: createCategoryDto.name }
    );

    const nameExists = existingCategories.categories.some(
      (cat) => cat.name.toLowerCase() === createCategoryDto.name.toLowerCase()
    );

    if (nameExists) {
      throw new ConflictException("Category with this name already exists");
    }

    // Validate parent category if provided
    if (createCategoryDto.parentId) {
      const parentCategory = await this.categoriesRepository.findById(
        createCategoryDto.parentId,
        userId
      );
      if (!parentCategory) {
        throw new NotFoundException("Parent category not found");
      }
    }

    // 🔧 FIX: Direct assignment instead of nested connect object
    const categoryData = {
      name: createCategoryDto.name,
      description: createCategoryDto.description,
      icon: createCategoryDto.icon,
      color: createCategoryDto.color,
      type: createCategoryDto.type,
      parentId: createCategoryDto.parentId,
      isActive: createCategoryDto.isActive ?? true,
      isSystem: false,
      userId: userId, // 👈 Direct assignment - this fixes the undefined error
    };

    const category = await this.categoriesRepository.create(categoryData);
    return this.mapToDto(category);
  }

  async findAll(
    userId: string,
    filters: {
      type?: CategoryType;
      isSystem?: boolean;
      parentId?: string;
      search?: string;
    } = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{
    categories: CategoryDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const { categories, total } =
      await this.categoriesRepository.findManyByUser(userId, filters, {
        skip,
        take: limit,
      });

    return {
      categories: categories.map((cat) => this.mapToDto(cat)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string): Promise<CategoryDto> {
    const category = await this.categoriesRepository.findById(id, userId);
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return this.mapToDto(category);
  }

  async update(
    userId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto
  ): Promise<CategoryDto> {
    const existingCategory = await this.categoriesRepository.findById(
      id,
      userId
    );
    if (!existingCategory) {
      throw new NotFoundException("Category not found");
    }

    if (existingCategory.isSystem) {
      throw new BadRequestException("Cannot update system categories");
    }

    if (
      updateCategoryDto.name &&
      updateCategoryDto.name !== existingCategory.name
    ) {
      const existingCategories = await this.categoriesRepository.findManyByUser(
        userId,
        { search: updateCategoryDto.name }
      );

      const nameExists = existingCategories.categories.some(
        (cat) =>
          cat.name.toLowerCase() === updateCategoryDto.name.toLowerCase() &&
          cat.id !== id
      );

      if (nameExists) {
        throw new ConflictException("Category with this name already exists");
      }
    }

    if (updateCategoryDto.parentId) {
      const parentCategory = await this.categoriesRepository.findById(
        updateCategoryDto.parentId,
        userId
      );
      if (!parentCategory) {
        throw new NotFoundException("Parent category not found");
      }

      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException("Category cannot be its own parent");
      }
    }

    const updatedCategory = await this.categoriesRepository.update(
      id,
      userId,
      updateCategoryDto
    );
    return this.mapToDto(updatedCategory);
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await this.categoriesRepository.findById(id, userId);
    if (!category) {
      throw new NotFoundException("Category not found");
    }

    if (category.isSystem) {
      throw new BadRequestException("Cannot delete system categories");
    }

    await this.categoriesRepository.delete(id, userId);
  }

  async getSystemCategories(): Promise<CategoryDto[]> {
    const categories = await this.categoriesRepository.getSystemCategories();
    return categories.map((cat) => this.mapToDto(cat));
  }

  async getCategoryAnalytics(
    userId: string,
    categoryId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CategoryAnalyticsDto> {
    const defaultEndDate = endDate || new Date();
    const defaultStartDate =
      startDate ||
      new Date(defaultEndDate.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

    const analytics = await this.categoriesRepository.getCategoryAnalytics(
      categoryId,
      userId,
      { startDate: defaultStartDate, endDate: defaultEndDate }
    );

    if (!analytics) {
      throw new NotFoundException("Category not found");
    }

    const daysSinceFirstUse = analytics.firstUsed
      ? Math.floor((Date.now() - analytics.firstUsed) / (1000 * 60 * 60 * 24))
      : 0;

    let usageFrequency: "DAILY" | "WEEKLY" | "MONTHLY" | "RARELY" = "RARELY";
    if (analytics.transactionCount > 0 && daysSinceFirstUse > 0) {
      const transactionsPerDay = analytics.transactionCount / daysSinceFirstUse;
      if (transactionsPerDay >= 0.5) usageFrequency = "DAILY";
      else if (transactionsPerDay >= 0.1) usageFrequency = "WEEKLY";
      else if (transactionsPerDay >= 0.03) usageFrequency = "MONTHLY";
    }

    return {
      ...analytics,
      currency: "USD",
      usageFrequency,
      lastUsed: analytics.lastUsed ? new Date(analytics.lastUsed) : undefined,
      firstUsed: analytics.firstUsed
        ? new Date(analytics.firstUsed)
        : undefined,
      budgetAllocated: 0,
      budgetUsedPercentage: 0,
      isOverBudget: false,
      percentageOfTotalSpending: 0,
      rankAmongCategories: 1,
      relatedGoals: [],
    };
  }

  async getMostUsedCategories(
    userId: string,
    limit: number = 10
  ): Promise<CategoryDto[]> {
    const categories = await this.categoriesRepository.getMostUsedCategories(
      userId,
      limit
    );
    return categories.map((cat) => this.mapToDto(cat));
  }

  private mapToDto(category: any): CategoryDto {
    return {
      id: category.id,
      userId: category.userId,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      type: category.type,
      parentId: category.parentId,
      isSystem: category.isSystem,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      subcategories: category.subcategories?.map((sub) => this.mapToDto(sub)),
      parent: category.parent ? this.mapToDto(category.parent) : undefined,
      transactionCount: category._count?.transactions || 0,
    };
  }
}

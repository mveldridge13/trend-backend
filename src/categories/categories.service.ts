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

    const categoryData = {
      name: createCategoryDto.name,
      description: createCategoryDto.description,
      icon: createCategoryDto.icon,
      color: createCategoryDto.color,
      type: createCategoryDto.type,
      parentId: createCategoryDto.parentId,
      isActive: createCategoryDto.isActive ?? true,
      isSystem: false,
      userId: userId,
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
      includeArchived?: boolean;
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

  async remove(
    userId: string,
    id: string,
    options: DeleteOptions = {}
  ): Promise<DeleteResult> {
    const category = await this.categoriesRepository.findById(id, userId);
    if (!category) {
      throw new NotFoundException("Category not found");
    }

    if (category.isSystem) {
      throw new BadRequestException("Cannot delete system categories");
    }

    // Count affected subcategories
    const subcategoriesCount =
      await this.categoriesRepository.countActiveSubcategories(id, userId);
    const totalAffected = 1 + subcategoriesCount;

    // If has subcategories and not forced, return warning
    if (subcategoriesCount > 0 && !options.force) {
      const action = options.permanent ? "permanent_delete" : "archive";
      const actionText = options.permanent ? "permanently delete" : "archive";
      const willText = options.permanent
        ? "will permanently delete"
        : "will archive";

      // Get subcategory names safely
      const subcategoryNames =
        (category as any).subcategories?.map((sub: any) => sub.name) || [];

      const warning: DeleteWarning = {
        message: `This category has ${subcategoriesCount} subcategory(ies). ${actionText === "archive" ? "Archiving" : "Deleting"} this category ${willText} all subcategories as well.`,
        subcategoriesCount,
        subcategoryNames,
        action,
        suggestion: `Add '?force=true' to confirm ${actionText} of parent and all ${subcategoriesCount} subcategory(ies).`,
        statusCode: 400,
        error: "Bad Request",
      };

      throw new BadRequestException(warning);
    }

    if (options.permanent) {
      await this.categoriesRepository.permanentDelete(id, userId);
    } else {
      await this.categoriesRepository.archiveWithChildren(id, userId);
    }

    // Get subcategory names safely for response
    const subcategoryNames =
      (category as any).subcategories?.map((sub: any) => sub.name) || [];

    return {
      message: options.permanent
        ? `Category and ${subcategoriesCount} subcategory(ies) permanently deleted`
        : `Category and ${subcategoriesCount} subcategory(ies) archived`,
      affectedCategories: totalAffected,
      subcategoryNames,
    };
  }

  async restore(userId: string, id: string): Promise<RestoreResult> {
    const category = await this.categoriesRepository.findArchivedById(
      id,
      userId
    );
    if (!category) {
      throw new NotFoundException("Archived category not found");
    }

    const restoredCount = await this.categoriesRepository.restoreWithChildren(
      id,
      userId
    );

    return {
      message: `Category and subcategories restored successfully`,
      restoredCategories: restoredCount,
    };
  }

  async findArchived(userId: string): Promise<CategoryDto[]> {
    const categories =
      await this.categoriesRepository.findArchivedByUser(userId);
    return categories.map((cat) => this.mapToDto(cat));
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
      subcategories: (category as any).subcategories?.map((sub: any) =>
        this.mapToDto(sub)
      ),
      parent: category.parent ? this.mapToDto(category.parent) : undefined,
      transactionCount: category._count?.transactions || 0,
    };
  }
}

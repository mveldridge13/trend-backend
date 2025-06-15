"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const categories_repository_1 = require("./repositories/categories.repository");
let CategoriesService = class CategoriesService {
    constructor(categoriesRepository) {
        this.categoriesRepository = categoriesRepository;
    }
    async create(userId, createCategoryDto) {
        const existingCategories = await this.categoriesRepository.findManyByUser(userId, { search: createCategoryDto.name });
        const nameExists = existingCategories.categories.some((cat) => cat.name.toLowerCase() === createCategoryDto.name.toLowerCase());
        if (nameExists) {
            throw new common_1.ConflictException("Category with this name already exists");
        }
        if (createCategoryDto.parentId) {
            const parentCategory = await this.categoriesRepository.findById(createCategoryDto.parentId, userId);
            if (!parentCategory) {
                throw new common_1.NotFoundException("Parent category not found");
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
    async findAll(userId, filters = {}, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const { categories, total } = await this.categoriesRepository.findManyByUser(userId, filters, {
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
    async findOne(userId, id) {
        const category = await this.categoriesRepository.findById(id, userId);
        if (!category) {
            throw new common_1.NotFoundException("Category not found");
        }
        return this.mapToDto(category);
    }
    async update(userId, id, updateCategoryDto) {
        const existingCategory = await this.categoriesRepository.findById(id, userId);
        if (!existingCategory) {
            throw new common_1.NotFoundException("Category not found");
        }
        if (existingCategory.isSystem) {
            throw new common_1.BadRequestException("Cannot update system categories");
        }
        if (updateCategoryDto.name &&
            updateCategoryDto.name !== existingCategory.name) {
            const existingCategories = await this.categoriesRepository.findManyByUser(userId, { search: updateCategoryDto.name });
            const nameExists = existingCategories.categories.some((cat) => cat.name.toLowerCase() === updateCategoryDto.name.toLowerCase() &&
                cat.id !== id);
            if (nameExists) {
                throw new common_1.ConflictException("Category with this name already exists");
            }
        }
        if (updateCategoryDto.parentId) {
            const parentCategory = await this.categoriesRepository.findById(updateCategoryDto.parentId, userId);
            if (!parentCategory) {
                throw new common_1.NotFoundException("Parent category not found");
            }
            if (updateCategoryDto.parentId === id) {
                throw new common_1.BadRequestException("Category cannot be its own parent");
            }
        }
        const updatedCategory = await this.categoriesRepository.update(id, userId, updateCategoryDto);
        return this.mapToDto(updatedCategory);
    }
    async remove(userId, id) {
        const category = await this.categoriesRepository.findById(id, userId);
        if (!category) {
            throw new common_1.NotFoundException("Category not found");
        }
        if (category.isSystem) {
            throw new common_1.BadRequestException("Cannot delete system categories");
        }
        await this.categoriesRepository.delete(id, userId);
    }
    async getSystemCategories() {
        const categories = await this.categoriesRepository.getSystemCategories();
        return categories.map((cat) => this.mapToDto(cat));
    }
    async getCategoryAnalytics(userId, categoryId, startDate, endDate) {
        const defaultEndDate = endDate || new Date();
        const defaultStartDate = startDate ||
            new Date(defaultEndDate.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        const analytics = await this.categoriesRepository.getCategoryAnalytics(categoryId, userId, { startDate: defaultStartDate, endDate: defaultEndDate });
        if (!analytics) {
            throw new common_1.NotFoundException("Category not found");
        }
        const daysSinceFirstUse = analytics.firstUsed
            ? Math.floor((Date.now() - analytics.firstUsed) / (1000 * 60 * 60 * 24))
            : 0;
        let usageFrequency = "RARELY";
        if (analytics.transactionCount > 0 && daysSinceFirstUse > 0) {
            const transactionsPerDay = analytics.transactionCount / daysSinceFirstUse;
            if (transactionsPerDay >= 0.5)
                usageFrequency = "DAILY";
            else if (transactionsPerDay >= 0.1)
                usageFrequency = "WEEKLY";
            else if (transactionsPerDay >= 0.03)
                usageFrequency = "MONTHLY";
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
    async getMostUsedCategories(userId, limit = 10) {
        const categories = await this.categoriesRepository.getMostUsedCategories(userId, limit);
        return categories.map((cat) => this.mapToDto(cat));
    }
    mapToDto(category) {
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
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [categories_repository_1.CategoriesRepository])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map
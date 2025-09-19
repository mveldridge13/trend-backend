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
exports.CategoriesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let CategoriesRepository = class CategoriesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const userId = data.userId;
        return this.prisma.category.create({
            data,
            include: {
                parent: true,
                subcategories: {
                    where: {
                        isActive: true,
                        OR: [{ userId: userId }, { isSystem: true }],
                    },
                    orderBy: { name: "asc" },
                },
            },
        });
    }
    async findById(id, userId) {
        return this.prisma.category.findFirst({
            where: {
                id,
                isActive: true,
                OR: [{ userId: userId }, { isSystem: true }],
            },
            include: {
                parent: true,
                subcategories: {
                    where: {
                        isActive: true,
                        OR: [{ userId: userId }, { isSystem: true }],
                    },
                    orderBy: { name: "asc" },
                },
            },
        });
    }
    async findManyByUser(userId, filters = {}, pagination = { skip: 0, take: 50 }) {
        let where = {
            ...(filters.type && { type: filters.type }),
            ...(filters.parentId && { parentId: filters.parentId }),
        };
        if (!filters.includeArchived) {
            where.isActive = true;
        }
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
            ];
        }
        if (filters.isSystem !== undefined) {
            if (filters.isSystem === true) {
                where.isSystem = true;
            }
            else {
                where.userId = userId;
                where.isSystem = false;
            }
        }
        else {
            where.AND = [
                {
                    OR: [
                        { userId: userId, isSystem: false },
                        { isSystem: true }
                    ]
                }
            ];
        }
        const [categories, total] = await Promise.all([
            this.prisma.category.findMany({
                where,
                include: {
                    parent: true,
                    subcategories: {
                        where: {
                            isActive: true,
                            OR: [{ userId: userId }, { isSystem: true }],
                        },
                        orderBy: { name: "asc" },
                    },
                    _count: {
                        select: {
                            transactions: true,
                        },
                    },
                },
                orderBy: [{ isSystem: "desc" }, { name: "asc" }],
                skip: pagination.skip,
                take: pagination.take,
            }),
            this.prisma.category.count({ where }),
        ]);
        return { categories, total };
    }
    async update(id, userId, data) {
        return this.prisma.category.update({
            where: {
                id,
                userId: userId,
                isSystem: false,
            },
            data,
            include: {
                parent: true,
                subcategories: {
                    where: {
                        isActive: true,
                        OR: [{ userId: userId }, { isSystem: true }],
                    },
                    orderBy: { name: "asc" },
                },
            },
        });
    }
    async delete(id, userId) {
        return this.prisma.category.update({
            where: {
                id,
                userId: userId,
                isSystem: false,
            },
            data: {
                isActive: false,
            },
        });
    }
    async countActiveSubcategories(parentId, userId) {
        return this.prisma.category.count({
            where: {
                parentId: parentId,
                isActive: true,
                OR: [{ userId: userId }, { isSystem: true }],
            },
        });
    }
    async archiveWithChildren(parentId, userId) {
        await this.prisma.$transaction(async (tx) => {
            await tx.category.updateMany({
                where: {
                    parentId: parentId,
                    userId: userId,
                    isSystem: false,
                },
                data: {
                    isActive: false,
                },
            });
            await tx.category.update({
                where: {
                    id: parentId,
                    userId: userId,
                    isSystem: false,
                },
                data: {
                    isActive: false,
                },
            });
        });
    }
    async permanentDelete(parentId, userId) {
        await this.prisma.$transaction(async (tx) => {
            await tx.category.deleteMany({
                where: {
                    parentId: parentId,
                    userId: userId,
                    isSystem: false,
                },
            });
            await tx.category.delete({
                where: {
                    id: parentId,
                    userId: userId,
                },
            });
        });
    }
    async restoreWithChildren(parentId, userId) {
        const result = await this.prisma.$transaction(async (tx) => {
            await tx.category.update({
                where: {
                    id: parentId,
                    userId: userId,
                },
                data: {
                    isActive: true,
                },
            });
            const restoredChildren = await tx.category.updateMany({
                where: {
                    parentId: parentId,
                    userId: userId,
                },
                data: {
                    isActive: true,
                },
            });
            return 1 + restoredChildren.count;
        });
        return result;
    }
    async findArchivedById(id, userId) {
        return this.prisma.category.findFirst({
            where: {
                id,
                userId: userId,
                isActive: false,
            },
            include: {
                parent: true,
                subcategories: {
                    where: { isActive: false },
                    orderBy: { name: "asc" },
                },
            },
        });
    }
    async findArchivedByUser(userId) {
        return this.prisma.category.findMany({
            where: {
                userId: userId,
                isActive: false,
                isSystem: false,
            },
            include: {
                parent: true,
                subcategories: {
                    where: { isActive: false },
                    orderBy: { name: "asc" },
                },
            },
            orderBy: { name: "asc" },
        });
    }
    async getSystemCategories() {
        return this.prisma.category.findMany({
            where: {
                isSystem: true,
                isActive: true,
            },
            include: {
                subcategories: {
                    where: { isActive: true },
                    orderBy: { name: "asc" },
                },
            },
            orderBy: { name: "asc" },
        });
    }
    async getCategoryAnalytics(categoryId, userId, dateRange) {
        const { startDate, endDate } = dateRange;
        const categoryWithStats = await this.prisma.category.findFirst({
            where: {
                id: categoryId,
                OR: [{ userId: userId }, { isSystem: true }],
            },
            include: {
                transactions: {
                    where: {
                        userId,
                        date: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    select: {
                        amount: true,
                        date: true,
                        type: true,
                    },
                },
                _count: {
                    select: {
                        transactions: {
                            where: {
                                userId,
                                date: {
                                    gte: startDate,
                                    lte: endDate,
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!categoryWithStats)
            return null;
        const transactions = categoryWithStats.transactions;
        const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const averageTransaction = transactions.length > 0 ? totalSpent / transactions.length : 0;
        const monthlySpending = transactions.reduce((acc, transaction) => {
            const month = transaction.date.toISOString().substring(0, 7);
            acc[month] = (acc[month] || 0) + Number(transaction.amount);
            return acc;
        }, {});
        return {
            categoryId,
            categoryName: categoryWithStats.name,
            categoryType: categoryWithStats.type,
            totalSpent,
            averageTransaction,
            transactionCount: transactions.length,
            lastUsed: transactions.length > 0
                ? Math.max(...transactions.map((t) => t.date.getTime()))
                : null,
            firstUsed: transactions.length > 0
                ? Math.min(...transactions.map((t) => t.date.getTime()))
                : null,
            monthlySpending: Object.entries(monthlySpending).map(([month, amount]) => ({
                month,
                amount,
            })),
        };
    }
    async getMostUsedCategories(userId, limit = 10) {
        return this.prisma.category.findMany({
            where: {
                OR: [{ userId: userId }, { isSystem: true }],
                isActive: true,
            },
            include: {
                _count: {
                    select: {
                        transactions: {
                            where: { userId },
                        },
                    },
                },
            },
            orderBy: {
                transactions: {
                    _count: "desc",
                },
            },
            take: limit,
        });
    }
};
exports.CategoriesRepository = CategoriesRepository;
exports.CategoriesRepository = CategoriesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesRepository);
//# sourceMappingURL=categories.repository.js.map
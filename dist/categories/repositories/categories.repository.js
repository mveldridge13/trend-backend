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
        return this.prisma.category.create({
            data,
        });
    }
    async findById(id, userId) {
        return this.prisma.category.findFirst({
            where: {
                id,
                OR: [
                    { userId },
                    { isSystem: true },
                ],
            },
        });
    }
    async findManyByUser(userId, filters = {}, pagination = { skip: 0, take: 50 }) {
        const where = {
            OR: [
                { userId },
                { isSystem: true },
            ],
            isActive: filters.isActive ?? true,
            ...(filters.type && { type: filters.type }),
            ...(filters.isSystem !== undefined && { isSystem: filters.isSystem }),
            ...(filters.search && {
                OR: [
                    { name: { contains: filters.search, mode: "insensitive" } },
                    { description: { contains: filters.search, mode: "insensitive" } },
                ],
            }),
        };
        const [categories, total] = await Promise.all([
            this.prisma.category.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            transactions: true,
                        },
                    },
                },
                orderBy: [
                    { isSystem: "desc" },
                    { name: "asc" },
                ],
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
                userId,
                isSystem: false,
            },
            data,
        });
    }
    async delete(id, userId) {
        return this.prisma.category.update({
            where: {
                id,
                userId,
                isSystem: false,
            },
            data: {
                isActive: false,
            },
        });
    }
    async getSystemCategories() {
        return this.prisma.category.findMany({
            where: {
                isSystem: true,
                isActive: true,
            },
            orderBy: { name: "asc" },
        });
    }
    async getCategoryAnalytics(categoryId, userId, dateRange) {
        const { startDate, endDate } = dateRange;
        const categoryWithStats = await this.prisma.category.findFirst({
            where: {
                id: categoryId,
                OR: [{ userId }, { isSystem: true }],
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
                OR: [{ userId }, { isSystem: true }],
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
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
exports.BudgetsRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const base_repository_1 = require("../../database/base.repository");
const prisma_service_1 = require("../../database/prisma.service");
let BudgetsRepository = class BudgetsRepository extends base_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
        this.prisma = prisma;
    }
    async create(userId, data) {
        if (!data.totalAmount || isNaN(data.totalAmount)) {
            throw new Error(`Invalid totalAmount: ${data.totalAmount}`);
        }
        console.log("REPOSITORY DEBUG:");
        console.log("data.totalAmount:", data.totalAmount);
        console.log("data.totalAmount type:", typeof data.totalAmount);
        return this.prisma.budget.create({
            data: {
                name: data.name,
                description: data.description || null,
                userId,
                totalAmount: new client_1.Prisma.Decimal(data.totalAmount.toString()),
                currency: data.currency || "USD",
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : null,
                isRecurring: data.isRecurring !== undefined ? data.isRecurring : true,
                status: data.status || client_1.BudgetStatus.ACTIVE,
            },
            include: {
                _count: {
                    select: { transactions: true },
                },
            },
        });
    }
    async findByUserId(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [budgets, total] = await Promise.all([
            this.prisma.budget.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    _count: {
                        select: { transactions: true },
                    },
                    transactions: {
                        select: {
                            amount: true,
                            type: true,
                        },
                    },
                },
            }),
            this.prisma.budget.count({ where: { userId } }),
        ]);
        return {
            data: budgets,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        };
    }
    async findByIdAndUserId(id, userId) {
        return this.prisma.budget.findFirst({
            where: { id, userId },
            include: {
                _count: {
                    select: { transactions: true },
                },
                transactions: {
                    select: {
                        amount: true,
                        type: true,
                        date: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: { date: "desc" },
                },
            },
        });
    }
    async update(id, userId, data) {
        const updateData = { ...data };
        if (data.totalAmount !== undefined) {
            updateData.totalAmount = new client_1.Prisma.Decimal(data.totalAmount);
        }
        if (data.startDate) {
            updateData.startDate = new Date(data.startDate);
        }
        if (data.endDate) {
            updateData.endDate = new Date(data.endDate);
        }
        return this.prisma.budget.update({
            where: { id, userId },
            data: updateData,
            include: {
                _count: {
                    select: { transactions: true },
                },
            },
        });
    }
    async delete(id, userId) {
        return this.prisma.budget.delete({
            where: { id, userId },
        });
    }
    async getBudgetAnalytics(id, userId) {
        const budget = await this.prisma.budget.findFirst({
            where: { id, userId },
            include: {
                transactions: {
                    select: {
                        amount: true,
                        type: true,
                        date: true,
                        categoryId: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!budget)
            return null;
        const expenseTransactions = budget.transactions.filter((t) => t.type === "EXPENSE");
        const spentAmount = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
        const categoryMap = new Map();
        expenseTransactions.forEach((t) => {
            const categoryId = t.categoryId || "uncategorized";
            const categoryName = t.category?.name || "Uncategorized";
            const amount = parseFloat(t.amount.toString());
            if (categoryMap.has(categoryId)) {
                const existing = categoryMap.get(categoryId);
                categoryMap.set(categoryId, {
                    ...existing,
                    amount: existing.amount + amount,
                    transactionCount: existing.transactionCount + 1,
                });
            }
            else {
                categoryMap.set(categoryId, {
                    categoryId,
                    categoryName,
                    amount,
                    percentage: 0,
                    transactionCount: 1,
                });
            }
        });
        const categoryBreakdown = Array.from(categoryMap.values()).map((cat) => ({
            ...cat,
            percentage: spentAmount > 0 ? (cat.amount / spentAmount) * 100 : 0,
        }));
        const spendingMap = new Map();
        expenseTransactions.forEach((t) => {
            const dateKey = t.date.toISOString().split("T")[0];
            const amount = parseFloat(t.amount.toString());
            spendingMap.set(dateKey, (spendingMap.get(dateKey) || 0) + amount);
        });
        const spendingTrend = Array.from(spendingMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .reduce((acc, [date, dailySpent], index) => {
            const cumulativeSpent = acc.length > 0
                ? acc[acc.length - 1].cumulativeSpent + dailySpent
                : dailySpent;
            acc.push({
                date,
                dailySpent,
                cumulativeSpent,
            });
            return acc;
        }, []);
        return {
            budget,
            spentAmount,
            categoryBreakdown,
            spendingTrend,
        };
    }
};
exports.BudgetsRepository = BudgetsRepository;
exports.BudgetsRepository = BudgetsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BudgetsRepository);
//# sourceMappingURL=budgets.repository.js.map
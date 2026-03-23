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
exports.TransactionsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
let TransactionsRepository = class TransactionsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, data) {
        return this.prisma.transaction.create({
            data: {
                userId,
                description: data.description,
                amount: new client_1.Prisma.Decimal(data.amount),
                currency: data.currency,
                date: new Date(data.date),
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                type: data.type,
                status: data.status,
                budgetId: data.budgetId,
                categoryId: data.categoryId,
                subcategoryId: data.subcategoryId,
                recurrence: data.recurrence,
                linkedGoalId: data.linkedGoalId,
            },
            include: {
                budget: {
                    select: { id: true, name: true },
                },
                category: {
                    select: { id: true, name: true, icon: true, color: true, type: true },
                },
                subcategory: {
                    select: { id: true, name: true, icon: true, color: true },
                },
                linkedGoal: {
                    select: { id: true, name: true, type: true },
                },
            },
        });
    }
    async findMany(userId, filters) {
        const where = {
            userId,
        };
        if (filters.startDate || filters.endDate) {
            const periodStart = filters.startDate ? (0, date_fns_1.startOfDay)(new Date(filters.startDate)) : undefined;
            const periodEnd = filters.endDate ? (0, date_fns_1.endOfDay)(new Date(filters.endDate)) : undefined;
            const dateInPeriod = {};
            const dueDateInPeriod = {};
            if (periodStart && periodEnd) {
                dateInPeriod.date = { gte: periodStart, lte: periodEnd };
                dueDateInPeriod.dueDate = { gte: periodStart, lte: periodEnd };
            }
            else if (periodStart) {
                dateInPeriod.date = { gte: periodStart };
                dueDateInPeriod.dueDate = { gte: periodStart };
            }
            else if (periodEnd) {
                dateInPeriod.date = { lte: periodEnd };
                dueDateInPeriod.dueDate = { lte: periodEnd };
            }
            where.OR = [
                { status: 'PAID', ...dateInPeriod },
                { status: 'UPCOMING', ...dueDateInPeriod },
                { status: 'OVERDUE', ...dueDateInPeriod },
                { status: null, ...dateInPeriod },
            ];
        }
        if (filters.categoryId) {
            where.categoryId = filters.categoryId;
        }
        if (filters.budgetId) {
            where.budgetId = filters.budgetId;
        }
        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.search) {
            where.description = { contains: filters.search, mode: "insensitive" };
        }
        if (filters.subcategoryId) {
            where.subcategoryId = filters.subcategoryId;
        }
        return this.prisma.transaction.findMany({
            where,
            include: {
                budget: {
                    select: { id: true, name: true },
                },
                category: {
                    select: { id: true, name: true, icon: true, color: true, type: true },
                },
                subcategory: {
                    select: { id: true, name: true, icon: true, color: true },
                },
                linkedGoal: {
                    select: { id: true, name: true, type: true },
                },
            },
            orderBy: {
                [filters.sortBy]: filters.sortOrder,
            },
            take: filters.limit,
            skip: filters.offset,
        });
    }
    async findById(id, userId) {
        return this.prisma.transaction.findFirst({
            where: { id, userId },
            include: {
                budget: {
                    select: { id: true, name: true },
                },
                category: {
                    select: { id: true, name: true, icon: true, color: true, type: true },
                },
                subcategory: {
                    select: { id: true, name: true, icon: true, color: true },
                },
                linkedGoal: {
                    select: { id: true, name: true, type: true },
                },
            },
        });
    }
    async update(id, userId, data) {
        const updateData = { ...data };
        if (data.amount !== undefined) {
            updateData.amount = new client_1.Prisma.Decimal(data.amount);
        }
        if (data.date !== undefined) {
            updateData.date = new Date(data.date);
        }
        if (data.dueDate !== undefined) {
            updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
        }
        const result = await this.prisma.transaction.update({
            where: {
                id,
                userId,
            },
            data: updateData,
            include: {
                budget: {
                    select: { id: true, name: true },
                },
                category: {
                    select: { id: true, name: true, icon: true, color: true, type: true },
                },
                subcategory: {
                    select: { id: true, name: true, icon: true, color: true },
                },
                linkedGoal: {
                    select: { id: true, name: true, type: true },
                },
            },
        });
        return result;
    }
    async delete(id, userId) {
        return this.prisma.transaction.delete({
            where: {
                id,
                userId,
            },
        });
    }
    async count(userId, filters = {}) {
        const where = {
            userId,
        };
        if (filters.startDate || filters.endDate) {
            const periodStart = filters.startDate ? (0, date_fns_1.startOfDay)(new Date(filters.startDate)) : undefined;
            const periodEnd = filters.endDate ? (0, date_fns_1.endOfDay)(new Date(filters.endDate)) : undefined;
            const dateInPeriod = {};
            const dueDateInPeriod = {};
            if (periodStart && periodEnd) {
                dateInPeriod.date = { gte: periodStart, lte: periodEnd };
                dueDateInPeriod.dueDate = { gte: periodStart, lte: periodEnd };
            }
            else if (periodStart) {
                dateInPeriod.date = { gte: periodStart };
                dueDateInPeriod.dueDate = { gte: periodStart };
            }
            else if (periodEnd) {
                dateInPeriod.date = { lte: periodEnd };
                dueDateInPeriod.dueDate = { lte: periodEnd };
            }
            where.OR = [
                { status: 'PAID', ...dateInPeriod },
                { status: 'UPCOMING', ...dueDateInPeriod },
                { status: 'OVERDUE', ...dueDateInPeriod },
                { status: null, ...dateInPeriod },
            ];
        }
        if (filters.categoryId) {
            where.categoryId = filters.categoryId;
        }
        if (filters.budgetId) {
            where.budgetId = filters.budgetId;
        }
        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.subcategoryId) {
            where.subcategoryId = filters.subcategoryId;
        }
        return this.prisma.transaction.count({ where });
    }
};
exports.TransactionsRepository = TransactionsRepository;
exports.TransactionsRepository = TransactionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsRepository);
//# sourceMappingURL=transactions.repository.js.map
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
                currency: data.currency || "USD",
                date: new Date(data.date),
                type: data.type,
                budgetId: data.budgetId,
                categoryId: data.categoryId,
                subcategoryId: data.subcategoryId,
                recurrence: data.recurrence,
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
            },
        });
    }
    async findMany(userId, filters) {
        const where = {
            userId,
        };
        const dateFilter = {};
        if (filters.startDate) {
            dateFilter.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            dateFilter.lte = new Date(filters.endDate);
        }
        if (Object.keys(dateFilter).length > 0) {
            where.date = dateFilter;
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
        return this.prisma.transaction.update({
            where: { id },
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
            },
        });
    }
    async delete(id, userId) {
        return this.prisma.transaction.delete({
            where: { id },
        });
    }
    async count(userId, filters = {}) {
        const where = {
            userId,
        };
        const dateFilter = {};
        if (filters.startDate) {
            dateFilter.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            dateFilter.lte = new Date(filters.endDate);
        }
        if (Object.keys(dateFilter).length > 0) {
            where.date = dateFilter;
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
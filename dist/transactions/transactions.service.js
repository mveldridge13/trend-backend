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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const transactions_repository_1 = require("./repositories/transactions.repository");
const client_1 = require("@prisma/client");
let TransactionsService = class TransactionsService {
    constructor(transactionsRepository) {
        this.transactionsRepository = transactionsRepository;
    }
    async create(userId, createTransactionDto) {
        this.validateTransactionAmount(createTransactionDto.amount, createTransactionDto.type);
        this.validateTransactionDate(createTransactionDto.date);
        const transaction = await this.transactionsRepository.create(userId, createTransactionDto);
        return this.mapToDto(transaction);
    }
    async findAll(userId, filters) {
        const [transactions, total] = await Promise.all([
            this.transactionsRepository.findMany(userId, filters),
            this.transactionsRepository.count(userId, filters),
        ]);
        const page = Math.floor(filters.offset / filters.limit) + 1;
        const totalPages = Math.ceil(total / filters.limit);
        return {
            transactions: transactions.map(this.mapToDto),
            total,
            page,
            limit: filters.limit,
            totalPages,
        };
    }
    async findOne(id, userId) {
        const transaction = await this.transactionsRepository.findById(id, userId);
        if (!transaction) {
            throw new common_1.NotFoundException(`Transaction with ID ${id} not found`);
        }
        return this.mapToDto(transaction);
    }
    async update(id, userId, updateTransactionDto) {
        const existingTransaction = await this.transactionsRepository.findById(id, userId);
        if (!existingTransaction) {
            throw new common_1.NotFoundException(`Transaction with ID ${id} not found`);
        }
        if (updateTransactionDto.amount !== undefined &&
            updateTransactionDto.type !== undefined) {
            this.validateTransactionAmount(updateTransactionDto.amount, updateTransactionDto.type);
        }
        else if (updateTransactionDto.amount !== undefined) {
            this.validateTransactionAmount(updateTransactionDto.amount, existingTransaction.type);
        }
        else if (updateTransactionDto.type !== undefined) {
            this.validateTransactionAmount(Number(existingTransaction.amount), updateTransactionDto.type);
        }
        if (updateTransactionDto.date !== undefined) {
            this.validateTransactionDate(updateTransactionDto.date);
        }
        const updatedTransaction = await this.transactionsRepository.update(id, userId, updateTransactionDto);
        return this.mapToDto(updatedTransaction);
    }
    async remove(id, userId) {
        const transaction = await this.transactionsRepository.findById(id, userId);
        if (!transaction) {
            throw new common_1.NotFoundException(`Transaction with ID ${id} not found`);
        }
        await this.transactionsRepository.delete(id, userId);
    }
    async getAnalytics(userId, filters = {}) {
        const transactions = await this.transactionsRepository.findMany(userId, {
            ...filters,
            limit: 10000,
            offset: 0,
            sortBy: "date",
            sortOrder: "desc",
        });
        return this.calculateAnalytics(transactions);
    }
    validateTransactionAmount(amount, type) {
        if (amount <= 0) {
            throw new common_1.BadRequestException("Transaction amount must be greater than 0");
        }
        if (amount > 999999.99) {
            throw new common_1.BadRequestException("Transaction amount cannot exceed $999,999.99");
        }
    }
    validateTransactionDate(dateString) {
        const transactionDate = new Date(dateString);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (transactionDate > today) {
            throw new common_1.BadRequestException("Transaction date cannot be in the future");
        }
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(today.getFullYear() - 5);
        if (transactionDate < fiveYearsAgo) {
            throw new common_1.BadRequestException("Transaction date cannot be more than 5 years in the past");
        }
    }
    mapToDto(transaction) {
        return {
            id: transaction.id,
            userId: transaction.userId,
            budgetId: transaction.budgetId,
            categoryId: transaction.categoryId,
            description: transaction.description,
            amount: Number(transaction.amount),
            currency: transaction.currency,
            date: transaction.date,
            type: transaction.type,
            recurrence: "none",
            isAICategorized: transaction.isAICategorized,
            aiConfidence: transaction.aiConfidence,
            notes: null,
            location: null,
            merchantName: null,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
            budget: transaction.budget
                ? {
                    id: transaction.budget.id,
                    name: transaction.budget.name,
                }
                : undefined,
            category: transaction.category
                ? {
                    id: transaction.category.id,
                    name: transaction.category.name,
                    icon: transaction.category.icon,
                    color: transaction.category.color,
                    type: transaction.category.type,
                }
                : undefined,
        };
    }
    calculateAnalytics(transactions) {
        const income = transactions
            .filter((t) => t.type === client_1.TransactionType.INCOME)
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const expenses = transactions
            .filter((t) => t.type === client_1.TransactionType.EXPENSE)
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const transactionCount = transactions.length;
        const averageTransaction = transactionCount > 0 ? (income + expenses) / transactionCount : 0;
        const categoryMap = new Map();
        transactions.forEach((transaction) => {
            if (transaction.category) {
                const categoryId = transaction.category.id;
                if (!categoryMap.has(categoryId)) {
                    categoryMap.set(categoryId, {
                        categoryId,
                        categoryName: transaction.category.name,
                        categoryIcon: transaction.category.icon,
                        categoryColor: transaction.category.color,
                        amount: 0,
                        transactionCount: 0,
                    });
                }
                const category = categoryMap.get(categoryId);
                category.amount += Number(transaction.amount);
                category.transactionCount += 1;
            }
        });
        const categoryBreakdown = Array.from(categoryMap.values()).map((category) => ({
            ...category,
            percentage: expenses > 0 ? (category.amount / expenses) * 100 : 0,
        }));
        return {
            totalIncome: income,
            totalExpenses: expenses,
            netIncome: income - expenses,
            transactionCount,
            averageTransaction,
            categoryBreakdown,
            monthlyTrends: [],
            recentTransactions: {
                totalAmount: transactions
                    .slice(0, 10)
                    .reduce((sum, t) => sum + Number(t.amount), 0),
                count: Math.min(10, transactions.length),
                topCategories: categoryBreakdown.slice(0, 3).map((c) => c.categoryName),
            },
            budgetPerformance: [],
        };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [transactions_repository_1.TransactionsRepository])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map
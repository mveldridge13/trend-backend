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
        console.log("🔍 Service UPDATE - Input params:", { id, userId });
        console.log("🔍 Service UPDATE - UpdateTransactionDto:", updateTransactionDto);
        const existingTransaction = await this.transactionsRepository.findById(id, userId);
        if (!existingTransaction) {
            throw new common_1.NotFoundException(`Transaction with ID ${id} not found`);
        }
        console.log("🔍 Service UPDATE - Existing transaction found:", existingTransaction);
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
        console.log("🔍 Service UPDATE - About to call repository update");
        const updatedTransaction = await this.transactionsRepository.update(id, userId, updateTransactionDto);
        console.log("🔍 Service UPDATE - Repository result:", updatedTransaction);
        const result = this.mapToDto(updatedTransaction);
        console.log("🔍 Service UPDATE - Final mapped result:", result);
        return result;
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
        return this.calculateAnalytics(transactions, filters);
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
            subcategoryId: transaction.subcategoryId,
            description: transaction.description,
            amount: Number(transaction.amount),
            currency: transaction.currency,
            date: transaction.date,
            type: transaction.type,
            recurrence: transaction.recurrence || "none",
            isAICategorized: transaction.isAICategorized,
            aiConfidence: transaction.aiConfidence,
            notes: transaction.notes || null,
            location: transaction.location || null,
            merchantName: transaction.merchantName || null,
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
            subcategory: transaction.subcategory
                ? {
                    id: transaction.subcategory.id,
                    name: transaction.subcategory.name,
                    icon: transaction.subcategory.icon,
                    color: transaction.subcategory.color,
                }
                : undefined,
        };
    }
    calculateSpendingVelocity(transactions, userMonthlyBudget) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = monthEnd.getDate();
        const daysElapsed = now.getDate();
        console.log(`🚀 Calculating spending velocity for month: ${currentMonth + 1}/${currentYear}`);
        console.log(`📅 Days elapsed: ${daysElapsed}/${daysInMonth}`);
        const currentMonthTransactions = transactions.filter((t) => {
            const transactionDate = new Date(t.date);
            return (transactionDate >= monthStart &&
                transactionDate <= now &&
                t.type === "EXPENSE");
        });
        const currentMonthSpent = currentMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const dailyAverage = daysElapsed > 0 ? currentMonthSpent / daysElapsed : 0;
        const projectedMonthlySpending = dailyAverage * daysInMonth;
        console.log(`💰 Current month spent: $${currentMonthSpent}`);
        console.log(`📊 Daily average: $${dailyAverage.toFixed(2)}`);
        console.log(`📈 Projected monthly: $${projectedMonthlySpending.toFixed(2)}`);
        let velocityStatus;
        let daysToOverspend;
        if (userMonthlyBudget) {
            const spendingRatio = projectedMonthlySpending / userMonthlyBudget;
            if (spendingRatio <= 1.0) {
                velocityStatus = "ON_TRACK";
            }
            else if (spendingRatio <= 1.2) {
                velocityStatus = "SLIGHTLY_HIGH";
            }
            else if (spendingRatio <= 1.5) {
                velocityStatus = "HIGH";
            }
            else {
                velocityStatus = "VERY_HIGH";
            }
            if (dailyAverage > 0 && currentMonthSpent < userMonthlyBudget) {
                const remainingBudget = userMonthlyBudget - currentMonthSpent;
                daysToOverspend = Math.floor(remainingBudget / dailyAverage);
            }
        }
        else {
            const lastMonth = new Date(currentYear, currentMonth - 1, 1);
            const lastMonthEnd = new Date(currentYear, currentMonth, 0);
            const lastMonthTransactions = transactions.filter((t) => {
                const transactionDate = new Date(t.date);
                return (transactionDate >= lastMonth &&
                    transactionDate <= lastMonthEnd &&
                    t.type === "EXPENSE");
            });
            const lastMonthSpent = lastMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
            console.log(`📅 Last month spent: $${lastMonthSpent}`);
            if (lastMonthSpent > 0) {
                const spendingRatio = projectedMonthlySpending / lastMonthSpent;
                if (spendingRatio <= 1.1) {
                    velocityStatus = "ON_TRACK";
                }
                else if (spendingRatio <= 1.3) {
                    velocityStatus = "SLIGHTLY_HIGH";
                }
                else if (spendingRatio <= 1.6) {
                    velocityStatus = "HIGH";
                }
                else {
                    velocityStatus = "VERY_HIGH";
                }
            }
            else {
                velocityStatus = "ON_TRACK";
            }
        }
        const remainingDays = daysInMonth - daysElapsed;
        const targetBudget = userMonthlyBudget || projectedMonthlySpending * 0.9;
        const remainingBudget = Math.max(0, targetBudget - currentMonthSpent);
        const recommendedDailySpending = remainingDays > 0 ? remainingBudget / remainingDays : 0;
        console.log(`🎯 Velocity status: ${velocityStatus}`);
        console.log(`💡 Recommended daily spending: $${recommendedDailySpending.toFixed(2)}`);
        return {
            currentMonthSpent,
            daysElapsed,
            daysInMonth,
            dailyAverage,
            projectedMonthlySpending,
            monthlyBudget: userMonthlyBudget,
            velocityStatus,
            daysToOverspend,
            recommendedDailySpending,
        };
    }
    calculateTrends(transactions, startDate, endDate) {
        if (!startDate || !endDate) {
            return [];
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`📊 Calculating trends for ${daysDiff} days (${startDate} to ${endDate})`);
        let periodType;
        if (daysDiff <= 14) {
            periodType = "daily";
        }
        else if (daysDiff <= 84) {
            periodType = "weekly";
        }
        else {
            periodType = "monthly";
        }
        console.log(`📊 Using ${periodType} period type for ${daysDiff} day range`);
        const trends = [];
        if (periodType === "daily") {
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dayStr = d.toISOString().split("T")[0];
                const dayTransactions = transactions.filter((t) => {
                    const transactionDate = new Date(t.date).toISOString().split("T")[0];
                    return transactionDate === dayStr;
                });
                const dayIncome = dayTransactions
                    .filter((t) => t.type === "INCOME")
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                const dayExpenses = dayTransactions
                    .filter((t) => t.type === "EXPENSE")
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                trends.push({
                    month: dayStr,
                    income: dayIncome,
                    expenses: dayExpenses,
                    net: dayIncome - dayExpenses,
                    transactionCount: dayTransactions.length,
                });
            }
        }
        else if (periodType === "weekly") {
            const current = new Date(start);
            while (current <= end) {
                const weekStart = new Date(current);
                const weekEnd = new Date(current);
                weekEnd.setDate(weekEnd.getDate() + 6);
                if (weekEnd > end) {
                    weekEnd.setTime(end.getTime());
                }
                const weekTransactions = transactions.filter((t) => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= weekStart && transactionDate <= weekEnd;
                });
                const weekIncome = weekTransactions
                    .filter((t) => t.type === "INCOME")
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                const weekExpenses = weekTransactions
                    .filter((t) => t.type === "EXPENSE")
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                trends.push({
                    month: weekStart.toISOString().split("T")[0],
                    income: weekIncome,
                    expenses: weekExpenses,
                    net: weekIncome - weekExpenses,
                    transactionCount: weekTransactions.length,
                });
                current.setDate(current.getDate() + 7);
            }
        }
        else {
            const months = new Set();
            console.log(`📅 Start date: ${start.toISOString()}`);
            console.log(`📅 End date: ${end.toISOString()}`);
            const startYear = start.getFullYear();
            const startMonth = start.getMonth();
            const endYear = end.getFullYear();
            const endMonth = end.getMonth();
            for (let year = startYear; year <= endYear; year++) {
                const monthStart = year === startYear ? startMonth : 0;
                const monthEnd = year === endYear ? endMonth : 11;
                for (let month = monthStart; month <= monthEnd; month++) {
                    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
                    months.add(monthStr);
                }
            }
            console.log(`📅 Months generated:`, Array.from(months));
            months.forEach((monthStr) => {
                const monthTransactions = transactions.filter((t) => {
                    const transactionMonth = new Date(t.date)
                        .toISOString()
                        .substring(0, 7);
                    return transactionMonth === monthStr;
                });
                const monthIncome = monthTransactions
                    .filter((t) => t.type === "INCOME")
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                const monthExpenses = monthTransactions
                    .filter((t) => t.type === "EXPENSE")
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                console.log(`📊 Month ${monthStr}: ${monthTransactions.length} transactions, ${monthExpenses} expenses`);
                trends.push({
                    month: monthStr,
                    income: monthIncome,
                    expenses: monthExpenses,
                    net: monthIncome - monthExpenses,
                    transactionCount: monthTransactions.length,
                });
            });
        }
        console.log(`📊 Generated ${trends.length} trend periods:`, trends);
        return trends.sort((a, b) => a.month.localeCompare(b.month));
    }
    calculateAnalytics(transactions, filters = {}, userMonthlyBudget) {
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
            const categoryToUse = transaction.subcategory || transaction.category;
            if (categoryToUse) {
                const categoryId = categoryToUse.id;
                if (!categoryMap.has(categoryId)) {
                    categoryMap.set(categoryId, {
                        categoryId,
                        categoryName: categoryToUse.name,
                        categoryIcon: categoryToUse.icon,
                        categoryColor: categoryToUse.color,
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
        const monthlyTrends = this.calculateTrends(transactions, filters.startDate, filters.endDate);
        const spendingVelocity = this.calculateSpendingVelocity(transactions, userMonthlyBudget);
        return {
            totalIncome: income,
            totalExpenses: expenses,
            netIncome: income - expenses,
            transactionCount,
            averageTransaction,
            categoryBreakdown,
            monthlyTrends,
            spendingVelocity,
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
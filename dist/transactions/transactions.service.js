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
const users_repository_1 = require("../users/repositories/users.repository");
const client_1 = require("@prisma/client");
let TransactionsService = class TransactionsService {
    constructor(transactionsRepository, usersRepository) {
        this.transactionsRepository = transactionsRepository;
        this.usersRepository = usersRepository;
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
        const userProfile = await this.usersRepository.findById(userId);
        const transactions = await this.transactionsRepository.findMany(userId, {
            ...filters,
            limit: 10000,
            offset: 0,
            sortBy: "date",
            sortOrder: "desc",
        });
        return this.calculateAnalytics(transactions, filters, userProfile);
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
    calculateDailyBurnRate(transactions, userProfile) {
        console.log("🔥 Calculating Daily Burn Rate (excluding recurring transactions)");
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        const recentTransactions = transactions.filter((t) => {
            const transactionDate = new Date(t.date);
            return (transactionDate >= sevenDaysAgo &&
                transactionDate <= now &&
                t.type === "EXPENSE" &&
                (t.recurrence === "none" || !t.recurrence));
        });
        const weeklySpending = recentTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const currentDailyBurnRate = weeklySpending / 7;
        console.log(`🔥 Current 7-day discretionary burn rate: $${currentDailyBurnRate.toFixed(2)}/day`);
        console.log(`📊 Excluded ${transactions.filter((t) => new Date(t.date) >= sevenDaysAgo &&
            new Date(t.date) <= now &&
            t.type === "EXPENSE" &&
            t.recurrence &&
            t.recurrence !== "none").length} recurring transactions from burn rate calculation`);
        let sustainableDailyRate = 0;
        let monthlyIncomeCapacity = 0;
        if (userProfile?.income && userProfile?.incomeFrequency) {
            const income = Number(userProfile.income);
            const frequency = userProfile.incomeFrequency;
            switch (frequency) {
                case client_1.IncomeFrequency.WEEKLY:
                    monthlyIncomeCapacity = (income * 52) / 12;
                    break;
                case client_1.IncomeFrequency.FORTNIGHTLY:
                    monthlyIncomeCapacity = (income * 26) / 12;
                    break;
                case client_1.IncomeFrequency.MONTHLY:
                    monthlyIncomeCapacity = income;
                    break;
                default:
                    monthlyIncomeCapacity = income;
            }
            const monthlyRecurringExpenses = this.calculateMonthlyRecurringExpenses(transactions);
            console.log(`💰 Monthly recurring expenses: $${monthlyRecurringExpenses.toFixed(2)}`);
            const userFixedExpenses = Number(userProfile.fixedExpenses) || 0;
            monthlyIncomeCapacity -= userFixedExpenses + monthlyRecurringExpenses;
            sustainableDailyRate = (monthlyIncomeCapacity * 0.8) / 30;
            console.log(`💰 Monthly income capacity after recurring expenses: $${monthlyIncomeCapacity.toFixed(2)}`);
            console.log(`🎯 Sustainable daily discretionary rate: $${sustainableDailyRate.toFixed(2)}/day`);
        }
        const weeklyTrend = [];
        const weeklyTrendWithLabels = [];
        console.log(`📅 Today is: ${now.toLocaleDateString("en-US", { weekday: "long" })}`);
        for (let i = 6; i >= 0; i--) {
            const day = new Date();
            day.setDate(now.getDate() - i);
            const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
            const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
            const daySpending = transactions
                .filter((t) => {
                const transactionDate = new Date(t.date);
                return (transactionDate >= dayStart &&
                    transactionDate < dayEnd &&
                    t.type === "EXPENSE" &&
                    (t.recurrence === "none" || !t.recurrence));
            })
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const dayLabel = day.toLocaleDateString("en-US", { weekday: "short" });
            const isToday = i === 0;
            weeklyTrend.push(daySpending);
            weeklyTrendWithLabels.push({
                day: dayLabel,
                amount: daySpending,
                isToday: isToday,
            });
            console.log(`📊 ${dayLabel} (${day.toISOString().split("T")[0]}): $${daySpending.toFixed(2)} discretionary ${isToday ? "← TODAY" : ""}`);
        }
        const projectedMonthlySpending = currentDailyBurnRate * 30;
        let burnRateStatus;
        let daysUntilBudgetExceeded = null;
        if (sustainableDailyRate > 0) {
            const burnRatio = currentDailyBurnRate / sustainableDailyRate;
            if (burnRatio <= 0.7) {
                burnRateStatus = "LOW";
            }
            else if (burnRatio <= 1.0) {
                burnRateStatus = "NORMAL";
            }
            else if (burnRatio <= 1.5) {
                burnRateStatus = "HIGH";
            }
            else {
                burnRateStatus = "CRITICAL";
            }
            if (currentDailyBurnRate > sustainableDailyRate) {
                const excessDailySpending = currentDailyBurnRate - sustainableDailyRate;
                const remainingDays = Math.floor(monthlyIncomeCapacity / excessDailySpending);
                daysUntilBudgetExceeded = Math.max(0, remainingDays);
            }
        }
        else {
            burnRateStatus = currentDailyBurnRate > 50 ? "HIGH" : "NORMAL";
        }
        const remainingDaysInMonth = 30 - now.getDate();
        const recommendedDailySpending = sustainableDailyRate > 0
            ? Math.min(sustainableDailyRate, sustainableDailyRate * 0.9)
            : currentDailyBurnRate * 0.8;
        console.log(`🚨 Discretionary burn rate status: ${burnRateStatus}`);
        console.log(`📊 Weekly discretionary trend: [${weeklyTrend.map((x) => x.toFixed(0)).join(", ")}]`);
        return {
            currentDailyBurnRate,
            sustainableDailyRate,
            daysUntilBudgetExceeded,
            recommendedDailySpending,
            burnRateStatus,
            weeklyTrend,
            weeklyTrendWithLabels,
            projectedMonthlySpending,
            monthlyIncomeCapacity,
        };
    }
    calculateMonthlyRecurringExpenses(transactions) {
        const now = new Date();
        const lastThreeMonths = new Date();
        lastThreeMonths.setMonth(now.getMonth() - 3);
        const recurringTransactions = transactions.filter((t) => {
            const transactionDate = new Date(t.date);
            return (transactionDate >= lastThreeMonths &&
                transactionDate <= now &&
                t.type === "EXPENSE" &&
                t.recurrence &&
                t.recurrence !== "none");
        });
        console.log(`📊 Found ${recurringTransactions.length} recurring transactions in last 3 months`);
        let monthlyRecurringTotal = 0;
        const recurrenceGroups = {
            weekly: [],
            fortnightly: [],
            monthly: [],
            sixmonths: [],
            yearly: [],
        };
        recurringTransactions.forEach((t) => {
            if (recurrenceGroups[t.recurrence]) {
                recurrenceGroups[t.recurrence].push(t);
            }
        });
        const weeklyMonthly = recurrenceGroups.weekly.reduce((sum, t) => sum + Number(t.amount), 0) *
            (52 / 12);
        const fortnightlyMonthly = recurrenceGroups.fortnightly.reduce((sum, t) => sum + Number(t.amount), 0) *
            (26 / 12);
        const monthlyMonthly = recurrenceGroups.monthly.reduce((sum, t) => sum + Number(t.amount), 0);
        const sixMonthsMonthly = recurrenceGroups.sixmonths.reduce((sum, t) => sum + Number(t.amount), 0) /
            6;
        const yearlyMonthly = recurrenceGroups.yearly.reduce((sum, t) => sum + Number(t.amount), 0) /
            12;
        monthlyRecurringTotal =
            weeklyMonthly +
                fortnightlyMonthly +
                monthlyMonthly +
                sixMonthsMonthly +
                yearlyMonthly;
        console.log(`💰 Monthly recurring breakdown:`, {
            weekly: weeklyMonthly.toFixed(2),
            fortnightly: fortnightlyMonthly.toFixed(2),
            monthly: monthlyMonthly.toFixed(2),
            sixMonths: sixMonthsMonthly.toFixed(2),
            yearly: yearlyMonthly.toFixed(2),
            total: monthlyRecurringTotal.toFixed(2),
        });
        return monthlyRecurringTotal;
    }
    calculateDiscretionaryTrends(transactions, startDate, endDate) {
        if (!startDate || !endDate) {
            return [];
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`📊 Calculating discretionary trends for ${daysDiff} days (${startDate} to ${endDate})`);
        const discretionaryTransactions = transactions.filter((t) => {
            return t.type === "EXPENSE" && (t.recurrence === "none" || !t.recurrence);
        });
        console.log(`📊 Filtered to ${discretionaryTransactions.length} discretionary transactions (excluded recurring)`);
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
        console.log(`📊 Using ${periodType} period type for discretionary trends`);
        const discretionaryTrends = [];
        if (periodType === "daily") {
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dayStr = d.toISOString().split("T")[0];
                const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
                const dayDiscretionaryExpenses = discretionaryTransactions
                    .filter((t) => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= dayStart && transactionDate < dayEnd;
                })
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                console.log(`📊 Discretionary ${dayStr}: $${dayDiscretionaryExpenses.toFixed(2)} (${discretionaryTransactions.filter((t) => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= dayStart && transactionDate < dayEnd;
                }).length} transactions)`);
                discretionaryTrends.push({
                    month: dayStr,
                    discretionaryExpenses: dayDiscretionaryExpenses,
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
                const weekDiscretionaryExpenses = discretionaryTransactions
                    .filter((t) => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= weekStart && transactionDate <= weekEnd;
                })
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                discretionaryTrends.push({
                    month: weekStart.toISOString().split("T")[0],
                    discretionaryExpenses: weekDiscretionaryExpenses,
                });
                current.setDate(current.getDate() + 7);
            }
        }
        else {
            const months = new Set();
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
            months.forEach((monthStr) => {
                const monthDiscretionaryExpenses = discretionaryTransactions
                    .filter((t) => {
                    const transactionMonth = new Date(t.date)
                        .toISOString()
                        .substring(0, 7);
                    return transactionMonth === monthStr;
                })
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                discretionaryTrends.push({
                    month: monthStr,
                    discretionaryExpenses: monthDiscretionaryExpenses,
                });
            });
        }
        console.log(`📊 Generated ${discretionaryTrends.length} discretionary trend periods with totals:`, discretionaryTrends.map((t) => ({
            date: t.month,
            amount: t.discretionaryExpenses,
        })));
        return discretionaryTrends.sort((a, b) => a.month.localeCompare(b.month));
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
        console.log(`💡 Recommended daily spending: ${recommendedDailySpending.toFixed(2)}`);
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
    calculateAnalytics(transactions, filters = {}, userProfile) {
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
        const discretionaryTrends = this.calculateDiscretionaryTrends(transactions, filters.startDate, filters.endDate);
        const enhancedMonthlyTrends = monthlyTrends.map((trend) => {
            const discretionaryTrend = discretionaryTrends.find((dt) => dt.month === trend.month);
            return {
                ...trend,
                discretionaryExpenses: discretionaryTrend?.discretionaryExpenses || 0,
            };
        });
        console.log(`📊 Enhanced monthly trends with discretionary data:`, enhancedMonthlyTrends);
        const spendingVelocity = this.calculateSpendingVelocity(transactions);
        const dailyBurnRate = this.calculateDailyBurnRate(transactions, userProfile);
        return {
            totalIncome: income,
            totalExpenses: expenses,
            netIncome: income - expenses,
            transactionCount,
            averageTransaction,
            categoryBreakdown,
            monthlyTrends: enhancedMonthlyTrends,
            spendingVelocity,
            dailyBurnRate,
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
    __metadata("design:paramtypes", [transactions_repository_1.TransactionsRepository,
        users_repository_1.UsersRepository])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map
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
    async getDiscretionaryBreakdown(userId, filters = {}) {
        console.log("🔍 Getting discretionary breakdown with filters:", filters);
        const now = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setDate(now.getDate() - 30);
        const startDate = filters.startDate || defaultStartDate.toISOString();
        const endDate = filters.endDate || now.toISOString();
        const selectedDate = filters.endDate || now.toISOString().split("T")[0];
        const selectedPeriod = this.determinePeriodType(startDate, endDate);
        console.log(`📅 Discretionary breakdown for: ${selectedDate} (${selectedPeriod})`);
        const transactions = await this.transactionsRepository.findMany(userId, {
            startDate,
            endDate,
            type: client_1.TransactionType.EXPENSE,
            limit: 10000,
            offset: 0,
            sortBy: "date",
            sortOrder: "desc",
        });
        console.log(`📊 Found ${transactions.length} expense transactions in period`);
        const discretionaryTransactions = transactions.filter((t) => {
            return t.recurrence === "none" || !t.recurrence;
        });
        console.log(`📊 Filtered to ${discretionaryTransactions.length} discretionary transactions`);
        const targetTransactions = this.filterTransactionsForPeriod(discretionaryTransactions, selectedDate, selectedPeriod);
        console.log(`📊 Found ${targetTransactions.length} transactions for selected ${selectedPeriod}`);
        const totalDiscretionaryAmount = targetTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        console.log(`💰 Total discretionary spending: $${totalDiscretionaryAmount.toFixed(2)}`);
        const categoryBreakdown = this.calculateCategoryBreakdown(targetTransactions, totalDiscretionaryAmount);
        const mappedTransactions = targetTransactions.map((t) => ({
            id: t.id,
            date: t.date,
            amount: Number(t.amount),
            description: t.description,
            merchant: t.merchantName,
            categoryId: t.category?.id || "unknown",
            categoryName: t.category?.name || "Other",
            subcategoryId: t.subcategory?.id,
            subcategoryName: t.subcategory?.name,
        }));
        const previousPeriod = this.calculatePreviousPeriodComparison(discretionaryTransactions, selectedDate, selectedPeriod);
        const insights = this.generateDiscretionaryInsights(categoryBreakdown, totalDiscretionaryAmount, previousPeriod, selectedPeriod);
        const summary = this.calculateDiscretionarySummary(targetTransactions, categoryBreakdown);
        return {
            selectedDate,
            selectedPeriod,
            totalDiscretionaryAmount,
            transactions: mappedTransactions,
            categoryBreakdown,
            previousPeriod,
            insights,
            summary,
        };
    }
    determinePeriodType(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 1) {
            return "daily";
        }
        else if (daysDiff <= 7) {
            return "weekly";
        }
        else {
            return "monthly";
        }
    }
    filterTransactionsForPeriod(transactions, selectedDate, selectedPeriod) {
        const targetDate = new Date(selectedDate);
        console.log(`🔍 Filtering transactions for ${selectedPeriod} period:`, selectedDate);
        console.log(`🔍 Target date:`, targetDate.toISOString());
        console.log(`🔍 Available transactions:`, transactions.length);
        if (selectedPeriod === "daily") {
            const dayStart = new Date(targetDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(targetDate);
            dayEnd.setHours(23, 59, 59, 999);
            console.log(`🔍 Daily range: ${dayStart.toISOString()} to ${dayEnd.toISOString()}`);
            const filtered = transactions.filter((t) => {
                const transactionDate = new Date(t.date);
                const transactionDateStr = transactionDate.toISOString().split("T")[0];
                const targetDateStr = targetDate.toISOString().split("T")[0];
                const isInRange = transactionDate >= dayStart && transactionDate <= dayEnd;
                const isInDateStr = transactionDateStr === targetDateStr;
                const matches = isInRange || isInDateStr;
                if (!matches) {
                    console.log(`🔍 Transaction ${t.id} (${transactionDate.toISOString()}) is outside range`);
                }
                else {
                    console.log(`✅ Transaction ${t.id} (${transactionDate.toISOString()}) matches`);
                }
                return matches;
            });
            console.log(`🔍 Filtered to ${filtered.length} daily transactions`);
            return filtered;
        }
        else if (selectedPeriod === "weekly") {
            const weekStart = new Date(targetDate);
            weekStart.setDate(targetDate.getDate() - targetDate.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            return transactions.filter((t) => {
                const transactionDate = new Date(t.date);
                return transactionDate >= weekStart && transactionDate <= weekEnd;
            });
        }
        else {
            const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            monthStart.setHours(0, 0, 0, 0);
            const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
            monthEnd.setHours(23, 59, 59, 999);
            return transactions.filter((t) => {
                const transactionDate = new Date(t.date);
                return transactionDate >= monthStart && transactionDate <= monthEnd;
            });
        }
    }
    calculateCategoryBreakdown(transactions, totalAmount) {
        const categoryMap = new Map();
        const defaultCategoryColors = {
            Food: "#FF6B6B",
            Shopping: "#FFB84D",
            Transport: "#4ECDC4",
            Entertainment: "#96CEB4",
            Health: "#FF9FF3",
            Home: "#FECA57",
            Education: "#A8A8A8",
            Travel: "#FF8C42",
            Gifts: "#6C5CE7",
            Coffee: "#FD79A8",
            Clothing: "#FFB84D",
            Groceries: "#FF6B6B",
            Takeout: "#FF6B6B",
            "Take Out": "#FF6B6B",
            Dining: "#FF6B6B",
            Restaurant: "#FF6B6B",
        };
        transactions.forEach((transaction) => {
            const category = transaction.category;
            if (!category)
                return;
            const categoryId = category.id;
            if (!categoryMap.has(categoryId)) {
                const categoryColor = category.color ||
                    defaultCategoryColors[category.name] ||
                    defaultCategoryColors[category.name?.toLowerCase()] ||
                    "#CCCCCC";
                console.log(`🎨 Setting color for category "${category.name}":`, {
                    databaseColor: category.color,
                    fallbackColor: defaultCategoryColors[category.name],
                    finalColor: categoryColor,
                });
                categoryMap.set(categoryId, {
                    categoryId,
                    categoryName: category.name,
                    categoryIcon: category.icon,
                    categoryColor: categoryColor,
                    amount: 0,
                    transactionCount: 0,
                    subcategories: new Map(),
                    transactions: [],
                });
            }
            const categoryData = categoryMap.get(categoryId);
            const amount = Number(transaction.amount);
            categoryData.amount += amount;
            categoryData.transactionCount += 1;
            categoryData.transactions.push({
                id: transaction.id,
                date: transaction.date,
                amount: amount,
                description: transaction.description,
                merchant: transaction.merchantName,
                subcategoryId: transaction.subcategory?.id,
                subcategoryName: transaction.subcategory?.name,
            });
            const subcategoryName = transaction.subcategory?.name ||
                this.matchSubcategory(transaction.description, category.name);
            const uniqueSubcategoryKey = `${subcategoryName}_${transaction.id}`;
            categoryData.subcategories.set(uniqueSubcategoryKey, {
                subcategoryId: transaction.subcategory?.id,
                subcategoryName,
                amount: amount,
                transactionCount: 1,
                percentage: 0,
                transactions: [
                    {
                        id: transaction.id,
                        date: transaction.date,
                        amount: amount,
                        description: transaction.description,
                        merchant: transaction.merchantName,
                    },
                ],
            });
            console.log(`🔍 Created subcategory entry:`, {
                uniqueKey: uniqueSubcategoryKey,
                subcategoryName,
                amount,
                transactionId: transaction.id,
            });
        });
        return Array.from(categoryMap.values())
            .map((category) => {
            const percentage = totalAmount > 0 ? (category.amount / totalAmount) * 100 : 0;
            const subcategories = Array.from(category.subcategories.values())
                .map((sub) => {
                return {
                    subcategoryId: sub.subcategoryId,
                    subcategoryName: sub.subcategoryName,
                    amount: sub.amount,
                    transactionCount: sub.transactionCount,
                    percentage: category.amount > 0 ? (sub.amount / category.amount) * 100 : 0,
                    transactions: sub.transactions,
                };
            })
                .sort((a, b) => b.amount - a.amount);
            console.log(`🏷️ Final category data for "${category.categoryName}":`, {
                categoryColor: category.categoryColor,
                amount: category.amount,
                subcategoriesCount: subcategories.length,
                subcategoryDetails: subcategories.map((sub) => ({
                    name: sub.subcategoryName,
                    amount: sub.amount,
                    transactionCount: sub.transactionCount,
                })),
            });
            return {
                categoryId: category.categoryId,
                categoryName: category.categoryName,
                categoryIcon: category.categoryIcon,
                categoryColor: category.categoryColor,
                amount: category.amount,
                transactionCount: category.transactionCount,
                percentage,
                subcategories,
                transactions: category.transactions,
            };
        })
            .sort((a, b) => b.amount - a.amount);
    }
    matchSubcategory(description, categoryName) {
        const desc = (description || "").toLowerCase();
        const category = categoryName.toLowerCase();
        if (category.includes("food") || category.includes("dining")) {
            if (desc.includes("uber") ||
                desc.includes("doordash") ||
                desc.includes("delivery")) {
                return "Takeout & Delivery";
            }
            if (desc.includes("woolworth") ||
                desc.includes("coles") ||
                desc.includes("supermarket") ||
                desc.includes("grocery")) {
                return "Groceries";
            }
            if (desc.includes("starbucks") ||
                desc.includes("cafe") ||
                desc.includes("coffee")) {
                return "Coffee & Cafes";
            }
            if (desc.includes("restaurant") || desc.includes("dining")) {
                return "Restaurants";
            }
        }
        if (category.includes("transport") || category.includes("car")) {
            if (desc.includes("gas") ||
                desc.includes("petrol") ||
                desc.includes("shell") ||
                desc.includes("bp")) {
                return "Fuel";
            }
            if (desc.includes("uber") ||
                desc.includes("taxi") ||
                desc.includes("rideshare")) {
                return "Rideshare";
            }
            if (desc.includes("parking")) {
                return "Parking";
            }
        }
        if (category.includes("health") || category.includes("medical")) {
            if (desc.includes("chemist") ||
                desc.includes("pharmacy") ||
                desc.includes("medication")) {
                return "Pharmacy";
            }
            if (desc.includes("doctor") ||
                desc.includes("medical") ||
                desc.includes("clinic")) {
                return "Medical Services";
            }
        }
        if (category.includes("entertainment")) {
            if (desc.includes("netflix") ||
                desc.includes("spotify") ||
                desc.includes("subscription")) {
                return "Streaming & Subscriptions";
            }
            if (desc.includes("movie") || desc.includes("cinema")) {
                return "Movies & Cinema";
            }
        }
        return "General";
    }
    calculatePreviousPeriodComparison(allTransactions, selectedDate, selectedPeriod) {
        const targetDate = new Date(selectedDate);
        let previousDate;
        if (selectedPeriod === "daily") {
            previousDate = new Date(targetDate);
            previousDate.setDate(targetDate.getDate() - 1);
        }
        else if (selectedPeriod === "weekly") {
            previousDate = new Date(targetDate);
            previousDate.setDate(targetDate.getDate() - 7);
        }
        else {
            previousDate = new Date(targetDate);
            previousDate.setMonth(targetDate.getMonth() - 1);
        }
        const previousTransactions = this.filterTransactionsForPeriod(allTransactions, previousDate.toISOString().split("T")[0], selectedPeriod);
        const previousAmount = previousTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const currentAmount = this.filterTransactionsForPeriod(allTransactions, selectedDate, selectedPeriod).reduce((sum, t) => sum + Number(t.amount), 0);
        const percentageChange = previousAmount > 0
            ? ((currentAmount - previousAmount) / previousAmount) * 100
            : 0;
        const previousCategoryBreakdown = this.calculateCategoryBreakdown(previousTransactions, previousAmount);
        const topCategories = previousCategoryBreakdown.slice(0, 3).map((cat) => ({
            categoryName: cat.categoryName,
            amount: cat.amount,
        }));
        return {
            date: previousDate.toISOString().split("T")[0],
            totalDiscretionaryAmount: previousAmount,
            percentageChange,
            topCategories,
        };
    }
    generateDiscretionaryInsights(categoryBreakdown, totalAmount, previousPeriod, selectedPeriod) {
        const insights = [];
        if (categoryBreakdown.length > 0) {
            const topCategory = categoryBreakdown[0];
            if (topCategory.percentage > 40) {
                insights.push({
                    type: "warning",
                    category: topCategory.categoryName,
                    title: "High Category Concentration",
                    message: `${topCategory.categoryName} accounts for ${topCategory.percentage.toFixed(1)}% of your discretionary spending.`,
                    suggestion: "Consider diversifying your spending or setting a specific budget for this category.",
                    amount: topCategory.amount,
                });
            }
        }
        if (previousPeriod && previousPeriod.totalDiscretionaryAmount > 0) {
            const changePercent = Math.abs(previousPeriod.percentageChange);
            if (changePercent > 20) {
                insights.push({
                    type: previousPeriod.percentageChange > 0 ? "warning" : "success",
                    title: `${selectedPeriod === "daily" ? "Daily" : selectedPeriod === "weekly" ? "Weekly" : "Monthly"} Spending Change`,
                    message: `Your discretionary spending has ${previousPeriod.percentageChange > 0 ? "increased" : "decreased"} by ${changePercent.toFixed(1)}% compared to the previous ${selectedPeriod}.`,
                    suggestion: previousPeriod.percentageChange > 0
                        ? "Consider reviewing your recent purchases to identify areas for reduction."
                        : "Great job managing your discretionary spending!",
                });
            }
        }
        const totalTransactions = categoryBreakdown.reduce((sum, cat) => sum + cat.transactionCount, 0);
        if (selectedPeriod === "daily" && totalTransactions > 5) {
            insights.push({
                type: "info",
                title: "High Transaction Frequency",
                message: `You made ${totalTransactions} discretionary purchases today.`,
                suggestion: "Consider consolidating purchases or planning ahead to reduce transaction frequency.",
            });
        }
        const averageTransaction = totalAmount / Math.max(totalTransactions, 1);
        if (averageTransaction < 10 && totalTransactions > 3) {
            insights.push({
                type: "info",
                title: "Frequent Small Purchases",
                message: `Your average transaction is $${averageTransaction.toFixed(2)} with ${totalTransactions} purchases.`,
                suggestion: "Small purchases can add up quickly. Consider tracking them more closely.",
            });
        }
        return insights;
    }
    calculateDiscretionarySummary(transactions, categoryBreakdown) {
        const transactionCount = transactions.length;
        const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const averageTransactionAmount = transactionCount > 0 ? totalAmount / transactionCount : 0;
        const largestTransaction = transactions.reduce((largest, current) => {
            return Number(current.amount) > Number(largest.amount)
                ? current
                : largest;
        }, transactions[0] || { amount: 0, description: "", category: { name: "" } });
        const topSpendingCategory = categoryBreakdown[0] || {
            categoryName: "",
            amount: 0,
            percentage: 0,
        };
        const spendingDistribution = {
            morning: 0,
            afternoon: 0,
            evening: 0,
            night: 0,
        };
        transactions.forEach((t) => {
            const hour = new Date(t.date).getHours();
            const amount = Number(t.amount);
            if (hour >= 6 && hour < 12) {
                spendingDistribution.morning += amount;
            }
            else if (hour >= 12 && hour < 18) {
                spendingDistribution.afternoon += amount;
            }
            else if (hour >= 18 && hour < 24) {
                spendingDistribution.evening += amount;
            }
            else {
                spendingDistribution.night += amount;
            }
        });
        return {
            transactionCount,
            averageTransactionAmount,
            largestTransaction: {
                id: largestTransaction.id,
                amount: Number(largestTransaction.amount),
                description: largestTransaction.description,
                categoryName: largestTransaction.category?.name || "Other",
            },
            topSpendingCategory: {
                categoryName: topSpendingCategory.categoryName,
                amount: topSpendingCategory.amount,
                percentage: topSpendingCategory.percentage,
            },
            spendingDistribution,
        };
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
            const userFixedExpenses = Number(userProfile.fixedExpenses) || 0;
            monthlyIncomeCapacity -= userFixedExpenses + monthlyRecurringExpenses;
            sustainableDailyRate = (monthlyIncomeCapacity * 0.8) / 30;
        }
        const weeklyTrend = [];
        const weeklyTrendWithLabels = [];
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
        const recommendedDailySpending = sustainableDailyRate > 0
            ? Math.min(sustainableDailyRate, sustainableDailyRate * 0.9)
            : currentDailyBurnRate * 0.8;
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
        return monthlyRecurringTotal;
    }
    calculateDiscretionaryTrends(transactions, startDate, endDate) {
        if (!startDate || !endDate) {
            return [];
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const discretionaryTransactions = transactions.filter((t) => {
            return t.type === "EXPENSE" && (t.recurrence === "none" || !t.recurrence);
        });
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
        const currentMonthTransactions = transactions.filter((t) => {
            const transactionDate = new Date(t.date);
            return (transactionDate >= monthStart &&
                transactionDate <= now &&
                t.type === "EXPENSE");
        });
        const currentMonthSpent = currentMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const dailyAverage = daysElapsed > 0 ? currentMonthSpent / daysElapsed : 0;
        const projectedMonthlySpending = dailyAverage * daysInMonth;
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
                trends.push({
                    month: monthStr,
                    income: monthIncome,
                    expenses: monthExpenses,
                    net: monthIncome - monthExpenses,
                    transactionCount: monthTransactions.length,
                });
            });
        }
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
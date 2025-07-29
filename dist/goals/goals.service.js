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
exports.GoalsService = void 0;
const common_1 = require("@nestjs/common");
const goals_repository_1 = require("./repositories/goals.repository");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
let GoalsService = class GoalsService {
    constructor(goalsRepository) {
        this.goalsRepository = goalsRepository;
    }
    async createGoal(userId, createGoalDto) {
        let initialCurrentAmount = createGoalDto.currentAmount || 0;
        if (createGoalDto.type === "DEBT_PAYOFF" &&
            createGoalDto.currentAmount === undefined) {
            initialCurrentAmount = createGoalDto.targetAmount;
        }
        const goalData = {
            ...createGoalDto,
            currentAmount: initialCurrentAmount,
            targetDate: createGoalDto.targetDate
                ? new Date(createGoalDto.targetDate)
                : null,
            user: {
                connect: { id: userId },
            },
        };
        const goal = await this.goalsRepository.create(goalData);
        const goalWithIncludes = await this.goalsRepository.findByIdWithIncludes(goal.id, this.getGoalIncludes());
        return this.transformGoalToResponse(goalWithIncludes);
    }
    async getGoals(userId, filters) {
        const where = this.buildGoalFilters(userId, filters);
        const orderBy = this.buildOrderBy(filters.sortBy, filters.sortOrder);
        const [goals, total] = await Promise.all([
            this.goalsRepository.findManyWithFilters(where, this.getGoalIncludes(), orderBy, ((filters.page || 1) - 1) * (filters.limit || 10), filters.limit || 10),
            this.goalsRepository.count(where),
        ]);
        const transformedGoals = goals.map((goal) => this.transformGoalToResponse(goal));
        const summary = await this.getGoalsSummary(userId);
        return {
            goals: transformedGoals,
            summary,
            pagination: {
                total,
                page: filters.page || 1,
                limit: filters.limit || 10,
                totalPages: Math.ceil(total / (filters.limit || 10)),
            },
        };
    }
    async getGoalById(userId, goalId) {
        const goal = await this.goalsRepository.findByUserAndGoalId(userId, goalId);
        if (!goal) {
            throw new common_1.NotFoundException("Goal not found");
        }
        const goalWithIncludes = await this.goalsRepository.findByIdWithIncludes(goalId, this.getGoalIncludes());
        return this.transformGoalToResponse(goalWithIncludes);
    }
    async updateGoal(userId, goalId, updateGoalDto) {
        const existingGoal = await this.goalsRepository.findByUserAndGoalId(userId, goalId);
        if (!existingGoal) {
            throw new common_1.NotFoundException("Goal not found");
        }
        const updateData = {
            ...updateGoalDto,
            targetDate: updateGoalDto.targetDate
                ? new Date(updateGoalDto.targetDate)
                : undefined,
        };
        if (updateGoalDto.isCompleted && !existingGoal.isCompleted) {
            updateData.completedAt = new Date();
            if (existingGoal.type === "DEBT_PAYOFF") {
                updateData.currentAmount = 0;
            }
            else {
                updateData.currentAmount = existingGoal.targetAmount;
            }
        }
        else if (existingGoal.type === "DEBT_PAYOFF" &&
            updateGoalDto.currentAmount !== undefined) {
            const newCurrentAmount = updateGoalDto.currentAmount;
            if (newCurrentAmount <= 0 && !existingGoal.isCompleted) {
                updateData.isCompleted = true;
                updateData.completedAt = new Date();
                updateData.currentAmount = 0;
            }
        }
        else if (existingGoal.type !== "DEBT_PAYOFF" &&
            updateGoalDto.currentAmount !== undefined) {
            const newCurrentAmount = updateGoalDto.currentAmount;
            if (newCurrentAmount >= existingGoal.targetAmount.toNumber() &&
                !existingGoal.isCompleted) {
                updateData.isCompleted = true;
                updateData.completedAt = new Date();
            }
        }
        const goal = await this.goalsRepository.updateWithIncludes(goalId, updateData, this.getGoalIncludes());
        return this.transformGoalToResponse(goal);
    }
    async deleteGoal(userId, goalId) {
        const goal = await this.goalsRepository.findByUserAndGoalId(userId, goalId);
        if (!goal) {
            throw new common_1.NotFoundException("Goal not found");
        }
        await this.goalsRepository.delete(goalId);
    }
    async addContribution(userId, goalId, createContributionDto) {
        const goal = await this.goalsRepository.findByUserAndGoalId(userId, goalId);
        if (!goal) {
            throw new common_1.NotFoundException("Goal not found");
        }
        if (goal.isCompleted) {
            throw new common_1.BadRequestException("Cannot add contributions to completed goal");
        }
        const contributionData = {
            ...createContributionDto,
            date: createContributionDto.date
                ? new Date(createContributionDto.date)
                : new Date(),
            goal: {
                connect: { id: goalId },
            },
            user: {
                connect: { id: userId },
            },
            transaction: createContributionDto.transactionId
                ? {
                    connect: { id: createContributionDto.transactionId },
                }
                : undefined,
        };
        const contribution = await this.goalsRepository.createContribution(contributionData);
        let newCurrentAmount;
        let isNowCompleted;
        if (goal.type === "DEBT_PAYOFF") {
            newCurrentAmount =
                goal.currentAmount.toNumber() - createContributionDto.amount;
            isNowCompleted = newCurrentAmount <= 0;
            if (newCurrentAmount < 0) {
                newCurrentAmount = 0;
            }
        }
        else {
            if (createContributionDto.type === client_1.ContributionType.WITHDRAWAL) {
                newCurrentAmount =
                    goal.currentAmount.toNumber() - createContributionDto.amount;
                if (newCurrentAmount < 0) {
                    newCurrentAmount = 0;
                }
                isNowCompleted = false;
            }
            else {
                newCurrentAmount =
                    goal.currentAmount.toNumber() + createContributionDto.amount;
                isNowCompleted = newCurrentAmount >= goal.targetAmount.toNumber();
            }
        }
        await this.goalsRepository.update(goalId, {
            currentAmount: newCurrentAmount,
            isCompleted: isNowCompleted,
            completedAt: isNowCompleted ? new Date() : null,
        });
        return {
            id: contribution.id,
            amount: contribution.amount.toNumber(),
            currency: contribution.currency,
            date: contribution.date,
            description: contribution.description,
            type: contribution.type,
            transactionId: contribution.transactionId,
        };
    }
    async getGoalContributions(userId, goalId, startDate, endDate) {
        const goal = await this.goalsRepository.findByUserAndGoalId(userId, goalId);
        if (!goal) {
            throw new common_1.NotFoundException("Goal not found");
        }
        const contributions = await this.goalsRepository.findContributionsByUserAndGoal(userId, goalId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return contributions.map((contribution) => ({
            id: contribution.id,
            amount: contribution.amount.toNumber(),
            currency: contribution.currency,
            date: contribution.date,
            description: contribution.description,
            type: contribution.type,
            transactionId: contribution.transactionId,
        }));
    }
    async getGoalAnalytics(userId, goalId) {
        const goal = await this.goalsRepository.findByUserAndGoalId(userId, goalId);
        if (!goal) {
            throw new common_1.NotFoundException("Goal not found");
        }
        const goalWithContributions = await this.goalsRepository.getGoalWithContributions(goalId);
        const currentAmount = goalWithContributions.currentAmount.toNumber();
        const targetAmount = goalWithContributions.targetAmount.toNumber();
        const progressPercentage = (currentAmount / targetAmount) * 100;
        const monthlyProgress = this.calculateMonthlyProgress(goalWithContributions.contributions);
        const averageMonthlyContribution = this.calculateAverageMonthlyContribution(goalWithContributions.contributions);
        const requiredMonthlyContribution = goalWithContributions.targetDate
            ? Math.max(0, (targetAmount - currentAmount) /
                Math.max(1, (0, date_fns_1.differenceInMonths)(goalWithContributions.targetDate, new Date())))
            : undefined;
        const projectedCompletion = this.calculateProjectedCompletion(currentAmount, targetAmount, averageMonthlyContribution);
        const contributionSources = this.calculateContributionSources(goalWithContributions.contributions);
        const milestones = this.calculateMilestones(targetAmount, currentAmount, goalWithContributions.contributions);
        return {
            goalId: goalWithContributions.id,
            goalName: goalWithContributions.name,
            currentAmount,
            targetAmount,
            progressPercentage,
            monthlyProgress,
            projectedCompletion,
            requiredMonthlyContribution,
            averageMonthlyContribution,
            isOnTrack: requiredMonthlyContribution
                ? averageMonthlyContribution >= requiredMonthlyContribution
                : true,
            contributionSources,
            milestones,
        };
    }
    async generateSmartSuggestions(userId) {
        const user = await this.goalsRepository.getUserWithIncome(userId);
        const existingGoals = await this.goalsRepository.findActiveByUserId(userId);
        const transactions = await this.goalsRepository.getRecentTransactionsByUserId(userId, 90);
        const suggestions = [];
        const insights = [];
        const hasEmergencyFund = existingGoals.some((goal) => goal.category === client_1.GoalCategory.EMERGENCY_FUND);
        if (!hasEmergencyFund) {
            const emergencySuggestion = await this.generateEmergencyFundSuggestion(transactions, user?.income?.toNumber());
            suggestions.push(emergencySuggestion);
            insights.push("You have no emergency fund. This should be your top priority.");
        }
        const spendingLimitSuggestions = this.generateSpendingLimitSuggestions(transactions);
        suggestions.push(...spendingLimitSuggestions);
        const monthlyExpenses = this.calculateAverageMonthlyExpenses(transactions);
        const userContext = {
            hasEmergencyFund,
            monthlyIncome: user?.income?.toNumber(),
            averageMonthlyExpenses: monthlyExpenses,
            totalActiveGoals: existingGoals.length,
            currentSavingsRate: user?.income
                ? ((user.income.toNumber() - monthlyExpenses) /
                    user.income.toNumber()) *
                    100
                : undefined,
        };
        return {
            suggestions,
            insights,
            userContext,
        };
    }
    getGoalIncludes() {
        return {
            contributions: {
                orderBy: {
                    date: "desc",
                },
                take: 1,
            },
            _count: {
                select: {
                    contributions: true,
                },
            },
        };
    }
    buildGoalFilters(userId, filters) {
        const where = { userId };
        if (filters.category)
            where.category = filters.category;
        if (filters.type)
            where.type = filters.type;
        if (filters.priority)
            where.priority = filters.priority;
        if (filters.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters.isCompleted !== undefined)
            where.isCompleted = filters.isCompleted;
        if (filters.targetDateFrom || filters.targetDateTo) {
            where.targetDate = {};
            if (filters.targetDateFrom)
                where.targetDate.gte = new Date(filters.targetDateFrom);
            if (filters.targetDateTo)
                where.targetDate.lte = new Date(filters.targetDateTo);
        }
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
            ];
        }
        if (!filters.includeArchived) {
            where.isActive = true;
        }
        return where;
    }
    buildOrderBy(sortBy, sortOrder) {
        const order = sortOrder === "asc" ? "asc" : "desc";
        switch (sortBy) {
            case "name":
                return { name: order };
            case "targetAmount":
                return { targetAmount: order };
            case "targetDate":
                return { targetDate: order };
            case "priority":
                return { priority: order };
            default:
                return { createdAt: order };
        }
    }
    transformGoalToResponse(goal) {
        const currentAmount = goal.currentAmount.toNumber();
        const targetAmount = goal.targetAmount.toNumber();
        const progressPercentage = (currentAmount / targetAmount) * 100;
        const remainingAmount = Math.max(0, targetAmount - currentAmount);
        const monthsRemaining = goal.targetDate
            ? (0, date_fns_1.differenceInMonths)(goal.targetDate, new Date())
            : undefined;
        const requiredMonthlyContribution = monthsRemaining && monthsRemaining > 0
            ? remainingAmount / monthsRemaining
            : undefined;
        const totalContributions = currentAmount;
        const contributionCount = goal._count?.contributions || 0;
        const averageMonthlyContribution = contributionCount > 0
            ? totalContributions / Math.max(1, contributionCount)
            : 0;
        const isOnTrack = goal.monthlyTarget
            ? averageMonthlyContribution >= goal.monthlyTarget.toNumber()
            : true;
        return {
            id: goal.id,
            name: goal.name,
            description: goal.description,
            targetAmount,
            currentAmount,
            currency: goal.currency,
            targetDate: goal.targetDate,
            category: goal.category,
            originalCategory: goal.originalCategory,
            type: goal.type,
            priority: goal.priority,
            isActive: goal.isActive,
            isCompleted: goal.isCompleted,
            completedAt: goal.completedAt,
            autoContribute: goal.autoContribute,
            monthlyTarget: goal.monthlyTarget?.toNumber(),
            createdAt: goal.createdAt,
            updatedAt: goal.updatedAt,
            progressPercentage,
            remainingAmount,
            monthsRemaining,
            requiredMonthlyContribution,
            isOnTrack,
            analytics: {
                totalContributions,
                averageMonthlyContribution,
                contributionCount,
                lastContribution: goal.contributions?.[0]
                    ? {
                        amount: goal.contributions[0].amount.toNumber(),
                        date: goal.contributions[0].date,
                        type: goal.contributions[0].type,
                    }
                    : undefined,
            },
        };
    }
    async getGoalsSummary(userId) {
        const summaryData = await this.goalsRepository.getGoalsSummaryByUserId(userId);
        const overallProgress = summaryData.totalTargetAmount > 0
            ? (summaryData.totalCurrentAmount / summaryData.totalTargetAmount) * 100
            : 0;
        return {
            ...summaryData,
            overallProgress,
        };
    }
    calculateMonthlyProgress(contributions) {
        const monthlyContributions = new Map();
        let cumulativeAmount = 0;
        contributions.forEach((contribution) => {
            const month = (0, date_fns_1.format)(contribution.date, "yyyy-MM");
            const amount = contribution.amount.toNumber();
            monthlyContributions.set(month, (monthlyContributions.get(month) || 0) + amount);
        });
        return Array.from(monthlyContributions.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, contributed]) => {
            cumulativeAmount += contributed;
            return {
                month,
                contributed,
                cumulativeAmount,
            };
        });
    }
    calculateAverageMonthlyContribution(contributions) {
        if (contributions.length === 0)
            return 0;
        const totalAmount = contributions.reduce((sum, c) => sum + c.amount.toNumber(), 0);
        const firstContribution = contributions[0];
        const lastContribution = contributions[contributions.length - 1];
        if (!firstContribution || !lastContribution)
            return 0;
        const monthsSpan = Math.max(1, (0, date_fns_1.differenceInMonths)(lastContribution.date, firstContribution.date) + 1);
        return totalAmount / monthsSpan;
    }
    calculateProjectedCompletion(currentAmount, targetAmount, averageMonthlyContribution) {
        if (averageMonthlyContribution <= 0)
            return undefined;
        const remainingAmount = targetAmount - currentAmount;
        const monthsToComplete = Math.ceil(remainingAmount / averageMonthlyContribution);
        const completion = new Date();
        completion.setMonth(completion.getMonth() + monthsToComplete);
        return completion;
    }
    calculateContributionSources(contributions) {
        const sources = new Map();
        const totalAmount = contributions.reduce((sum, c) => sum + c.amount.toNumber(), 0);
        contributions.forEach((contribution) => {
            const type = contribution.type;
            const amount = contribution.amount.toNumber();
            sources.set(type, (sources.get(type) || 0) + amount);
        });
        return Array.from(sources.entries()).map(([type, amount]) => ({
            type,
            amount,
            percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        }));
    }
    calculateMilestones(targetAmount, currentAmount, contributions) {
        const milestonePercentages = [25, 50, 75, 90, 100];
        return milestonePercentages.map((percentage) => {
            const milestoneAmount = (targetAmount * percentage) / 100;
            const achievedContribution = contributions.find((c) => c.amount.toNumber() >= milestoneAmount);
            return {
                percentage,
                amount: milestoneAmount,
                achievedAt: achievedContribution?.date,
                projectedDate: currentAmount < milestoneAmount
                    ? this.calculateProjectedCompletion(currentAmount, milestoneAmount, this.calculateAverageMonthlyContribution(contributions))
                    : undefined,
            };
        });
    }
    async generateEmergencyFundSuggestion(transactions, income) {
        const monthlyExpenses = this.calculateAverageMonthlyExpenses(transactions);
        const recommendedAmount = monthlyExpenses * 6;
        const suggestedMonthlyContribution = income
            ? Math.min(income * 0.1, recommendedAmount / 24)
            : recommendedAmount / 24;
        return {
            id: "emergency_fund_suggestion",
            type: client_1.GoalCategory.EMERGENCY_FUND,
            priority: "HIGH",
            suggestedAmount: recommendedAmount,
            suggestedMonthlyContribution,
            suggestedTimeline: 24,
            reasoning: `Based on your average monthly expenses of $${monthlyExpenses.toFixed(2)}, we recommend 6 months of emergency savings.`,
            basedOnSpending: {
                averageMonthlyExpenses: monthlyExpenses,
                categoryBreakdown: {
                    essentials: monthlyExpenses * 0.8,
                    discretionary: monthlyExpenses * 0.2,
                },
            },
            autoCreateGoal: {
                name: "Emergency Fund",
                description: "6 months of essential expenses for financial security",
                targetAmount: recommendedAmount,
                category: client_1.GoalCategory.EMERGENCY_FUND,
                type: client_1.GoalType.SAVINGS,
                monthlyTarget: suggestedMonthlyContribution,
            },
        };
    }
    generateSpendingLimitSuggestions(transactions) {
        const categorySpending = new Map();
        transactions.forEach((transaction) => {
            if (transaction.type === "EXPENSE" && transaction.category) {
                const key = transaction.category.name;
                const current = categorySpending.get(key) || {
                    total: 0,
                    count: 0,
                    category: transaction.category.name,
                };
                current.total += transaction.amount.toNumber();
                current.count += 1;
                categorySpending.set(key, current);
            }
        });
        const suggestions = [];
        const monthlyDivisor = 3;
        categorySpending.forEach((data, categoryName) => {
            const monthlyAverage = data.total / monthlyDivisor;
            if (monthlyAverage > 200 && data.count > 5) {
                const suggestedLimit = monthlyAverage * 0.8;
                const potentialSavings = monthlyAverage - suggestedLimit;
                suggestions.push({
                    id: `spending_limit_${categoryName.toLowerCase().replace(/\s+/g, "_")}`,
                    type: client_1.GoalCategory.OTHER,
                    priority: "MEDIUM",
                    suggestedAmount: suggestedLimit,
                    reasoning: `You spent $${monthlyAverage.toFixed(2)} on ${categoryName} last month. Consider setting a $${suggestedLimit.toFixed(2)} monthly limit to save $${potentialSavings.toFixed(2)}.`,
                    basedOnSpending: {
                        category: categoryName,
                        lastMonthSpending: monthlyAverage,
                        averageSpending: monthlyAverage,
                        potentialSavings,
                    },
                    autoCreateGoal: {
                        name: `${categoryName} Spending Limit`,
                        description: `Monthly spending limit for ${categoryName} category`,
                        targetAmount: suggestedLimit,
                        category: client_1.GoalCategory.OTHER,
                        type: client_1.GoalType.SPENDING_LIMIT,
                        monthlyTarget: suggestedLimit,
                    },
                });
            }
        });
        return suggestions.slice(0, 3);
    }
    calculateAverageMonthlyExpenses(transactions) {
        const expenseTransactions = transactions.filter((t) => t.type === "EXPENSE");
        const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
        return totalExpenses / 3;
    }
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [goals_repository_1.GoalsRepository])
], GoalsService);
//# sourceMappingURL=goals.service.js.map
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
exports.BudgetsService = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const budgets_repository_1 = require("./repositories/budgets.repository");
const budget_analytics_dto_1 = require("./dto/budget-analytics.dto");
let BudgetsService = class BudgetsService {
    constructor(budgetsRepository) {
        this.budgetsRepository = budgetsRepository;
    }
    async createBudget(userId, createBudgetDto) {
        const startDate = new Date(createBudgetDto.startDate);
        const endDate = createBudgetDto.endDate
            ? new Date(createBudgetDto.endDate)
            : null;
        if (endDate && endDate <= startDate) {
            throw new common_1.BadRequestException("End date must be after start date");
        }
        const budget = await this.budgetsRepository.create(userId, createBudgetDto);
        return this.enrichBudgetWithAnalytics(budget);
    }
    async getUserBudgets(userId, page = 1, limit = 10) {
        const result = await this.budgetsRepository.findByUserId(userId, page, limit);
        const enrichedBudgets = await Promise.all(result.data.map((budget) => this.enrichBudgetWithAnalytics(budget)));
        return {
            ...result,
            data: enrichedBudgets,
        };
    }
    async getBudgetById(id, userId) {
        const budget = await this.budgetsRepository.findByIdAndUserId(id, userId);
        if (!budget) {
            throw new common_1.NotFoundException("Budget not found");
        }
        return this.enrichBudgetWithAnalytics(budget);
    }
    async updateBudget(id, userId, updateBudgetDto) {
        const existingBudget = await this.budgetsRepository.findByIdAndUserId(id, userId);
        if (!existingBudget) {
            throw new common_1.NotFoundException("Budget not found");
        }
        if (updateBudgetDto.startDate || updateBudgetDto.endDate) {
            const startDate = updateBudgetDto.startDate
                ? new Date(updateBudgetDto.startDate)
                : existingBudget.startDate;
            const endDate = updateBudgetDto.endDate
                ? new Date(updateBudgetDto.endDate)
                : existingBudget.endDate;
            if (endDate && endDate <= startDate) {
                throw new common_1.BadRequestException("End date must be after start date");
            }
        }
        const updatedBudget = await this.budgetsRepository.update(id, userId, updateBudgetDto);
        return this.enrichBudgetWithAnalytics(updatedBudget);
    }
    async deleteBudget(id, userId) {
        const budget = await this.budgetsRepository.findByIdAndUserId(id, userId);
        if (!budget) {
            throw new common_1.NotFoundException("Budget not found");
        }
        if (budget._count.transactions > 0) {
            throw new common_1.BadRequestException("Cannot delete budget with existing transactions. Archive it instead.");
        }
        await this.budgetsRepository.delete(id, userId);
    }
    async getBudgetAnalytics(id, userId) {
        const analyticsData = await this.budgetsRepository.getBudgetAnalytics(id, userId);
        if (!analyticsData) {
            throw new common_1.NotFoundException("Budget not found");
        }
        const { budget, spentAmount, categoryBreakdown, spendingTrend } = analyticsData;
        const totalAmount = parseFloat(budget.totalAmount.toString());
        const remainingAmount = totalAmount - spentAmount;
        const spentPercentage = totalAmount > 0 ? (spentAmount / totalAmount) * 100 : 0;
        const now = new Date();
        const startDate = budget.startDate;
        const endDate = budget.endDate || now;
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const dailyBudget = totalDays > 0 ? totalAmount / totalDays : 0;
        const dailyAverageSpending = elapsedDays > 0 ? spentAmount / elapsedDays : 0;
        const projectedTotalSpending = dailyAverageSpending * totalDays;
        const isOverBudget = spentAmount > totalAmount;
        const isOnTrack = projectedTotalSpending <= totalAmount;
        const analytics = {
            budgetId: budget.id,
            budgetName: budget.name,
            totalAmount,
            spentAmount,
            remainingAmount,
            spentPercentage: Math.round(spentPercentage * 100) / 100,
            transactionCount: budget.transactions.length,
            daysTotal: totalDays,
            daysElapsed: elapsedDays,
            daysRemaining: remainingDays,
            dailyBudget: Math.round(dailyBudget * 100) / 100,
            dailyAverageSpending: Math.round(dailyAverageSpending * 100) / 100,
            projectedTotalSpending: Math.round(projectedTotalSpending * 100) / 100,
            isOverBudget,
            isOnTrack,
            categoryBreakdown,
            spendingTrend,
        };
        return (0, class_transformer_1.plainToInstance)(budget_analytics_dto_1.BudgetAnalyticsDto, analytics, {
            excludeExtraneousValues: true,
        });
    }
    async enrichBudgetWithAnalytics(budget) {
        const expenseTransactions = budget.transactions?.filter((t) => t.type === "EXPENSE") || [];
        const spentAmount = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
        const totalAmount = parseFloat(budget.totalAmount.toString());
        const remainingAmount = totalAmount - spentAmount;
        const spentPercentage = totalAmount > 0 ? (spentAmount / totalAmount) * 100 : 0;
        const now = new Date();
        const endDate = budget.endDate;
        const daysRemaining = endDate
            ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : null;
        const enrichedBudget = {
            ...budget,
            spentAmount,
            remainingAmount,
            spentPercentage: Math.round(spentPercentage * 100) / 100,
            transactionCount: budget._count?.transactions || 0,
            daysRemaining,
            isOverBudget: spentAmount > totalAmount,
        };
        return enrichedBudget;
    }
};
exports.BudgetsService = BudgetsService;
exports.BudgetsService = BudgetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [budgets_repository_1.BudgetsRepository])
], BudgetsService);
//# sourceMappingURL=budgets.service.js.map
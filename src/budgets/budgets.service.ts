import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { BudgetsRepository } from "./repositories/budgets.repository";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { BudgetDto } from "./dto/budget.dto";
import { BudgetAnalyticsDto } from "./dto/budget-analytics.dto";

@Injectable()
export class BudgetsService {
  constructor(private readonly budgetsRepository: BudgetsRepository) {}

  async createBudget(
    userId: string,
    createBudgetDto: CreateBudgetDto,
  ): Promise<BudgetDto> {
    // Validate date range
    const startDate = new Date(createBudgetDto.startDate);
    const endDate = createBudgetDto.endDate
      ? new Date(createBudgetDto.endDate)
      : null;

    if (endDate && endDate <= startDate) {
      throw new BadRequestException("End date must be after start date");
    }

    const budget = await this.budgetsRepository.create(userId, createBudgetDto);
    return this.enrichBudgetWithAnalytics(budget);
  }

  async getUserBudgets(userId: string, page: number = 1, limit: number = 10) {
    const result = await this.budgetsRepository.findByUserId(
      userId,
      page,
      limit,
    );

    const enrichedBudgets = await Promise.all(
      result.data.map((budget) => this.enrichBudgetWithAnalytics(budget)),
    );

    return {
      ...result,
      data: enrichedBudgets,
    };
  }

  async getBudgetById(id: string, userId: string): Promise<BudgetDto> {
    const budget = await this.budgetsRepository.findByIdAndUserId(id, userId);

    if (!budget) {
      throw new NotFoundException("Budget not found");
    }

    return this.enrichBudgetWithAnalytics(budget);
  }

  async updateBudget(
    id: string,
    userId: string,
    updateBudgetDto: UpdateBudgetDto,
  ): Promise<BudgetDto> {
    // Check if budget exists and belongs to user
    const existingBudget = await this.budgetsRepository.findByIdAndUserId(
      id,
      userId,
    );
    if (!existingBudget) {
      throw new NotFoundException("Budget not found");
    }

    // Validate date range if both dates are provided
    if (updateBudgetDto.startDate || updateBudgetDto.endDate) {
      const startDate = updateBudgetDto.startDate
        ? new Date(updateBudgetDto.startDate)
        : existingBudget.startDate;
      const endDate = updateBudgetDto.endDate
        ? new Date(updateBudgetDto.endDate)
        : existingBudget.endDate;

      if (endDate && endDate <= startDate) {
        throw new BadRequestException("End date must be after start date");
      }
    }

    const updatedBudget = await this.budgetsRepository.update(
      id,
      userId,
      updateBudgetDto,
    );
    return this.enrichBudgetWithAnalytics(updatedBudget);
  }

  async deleteBudget(id: string, userId: string): Promise<void> {
    const budget = await this.budgetsRepository.findByIdAndUserId(id, userId);

    if (!budget) {
      throw new NotFoundException("Budget not found");
    }

    // Check if budget has transactions
    if (budget._count.transactions > 0) {
      throw new BadRequestException(
        "Cannot delete budget with existing transactions. Archive it instead.",
      );
    }

    await this.budgetsRepository.delete(id, userId);
  }

  async getBudgetAnalytics(
    id: string,
    userId: string,
  ): Promise<BudgetAnalyticsDto> {
    const analyticsData = await this.budgetsRepository.getBudgetAnalytics(
      id,
      userId,
    );

    if (!analyticsData) {
      throw new NotFoundException("Budget not found");
    }

    const { budget, spentAmount, categoryBreakdown, spendingTrend } =
      analyticsData;

    // Calculate comprehensive analytics
    const totalAmount = parseFloat(budget.totalAmount.toString());
    const remainingAmount = totalAmount - spentAmount;
    const spentPercentage =
      totalAmount > 0 ? (spentAmount / totalAmount) * 100 : 0;

    // Date calculations
    const now = new Date();
    const startDate = budget.startDate;
    const endDate = budget.endDate || now;

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const elapsedDays = Math.ceil(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const remainingDays = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const dailyBudget = totalDays > 0 ? totalAmount / totalDays : 0;
    const dailyAverageSpending =
      elapsedDays > 0 ? spentAmount / elapsedDays : 0;
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

    return plainToInstance(BudgetAnalyticsDto, analytics, {
      excludeExtraneousValues: true,
    });
  }

  private async enrichBudgetWithAnalytics(budget: any): Promise<BudgetDto> {
    const expenseTransactions =
      budget.transactions?.filter((t) => t.type === "EXPENSE") || [];
    const spentAmount = expenseTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount.toString()),
      0,
    );

    const totalAmount = parseFloat(budget.totalAmount.toString());
    const remainingAmount = totalAmount - spentAmount;
    const spentPercentage =
      totalAmount > 0 ? (spentAmount / totalAmount) * 100 : 0;

    // Calculate days remaining
    const now = new Date();
    const endDate = budget.endDate;
    const daysRemaining = endDate
      ? Math.max(
          0,
          Math.ceil(
            (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
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

    // Remove plainToInstance for now - it's causing the undefined issue
    return enrichedBudget as BudgetDto;
  }
}

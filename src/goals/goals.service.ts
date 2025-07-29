import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { GoalsRepository } from "./repositories/goals.repository";
import {
  Goal,
  GoalContribution,
  Prisma,
  GoalCategory,
  ContributionType,
  GoalType,
} from "@prisma/client";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";
import { GoalFiltersDto } from "./dto/goal-filters.dto";
import { CreateGoalContributionDto } from "./dto/create-goal-contribution.dto";
import {
  GoalResponseDto,
  GoalsListResponseDto,
  GoalsSummaryDto,
  GoalAnalyticsDto,
  GoalContributionResponseDto,
} from "./dto/goal-response.dto";
import {
  GoalSuggestionsResponseDto,
  GoalSuggestionDto,
  EmergencyFundSuggestionDto,
} from "./dto/goal-suggestions.dto";
import { differenceInMonths, startOfMonth, endOfMonth, format } from "date-fns";

@Injectable()
export class GoalsService {
  constructor(private readonly goalsRepository: GoalsRepository) {}

  // Core CRUD Operations
  async createGoal(
    userId: string,
    createGoalDto: CreateGoalDto
  ): Promise<GoalResponseDto> {
    // For debt goals, initialize currentAmount to targetAmount (debt owed)
    // For savings goals, initialize currentAmount to provided value or 0
    let initialCurrentAmount = createGoalDto.currentAmount || 0;

    if (
      createGoalDto.type === "DEBT_PAYOFF" &&
      createGoalDto.currentAmount === undefined
    ) {
      // If no currentAmount specified for debt goal, use targetAmount (total debt)
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
    const goalWithIncludes = await this.goalsRepository.findByIdWithIncludes(
      goal.id,
      this.getGoalIncludes()
    );

    return this.transformGoalToResponse(goalWithIncludes);
  }

  async getGoals(
    userId: string,
    filters: GoalFiltersDto
  ): Promise<GoalsListResponseDto> {
    const where = this.buildGoalFilters(userId, filters);
    const orderBy = this.buildOrderBy(filters.sortBy, filters.sortOrder);

    const [goals, total] = await Promise.all([
      this.goalsRepository.findManyWithFilters(
        where,
        this.getGoalIncludes(),
        orderBy,
        ((filters.page || 1) - 1) * (filters.limit || 10),
        filters.limit || 10
      ),
      this.goalsRepository.count(where),
    ]);

    const transformedGoals = goals.map((goal) =>
      this.transformGoalToResponse(goal)
    );
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

  async getGoalById(userId: string, goalId: string): Promise<GoalResponseDto> {
    const goal = await this.goalsRepository.findByUserAndGoalId(userId, goalId);

    if (!goal) {
      throw new NotFoundException("Goal not found");
    }

    const goalWithIncludes = await this.goalsRepository.findByIdWithIncludes(
      goalId,
      this.getGoalIncludes()
    );

    return this.transformGoalToResponse(goalWithIncludes);
  }

  async updateGoal(
    userId: string,
    goalId: string,
    updateGoalDto: UpdateGoalDto
  ): Promise<GoalResponseDto> {
    const existingGoal = await this.goalsRepository.findByUserAndGoalId(
      userId,
      goalId
    );

    if (!existingGoal) {
      throw new NotFoundException("Goal not found");
    }

    // Handle completion
    const updateData: any = {
      ...updateGoalDto,
      targetDate: updateGoalDto.targetDate
        ? new Date(updateGoalDto.targetDate)
        : undefined,
    };

    // Handle completion logic based on goal type
    if (updateGoalDto.isCompleted && !existingGoal.isCompleted) {
      updateData.completedAt = new Date();

      // For debt goals, completion means currentAmount = 0
      if (existingGoal.type === "DEBT_PAYOFF") {
        updateData.currentAmount = 0;
      } else {
        // For savings/other goals, completion means currentAmount = targetAmount
        updateData.currentAmount = existingGoal.targetAmount;
      }
    } else if (
      existingGoal.type === "DEBT_PAYOFF" &&
      updateGoalDto.currentAmount !== undefined
    ) {
      // For debt goals, check if automatically completed when currentAmount reaches 0
      const newCurrentAmount = updateGoalDto.currentAmount;
      if (newCurrentAmount <= 0 && !existingGoal.isCompleted) {
        updateData.isCompleted = true;
        updateData.completedAt = new Date();
        updateData.currentAmount = 0; // Ensure it's exactly 0
      }
    } else if (
      existingGoal.type !== "DEBT_PAYOFF" &&
      updateGoalDto.currentAmount !== undefined
    ) {
      // For savings goals, check if automatically completed when currentAmount reaches targetAmount
      const newCurrentAmount = updateGoalDto.currentAmount;
      if (
        newCurrentAmount >= existingGoal.targetAmount.toNumber() &&
        !existingGoal.isCompleted
      ) {
        updateData.isCompleted = true;
        updateData.completedAt = new Date();
      }
    }

    const goal = await this.goalsRepository.updateWithIncludes(
      goalId,
      updateData,
      this.getGoalIncludes()
    );

    return this.transformGoalToResponse(goal);
  }

  async deleteGoal(userId: string, goalId: string): Promise<void> {
    const goal = await this.goalsRepository.findByUserAndGoalId(userId, goalId);

    if (!goal) {
      throw new NotFoundException("Goal not found");
    }

    await this.goalsRepository.delete(goalId);
  }

  // Goal Contributions
  async addContribution(
    userId: string,
    goalId: string,
    createContributionDto: CreateGoalContributionDto
  ): Promise<GoalContributionResponseDto> {
    const goal = await this.goalsRepository.findByUserAndGoalId(userId, goalId);

    if (!goal) {
      throw new NotFoundException("Goal not found");
    }

    if (goal.isCompleted) {
      throw new BadRequestException(
        "Cannot add contributions to completed goal"
      );
    }

    // Create contribution
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

    const contribution =
      await this.goalsRepository.createContribution(contributionData);

    // Update goal current amount based on goal type and contribution type
    let newCurrentAmount: number;
    let isNowCompleted: boolean;

    if (goal.type === "DEBT_PAYOFF") {
      // For debt goals, subtract the payment from current debt
      newCurrentAmount =
        goal.currentAmount.toNumber() - createContributionDto.amount;
      isNowCompleted = newCurrentAmount <= 0;
      // Ensure debt doesn't go negative
      if (newCurrentAmount < 0) {
        newCurrentAmount = 0;
      }
    } else {
      // For savings goals, handle withdrawals and contributions differently
      if (createContributionDto.type === ContributionType.WITHDRAWAL) {
        // For withdrawals, subtract from current amount
        newCurrentAmount =
          goal.currentAmount.toNumber() - createContributionDto.amount;
        // Ensure savings don't go negative
        if (newCurrentAmount < 0) {
          newCurrentAmount = 0;
        }
        isNowCompleted = false; // Withdrawals don't complete goals
      } else {
        // For regular contributions, add to current amount
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

  async getGoalContributions(
    userId: string,
    goalId: string,
    startDate?: string,
    endDate?: string
  ): Promise<GoalContributionResponseDto[]> {
    const goal = await this.goalsRepository.findByUserAndGoalId(userId, goalId);

    if (!goal) {
      throw new NotFoundException("Goal not found");
    }

    const contributions =
      await this.goalsRepository.findContributionsByUserAndGoal(
        userId,
        goalId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

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

  // Analytics
  async getGoalAnalytics(
    userId: string,
    goalId: string
  ): Promise<GoalAnalyticsDto> {
    const goal = await this.goalsRepository.findByUserAndGoalId(userId, goalId);

    if (!goal) {
      throw new NotFoundException("Goal not found");
    }

    const goalWithContributions =
      await this.goalsRepository.getGoalWithContributions(goalId);

    const currentAmount = goalWithContributions.currentAmount.toNumber();
    const targetAmount = goalWithContributions.targetAmount.toNumber();
    const progressPercentage = (currentAmount / targetAmount) * 100;

    // Calculate monthly progress
    const monthlyProgress = this.calculateMonthlyProgress(
      goalWithContributions.contributions
    );

    // Calculate projections
    const averageMonthlyContribution = this.calculateAverageMonthlyContribution(
      goalWithContributions.contributions
    );
    const requiredMonthlyContribution = goalWithContributions.targetDate
      ? Math.max(
          0,
          (targetAmount - currentAmount) /
            Math.max(
              1,
              differenceInMonths(goalWithContributions.targetDate, new Date())
            )
        )
      : undefined;

    const projectedCompletion = this.calculateProjectedCompletion(
      currentAmount,
      targetAmount,
      averageMonthlyContribution
    );

    // Contribution sources
    const contributionSources = this.calculateContributionSources(
      goalWithContributions.contributions
    );

    // Milestones
    const milestones = this.calculateMilestones(
      targetAmount,
      currentAmount,
      goalWithContributions.contributions
    );

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

  // Smart Suggestions
  async generateSmartSuggestions(
    userId: string
  ): Promise<GoalSuggestionsResponseDto> {
    const user = await this.goalsRepository.getUserWithIncome(userId);
    const existingGoals = await this.goalsRepository.findActiveByUserId(userId);

    // Get recent transactions for analysis
    const transactions =
      await this.goalsRepository.getRecentTransactionsByUserId(userId, 90);

    const suggestions: GoalSuggestionDto[] = [];
    const insights: string[] = [];

    // Emergency fund suggestion
    const hasEmergencyFund = existingGoals.some(
      (goal) => goal.category === GoalCategory.EMERGENCY_FUND
    );
    if (!hasEmergencyFund) {
      const emergencySuggestion = await this.generateEmergencyFundSuggestion(
        transactions,
        user?.income?.toNumber()
      );
      suggestions.push(emergencySuggestion);
      insights.push(
        "You have no emergency fund. This should be your top priority."
      );
    }

    // Spending limit suggestions
    const spendingLimitSuggestions =
      this.generateSpendingLimitSuggestions(transactions);
    suggestions.push(...spendingLimitSuggestions);

    // Calculate user context
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

  // Private Helper Methods
  private getGoalIncludes(): Prisma.GoalInclude {
    return {
      contributions: {
        orderBy: {
          date: "desc",
        } as Prisma.GoalContributionOrderByWithRelationInput,
        take: 1,
      },
      _count: {
        select: {
          contributions: true,
        },
      },
    };
  }

  private buildGoalFilters(userId: string, filters: GoalFiltersDto) {
    const where: Prisma.GoalWhereInput = { userId };

    if (filters.category) where.category = filters.category;
    if (filters.type) where.type = filters.type;
    if (filters.priority) where.priority = filters.priority;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
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

  private buildOrderBy(
    sortBy?: string,
    sortOrder?: string
  ): Prisma.GoalOrderByWithRelationInput {
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

  private transformGoalToResponse(goal: any): GoalResponseDto {
    const currentAmount = goal.currentAmount.toNumber();
    const targetAmount = goal.targetAmount.toNumber();
    const progressPercentage = (currentAmount / targetAmount) * 100;
    const remainingAmount = Math.max(0, targetAmount - currentAmount);

    const monthsRemaining = goal.targetDate
      ? differenceInMonths(goal.targetDate, new Date())
      : undefined;
    const requiredMonthlyContribution =
      monthsRemaining && monthsRemaining > 0
        ? remainingAmount / monthsRemaining
        : undefined;

    const totalContributions = currentAmount;
    const contributionCount = goal._count?.contributions || 0;
    const averageMonthlyContribution =
      contributionCount > 0
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

  private async getGoalsSummary(userId: string): Promise<GoalsSummaryDto> {
    const summaryData =
      await this.goalsRepository.getGoalsSummaryByUserId(userId);
    const overallProgress =
      summaryData.totalTargetAmount > 0
        ? (summaryData.totalCurrentAmount / summaryData.totalTargetAmount) * 100
        : 0;

    return {
      ...summaryData,
      overallProgress,
    };
  }

  private calculateMonthlyProgress(contributions: any[]) {
    const monthlyContributions = new Map<string, number>();
    let cumulativeAmount = 0;

    contributions.forEach((contribution) => {
      const month = format(contribution.date, "yyyy-MM");
      const amount = contribution.amount.toNumber();

      monthlyContributions.set(
        month,
        (monthlyContributions.get(month) || 0) + amount
      );
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

  private calculateAverageMonthlyContribution(contributions: any[]): number {
    if (contributions.length === 0) return 0;

    const totalAmount = contributions.reduce(
      (sum, c) => sum + c.amount.toNumber(),
      0
    );
    const firstContribution = contributions[0];
    const lastContribution = contributions[contributions.length - 1];

    if (!firstContribution || !lastContribution) return 0;

    const monthsSpan = Math.max(
      1,
      differenceInMonths(lastContribution.date, firstContribution.date) + 1
    );
    return totalAmount / monthsSpan;
  }

  private calculateProjectedCompletion(
    currentAmount: number,
    targetAmount: number,
    averageMonthlyContribution: number
  ): Date | undefined {
    if (averageMonthlyContribution <= 0) return undefined;

    const remainingAmount = targetAmount - currentAmount;
    const monthsToComplete = Math.ceil(
      remainingAmount / averageMonthlyContribution
    );

    const completion = new Date();
    completion.setMonth(completion.getMonth() + monthsToComplete);
    return completion;
  }

  private calculateContributionSources(contributions: any[]) {
    const sources = new Map<string, number>();
    const totalAmount = contributions.reduce(
      (sum, c) => sum + c.amount.toNumber(),
      0
    );

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

  private calculateMilestones(
    targetAmount: number,
    currentAmount: number,
    contributions: any[]
  ) {
    const milestonePercentages = [25, 50, 75, 90, 100];

    return milestonePercentages.map((percentage) => {
      const milestoneAmount = (targetAmount * percentage) / 100;
      const achievedContribution = contributions.find(
        (c) => c.amount.toNumber() >= milestoneAmount
      );

      return {
        percentage,
        amount: milestoneAmount,
        achievedAt: achievedContribution?.date,
        projectedDate:
          currentAmount < milestoneAmount
            ? this.calculateProjectedCompletion(
                currentAmount,
                milestoneAmount,
                this.calculateAverageMonthlyContribution(contributions)
              )
            : undefined,
      };
    });
  }

  private async generateEmergencyFundSuggestion(
    transactions: any[],
    income?: number
  ): Promise<GoalSuggestionDto> {
    const monthlyExpenses = this.calculateAverageMonthlyExpenses(transactions);
    const recommendedAmount = monthlyExpenses * 6; // 6 months of expenses
    const suggestedMonthlyContribution = income
      ? Math.min(income * 0.1, recommendedAmount / 24)
      : recommendedAmount / 24;

    return {
      id: "emergency_fund_suggestion",
      type: GoalCategory.EMERGENCY_FUND,
      priority: "HIGH" as any,
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
        category: GoalCategory.EMERGENCY_FUND,
        type: GoalType.SAVINGS,
        monthlyTarget: suggestedMonthlyContribution,
      },
    };
  }

  private generateSpendingLimitSuggestions(
    transactions: any[]
  ): GoalSuggestionDto[] {
    // Analyze spending by category to suggest spending limits
    const categorySpending = new Map<
      string,
      { total: number; count: number; category: string }
    >();

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

    const suggestions: GoalSuggestionDto[] = [];
    const monthlyDivisor = 3; // 90 days of data

    categorySpending.forEach((data, categoryName) => {
      const monthlyAverage = data.total / monthlyDivisor;

      // Suggest spending limit if category spending is high
      if (monthlyAverage > 200 && data.count > 5) {
        const suggestedLimit = monthlyAverage * 0.8; // 20% reduction
        const potentialSavings = monthlyAverage - suggestedLimit;

        suggestions.push({
          id: `spending_limit_${categoryName.toLowerCase().replace(/\s+/g, "_")}`,
          type: GoalCategory.OTHER,
          priority: "MEDIUM" as any,
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
            category: GoalCategory.OTHER,
            type: GoalType.SPENDING_LIMIT, // ✅ FIXED: Changed from GoalType.SPENDING to GoalType.SPENDING_LIMIT
            monthlyTarget: suggestedLimit,
          },
        });
      }
    });

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  private calculateAverageMonthlyExpenses(transactions: any[]): number {
    const expenseTransactions = transactions.filter(
      (t) => t.type === "EXPENSE"
    );
    const totalExpenses = expenseTransactions.reduce(
      (sum, t) => sum + t.amount.toNumber(),
      0
    );
    return totalExpenses / 3; // 90 days = ~3 months
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaClient, Goal, GoalContribution, Prisma } from "@prisma/client";

@Injectable()
export class GoalsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Goal CRUD operations
  async create(data: Prisma.GoalCreateInput): Promise<Goal> {
    return this.prisma.goal.create({
      data,
    });
  }

  async findById(id: string): Promise<Goal | null> {
    return this.prisma.goal.findUnique({
      where: { id },
    });
  }

  async findByIdWithIncludes(
    id: string,
    include?: Prisma.GoalInclude
  ): Promise<any> {
    return this.prisma.goal.findUnique({
      where: { id },
      include,
    });
  }

  async findByUserIdWithIncludes(
    userId: string,
    include?: Prisma.GoalInclude
  ): Promise<any[]> {
    return this.prisma.goal.findMany({
      where: { userId },
      include,
    });
  }

  async findManyWithFilters(
    where: Prisma.GoalWhereInput,
    include?: Prisma.GoalInclude,
    orderBy?:
      | Prisma.GoalOrderByWithRelationInput
      | Prisma.GoalOrderByWithRelationInput[],
    skip?: number,
    take?: number
  ): Promise<any[]> {
    return this.prisma.goal.findMany({
      where,
      include,
      orderBy,
      skip,
      take,
    });
  }

  async count(where: Prisma.GoalWhereInput): Promise<number> {
    return this.prisma.goal.count({ where });
  }

  async update(id: string, data: Prisma.GoalUpdateInput): Promise<Goal> {
    return this.prisma.goal.update({
      where: { id },
      data,
    });
  }

  async updateWithIncludes(
    id: string,
    data: Prisma.GoalUpdateInput,
    include?: Prisma.GoalInclude
  ): Promise<any> {
    return this.prisma.goal.update({
      where: { id },
      data,
      include,
    });
  }

  async delete(id: string): Promise<Goal> {
    return this.prisma.goal.delete({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<Goal[]> {
    return this.prisma.goal.findMany({
      where: { userId },
    });
  }

  async findActiveByUserId(userId: string): Promise<Goal[]> {
    return this.prisma.goal.findMany({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  async findByUserAndGoalId(
    userId: string,
    goalId: string
  ): Promise<Goal | null> {
    return this.prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
    });
  }

  // Goal Contribution operations
  async createContribution(
    data: Prisma.GoalContributionCreateInput
  ): Promise<GoalContribution> {
    return this.prisma.goalContribution.create({
      data,
    });
  }

  async findContributionsByGoalId(
    goalId: string,
    startDate?: Date,
    endDate?: Date,
    orderBy?:
      | Prisma.GoalContributionOrderByWithRelationInput
      | Prisma.GoalContributionOrderByWithRelationInput[]
  ): Promise<GoalContribution[]> {
    const where: Prisma.GoalContributionWhereInput = { goalId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    return this.prisma.goalContribution.findMany({
      where,
      orderBy: orderBy || { date: "desc" },
    });
  }

  async findContributionsByUserId(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GoalContribution[]> {
    const where: Prisma.GoalContributionWhereInput = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    return this.prisma.goalContribution.findMany({
      where,
      orderBy: { date: "desc" },
    });
  }

  async findContributionsByUserAndGoal(
    userId: string,
    goalId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GoalContribution[]> {
    const where: Prisma.GoalContributionWhereInput = {
      userId,
      goalId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    return this.prisma.goalContribution.findMany({
      where,
      orderBy: { date: "desc" },
    });
  }

  // Analytics queries
  async getGoalsSummaryByUserId(userId: string): Promise<{
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
  }> {
    const goals = await this.prisma.goal.findMany({
      where: { userId, isActive: true },
      select: {
        isCompleted: true,
        targetAmount: true,
        currentAmount: true,
      },
    });

    const totalGoals = goals.length;
    const activeGoals = goals.filter((g) => !g.isCompleted).length;
    const completedGoals = goals.filter((g) => g.isCompleted).length;
    const totalTargetAmount = goals.reduce(
      (sum, g) => sum + g.targetAmount.toNumber(),
      0
    );
    const totalCurrentAmount = goals.reduce(
      (sum, g) => sum + g.currentAmount.toNumber(),
      0
    );

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      totalTargetAmount,
      totalCurrentAmount,
    };
  }

  // Transaction-related queries (for suggestions)
  async getRecentTransactionsByUserId(
    userId: string,
    daysBack: number = 90
  ): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    return this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
      include: {
        category: true,
        subcategory: true,
      },
      orderBy: { date: "desc" },
    });
  }

  async getUserWithIncome(userId: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        income: true,
        incomeFrequency: true,
        currency: true,
      },
    });
  }

  // Specialized queries for analytics
  async getGoalWithContributions(goalId: string): Promise<any> {
    return this.prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        contributions: {
          orderBy: { date: "asc" },
        },
        _count: {
          select: {
            contributions: true,
          },
        },
      },
    });
  }

  async getGoalsWithLatestContribution(userId: string): Promise<any[]> {
    return this.prisma.goal.findMany({
      where: { userId },
      include: {
        contributions: {
          orderBy: { date: "desc" },
          take: 1,
        },
        _count: {
          select: {
            contributions: true,
          },
        },
      },
    });
  }
}

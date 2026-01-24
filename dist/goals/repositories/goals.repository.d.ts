import { PrismaClient, Goal, GoalContribution, Prisma } from "@prisma/client";
export declare class GoalsRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    create(data: Prisma.GoalCreateInput): Promise<Goal>;
    findById(id: string): Promise<Goal | null>;
    findByIdWithIncludes(id: string, include?: Prisma.GoalInclude): Promise<any>;
    findByUserIdWithIncludes(userId: string, include?: Prisma.GoalInclude): Promise<any[]>;
    findManyWithFilters(where: Prisma.GoalWhereInput, include?: Prisma.GoalInclude, orderBy?: Prisma.GoalOrderByWithRelationInput | Prisma.GoalOrderByWithRelationInput[], skip?: number, take?: number): Promise<any[]>;
    count(where: Prisma.GoalWhereInput): Promise<number>;
    update(id: string, data: Prisma.GoalUpdateInput): Promise<Goal>;
    updateWithIncludes(id: string, data: Prisma.GoalUpdateInput, include?: Prisma.GoalInclude): Promise<any>;
    delete(id: string): Promise<Goal>;
    findByUserId(userId: string): Promise<Goal[]>;
    findActiveByUserId(userId: string): Promise<Goal[]>;
    findByUserAndGoalId(userId: string, goalId: string): Promise<Goal | null>;
    createContribution(data: Prisma.GoalContributionCreateInput): Promise<GoalContribution>;
    findContributionsByGoalId(goalId: string, startDate?: Date, endDate?: Date, orderBy?: Prisma.GoalContributionOrderByWithRelationInput | Prisma.GoalContributionOrderByWithRelationInput[]): Promise<GoalContribution[]>;
    findContributionsByUserId(userId: string, startDate?: Date, endDate?: Date): Promise<GoalContribution[]>;
    findContributionsByUserAndGoal(userId: string, goalId: string, startDate?: Date, endDate?: Date): Promise<GoalContribution[]>;
    getGoalsSummaryByUserId(userId: string): Promise<{
        totalGoals: number;
        activeGoals: number;
        completedGoals: number;
        totalTargetAmount: number;
        totalCurrentAmount: number;
    }>;
    getRecentTransactionsByUserId(userId: string, daysBack?: number): Promise<any[]>;
    getUserWithIncome(userId: string): Promise<any>;
    getOverallAnalytics(userId: string): Promise<{
        totalGoals: number;
        activeGoals: number;
        completedGoals: number;
        totalTargetAmount: number;
        totalCurrentAmount: number;
    }>;
    getGoalWithContributions(goalId: string): Promise<any>;
    getGoalsWithLatestContribution(userId: string): Promise<any[]>;
}

import { GoalCategory, GoalType, GoalPriority, LoanTerm } from "@prisma/client";
export declare class GoalResponseDto {
    id: string;
    name: string;
    description?: string;
    targetAmount: number;
    currentAmount: number;
    currency: string;
    targetDate?: Date;
    category: GoalCategory;
    originalCategory?: string;
    type: GoalType;
    priority: GoalPriority;
    isActive: boolean;
    isCompleted: boolean;
    completedAt?: Date;
    autoContribute: boolean;
    monthlyTarget?: number;
    loanTerm?: LoanTerm;
    interestRate?: number;
    minimumPayment?: number;
    createdAt: Date;
    updatedAt: Date;
    progressPercentage: number;
    remainingAmount: number;
    monthsRemaining?: number;
    requiredMonthlyContribution?: number;
    isOnTrack?: boolean;
    analytics: {
        totalContributions: number;
        averageMonthlyContribution: number;
        contributionCount: number;
        lastContribution?: {
            amount: number;
            date: Date;
            type: string;
        };
    };
}
export declare class GoalContributionResponseDto {
    id: string;
    amount: number;
    currency: string;
    date: Date;
    description?: string;
    type: string;
    transactionId?: string;
}
export declare class GoalsSummaryDto {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    overallProgress: number;
}
export declare class GoalsListResponseDto {
    goals: GoalResponseDto[];
    summary: GoalsSummaryDto;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
export declare class GoalAnalyticsDto {
    goalId: string;
    goalName: string;
    currentAmount: number;
    targetAmount: number;
    progressPercentage: number;
    monthlyProgress: Array<{
        month: string;
        contributed: number;
        cumulativeAmount: number;
    }>;
    projectedCompletion?: Date;
    requiredMonthlyContribution?: number;
    averageMonthlyContribution: number;
    isOnTrack: boolean;
    contributionSources: Array<{
        type: string;
        amount: number;
        percentage: number;
    }>;
    milestones: Array<{
        percentage: number;
        amount: number;
        achievedAt?: Date;
        projectedDate?: Date;
    }>;
}

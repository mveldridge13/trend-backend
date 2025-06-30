import { GoalCategory, GoalType, GoalPriority } from "@prisma/client";

export class GoalResponseDto {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: Date;
  category: GoalCategory;
  type: GoalType;
  priority: GoalPriority;
  isActive: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  autoContribute: boolean;
  monthlyTarget?: number;
  createdAt: Date;
  updatedAt: Date;

  // Calculated fields
  progressPercentage: number;
  remainingAmount: number;
  monthsRemaining?: number;
  requiredMonthlyContribution?: number;
  isOnTrack?: boolean;

  // Analytics
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

export class GoalContributionResponseDto {
  id: string;
  amount: number;
  currency: string;
  date: Date;
  description?: string;
  type: string;
  transactionId?: string;
}

export class GoalsSummaryDto {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  overallProgress: number;
}

export class GoalsListResponseDto {
  goals: GoalResponseDto[];
  summary: GoalsSummaryDto;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class GoalAnalyticsDto {
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

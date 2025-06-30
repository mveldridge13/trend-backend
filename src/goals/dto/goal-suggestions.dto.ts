import { GoalCategory, GoalType, GoalPriority } from "@prisma/client";

export class GoalSuggestionDto {
  id: string;
  type: GoalCategory;
  priority: GoalPriority;
  suggestedAmount: number;
  suggestedMonthlyContribution?: number;
  suggestedTimeline?: number; // months
  reasoning: string;
  basedOnSpending?: {
    averageMonthlyExpenses?: number;
    categoryBreakdown?: {
      essentials: number;
      discretionary: number;
    };
    category?: string;
    subcategory?: string;
    lastMonthSpending?: number;
    averageSpending?: number;
    potentialSavings?: number;
  };
  autoCreateGoal: {
    name: string;
    description: string;
    targetAmount: number;
    category: GoalCategory;
    type: GoalType;
    monthlyTarget?: number;
  };
}

export class GoalSuggestionsResponseDto {
  suggestions: GoalSuggestionDto[];
  insights: string[];
  userContext: {
    hasEmergencyFund: boolean;
    monthlyIncome?: number;
    averageMonthlyExpenses: number;
    totalActiveGoals: number;
    currentSavingsRate?: number;
  };
}

export class SpendingAnalysisDto {
  category: string;
  subcategory?: string;
  lastMonthAmount: number;
  averageAmount: number;
  trend: "increasing" | "decreasing" | "stable";
  percentageOfIncome?: number;
  potentialSavings: number;
  suggestionType: "spending_limit" | "budget_adjustment" | "category_awareness";
}

export class EmergencyFundSuggestionDto {
  recommendedAmount: number;
  monthsOfExpenses: number;
  basedOnExpenses: number;
  suggestedMonthlyContribution: number;
  timeToComplete: number; // months
  reasoning: string;
}

import { GoalCategory, GoalPriority, LoanTerm } from "@prisma/client";
export declare class UpdateGoalDto {
    name?: string;
    description?: string;
    targetAmount?: number;
    currentAmount?: number;
    currency?: string;
    targetDate?: string;
    category?: GoalCategory;
    originalCategory?: string;
    priority?: GoalPriority;
    autoContribute?: boolean;
    monthlyTarget?: number;
    isActive?: boolean;
    isCompleted?: boolean;
    completedAt?: string;
    loanTerm?: LoanTerm;
    interestRate?: number;
    minimumPayment?: number;
}

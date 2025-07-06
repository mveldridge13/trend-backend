import { GoalCategory, GoalType, GoalPriority } from "@prisma/client";
export declare class CreateGoalDto {
    name: string;
    description?: string;
    targetAmount: number;
    currency?: string;
    targetDate?: string;
    category: GoalCategory;
    originalCategory?: string;
    type?: GoalType;
    priority?: GoalPriority;
    autoContribute?: boolean;
    monthlyTarget?: number;
    currentAmount?: number;
}

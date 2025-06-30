import { GoalCategory, GoalType, GoalPriority } from "@prisma/client";
export declare class GoalFiltersDto {
    category?: GoalCategory;
    type?: GoalType;
    priority?: GoalPriority;
    isActive?: boolean;
    isCompleted?: boolean;
    targetDateFrom?: string;
    targetDateTo?: string;
    search?: string;
    includeArchived?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
}

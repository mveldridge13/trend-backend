export declare class GoalAllocationDto {
    goalId: string;
    amount: number;
    description?: string;
}
export declare class RolloverContributionDto {
    totalRolloverAmount: number;
    goalAllocations: GoalAllocationDto[];
    description?: string;
}

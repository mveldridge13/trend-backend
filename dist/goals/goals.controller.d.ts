import { GoalsService } from "./goals.service";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";
import { GoalFiltersDto } from "./dto/goal-filters.dto";
import { CreateGoalContributionDto } from "./dto/create-goal-contribution.dto";
import { RolloverContributionDto } from "./dto/rollover-contribution.dto";
import { GoalResponseDto, GoalsListResponseDto, GoalAnalyticsDto, GoalContributionResponseDto } from "./dto/goal-response.dto";
import { GoalSuggestionsResponseDto } from "./dto/goal-suggestions.dto";
export declare class GoalsController {
    private readonly goalsService;
    constructor(goalsService: GoalsService);
    private extractUserId;
    createGoal(req: any, createGoalDto: CreateGoalDto): Promise<GoalResponseDto>;
    getGoals(req: any, filters: GoalFiltersDto): Promise<GoalsListResponseDto>;
    getGoalSuggestions(req: any): Promise<GoalSuggestionsResponseDto>;
    getGoalById(req: any, goalId: string): Promise<GoalResponseDto>;
    updateGoal(req: any, goalId: string, updateGoalDto: UpdateGoalDto): Promise<GoalResponseDto>;
    deleteGoal(req: any, goalId: string): Promise<void>;
    getGoalAnalytics(req: any, goalId: string): Promise<GoalAnalyticsDto>;
    addGoalContribution(req: any, goalId: string, createContributionDto: CreateGoalContributionDto): Promise<GoalContributionResponseDto>;
    getGoalContributions(req: any, goalId: string, startDate?: string, endDate?: string): Promise<GoalContributionResponseDto[]>;
    addRolloverContribution(req: any, rolloverContributionDto: RolloverContributionDto): Promise<GoalContributionResponseDto[]>;
}

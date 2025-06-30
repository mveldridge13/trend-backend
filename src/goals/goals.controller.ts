import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from "@nestjs/common";
import { GoalsService } from "./goals.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";
import { GoalFiltersDto } from "./dto/goal-filters.dto";
import { CreateGoalContributionDto } from "./dto/create-goal-contribution.dto";
import {
  GoalResponseDto,
  GoalsListResponseDto,
  GoalAnalyticsDto,
  GoalContributionResponseDto,
} from "./dto/goal-response.dto";
import { GoalSuggestionsResponseDto } from "./dto/goal-suggestions.dto";

@Controller("goals")
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  // Goal CRUD Operations
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGoal(
    @Request() req: any,
    @Body(ValidationPipe) createGoalDto: CreateGoalDto
  ): Promise<GoalResponseDto> {
    return this.goalsService.createGoal(req.user.sub, createGoalDto);
  }

  @Get()
  async getGoals(
    @Request() req: any,
    @Query(ValidationPipe) filters: GoalFiltersDto
  ): Promise<GoalsListResponseDto> {
    return this.goalsService.getGoals(req.user.sub, filters);
  }

  @Get("suggestions")
  async getGoalSuggestions(
    @Request() req: any
  ): Promise<GoalSuggestionsResponseDto> {
    return this.goalsService.generateSmartSuggestions(req.user.sub);
  }

  @Get(":id")
  async getGoalById(
    @Request() req: any,
    @Param("id") goalId: string
  ): Promise<GoalResponseDto> {
    return this.goalsService.getGoalById(req.user.sub, goalId);
  }

  @Put(":id")
  async updateGoal(
    @Request() req: any,
    @Param("id") goalId: string,
    @Body(ValidationPipe) updateGoalDto: UpdateGoalDto
  ): Promise<GoalResponseDto> {
    return this.goalsService.updateGoal(req.user.sub, goalId, updateGoalDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGoal(
    @Request() req: any,
    @Param("id") goalId: string
  ): Promise<void> {
    return this.goalsService.deleteGoal(req.user.sub, goalId);
  }

  @Get(":id/analytics")
  async getGoalAnalytics(
    @Request() req: any,
    @Param("id") goalId: string
  ): Promise<GoalAnalyticsDto> {
    return this.goalsService.getGoalAnalytics(req.user.sub, goalId);
  }

  // Goal Contributions
  @Post(":id/contributions")
  @HttpCode(HttpStatus.CREATED)
  async addGoalContribution(
    @Request() req: any,
    @Param("id") goalId: string,
    @Body(ValidationPipe) createContributionDto: CreateGoalContributionDto
  ): Promise<GoalContributionResponseDto> {
    return this.goalsService.addContribution(
      req.user.sub,
      goalId,
      createContributionDto
    );
  }

  @Get(":id/contributions")
  async getGoalContributions(
    @Request() req: any,
    @Param("id") goalId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ): Promise<GoalContributionResponseDto[]> {
    return this.goalsService.getGoalContributions(
      req.user.sub,
      goalId,
      startDate,
      endDate
    );
  }
}

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

  // Helper method to extract userId from request
  private extractUserId(req: any): string {
    // Your JWT strategy uses 'id' instead of 'sub'
    const userId = req.user?.id || req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new Error("User ID not found in request");
    }

    return userId;
  }

  // Goal CRUD Operations
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGoal(
    @Request() req: any,
    @Body(ValidationPipe) createGoalDto: CreateGoalDto
  ): Promise<GoalResponseDto> {
    const userId = this.extractUserId(req);
    return this.goalsService.createGoal(userId, createGoalDto);
  }

  @Get()
  async getGoals(
    @Request() req: any,
    @Query(ValidationPipe) filters: GoalFiltersDto
  ): Promise<GoalsListResponseDto> {
    const userId = this.extractUserId(req);
    return this.goalsService.getGoals(userId, filters);
  }

  @Get("suggestions")
  async getGoalSuggestions(
    @Request() req: any
  ): Promise<GoalSuggestionsResponseDto> {
    const userId = this.extractUserId(req);
    return this.goalsService.generateSmartSuggestions(userId);
  }

  @Get(":id")
  async getGoalById(
    @Request() req: any,
    @Param("id") goalId: string
  ): Promise<GoalResponseDto> {
    const userId = this.extractUserId(req);
    return this.goalsService.getGoalById(userId, goalId);
  }

  @Put(":id")
  async updateGoal(
    @Request() req: any,
    @Param("id") goalId: string,
    @Body(ValidationPipe) updateGoalDto: UpdateGoalDto
  ): Promise<GoalResponseDto> {
    const userId = this.extractUserId(req);
    return this.goalsService.updateGoal(userId, goalId, updateGoalDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGoal(
    @Request() req: any,
    @Param("id") goalId: string
  ): Promise<void> {
    const userId = this.extractUserId(req);
    return this.goalsService.deleteGoal(userId, goalId);
  }

  @Get(":id/analytics")
  async getGoalAnalytics(
    @Request() req: any,
    @Param("id") goalId: string
  ): Promise<GoalAnalyticsDto> {
    const userId = this.extractUserId(req);
    return this.goalsService.getGoalAnalytics(userId, goalId);
  }

  // Goal Contributions
  @Post(":id/contributions")
  @HttpCode(HttpStatus.CREATED)
  async addGoalContribution(
    @Request() req: any,
    @Param("id") goalId: string,
    @Body(ValidationPipe) createContributionDto: CreateGoalContributionDto
  ): Promise<GoalContributionResponseDto> {
    const userId = this.extractUserId(req);
    return this.goalsService.addContribution(
      userId,
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
    const userId = this.extractUserId(req);
    return this.goalsService.getGoalContributions(
      userId,
      goalId,
      startDate,
      endDate
    );
  }
}

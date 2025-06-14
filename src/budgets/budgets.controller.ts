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
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { BudgetsService } from "./budgets.service";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { BudgetDto } from "./dto/budget.dto";
import { BudgetAnalyticsDto } from "./dto/budget-analytics.dto";

@Controller("budgets")
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBudget(
    @Request() req,
    @Body() createBudgetDto: CreateBudgetDto
  ): Promise<BudgetDto> {
    return this.budgetsService.createBudget(req.user.id, createBudgetDto);
  }

  @Get()
  async getUserBudgets(
    @Request() req,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

    return this.budgetsService.getUserBudgets(
      req.user.id,
      validPage,
      validLimit
    );
  }

  @Get(":id")
  async getBudgetById(
    @Request() req,
    @Param("id") id: string
  ): Promise<BudgetDto> {
    return this.budgetsService.getBudgetById(id, req.user.id);
  }

  @Put(":id")
  async updateBudget(
    @Request() req,
    @Param("id") id: string,
    @Body() updateBudgetDto: UpdateBudgetDto
  ): Promise<BudgetDto> {
    return this.budgetsService.updateBudget(id, req.user.id, updateBudgetDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBudget(@Request() req, @Param("id") id: string): Promise<void> {
    return this.budgetsService.deleteBudget(id, req.user.id);
  }

  @Get(":id/analytics")
  async getBudgetAnalytics(
    @Request() req,
    @Param("id") id: string
  ): Promise<BudgetAnalyticsDto> {
    return this.budgetsService.getBudgetAnalytics(id, req.user.id);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CashFlowEngineService } from "./cash-flow-engine.service";
import { PlansService } from "./plans.service";
import { PlannerSettingsService } from "./planner-settings.service";
import { ForecastQueryDto } from "./dto/forecast-query.dto";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { UpdatePlannerSettingsDto } from "./dto/update-planner-settings.dto";

@Controller("planner")
@UseGuards(JwtAuthGuard)
export class PlannerController {
  constructor(
    private readonly cashFlowEngineService: CashFlowEngineService,
    private readonly plansService: PlansService,
    private readonly plannerSettingsService: PlannerSettingsService,
  ) {}

  private extractUserId(req: any): string {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new Error("User ID not found in request");
    }
    return userId;
  }

  @Get("forecast")
  async getForecast(@Request() req: any, @Query() query: ForecastQueryDto) {
    return this.cashFlowEngineService.getForecast(
      this.extractUserId(req),
      query.days ?? 30,
    );
  }

  @Get("plans")
  async getPlans(@Request() req: any) {
    return this.plansService.findAll(this.extractUserId(req));
  }

  @Post("plans")
  @HttpCode(HttpStatus.CREATED)
  async createPlan(@Request() req: any, @Body() dto: CreatePlanDto) {
    return this.plansService.create(this.extractUserId(req), dto);
  }

  @Patch("plans/:id")
  async updatePlan(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(id, this.extractUserId(req), dto);
  }

  @Patch("plans/:id/cancel")
  async cancelPlan(@Request() req: any, @Param("id") id: string) {
    return this.plansService.setStatus(id, this.extractUserId(req), "CANCELLED");
  }

  @Patch("plans/:id/promote")
  async promotePlan(@Request() req: any, @Param("id") id: string) {
    return this.plansService.setStatus(id, this.extractUserId(req), "PLANNED");
  }

  @Post("plans/:id/complete")
  async completePlan(@Request() req: any, @Param("id") id: string) {
    return this.plansService.complete(id, this.extractUserId(req));
  }

  @Delete("plans/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePlan(@Request() req: any, @Param("id") id: string) {
    await this.plansService.delete(id, this.extractUserId(req));
  }

  @Get("settings")
  async getSettings(@Request() req: any) {
    return this.plannerSettingsService.get(this.extractUserId(req));
  }

  @Patch("settings")
  async updateSettings(
    @Request() req: any,
    @Body() dto: UpdatePlannerSettingsDto,
  ) {
    return this.plannerSettingsService.update(this.extractUserId(req), dto);
  }
}

import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { UsersModule } from "../users/users.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { GoalsModule } from "../goals/goals.module";
import { IncomeSourcesModule } from "../income-sources/income-sources.module";
import { HomeModule } from "../home/home.module";
import { PlannerController } from "./planner.controller";
import { CashFlowEngineService } from "./cash-flow-engine.service";
import { PlansService } from "./plans.service";
import { PlansRepository } from "./repositories/plans.repository";
import { PlannerSettingsService } from "./planner-settings.service";

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    TransactionsModule,
    GoalsModule,
    IncomeSourcesModule,
    HomeModule,
  ],
  controllers: [PlannerController],
  providers: [
    CashFlowEngineService,
    PlansService,
    PlansRepository,
    PlannerSettingsService,
  ],
  exports: [PlansService],
})
export class PlannerModule {}

import { Module } from "@nestjs/common";
import { BudgetsController } from "./budgets.controller";
import { BudgetsService } from "./budgets.service";
import { BudgetsRepository } from "./repositories/budgets.repository";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetsRepository],
  exports: [BudgetsService, BudgetsRepository],
})
export class BudgetsModule {}

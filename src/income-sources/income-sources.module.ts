import { Module } from "@nestjs/common";
import { IncomeSourcesController } from "./income-sources.controller";
import { IncomeSourcesService } from "./income-sources.service";
import { DatabaseModule } from "../database/database.module";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [IncomeSourcesController],
  providers: [IncomeSourcesService],
  exports: [IncomeSourcesService],
})
export class IncomeSourcesModule {}

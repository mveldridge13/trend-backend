import { Module } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CategoriesController } from "./categories.controller";
import { CategoriesRepository } from "./repositories/categories.repository";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository],
  exports: [CategoriesService, CategoriesRepository],
})
export class CategoriesModule {}

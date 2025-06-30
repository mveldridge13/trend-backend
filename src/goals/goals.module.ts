import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { GoalsController } from "./goals.controller";
import { GoalsService } from "./goals.service";
import { GoalsRepository } from "./repositories/goals.repository";

@Module({
  controllers: [GoalsController],
  providers: [
    GoalsService,
    GoalsRepository,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [GoalsService, GoalsRepository],
})
export class GoalsModule {}

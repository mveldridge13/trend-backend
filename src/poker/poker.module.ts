import { Module } from "@nestjs/common";
import { PokerController } from "./poker.controller";
import { PokerService } from "./poker.service";
import { PokerRepository } from "./repositories/poker.repository";
import { PrismaService } from "../database/prisma.service";

@Module({
  controllers: [PokerController],
  providers: [PokerService, PokerRepository, PrismaService],
  exports: [PokerService, PokerRepository],
})
export class PokerModule {}

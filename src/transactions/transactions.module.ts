import { Module } from "@nestjs/common";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { TransactionsRepository } from "./repositories/transactions.repository";
import { UsersRepository } from "../users/repositories/users.repository";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionsRepository,
    UsersRepository, // ✅ ADD: Needed for Daily Burn Rate calculations
  ],
  exports: [TransactionsService, TransactionsRepository],
})
export class TransactionsModule {
  constructor() {
    console.log("🔥 TransactionsModule loaded successfully!");
  }
}

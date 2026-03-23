import { Module, forwardRef } from "@nestjs/common";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { TransactionsRepository } from "./repositories/transactions.repository";
import { UsersRepository } from "../users/repositories/users.repository";
import { DatabaseModule } from "../database/database.module";
import { GoalsModule } from "../goals/goals.module";

@Module({
  imports: [DatabaseModule, forwardRef(() => GoalsModule)],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionsRepository,
    UsersRepository,
  ],
  exports: [TransactionsService, TransactionsRepository],
})
export class TransactionsModule {}

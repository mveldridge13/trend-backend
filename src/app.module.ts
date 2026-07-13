import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { BudgetsModule } from "./budgets/budgets.module";
import { CategoriesModule } from "./categories/categories.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { GoalsModule } from "./goals/goals.module";
import { PokerModule } from "./poker/poker.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { IncomeSourcesModule } from "./income-sources/income-sources.module";
import { CommonModule } from "./common/common.module";
import { AuditModule } from "./audit/audit.module";
import { EmailModule } from "./email/email.module";
import { HomeModule } from "./home/home.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
// import { AssistantModule } from "./assistant/assistant.module"; // Disabled - uncomment when ready to enable AI assistant

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuditModule,
    CommonModule,
    EmailModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    BudgetsModule,
    CategoriesModule,
    TransactionsModule,
    GoalsModule,
    PokerModule,
    InvoicesModule,
    IncomeSourcesModule,
    HomeModule,
    WebhooksModule,
    // AssistantModule, // Disabled - uncomment when ready to enable AI assistant
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    AppService,
  ],
})
export class AppModule {}

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ["error", "warn"],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("✅ Database connected successfully");
    } catch (error) {
      this.logger.error("❌ Database connection failed", error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Database disconnected");
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  // Clean database for testing
  async cleanDatabase() {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("Database cleaning is only allowed in test environment");
    }

    const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    for (const { tablename } of tablenames) {
      if (tablename !== "_prisma_migrations") {
        try {
          await this.$executeRawUnsafe(
            `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
          );
        } catch (error) {
        }
      }
    }
  }
}

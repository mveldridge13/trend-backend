import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersModule } from "../users/users.module";
import { SecretsService } from "../common/services/secrets.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (secretsService: SecretsService) => {
        // Wait for secrets service to initialize
        await secretsService.onModuleInit();

        const jwtSecret = secretsService.get("JWT_SECRET");
        if (!jwtSecret) {
          throw new Error("FATAL: JWT_SECRET is not set. Application cannot start.");
        }

        return {
          secret: jwtSecret,
          signOptions: { expiresIn: "15m" }, // Short-lived access tokens (15 minutes)
        };
      },
      inject: [SecretsService],
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller"; // ✅ Add this
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    JwtModule.register({
      secret: (() => {
        if (!process.env.JWT_SECRET) {
          throw new Error('FATAL: JWT_SECRET environment variable is not set. Application cannot start.');
        }
        return process.env.JWT_SECRET;
      })(),
      signOptions: { expiresIn: "15m" }, // Short-lived access tokens (15 minutes)
    }),
    UsersModule,
  ],
  controllers: [AuthController], // ✅ Add this
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

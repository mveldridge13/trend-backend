import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../../users/users.service";
import { SecretsService } from "../../common/services/secrets.service";

export interface JwtPayload {
  userId?: string; // For tokens with userId field
  sub?: string;    // For tokens with sub field
  email?: string;
  username?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private secretsService: SecretsService,
  ) {
    const jwtSecret = secretsService.get("JWT_SECRET");
    if (!jwtSecret) {
      throw new Error("FATAL: JWT_SECRET is not set. Application cannot start.");
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    // Handle both userId and sub fields in JWT payload
    const userIdFromToken = payload.userId || payload.sub;

    if (!userIdFromToken) {
      throw new UnauthorizedException("No user ID found in token");
    }

    const user = await this.usersService.findById(userIdFromToken);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive");
    }

    // 🔧 FIX: Return userId instead of id to match controller expectation
    return {
      userId: user.id, // 👈 Changed from 'id' to 'userId'
      id: user.id, // 👈 Keep both for compatibility
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
    };
  }
}

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  Ip,
  Headers,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { UpdateUserProfileDto } from "../users/dto/update-user-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Strict rate limiting: 5 requests per 60 seconds for registration
  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
  ) {
    return this.authService.register(registerDto, ip, userAgent);
  }

  // Strict rate limiting: 5 requests per 60 seconds for login
  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
  ) {
    return this.authService.login(loginDto, ip, userAgent);
  }

  // Refresh token endpoint
  @Post("refresh")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
  ) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token, ip, userAgent);
  }

  // Logout - revoke refresh token
  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body() body: { refreshToken?: string },
    @Request() req: any,
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
  ) {
    return this.authService.logout(req.user.id, body.refreshToken, ip, userAgent);
  }

  // NEW: Profile endpoints for AppNavigator
  @Get("profile")
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.authService.getUserProfile(req.user.id);
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateUserProfileDto,
  ) {
    return this.authService.updateUserProfile(req.user.id, updateProfileDto);
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
  ) {
    return this.authService.changePassword(req.user.id, changePasswordDto, ip, userAgent);
  }

  // Password reset endpoints (no auth required)
  @Post("forgot-password")
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto, ip, userAgent);
  }

  @Post("reset-password")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
  ) {
    return this.authService.resetPassword(resetPasswordDto, ip, userAgent);
  }

  // Session management endpoints
  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  async getSessions(
    @Request() req,
    @Body() body: { currentToken?: string },
  ) {
    return this.authService.getActiveSessions(req.user.id, body.currentToken);
  }

  @Delete("sessions/:sessionId")
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @Request() req,
    @Param("sessionId") sessionId: string,
    @Body() body: { currentToken?: string },
  ) {
    return this.authService.revokeSession(req.user.id, sessionId, body.currentToken);
  }

  @Post("sessions/revoke-others")
  @UseGuards(JwtAuthGuard)
  async revokeOtherSessions(
    @Request() req,
    @Body() body: { currentToken: string },
    @Ip() ip: string,
    @Headers("user-agent") userAgent: string,
  ) {
    return this.authService.revokeOtherSessions(
      req.user.id,
      body.currentToken,
      ip,
      userAgent,
    );
  }
}

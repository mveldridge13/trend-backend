import {
  Controller,
  Post,
  Get,
  Put,
  Body,
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
    return this.authService.refreshToken(refreshTokenDto.refreshToken, ip, userAgent);
  }

  // Logout - revoke refresh token
  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@Body() body: { refreshToken?: string }, @Request() req: any) {
    return this.authService.logout(req.user.id, body.refreshToken);
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
  ) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }
}

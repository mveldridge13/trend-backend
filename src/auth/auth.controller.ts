import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Request,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { UpdateUserProfileDto } from "../users/dto/update-user-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() registerDto: any) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  async login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
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

import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UserDto } from "./dto/user.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  async getProfile(@Request() req): Promise<UserDto> {
    const userId = req.user.id;
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  @Put("profile")
  async updateProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserDto> {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, updateUserDto);
  }

  // ============================================================================
  // INCOME ENDPOINTS - NEW SECTION
  // ============================================================================

  @Get("income")
  async getIncome(@Request() req): Promise<any> {
    const userId = req.user.id;
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      income: user.income,
      incomeFrequency: user.incomeFrequency,
      nextPayDate: user.nextPayDate,
      setupComplete: user.setupComplete,
    };
  }

  @Put("income")
  async updateIncome(
    @Request() req,
    @Body() incomeData: UpdateUserDto
  ): Promise<any> {
    const userId = req.user.id;

    console.log("💰 Backend: Received income data:", incomeData);

    try {
      const updatedUser = await this.usersService.updateProfile(
        userId,
        incomeData
      );

      console.log("💰 Backend: User updated successfully");

      return {
        success: true,
        income: {
          income: updatedUser.income,
          incomeFrequency: updatedUser.incomeFrequency,
          nextPayDate: updatedUser.nextPayDate,
          setupComplete: updatedUser.setupComplete,
        },
      };
    } catch (error) {
      console.error("💰 Backend: Error updating income:", error);
      throw error;
    }
  }

  // ============================================================================
  // EXISTING ENDPOINTS
  // ============================================================================

  @Patch("onboarding")
  async updateOnboarding(
    @Request() req,
    @Body() updateOnboardingDto: UpdateUserProfileDto
  ): Promise<UserDto> {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, updateOnboardingDto);
  }

  @Delete("profile")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivateAccount(@Request() req): Promise<void> {
    const userId = req.user.id;
    await this.usersService.deactivate(userId);
  }
}

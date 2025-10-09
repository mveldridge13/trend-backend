import {
  Controller,
  Get,
  Put,
  Post,
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
import { UpdateRolloverDto } from "./dto/update-rollover.dto";
import { RolloverEntryDto } from "./dto/rollover-entry.dto";
import { CreateRolloverEntryDto } from "./dto/create-rollover-entry.dto";
import { RolloverNotificationDto } from "./dto/rollover-notification.dto";
import { CreateRolloverNotificationDto } from "./dto/create-rollover-notification.dto";

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
    @Body() updateUserDto: UpdateUserDto,
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
    @Body() incomeData: UpdateUserDto,
  ): Promise<any> {
    const userId = req.user.id;


    try {
      const updatedUser = await this.usersService.updateProfile(
        userId,
        incomeData,
      );


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
      throw error;
    }
  }

  // ============================================================================
  // ROLLOVER ENDPOINTS - NEW SECTION
  // ============================================================================

  @Get("rollover")
  async getRolloverStatus(@Request() req): Promise<any> {
    const userId = req.user.id;
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      rolloverAmount: user.rolloverAmount,
      lastRolloverDate: user.lastRolloverDate,
    };
  }

  @Put("rollover")
  async updateRollover(
    @Request() req,
    @Body() rolloverData: UpdateRolloverDto,
  ): Promise<any> {
    const userId = req.user.id;


    try {
      const updatedUser = await this.usersService.updateProfile(
        userId,
        rolloverData as UpdateUserDto,
      );


      return {
        success: true,
        rollover: {
          rolloverAmount: updatedUser.rolloverAmount,
          lastRolloverDate: updatedUser.lastRolloverDate,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("rollover/history")
  async getRolloverHistory(@Request() req): Promise<RolloverEntryDto[]> {
    const userId = req.user.id;
    return this.usersService.getRolloverHistory(userId);
  }

  @Post("rollover/entries")
  async createRolloverEntry(
    @Request() req,
    @Body() createRolloverEntryDto: CreateRolloverEntryDto,
  ): Promise<RolloverEntryDto> {
    const userId = req.user.id;
    return this.usersService.createRolloverEntry(
      userId,
      createRolloverEntryDto,
    );
  }

  // ============================================================================
  // ROLLOVER NOTIFICATION ENDPOINTS - NEW SECTION
  // ============================================================================

  @Get("rollover/notification")
  async getRolloverNotification(
    @Request() req,
  ): Promise<RolloverNotificationDto | null> {
    const userId = req.user.id;
    return this.usersService.getRolloverNotification(userId);
  }

  @Post("rollover/notification")
  async createRolloverNotification(
    @Request() req,
    @Body() createNotificationDto: CreateRolloverNotificationDto,
  ): Promise<RolloverNotificationDto> {
    const userId = req.user.id;
    return this.usersService.createRolloverNotification(
      userId,
      createNotificationDto,
    );
  }

  @Delete("rollover/notification")
  @HttpCode(HttpStatus.NO_CONTENT)
  async dismissRolloverNotification(@Request() req): Promise<void> {
    const userId = req.user.id;
    await this.usersService.dismissRolloverNotification(userId);
  }

  // ============================================================================
  // GDPR COMPLIANCE ENDPOINTS - NEW SECTION
  // ============================================================================

  @Post("export-data")
  async exportUserData(@Request() req): Promise<any> {
    const userId = req.user.id;
    return this.usersService.exportUserData(userId);
  }

  @Delete("account")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Request() req): Promise<void> {
    const userId = req.user.id;
    await this.usersService.permanentlyDeleteAccount(userId);
  }

  // ============================================================================
  // EXISTING ENDPOINTS
  // ============================================================================

  @Patch("onboarding")
  async updateOnboarding(
    @Request() req,
    @Body() updateOnboardingDto: UpdateUserProfileDto,
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

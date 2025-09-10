import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "./repositories/users.repository";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UserDto } from "./dto/user.dto";
import { RolloverEntryDto } from "./dto/rollover-entry.dto";
import { CreateRolloverEntryDto } from "./dto/create-rollover-entry.dto";
import { RolloverNotificationDto } from "./dto/rollover-notification.dto";
import { CreateRolloverNotificationDto } from "./dto/create-rollover-notification.dto";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string): Promise<UserDto | null> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      return null;
    }
    return this.toUserDto(user);
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      return null;
    }
    return this.toUserDto(user);
  }

  async updateProfile(id: string, updateData: UpdateUserDto): Promise<UserDto> {
    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException("User not found");
    }

    // Check if username is already taken (if updating username)
    if (updateData.username && updateData.username !== existingUser.username) {
      const userWithUsername = await this.usersRepository.findByUsername(
        updateData.username,
      );
      if (userWithUsername) {
        throw new Error("Username already taken");
      }
    }

    const updatedUser = await this.usersRepository.update(id, updateData);
    return this.toUserDto(updatedUser);
  }

  // ✅ FIXED: Profile methods for AppNavigator - NOW INCLUDES PAY SCHEDULE
  async getUserProfile(id: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    income?: number;
    incomeFrequency?: string;
    nextPayDate?: string;
    setupComplete: boolean;
    hasSeenWelcome: boolean;
  }> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      income: user.income ? Number(user.income) : undefined,
      incomeFrequency: user.incomeFrequency
        ? user.incomeFrequency.toLowerCase()
        : undefined, // Convert MONTHLY -> monthly
      nextPayDate: user.nextPayDate
        ? user.nextPayDate.toISOString()
        : undefined,
      setupComplete: user.setupComplete,
      hasSeenWelcome: user.hasSeenWelcome,
    };
  }

  async updateUserProfile(
    id: string,
    profileData: UpdateUserProfileDto,
  ): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    income?: number;
    incomeFrequency?: string;
    nextPayDate?: string;
    setupComplete: boolean;
    hasSeenWelcome: boolean;
  }> {
    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException("User not found");
    }

    const updatedUser = await this.usersRepository.updateProfile(
      id,
      profileData,
    );

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      income: updatedUser.income ? Number(updatedUser.income) : undefined,
      incomeFrequency: updatedUser.incomeFrequency
        ? updatedUser.incomeFrequency.toLowerCase()
        : undefined,
      nextPayDate: updatedUser.nextPayDate
        ? updatedUser.nextPayDate.toISOString()
        : undefined,
      setupComplete: updatedUser.setupComplete,
      hasSeenWelcome: updatedUser.hasSeenWelcome,
    };
  }

  async deactivate(id: string): Promise<void> {
    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException("User not found");
    }

    await this.usersRepository.update(id, { isActive: false });
  }

  // ============================================================================
  // ROLLOVER METHODS - NEW SECTION
  // ============================================================================

  async getRolloverHistory(userId: string): Promise<RolloverEntryDto[]> {
    const rolloverEntries =
      await this.usersRepository.getRolloverHistory(userId);
    return rolloverEntries.map((entry) => ({
      id: entry.id,
      amount: Number(entry.amount),
      date: entry.date,
      type: entry.type,
      periodStart: entry.periodStart,
      periodEnd: entry.periodEnd,
      description: entry.description,
    }));
  }

  async createRolloverEntry(
    userId: string,
    createRolloverEntryDto: CreateRolloverEntryDto,
  ): Promise<RolloverEntryDto> {
    let periodStartDate: Date;
    let periodEndDate: Date;

    try {
      periodStartDate = new Date(createRolloverEntryDto.periodStart);
      periodEndDate = new Date(createRolloverEntryDto.periodEnd);

      if (isNaN(periodStartDate.getTime()) || isNaN(periodEndDate.getTime())) {
        throw new Error("Invalid date format provided");
      }
    } catch (error) {
      throw new Error("Invalid date format in rollover entry data");
    }

    const entry = await this.usersRepository.createRolloverEntry({
      userId,
      amount: createRolloverEntryDto.amount,
      type: createRolloverEntryDto.type,
      periodStart: periodStartDate,
      periodEnd: periodEndDate,
      description: createRolloverEntryDto.description,
    });

    return {
      id: entry.id,
      amount: Number(entry.amount),
      date: entry.date,
      type: entry.type,
      periodStart: entry.periodStart,
      periodEnd: entry.periodEnd,
      description: entry.description,
    };
  }

  // ============================================================================
  // ROLLOVER NOTIFICATION METHODS - NEW SECTION
  // ============================================================================

  async getRolloverNotification(
    userId: string,
  ): Promise<RolloverNotificationDto | null> {
    const notification =
      await this.usersRepository.getRolloverNotification(userId);
    if (!notification) {
      return null;
    }

    return {
      id: notification.id,
      amount: Number(notification.amount),
      fromPeriod: notification.fromPeriod,
      createdAt: notification.createdAt,
    };
  }

  async createRolloverNotification(
    userId: string,
    createNotificationDto: CreateRolloverNotificationDto,
  ): Promise<RolloverNotificationDto> {
    let createdAt: Date | undefined;

    if (createNotificationDto.createdAt) {
      try {
        createdAt = new Date(createNotificationDto.createdAt);
        if (isNaN(createdAt.getTime())) {
          throw new Error("Invalid date format provided");
        }
      } catch (error) {
        throw new Error("Invalid date format in notification data");
      }
    }

    const notification = await this.usersRepository.createRolloverNotification({
      userId,
      amount: createNotificationDto.amount,
      fromPeriod: createNotificationDto.fromPeriod,
      createdAt,
    });

    return {
      id: notification.id,
      amount: Number(notification.amount),
      fromPeriod: notification.fromPeriod,
      createdAt: notification.createdAt,
    };
  }

  async dismissRolloverNotification(userId: string): Promise<void> {
    await this.usersRepository.dismissRolloverNotification(userId);
  }

  private toUserDto(user: any): UserDto {
    const { passwordHash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      income: user.income ? Number(user.income) : undefined,
      fixedExpenses: user.fixedExpenses
        ? Number(user.fixedExpenses)
        : undefined,
      rolloverAmount: user.rolloverAmount
        ? Number(user.rolloverAmount)
        : undefined,
    };
  }
}

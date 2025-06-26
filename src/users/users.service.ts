import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "./repositories/users.repository";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UserDto } from "./dto/user.dto";

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
        updateData.username
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
    profileData: UpdateUserProfileDto
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
      profileData
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

  private toUserDto(user: any): UserDto {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

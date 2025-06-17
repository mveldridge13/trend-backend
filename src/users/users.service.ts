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

  // NEW: Profile methods for AppNavigator
  async getUserProfile(id: string): Promise<{
    income?: number;
    setupComplete: boolean;
    hasSeenWelcome: boolean;
  }> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      income: user.income ? Number(user.income) : undefined,
      setupComplete: user.setupComplete,
      hasSeenWelcome: user.hasSeenWelcome,
    };
  }

  async updateUserProfile(
    id: string,
    profileData: UpdateUserProfileDto
  ): Promise<{
    income?: number;
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
      income: updatedUser.income ? Number(updatedUser.income) : undefined,
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

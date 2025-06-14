import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "./repositories/users.repository";
import { UpdateUserDto } from "./dto/update-user.dto";
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

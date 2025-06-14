import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { BaseRepository } from "../../database/base.repository";
import { PrismaService } from "../../database/prisma.service";
import { RegisterDto } from "../../auth/dto/register.dto";
import { UpdateUserDto } from "../dto/update-user.dto";

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      console.log("Attempting to find user by email:", email);
      const result = await this.prisma.user.findUnique({
        where: { email },
      });
      console.log("Query successful, result:", result);
      return result;
    } catch (error) {
      console.error("Raw database error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      this.handleDatabaseError(error);
      return null;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { username },
      });
    } catch (error) {
      this.handleDatabaseError(error);
      return null; // Add this return statement
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      this.handleDatabaseError(error);
      return null; // Add this return statement
    }
  }

  async create(data: RegisterDto & { passwordHash: string }): Promise<User> {
    try {
      const { password, ...userData } = data as any;
      return await this.prisma.user.create({
        data: userData,
      });
    } catch (error) {
      this.handleDatabaseError(error);
      throw error; // Re-throw for create operations
    }
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handleDatabaseError(error);
      throw error; // Re-throw for update operations
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      this.handleDatabaseError(error);
      // For void methods, we can just let the error be handled
    }
  }
}

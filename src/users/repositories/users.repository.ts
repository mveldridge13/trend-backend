import { Injectable } from "@nestjs/common";
import {
  User,
  RolloverEntry,
  RolloverType,
  RolloverNotification,
} from "@prisma/client";
import { BaseRepository } from "../../database/base.repository";
import { PrismaService } from "../../database/prisma.service";
import { RegisterDto } from "../../auth/dto/register.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UpdateUserProfileDto } from "../dto/update-user-profile.dto";

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.prisma.user.findUnique({
        where: { email },
      });
      return result;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { username },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      this.handleDatabaseError(error);
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
      throw error;
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
      throw error;
    }
  }

  // NEW: Separate method for profile updates
  async updateProfile(id: string, data: UpdateUserProfileDto): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handleDatabaseError(error);
      throw error;
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
    }
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { passwordHash },
      });
    } catch (error) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  // ============================================================================
  // ROLLOVER METHODS - NEW SECTION
  // ============================================================================

  async getRolloverHistory(userId: string): Promise<RolloverEntry[]> {
    try {
      return await this.prisma.rolloverEntry.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async createRolloverEntry(data: {
    userId: string;
    amount: number;
    type: RolloverType;
    periodStart: Date;
    periodEnd: Date;
    description?: string;
  }): Promise<RolloverEntry> {
    try {
      return await this.prisma.rolloverEntry.create({
        data,
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // ============================================================================
  // ROLLOVER NOTIFICATION METHODS - NEW SECTION
  // ============================================================================

  async getRolloverNotification(
    userId: string
  ): Promise<RolloverNotification | null> {
    try {
      return await this.prisma.rolloverNotification.findFirst({
        where: {
          userId,
          dismissedAt: null,
        },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async createRolloverNotification(data: {
    userId: string;
    amount: number;
    fromPeriod?: string;
    createdAt?: Date;
  }): Promise<RolloverNotification> {
    try {
      // First, dismiss any existing notification
      await this.prisma.rolloverNotification.updateMany({
        where: {
          userId: data.userId,
          dismissedAt: null,
        },
        data: {
          dismissedAt: new Date(),
        },
      });

      // Create new notification
      return await this.prisma.rolloverNotification.create({
        data: {
          userId: data.userId,
          amount: data.amount,
          fromPeriod: data.fromPeriod || "last period",
          createdAt: data.createdAt || new Date(),
        },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async dismissRolloverNotification(userId: string): Promise<void> {
    try {
      await this.prisma.rolloverNotification.updateMany({
        where: {
          userId,
          dismissedAt: null,
        },
        data: {
          dismissedAt: new Date(),
        },
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}

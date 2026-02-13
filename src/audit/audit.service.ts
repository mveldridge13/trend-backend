import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditEventType } from "@prisma/client";

export interface AuditLogData {
  userId?: string;
  eventType: AuditEventType;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  success?: boolean;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          eventType: data.eventType,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata,
          success: data.success ?? true,
        },
      });
    } catch (error) {
      // Log to console but don't throw - audit logging should not break auth flow
      console.error("Failed to create audit log:", error);
    }
  }

  // Convenience methods for common events
  async logLoginSuccess(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      eventType: AuditEventType.LOGIN_SUCCESS,
      ipAddress,
      userAgent,
      success: true,
    });
  }

  async logLoginFailed(email: string, ipAddress?: string, userAgent?: string, reason?: string): Promise<void> {
    await this.log({
      eventType: AuditEventType.LOGIN_FAILED,
      ipAddress,
      userAgent,
      metadata: { email, reason },
      success: false,
    });
  }

  async logLogout(userId: string, ipAddress?: string, userAgent?: string, allDevices?: boolean): Promise<void> {
    await this.log({
      userId,
      eventType: AuditEventType.LOGOUT,
      ipAddress,
      userAgent,
      metadata: { allDevices },
      success: true,
    });
  }

  async logRegister(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      eventType: AuditEventType.REGISTER,
      ipAddress,
      userAgent,
      metadata: { email },
      success: true,
    });
  }

  async logPasswordChange(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      eventType: AuditEventType.PASSWORD_CHANGE,
      ipAddress,
      userAgent,
      success: true,
    });
  }

  async logAccountLocked(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      eventType: AuditEventType.ACCOUNT_LOCKED,
      ipAddress,
      userAgent,
      metadata: { email },
      success: false,
    });
  }

  async logTokenRefresh(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      eventType: AuditEventType.TOKEN_REFRESH,
      ipAddress,
      userAgent,
      success: true,
    });
  }

  async logPasswordResetRequest(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      eventType: AuditEventType.PASSWORD_RESET_REQUEST,
      ipAddress,
      userAgent,
      success: true,
    });
  }

  async logPasswordResetComplete(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      eventType: AuditEventType.PASSWORD_RESET_COMPLETE,
      ipAddress,
      userAgent,
      success: true,
    });
  }

  // Query methods for security monitoring
  async getRecentFailedLogins(ipAddress: string, minutes: number = 15): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return this.prisma.auditLog.count({
      where: {
        ipAddress,
        eventType: AuditEventType.LOGIN_FAILED,
        createdAt: { gte: since },
      },
    });
  }

  async getUserAuditLogs(userId: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

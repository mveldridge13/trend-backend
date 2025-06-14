import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

export interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  database: {
    status: "connected" | "disconnected";
    responseTime?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();

    // Check database
    const databaseHealthy = await this.prisma.isHealthy();
    const databaseResponseTime = Date.now() - startTime;

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryPercentage =
      (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    return {
      status: databaseHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: databaseHealthy ? "connected" : "disconnected",
        responseTime: databaseResponseTime,
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round(memoryPercentage),
      },
    };
  }
}

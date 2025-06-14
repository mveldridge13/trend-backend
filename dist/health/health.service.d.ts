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
export declare class HealthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getHealthStatus(): Promise<HealthStatus>;
}

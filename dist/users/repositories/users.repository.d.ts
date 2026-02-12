import { User, RolloverEntry, RolloverType, RolloverNotification, RefreshToken } from "@prisma/client";
import { BaseRepository } from "../../database/base.repository";
import { PrismaService } from "../../database/prisma.service";
import { RegisterDto } from "../../auth/dto/register.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UpdateUserProfileDto } from "../dto/update-user-profile.dto";
export declare class UsersRepository extends BaseRepository<User> {
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(data: RegisterDto & {
        passwordHash: string;
    }): Promise<User>;
    update(id: string, data: UpdateUserDto): Promise<User>;
    updateProfile(id: string, data: UpdateUserProfileDto): Promise<User>;
    updateLastLogin(id: string): Promise<void>;
    updatePassword(id: string, passwordHash: string): Promise<void>;
    getRolloverHistory(userId: string): Promise<RolloverEntry[]>;
    createRolloverEntry(data: {
        userId: string;
        amount: number;
        type: RolloverType;
        periodStart: Date;
        periodEnd: Date;
        description?: string;
    }): Promise<RolloverEntry>;
    getRolloverNotification(userId: string): Promise<RolloverNotification | null>;
    createRolloverNotification(data: {
        userId: string;
        amount: number;
        fromPeriod?: string;
        createdAt?: Date;
    }): Promise<RolloverNotification>;
    dismissRolloverNotification(userId: string): Promise<void>;
    recordFailedLogin(userId: string): Promise<User>;
    lockAccount(userId: string, lockDurationMinutes?: number): Promise<User>;
    resetFailedLoginAttempts(userId: string): Promise<void>;
    createRefreshToken(data: {
        userId: string;
        token: string;
        expiresAt: Date;
        userAgent?: string;
        ipAddress?: string;
        deviceName?: string;
    }): Promise<RefreshToken>;
    findRefreshToken(token: string): Promise<RefreshToken | null>;
    revokeRefreshToken(token: string): Promise<void>;
    revokeAllUserRefreshTokens(userId: string): Promise<void>;
    cleanupExpiredRefreshTokens(): Promise<void>;
    getActiveSessions(userId: string): Promise<RefreshToken[]>;
    revokeSessionById(userId: string, sessionId: string): Promise<boolean>;
    revokeOtherSessions(userId: string, currentToken: string): Promise<number>;
    updateSessionLastUsed(token: string): Promise<void>;
    updateSessionDeviceName(token: string, deviceName: string): Promise<void>;
    addPasswordToHistory(userId: string, passwordHash: string): Promise<void>;
    getPasswordHistory(userId: string, limit?: number): Promise<string[]>;
    cleanupOldPasswordHistory(userId: string, keepCount?: number): Promise<void>;
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const base_repository_1 = require("../../database/base.repository");
const prisma_service_1 = require("../../database/prisma.service");
let UsersRepository = class UsersRepository extends base_repository_1.BaseRepository {
    constructor(prisma) {
        super(prisma);
    }
    async findByEmail(email) {
        try {
            const result = await this.prisma.user.findUnique({
                where: { email },
            });
            return result;
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async findByUsername(username) {
        try {
            return await this.prisma.user.findUnique({
                where: { username },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async findById(id) {
        try {
            return await this.prisma.user.findUnique({
                where: { id },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async create(data) {
        try {
            const { password, ...userData } = data;
            return await this.prisma.user.create({
                data: userData,
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
            throw error;
        }
    }
    async update(id, data) {
        try {
            return await this.prisma.user.update({
                where: { id },
                data,
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
            throw error;
        }
    }
    async updateProfile(id, data) {
        try {
            return await this.prisma.user.update({
                where: { id },
                data,
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
            throw error;
        }
    }
    async updateLastLogin(id) {
        try {
            await this.prisma.user.update({
                where: { id },
                data: { updatedAt: new Date() },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async updatePassword(id, passwordHash) {
        try {
            await this.prisma.user.update({
                where: { id },
                data: { passwordHash },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
            throw error;
        }
    }
    async getRolloverHistory(userId) {
        try {
            return await this.prisma.rolloverEntry.findMany({
                where: { userId },
                orderBy: { date: "desc" },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async createRolloverEntry(data) {
        try {
            return await this.prisma.rolloverEntry.create({
                data,
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async getRolloverNotification(userId) {
        try {
            return await this.prisma.rolloverNotification.findFirst({
                where: {
                    userId,
                    dismissedAt: null,
                },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async createRolloverNotification(data) {
        try {
            await this.prisma.rolloverNotification.updateMany({
                where: {
                    userId: data.userId,
                    dismissedAt: null,
                },
                data: {
                    dismissedAt: new Date(),
                },
            });
            return await this.prisma.rolloverNotification.create({
                data: {
                    userId: data.userId,
                    amount: data.amount,
                    fromPeriod: data.fromPeriod || "last period",
                    createdAt: data.createdAt || new Date(),
                },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async dismissRolloverNotification(userId) {
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
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async recordFailedLogin(userId) {
        try {
            return await this.prisma.user.update({
                where: { id: userId },
                data: {
                    failedLoginAttempts: { increment: 1 },
                    lastFailedLogin: new Date(),
                },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async lockAccount(userId, lockDurationMinutes = 15) {
        try {
            const lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
            return await this.prisma.user.update({
                where: { id: userId },
                data: { lockedUntil },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async resetFailedLoginAttempts(userId) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                    lastFailedLogin: null,
                },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async createRefreshToken(data) {
        try {
            return await this.prisma.refreshToken.create({
                data,
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async findRefreshToken(token) {
        try {
            return await this.prisma.refreshToken.findUnique({
                where: { token },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async revokeRefreshToken(token) {
        try {
            await this.prisma.refreshToken.update({
                where: { token },
                data: { revokedAt: new Date() },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async revokeAllUserRefreshTokens(userId) {
        try {
            await this.prisma.refreshToken.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async cleanupExpiredRefreshTokens() {
        try {
            await this.prisma.refreshToken.deleteMany({
                where: {
                    OR: [
                        { expiresAt: { lt: new Date() } },
                        { revokedAt: { not: null } },
                    ],
                },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async getActiveSessions(userId) {
        try {
            return await this.prisma.refreshToken.findMany({
                where: {
                    userId,
                    revokedAt: null,
                    expiresAt: { gt: new Date() },
                },
                orderBy: { lastUsedAt: "desc" },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async revokeSessionById(userId, sessionId) {
        try {
            const result = await this.prisma.refreshToken.updateMany({
                where: {
                    id: sessionId,
                    userId,
                    revokedAt: null,
                },
                data: { revokedAt: new Date() },
            });
            return result.count > 0;
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async revokeOtherSessions(userId, currentToken) {
        try {
            const result = await this.prisma.refreshToken.updateMany({
                where: {
                    userId,
                    token: { not: currentToken },
                    revokedAt: null,
                },
                data: { revokedAt: new Date() },
            });
            return result.count;
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async updateSessionLastUsed(token) {
        try {
            await this.prisma.refreshToken.update({
                where: { token },
                data: { lastUsedAt: new Date() },
            });
        }
        catch (error) {
            console.error("Failed to update session lastUsedAt:", error);
        }
    }
    async updateSessionDeviceName(token, deviceName) {
        try {
            await this.prisma.refreshToken.update({
                where: { token },
                data: { deviceName },
            });
        }
        catch (error) {
            console.error("Failed to update session deviceName:", error);
        }
    }
    async addPasswordToHistory(userId, passwordHash) {
        try {
            await this.prisma.passwordHistory.create({
                data: {
                    userId,
                    passwordHash,
                },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async getPasswordHistory(userId, limit = 5) {
        try {
            const history = await this.prisma.passwordHistory.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: limit,
                select: { passwordHash: true },
            });
            return history.map((h) => h.passwordHash);
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async cleanupOldPasswordHistory(userId, keepCount = 5) {
        try {
            const toKeep = await this.prisma.passwordHistory.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: keepCount,
                select: { id: true },
            });
            const keepIds = toKeep.map((p) => p.id);
            if (keepIds.length > 0) {
                await this.prisma.passwordHistory.deleteMany({
                    where: {
                        userId,
                        id: { notIn: keepIds },
                    },
                });
            }
        }
        catch (error) {
            console.error("Failed to cleanup password history:", error);
        }
    }
    async setPasswordResetToken(userId, token, expiresAt) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    passwordResetToken: token,
                    passwordResetExpires: expiresAt,
                },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async findByPasswordResetToken(token) {
        try {
            return await this.prisma.user.findFirst({
                where: {
                    passwordResetToken: token,
                    passwordResetExpires: { gt: new Date() },
                },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
    async clearPasswordResetToken(userId) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    passwordResetToken: null,
                    passwordResetExpires: null,
                },
            });
        }
        catch (error) {
            this.handleDatabaseError(error);
        }
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersRepository);
//# sourceMappingURL=users.repository.js.map
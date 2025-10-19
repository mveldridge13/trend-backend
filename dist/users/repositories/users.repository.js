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
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersRepository);
//# sourceMappingURL=users.repository.js.map
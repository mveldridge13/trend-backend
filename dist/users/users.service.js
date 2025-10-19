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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const users_repository_1 = require("./repositories/users.repository");
const prisma_service_1 = require("../database/prisma.service");
let UsersService = class UsersService {
    constructor(usersRepository, prisma) {
        this.usersRepository = usersRepository;
        this.prisma = prisma;
    }
    async findById(id) {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            return null;
        }
        return this.toUserDto(user);
    }
    async findByEmail(email) {
        const user = await this.usersRepository.findByEmail(email);
        if (!user) {
            return null;
        }
        return this.toUserDto(user);
    }
    async updateProfile(id, updateData) {
        const existingUser = await this.usersRepository.findById(id);
        if (!existingUser) {
            throw new common_1.NotFoundException("User not found");
        }
        if (updateData.username && updateData.username !== existingUser.username) {
            const userWithUsername = await this.usersRepository.findByUsername(updateData.username);
            if (userWithUsername) {
                throw new Error("Username already taken");
            }
        }
        const updatedUser = await this.usersRepository.update(id, updateData);
        return this.toUserDto(updatedUser);
    }
    async getUserProfile(id) {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            income: user.income ? Number(user.income) : undefined,
            incomeFrequency: user.incomeFrequency
                ? user.incomeFrequency.toLowerCase()
                : undefined,
            nextPayDate: user.nextPayDate
                ? user.nextPayDate.toISOString()
                : undefined,
            setupComplete: user.setupComplete,
            hasSeenWelcome: user.hasSeenWelcome,
        };
    }
    async updateUserProfile(id, profileData) {
        const existingUser = await this.usersRepository.findById(id);
        if (!existingUser) {
            throw new common_1.NotFoundException("User not found");
        }
        const updatedUser = await this.usersRepository.updateProfile(id, profileData);
        return {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            income: updatedUser.income ? Number(updatedUser.income) : undefined,
            incomeFrequency: updatedUser.incomeFrequency
                ? updatedUser.incomeFrequency.toLowerCase()
                : undefined,
            nextPayDate: updatedUser.nextPayDate
                ? updatedUser.nextPayDate.toISOString()
                : undefined,
            setupComplete: updatedUser.setupComplete,
            hasSeenWelcome: updatedUser.hasSeenWelcome,
        };
    }
    async deactivate(id) {
        const existingUser = await this.usersRepository.findById(id);
        if (!existingUser) {
            throw new common_1.NotFoundException("User not found");
        }
        await this.usersRepository.update(id, { isActive: false });
    }
    async getRolloverHistory(userId) {
        const rolloverEntries = await this.usersRepository.getRolloverHistory(userId);
        return rolloverEntries.map((entry) => ({
            id: entry.id,
            amount: Number(entry.amount),
            date: entry.date,
            type: entry.type,
            periodStart: entry.periodStart,
            periodEnd: entry.periodEnd,
            description: entry.description,
        }));
    }
    async createRolloverEntry(userId, createRolloverEntryDto) {
        let periodStartDate;
        let periodEndDate;
        try {
            periodStartDate = new Date(createRolloverEntryDto.periodStart);
            periodEndDate = new Date(createRolloverEntryDto.periodEnd);
            if (isNaN(periodStartDate.getTime()) || isNaN(periodEndDate.getTime())) {
                throw new Error("Invalid date format provided");
            }
        }
        catch (error) {
            throw new Error("Invalid date format in rollover entry data");
        }
        const entry = await this.usersRepository.createRolloverEntry({
            userId,
            amount: createRolloverEntryDto.amount,
            type: createRolloverEntryDto.type,
            periodStart: periodStartDate,
            periodEnd: periodEndDate,
            description: createRolloverEntryDto.description,
        });
        return {
            id: entry.id,
            amount: Number(entry.amount),
            date: entry.date,
            type: entry.type,
            periodStart: entry.periodStart,
            periodEnd: entry.periodEnd,
            description: entry.description,
        };
    }
    async getRolloverNotification(userId) {
        const notification = await this.usersRepository.getRolloverNotification(userId);
        if (!notification) {
            return null;
        }
        return {
            id: notification.id,
            amount: Number(notification.amount),
            fromPeriod: notification.fromPeriod,
            createdAt: notification.createdAt,
        };
    }
    async createRolloverNotification(userId, createNotificationDto) {
        let createdAt;
        if (createNotificationDto.createdAt) {
            try {
                createdAt = new Date(createNotificationDto.createdAt);
                if (isNaN(createdAt.getTime())) {
                    throw new Error("Invalid date format provided");
                }
            }
            catch (error) {
                throw new Error("Invalid date format in notification data");
            }
        }
        const notification = await this.usersRepository.createRolloverNotification({
            userId,
            amount: createNotificationDto.amount,
            fromPeriod: createNotificationDto.fromPeriod,
            createdAt,
        });
        return {
            id: notification.id,
            amount: Number(notification.amount),
            fromPeriod: notification.fromPeriod,
            createdAt: notification.createdAt,
        };
    }
    async dismissRolloverNotification(userId) {
        await this.usersRepository.dismissRolloverNotification(userId);
    }
    async exportUserData(userId) {
        const user = await this.usersRepository.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        const [transactions, goals, budgets, categories, pokerTournaments, rolloverHistory] = await Promise.all([
            this.prisma.transaction.findMany({ where: { userId } }),
            this.prisma.goal.findMany({
                where: { userId },
                include: { contributions: true },
            }),
            this.prisma.budget.findMany({ where: { userId } }),
            this.prisma.category.findMany({
                where: { OR: [{ userId }, { userId: null }] },
            }),
            this.prisma.pokerTournament.findMany({ where: { userId } }),
            this.prisma.rolloverEntry.findMany({ where: { userId } }),
        ]);
        const { passwordHash, ...userDataWithoutPassword } = user;
        return {
            version: "1.0",
            exportDate: new Date().toISOString(),
            user: {
                ...userDataWithoutPassword,
                income: user.income ? Number(user.income) : null,
                fixedExpenses: user.fixedExpenses ? Number(user.fixedExpenses) : null,
                rolloverAmount: user.rolloverAmount ? Number(user.rolloverAmount) : null,
            },
            transactions: transactions.map((t) => ({
                ...t,
                amount: Number(t.amount),
            })),
            goals: goals.map((g) => ({
                ...g,
                targetAmount: Number(g.targetAmount),
                currentAmount: Number(g.currentAmount),
                monthlyTarget: g.monthlyTarget ? Number(g.monthlyTarget) : null,
                contributions: g.contributions.map((c) => ({
                    ...c,
                    amount: Number(c.amount),
                })),
            })),
            budgets: budgets.map((b) => ({
                ...b,
                totalAmount: Number(b.totalAmount),
            })),
            categories,
            pokerTournaments: pokerTournaments.map((t) => ({
                ...t,
                buyIn: Number(t.buyIn),
                totalPrizePool: t.totalPrizePool ? Number(t.totalPrizePool) : null,
            })),
            rolloverHistory: rolloverHistory.map((r) => ({
                ...r,
                amount: Number(r.amount),
            })),
            metadata: {
                totalTransactions: transactions.length,
                totalGoals: goals.length,
                totalBudgets: budgets.length,
                totalPokerTournaments: pokerTournaments.length,
            },
        };
    }
    async permanentlyDeleteAccount(userId) {
        const user = await this.usersRepository.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.transaction.deleteMany({ where: { userId } });
            await tx.goalContribution.deleteMany({ where: { goal: { userId } } });
            await tx.goal.deleteMany({ where: { userId } });
            await tx.budget.deleteMany({ where: { userId } });
            await tx.pokerTournament.deleteMany({ where: { userId } });
            await tx.category.deleteMany({ where: { userId } });
            await tx.rolloverEntry.deleteMany({ where: { userId } });
            await tx.rolloverNotification.deleteMany({ where: { userId } });
            await tx.user.delete({ where: { id: userId } });
        });
    }
    toUserDto(user) {
        const { passwordHash, ...userWithoutPassword } = user;
        return {
            ...userWithoutPassword,
            income: user.income ? Number(user.income) : undefined,
            fixedExpenses: user.fixedExpenses
                ? Number(user.fixedExpenses)
                : undefined,
            rolloverAmount: user.rolloverAmount
                ? Number(user.rolloverAmount)
                : undefined,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository,
        prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map
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
exports.GoalsRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let GoalsRepository = class GoalsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.goal.create({
            data,
        });
    }
    async findById(id) {
        return this.prisma.goal.findUnique({
            where: { id },
        });
    }
    async findByIdWithIncludes(id, include) {
        return this.prisma.goal.findUnique({
            where: { id },
            include,
        });
    }
    async findByUserIdWithIncludes(userId, include) {
        return this.prisma.goal.findMany({
            where: { userId },
            include,
        });
    }
    async findManyWithFilters(where, include, orderBy, skip, take) {
        return this.prisma.goal.findMany({
            where,
            include,
            orderBy,
            skip,
            take,
        });
    }
    async count(where) {
        return this.prisma.goal.count({ where });
    }
    async update(id, data) {
        return this.prisma.goal.update({
            where: { id },
            data,
        });
    }
    async updateWithIncludes(id, data, include) {
        return this.prisma.goal.update({
            where: { id },
            data,
            include,
        });
    }
    async delete(id) {
        return this.prisma.goal.delete({
            where: { id },
        });
    }
    async findByUserId(userId) {
        if (!userId) {
            throw new Error("User ID is required for findByUserId");
        }
        return this.prisma.goal.findMany({
            where: { userId },
        });
    }
    async findActiveByUserId(userId) {
        if (!userId) {
            throw new Error("User ID is required for findActiveByUserId");
        }
        console.log("🔍 Debug: findActiveByUserId called with userId:", userId);
        return this.prisma.goal.findMany({
            where: {
                userId,
                isActive: true,
            },
        });
    }
    async findByUserAndGoalId(userId, goalId) {
        return this.prisma.goal.findFirst({
            where: {
                id: goalId,
                userId,
            },
        });
    }
    async createContribution(data) {
        return this.prisma.goalContribution.create({
            data,
        });
    }
    async findContributionsByGoalId(goalId, startDate, endDate, orderBy) {
        const where = { goalId };
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = startDate;
            if (endDate)
                where.date.lte = endDate;
        }
        return this.prisma.goalContribution.findMany({
            where,
            orderBy: orderBy || { date: "desc" },
        });
    }
    async findContributionsByUserId(userId, startDate, endDate) {
        const where = { userId };
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = startDate;
            if (endDate)
                where.date.lte = endDate;
        }
        return this.prisma.goalContribution.findMany({
            where,
            orderBy: { date: "desc" },
        });
    }
    async findContributionsByUserAndGoal(userId, goalId, startDate, endDate) {
        const where = {
            userId,
            goalId,
        };
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = startDate;
            if (endDate)
                where.date.lte = endDate;
        }
        return this.prisma.goalContribution.findMany({
            where,
            orderBy: { date: "desc" },
        });
    }
    async getGoalsSummaryByUserId(userId) {
        if (!userId) {
            throw new Error("User ID is required for getGoalsSummaryByUserId");
        }
        const goals = await this.prisma.goal.findMany({
            where: { userId, isActive: true },
            select: {
                isCompleted: true,
                targetAmount: true,
                currentAmount: true,
            },
        });
        const totalGoals = goals.length;
        const activeGoals = goals.filter((g) => !g.isCompleted).length;
        const completedGoals = goals.filter((g) => g.isCompleted).length;
        const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount.toNumber(), 0);
        const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount.toNumber(), 0);
        return {
            totalGoals,
            activeGoals,
            completedGoals,
            totalTargetAmount,
            totalCurrentAmount,
        };
    }
    async getRecentTransactionsByUserId(userId, daysBack = 90) {
        if (!userId) {
            throw new Error("User ID is required for getRecentTransactionsByUserId");
        }
        console.log("🔍 Debug: getRecentTransactionsByUserId called with userId:", userId, "daysBack:", daysBack);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);
        try {
            const transactions = await this.prisma.transaction.findMany({
                where: {
                    userId,
                    date: {
                        gte: startDate,
                    },
                },
                include: {
                    category: true,
                    subcategory: true,
                },
                orderBy: { date: "desc" },
            });
            console.log("🔍 Debug: Found transactions:", transactions.length);
            return transactions;
        }
        catch (error) {
            console.error("❌ Error in getRecentTransactionsByUserId:", error);
            throw error;
        }
    }
    async getUserWithIncome(userId) {
        console.log("🔍 Debug: getUserWithIncome called with userId:", userId);
        console.log("🔍 Debug: userId type:", typeof userId);
        console.log("🔍 Debug: userId length:", userId?.length);
        if (!userId) {
            throw new Error("User ID is required for getUserWithIncome");
        }
        if (typeof userId !== "string") {
            throw new Error(`User ID must be a string, received: ${typeof userId}`);
        }
        if (userId.trim() === "") {
            throw new Error("User ID cannot be empty");
        }
        try {
            console.log("🔍 Debug: Executing Prisma query for user:", userId);
            const user = await this.prisma.user.findUnique({
                where: {
                    id: userId.trim(),
                },
                select: {
                    id: true,
                    income: true,
                    incomeFrequency: true,
                    currency: true,
                },
            });
            console.log("🔍 Debug: User query result:", user ? "Found user" : "User not found");
            return user;
        }
        catch (error) {
            console.error("❌ Error in getUserWithIncome:", error);
            console.error("❌ Error details:", {
                message: error.message,
                code: error.code,
                userId: userId,
            });
            throw error;
        }
    }
    async getGoalWithContributions(goalId) {
        return this.prisma.goal.findUnique({
            where: { id: goalId },
            include: {
                contributions: {
                    orderBy: { date: "asc" },
                },
                _count: {
                    select: {
                        contributions: true,
                    },
                },
            },
        });
    }
    async getGoalsWithLatestContribution(userId) {
        if (!userId) {
            throw new Error("User ID is required for getGoalsWithLatestContribution");
        }
        return this.prisma.goal.findMany({
            where: { userId },
            include: {
                contributions: {
                    orderBy: { date: "desc" },
                    take: 1,
                },
                _count: {
                    select: {
                        contributions: true,
                    },
                },
            },
        });
    }
};
exports.GoalsRepository = GoalsRepository;
exports.GoalsRepository = GoalsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], GoalsRepository);
//# sourceMappingURL=goals.repository.js.map
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
var IncomeSourcesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomeSourcesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const date_service_1 = require("../common/services/date.service");
const client_1 = require("@prisma/client");
let IncomeSourcesService = IncomeSourcesService_1 = class IncomeSourcesService {
    constructor(prisma, dateService) {
        this.prisma = prisma;
        this.dateService = dateService;
        this.logger = new common_1.Logger(IncomeSourcesService_1.name);
    }
    async findAll(userId) {
        const sources = await this.prisma.incomeSource.findMany({
            where: { userId },
            orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
        });
        return sources.map((s) => this.toResponse(s));
    }
    async create(userId, dto) {
        const source = await this.prisma.incomeSource.create({
            data: {
                userId,
                name: dto.name,
                amount: dto.amount,
                frequency: dto.frequency,
                nextPaymentDate: new Date(dto.nextPaymentDate),
                isActive: dto.isActive ?? true,
            },
        });
        return this.toResponse(source);
    }
    async update(userId, id, dto) {
        await this.findOwned(userId, id);
        const source = await this.prisma.incomeSource.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.amount !== undefined && { amount: dto.amount }),
                ...(dto.frequency !== undefined && { frequency: dto.frequency }),
                ...(dto.nextPaymentDate !== undefined && {
                    nextPaymentDate: new Date(dto.nextPaymentDate),
                }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });
        return this.toResponse(source);
    }
    async remove(userId, id) {
        await this.findOwned(userId, id);
        await this.prisma.incomeSource.delete({ where: { id } });
    }
    async findOwned(userId, id) {
        const source = await this.prisma.incomeSource.findFirst({
            where: { id, userId },
        });
        if (!source) {
            throw new common_1.NotFoundException("Income source not found");
        }
        return source;
    }
    async materializeDueTransactions(userId, userTimezone) {
        const sources = await this.prisma.incomeSource.findMany({
            where: { userId, isActive: true },
        });
        let created = 0;
        for (const source of sources) {
            let dueDate = new Date(source.nextPaymentDate);
            let iterations = 0;
            while (this.dateService.shouldTransitionPayPeriod(dueDate, userTimezone) &&
                iterations < IncomeSourcesService_1.MAX_OCCURRENCES_PER_RUN) {
                const nextDate = this.dateService.calculateNextPayDateFromCurrent(dueDate, source.frequency);
                const claimedDate = dueDate;
                const materialized = await this.prisma.$transaction(async (tx) => {
                    const claimed = await tx.incomeSource.updateMany({
                        where: { id: source.id, nextPaymentDate: claimedDate },
                        data: { nextPaymentDate: nextDate },
                    });
                    if (claimed.count === 0) {
                        return false;
                    }
                    await tx.transaction.create({
                        data: {
                            userId,
                            description: source.name,
                            amount: source.amount,
                            date: claimedDate,
                            type: client_1.TransactionType.INCOME,
                            recurrence: "none",
                            incomeSourceId: source.id,
                            notes: "Auto-created from income source",
                        },
                    });
                    return true;
                });
                if (!materialized)
                    break;
                created++;
                this.logger.log(`Materialized income source "${source.name}" occurrence for user ${userId} on ${claimedDate.toISOString().slice(0, 10)}`);
                dueDate = nextDate;
                iterations++;
            }
        }
        return created;
    }
    toResponse(source) {
        return {
            id: source.id,
            name: source.name,
            amount: Number(source.amount),
            frequency: source.frequency,
            nextPaymentDate: source.nextPaymentDate.toISOString(),
            isActive: source.isActive,
            createdAt: source.createdAt.toISOString(),
            updatedAt: source.updatedAt.toISOString(),
        };
    }
};
exports.IncomeSourcesService = IncomeSourcesService;
IncomeSourcesService.MAX_OCCURRENCES_PER_RUN = 26;
exports.IncomeSourcesService = IncomeSourcesService = IncomeSourcesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        date_service_1.DateService])
], IncomeSourcesService);
//# sourceMappingURL=income-sources.service.js.map
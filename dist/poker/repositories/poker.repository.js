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
exports.PokerRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let PokerRepository = class PokerRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTournament(data) {
        return this.prisma.pokerTournament.create({
            data,
        });
    }
    async findTournamentById(id) {
        return this.prisma.pokerTournament.findUnique({
            where: { id },
        });
    }
    async findTournamentByIdWithEvents(id) {
        return this.prisma.pokerTournament.findUnique({
            where: { id },
            include: {
                events: {
                    orderBy: { eventDate: 'asc' }
                }
            },
        });
    }
    async findTournamentsByUserId(userId) {
        return this.prisma.pokerTournament.findMany({
            where: { userId },
            orderBy: { dateStart: 'desc' },
            include: {
                events: true
            }
        });
    }
    async updateTournament(id, data) {
        return this.prisma.pokerTournament.update({
            where: { id },
            data,
        });
    }
    async deleteTournament(id) {
        return this.prisma.pokerTournament.delete({
            where: { id },
        });
    }
    async createEvent(data) {
        return this.prisma.pokerTournamentEvent.create({
            data,
        });
    }
    async findEventById(id) {
        return this.prisma.pokerTournamentEvent.findUnique({
            where: { id },
            include: {
                tournament: true
            }
        });
    }
    async findEventsByTournamentId(tournamentId) {
        return this.prisma.pokerTournamentEvent.findMany({
            where: { tournamentId },
            orderBy: { eventDate: 'asc' },
        });
    }
    async findEventsByUserId(userId) {
        return this.prisma.pokerTournamentEvent.findMany({
            where: { userId },
            orderBy: { eventDate: 'desc' },
            include: {
                tournament: true
            }
        });
    }
    async updateEvent(id, data) {
        return this.prisma.pokerTournamentEvent.update({
            where: { id },
            data,
        });
    }
    async deleteEvent(id) {
        return this.prisma.pokerTournamentEvent.delete({
            where: { id },
        });
    }
    async getTournamentStats(tournamentId) {
        const result = await this.prisma.$queryRaw `
      SELECT 
        t.id,
        t.name,
        t.location,
        t."dateStart",
        t."dateEnd",
        t."accommodationCost",
        t."foodBudget", 
        t."otherExpenses",
        (t."accommodationCost" + t."foodBudget" + t."otherExpenses") as "sharedCosts",
        COALESCE(SUM(e."buyIn"), 0) as "totalBuyIns",
        (t."accommodationCost" + t."foodBudget" + t."otherExpenses" + COALESCE(SUM(e."buyIn"), 0)) as "totalInvestment",
        COALESCE(SUM(e.winnings), 0) as "totalWinnings",
        (COALESCE(SUM(e.winnings), 0) - (t."accommodationCost" + t."foodBudget" + t."otherExpenses" + COALESCE(SUM(e."buyIn"), 0))) as "netProfit",
        COUNT(e.id) as "eventsPlayed",
        COUNT(CASE WHEN e.winnings > e."buyIn" THEN 1 END) as "eventsWon"
      FROM poker_tournaments t
      LEFT JOIN poker_tournament_events e ON t.id = e."tournamentId"
      WHERE t.id = ${tournamentId}
      GROUP BY t.id, t.name, t.location, t."dateStart", t."dateEnd", t."accommodationCost", t."foodBudget", t."otherExpenses"
    `;
        return result[0] || null;
    }
    async getUserPokerStats(userId) {
        const result = await this.prisma.$queryRaw `
      SELECT 
        COUNT(DISTINCT t.id) as "totalTournaments",
        COALESCE(SUM(t."accommodationCost" + t."foodBudget" + t."otherExpenses"), 0) as "totalSharedCosts",
        COALESCE(SUM(e."buyIn"), 0) as "totalBuyIns",
        COALESCE(SUM(t."accommodationCost" + t."foodBudget" + t."otherExpenses") + SUM(e."buyIn"), 0) as "totalInvestment",
        COALESCE(SUM(e.winnings), 0) as "totalWinnings",
        COALESCE(SUM(e.winnings) - SUM(t."accommodationCost" + t."foodBudget" + t."otherExpenses") - SUM(e."buyIn"), 0) as "netProfit",
        COUNT(e.id) as "totalEventsPlayed",
        COUNT(CASE WHEN e.winnings > e."buyIn" THEN 1 END) as "totalEventsWon",
        COALESCE(MAX(e.winnings), 0) as "biggestWin",
        COALESCE(MIN(e."buyIn" - e.winnings), 0) as "biggestLoss"
      FROM poker_tournaments t
      LEFT JOIN poker_tournament_events e ON t.id = e."tournamentId"
      WHERE t."userId" = ${userId}
    `;
        return result[0] || null;
    }
};
exports.PokerRepository = PokerRepository;
exports.PokerRepository = PokerRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PokerRepository);
//# sourceMappingURL=poker.repository.js.map
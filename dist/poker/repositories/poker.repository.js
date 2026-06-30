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
                    orderBy: { eventDate: "asc" },
                },
            },
        });
    }
    async findTournamentsByUserId(userId) {
        return this.prisma.pokerTournament.findMany({
            where: { userId },
            orderBy: { dateStart: "desc" },
            include: {
                events: true,
            },
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
                tournament: true,
            },
        });
    }
    async findEventsByTournamentId(tournamentId) {
        return this.prisma.pokerTournamentEvent.findMany({
            where: { tournamentId },
            orderBy: { eventDate: "asc" },
        });
    }
    async findEventsByUserId(userId) {
        return this.prisma.pokerTournamentEvent.findMany({
            where: { userId },
            orderBy: { eventDate: "desc" },
            include: {
                tournament: true,
            },
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
        COALESCE(SUM(e."reBuyAmount"), 0) as "totalReBuys",
        (t."accommodationCost" + t."foodBudget" + t."otherExpenses" + COALESCE(SUM(e."buyIn"), 0) + COALESCE(SUM(e."reBuyAmount"), 0)) as "totalInvestment",
        COALESCE(SUM(e.winnings), 0) as "totalWinnings",
        (COALESCE(SUM(e.winnings), 0) - (t."accommodationCost" + t."foodBudget" + t."otherExpenses" + COALESCE(SUM(e."buyIn"), 0) + COALESCE(SUM(e."reBuyAmount"), 0))) as "netProfit",
        COUNT(e.id) as "eventsPlayed",
        COUNT(CASE WHEN e.winnings > (e."buyIn" + COALESCE(e."reBuyAmount", 0)) THEN 1 END) as "eventsWon"
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
        COALESCE(SUM(ev."buyIns"), 0) as "totalBuyIns",
        COALESCE(SUM(ev."reBuys"), 0) as "totalReBuys",
        COALESCE(SUM(t."accommodationCost" + t."foodBudget" + t."otherExpenses"), 0) + COALESCE(SUM(ev."buyIns"), 0) + COALESCE(SUM(ev."reBuys"), 0) as "totalInvestment",
        COALESCE(SUM(ev."winnings"), 0) as "totalWinnings",
        COALESCE(SUM(ev."winnings"), 0) - COALESCE(SUM(t."accommodationCost" + t."foodBudget" + t."otherExpenses"), 0) - COALESCE(SUM(ev."buyIns"), 0) - COALESCE(SUM(ev."reBuys"), 0) as "netProfit",
        COALESCE(SUM(ev."eventsPlayed"), 0) as "totalEventsPlayed",
        COALESCE(SUM(ev."eventsWon"), 0) as "totalEventsWon",
        COALESCE(MAX(ev."biggestWin"), 0) as "biggestWin",
        COALESCE(MIN(ev."biggestLoss"), 0) as "biggestLoss"
      FROM poker_tournaments t
      LEFT JOIN (
        SELECT
          e."tournamentId",
          SUM(e."buyIn") as "buyIns",
          SUM(e."reBuyAmount") as "reBuys",
          SUM(e.winnings) as "winnings",
          COUNT(e.id) as "eventsPlayed",
          COUNT(CASE WHEN e.winnings > (e."buyIn" + COALESCE(e."reBuyAmount", 0)) THEN 1 END) as "eventsWon",
          MAX(e.winnings) as "biggestWin",
          MIN(e."buyIn" - e.winnings) as "biggestLoss"
        FROM poker_tournament_events e
        GROUP BY e."tournamentId"
      ) ev ON ev."tournamentId" = t.id
      WHERE t."userId" = ${userId}
    `;
        return result[0] || null;
    }
    async createBankrollTransaction(data) {
        return this.prisma.pokerBankrollTransaction.create({ data });
    }
    async findBankrollTransactionsByUserId(userId) {
        return this.prisma.pokerBankrollTransaction.findMany({
            where: { userId },
            orderBy: { date: "desc" },
        });
    }
    async findBankrollTransactionById(id) {
        return this.prisma.pokerBankrollTransaction.findUnique({ where: { id } });
    }
    async deleteBankrollTransaction(id) {
        return this.prisma.pokerBankrollTransaction.delete({ where: { id } });
    }
};
exports.PokerRepository = PokerRepository;
exports.PokerRepository = PokerRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PokerRepository);
//# sourceMappingURL=poker.repository.js.map
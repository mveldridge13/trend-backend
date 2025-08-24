import { Injectable } from "@nestjs/common";
import { 
  PokerTournament, 
  PokerTournamentEvent, 
  Prisma 
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class PokerRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Tournament CRUD operations
  async createTournament(data: Prisma.PokerTournamentCreateInput): Promise<PokerTournament> {
    return this.prisma.pokerTournament.create({
      data,
    });
  }

  async findTournamentById(id: string): Promise<PokerTournament | null> {
    return this.prisma.pokerTournament.findUnique({
      where: { id },
    });
  }

  async findTournamentByIdWithEvents(id: string): Promise<any> {
    return this.prisma.pokerTournament.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { eventDate: 'asc' }
        }
      },
    });
  }

  async findTournamentsByUserId(userId: string): Promise<PokerTournament[]> {
    return this.prisma.pokerTournament.findMany({
      where: { userId },
      orderBy: { dateStart: 'desc' },
      include: {
        events: true
      }
    });
  }

  async updateTournament(
    id: string, 
    data: Prisma.PokerTournamentUpdateInput
  ): Promise<PokerTournament> {
    return this.prisma.pokerTournament.update({
      where: { id },
      data,
    });
  }

  async deleteTournament(id: string): Promise<PokerTournament> {
    return this.prisma.pokerTournament.delete({
      where: { id },
    });
  }

  // Tournament Event CRUD operations
  async createEvent(data: Prisma.PokerTournamentEventCreateInput): Promise<PokerTournamentEvent> {
    return this.prisma.pokerTournamentEvent.create({
      data,
    });
  }

  async findEventById(id: string): Promise<PokerTournamentEvent | null> {
    return this.prisma.pokerTournamentEvent.findUnique({
      where: { id },
      include: {
        tournament: true
      }
    });
  }

  async findEventsByTournamentId(tournamentId: string): Promise<PokerTournamentEvent[]> {
    return this.prisma.pokerTournamentEvent.findMany({
      where: { tournamentId },
      orderBy: { eventDate: 'asc' },
    });
  }

  async findEventsByUserId(userId: string): Promise<PokerTournamentEvent[]> {
    return this.prisma.pokerTournamentEvent.findMany({
      where: { userId },
      orderBy: { eventDate: 'desc' },
      include: {
        tournament: true
      }
    });
  }

  async updateEvent(
    id: string, 
    data: Prisma.PokerTournamentEventUpdateInput
  ): Promise<PokerTournamentEvent> {
    return this.prisma.pokerTournamentEvent.update({
      where: { id },
      data,
    });
  }

  async deleteEvent(id: string): Promise<PokerTournamentEvent> {
    return this.prisma.pokerTournamentEvent.delete({
      where: { id },
    });
  }

  // Analytics queries
  async getTournamentStats(tournamentId: string): Promise<any> {
    const result = await this.prisma.$queryRaw`
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

  async getUserPokerStats(userId: string): Promise<any> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT t.id) as "totalTournaments",
        COALESCE(SUM(t."accommodationCost" + t."foodBudget" + t."otherExpenses"), 0) as "totalSharedCosts",
        COALESCE(SUM(e."buyIn"), 0) as "totalBuyIns",
        COALESCE(SUM(e."reBuyAmount"), 0) as "totalReBuys",
        COALESCE(SUM(t."accommodationCost" + t."foodBudget" + t."otherExpenses") + SUM(e."buyIn") + SUM(e."reBuyAmount"), 0) as "totalInvestment",
        COALESCE(SUM(e.winnings), 0) as "totalWinnings",
        COALESCE(SUM(e.winnings) - SUM(t."accommodationCost" + t."foodBudget" + t."otherExpenses") - SUM(e."buyIn") - SUM(e."reBuyAmount"), 0) as "netProfit",
        COUNT(e.id) as "totalEventsPlayed",
        COUNT(CASE WHEN e.winnings > (e."buyIn" + COALESCE(e."reBuyAmount", 0)) THEN 1 END) as "totalEventsWon",
        COALESCE(MAX(e.winnings), 0) as "biggestWin",
        COALESCE(MIN(e."buyIn" - e.winnings), 0) as "biggestLoss"
      FROM poker_tournaments t
      LEFT JOIN poker_tournament_events e ON t.id = e."tournamentId"
      WHERE t."userId" = ${userId}
    `;
    
    return result[0] || null;
  }
}
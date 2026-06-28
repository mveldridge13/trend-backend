import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PokerRepository } from "./repositories/poker.repository";
import { CreatePokerTournamentDto } from "./dto/create-poker-tournament.dto";
import { UpdatePokerTournamentDto } from "./dto/update-poker-tournament.dto";
import { CreatePokerTournamentEventDto } from "./dto/create-poker-tournament-event.dto";
import { UpdatePokerTournamentEventDto } from "./dto/update-poker-tournament-event.dto";
import {
  PokerTournamentDto,
  PokerTournamentEventDto,
} from "./dto/poker-tournament.dto";
import {
  PokerAnalyticsDto,
  TournamentAnalyticsDto,
} from "./dto/poker-analytics.dto";
import { CreatePokerBankrollTransactionDto } from "./dto/create-poker-bankroll-transaction.dto";
import {
  PokerBankrollDto,
  PokerBankrollStatus,
  PokerBankrollTransactionDto,
} from "./dto/poker-bankroll.dto";

@Injectable()
export class PokerService {
  constructor(private readonly pokerRepository: PokerRepository) {}

  // Tournament CRUD Operations
  async createTournament(
    userId: string,
    createTournamentDto: CreatePokerTournamentDto,
  ): Promise<PokerTournamentDto> {
    // Validate date range
    if (createTournamentDto.dateEnd) {
      const startDate = new Date(createTournamentDto.dateStart);
      const endDate = new Date(createTournamentDto.dateEnd);

      if (endDate < startDate) {
        throw new BadRequestException("End date cannot be before start date");
      }
    }

    const tournamentData = {
      ...createTournamentDto,
      dateStart: new Date(createTournamentDto.dateStart),
      dateEnd: createTournamentDto.dateEnd
        ? new Date(createTournamentDto.dateEnd)
        : null,
      user: {
        connect: { id: userId },
      },
    };

    const tournament =
      await this.pokerRepository.createTournament(tournamentData);
    return this.transformTournamentToDto(tournament);
  }

  async getTournaments(userId: string): Promise<PokerTournamentDto[]> {
    const tournaments =
      await this.pokerRepository.findTournamentsByUserId(userId);
    return tournaments.map((tournament) =>
      this.transformTournamentToDto(tournament),
    );
  }

  async getTournamentById(
    id: string,
    userId: string,
  ): Promise<PokerTournamentDto> {
    const tournament =
      await this.pokerRepository.findTournamentByIdWithEvents(id);

    if (!tournament) {
      throw new NotFoundException("Tournament not found");
    }

    if (tournament.userId !== userId) {
      throw new ForbiddenException("Access denied to this tournament");
    }

    return this.transformTournamentToDto(tournament);
  }

  async updateTournament(
    id: string,
    userId: string,
    updateTournamentDto: UpdatePokerTournamentDto,
  ): Promise<PokerTournamentDto> {
    const existingTournament =
      await this.pokerRepository.findTournamentById(id);

    if (!existingTournament) {
      throw new NotFoundException("Tournament not found");
    }

    if (existingTournament.userId !== userId) {
      throw new ForbiddenException("Access denied to this tournament");
    }

    // Validate date range if both dates are provided
    if (updateTournamentDto.dateStart || updateTournamentDto.dateEnd) {
      const startDate = new Date(
        updateTournamentDto.dateStart || existingTournament.dateStart,
      );
      const endDate = updateTournamentDto.dateEnd
        ? new Date(updateTournamentDto.dateEnd)
        : existingTournament.dateEnd;

      if (endDate && endDate < startDate) {
        throw new BadRequestException("End date cannot be before start date");
      }
    }

    const updateData = {
      ...updateTournamentDto,
      dateStart: updateTournamentDto.dateStart
        ? new Date(updateTournamentDto.dateStart)
        : undefined,
      dateEnd: updateTournamentDto.dateEnd
        ? new Date(updateTournamentDto.dateEnd)
        : undefined,
    };

    const tournament = await this.pokerRepository.updateTournament(
      id,
      updateData,
    );
    return this.transformTournamentToDto(tournament);
  }

  async deleteTournament(id: string, userId: string): Promise<void> {
    const existingTournament =
      await this.pokerRepository.findTournamentById(id);

    if (!existingTournament) {
      throw new NotFoundException("Tournament not found");
    }

    if (existingTournament.userId !== userId) {
      throw new ForbiddenException("Access denied to this tournament");
    }

    await this.pokerRepository.deleteTournament(id);
  }

  // Tournament Event CRUD Operations
  async createTournamentEvent(
    tournamentId: string,
    userId: string,
    createEventDto: CreatePokerTournamentEventDto,
  ): Promise<PokerTournamentEventDto> {
    // Verify tournament exists and user has access
    const tournament =
      await this.pokerRepository.findTournamentById(tournamentId);

    if (!tournament) {
      throw new NotFoundException("Tournament not found");
    }

    if (tournament.userId !== userId) {
      throw new ForbiddenException("Access denied to this tournament");
    }

    const eventData = {
      ...createEventDto,
      eventDate: new Date(createEventDto.eventDate),
      tournament: {
        connect: { id: tournamentId },
      },
      user: {
        connect: { id: userId },
      },
    };

    const event = await this.pokerRepository.createEvent(eventData);
    return this.transformEventToDto(event);
  }

  async updateTournamentEvent(
    eventId: string,
    userId: string,
    updateEventDto: UpdatePokerTournamentEventDto,
  ): Promise<PokerTournamentEventDto> {
    const existingEvent = await this.pokerRepository.findEventById(eventId);

    if (!existingEvent) {
      throw new NotFoundException("Event not found");
    }

    if (existingEvent.userId !== userId) {
      throw new ForbiddenException("Access denied to this event");
    }

    const updateData = {
      ...updateEventDto,
      eventDate: updateEventDto.eventDate
        ? new Date(updateEventDto.eventDate)
        : undefined,
    };

    const event = await this.pokerRepository.updateEvent(eventId, updateData);
    return this.transformEventToDto(event);
  }

  async deleteTournamentEvent(eventId: string, userId: string): Promise<void> {
    const existingEvent = await this.pokerRepository.findEventById(eventId);

    if (!existingEvent) {
      throw new NotFoundException("Event not found");
    }

    if (existingEvent.userId !== userId) {
      throw new ForbiddenException("Access denied to this event");
    }

    await this.pokerRepository.deleteEvent(eventId);
  }

  async getTournamentEvents(
    tournamentId: string,
    userId: string,
  ): Promise<PokerTournamentEventDto[]> {
    const tournament =
      await this.pokerRepository.findTournamentById(tournamentId);

    if (!tournament) {
      throw new NotFoundException("Tournament not found");
    }

    if (tournament.userId !== userId) {
      throw new ForbiddenException("Access denied to this tournament");
    }

    const events =
      await this.pokerRepository.findEventsByTournamentId(tournamentId);
    return events.map((event) => this.transformEventToDto(event));
  }

  // Analytics
  async getPokerAnalytics(userId: string): Promise<PokerAnalyticsDto> {
    const stats = await this.pokerRepository.getUserPokerStats(userId);

    if (!stats) {
      return {
        totalTournaments: 0,
        totalInvestment: 0,
        totalWinnings: 0,
        netProfit: 0,
        overallROI: 0,
        totalEventsPlayed: 0,
        totalEventsWon: 0,
        winRate: 0,
        averageBuyIn: 0,
        averageWinnings: 0,
        biggestWin: 0,
        biggestLoss: 0,
        profitableTournaments: 0,
        profitableTournamentsPercentage: 0,
      };
    }

    const totalEventsPlayed = parseInt(stats.totalEventsPlayed) || 0;
    const totalEventsWon = parseInt(stats.totalEventsWon) || 0;
    const totalInvestment = parseFloat(stats.totalInvestment) || 0;
    const totalWinnings = parseFloat(stats.totalWinnings) || 0;

    return {
      totalTournaments: parseInt(stats.totalTournaments) || 0,
      totalInvestment,
      totalWinnings,
      netProfit: parseFloat(stats.netProfit) || 0,
      overallROI:
        totalInvestment > 0
          ? ((totalWinnings - totalInvestment) / totalInvestment) * 100
          : 0,
      totalEventsPlayed,
      totalEventsWon,
      winRate:
        totalEventsPlayed > 0 ? (totalEventsWon / totalEventsPlayed) * 100 : 0,
      averageBuyIn:
        totalEventsPlayed > 0
          ? parseFloat(stats.totalBuyIns) / totalEventsPlayed
          : 0,
      averageWinnings:
        totalEventsPlayed > 0 ? totalWinnings / totalEventsPlayed : 0,
      biggestWin: parseFloat(stats.biggestWin) || 0,
      biggestLoss: parseFloat(stats.biggestLoss) || 0,
      profitableTournaments: 0, // TODO: Implement
      profitableTournamentsPercentage: 0, // TODO: Implement
    };
  }

  async getTournamentAnalytics(
    tournamentId: string,
    userId: string,
  ): Promise<TournamentAnalyticsDto> {
    const tournament =
      await this.pokerRepository.findTournamentById(tournamentId);

    if (!tournament) {
      throw new NotFoundException("Tournament not found");
    }

    if (tournament.userId !== userId) {
      throw new ForbiddenException("Access denied to this tournament");
    }

    const stats = await this.pokerRepository.getTournamentStats(tournamentId);

    if (!stats) {
      throw new NotFoundException("Tournament statistics not found");
    }

    const eventsPlayed = parseInt(stats.eventsPlayed) || 0;
    const eventsWon = parseInt(stats.eventsWon) || 0;
    const totalInvestment = parseFloat(stats.totalInvestment) || 0;
    const totalWinnings = parseFloat(stats.totalWinnings) || 0;
    const totalBuyIns = parseFloat(stats.totalBuyIns) || 0;

    return {
      tournamentId: stats.id,
      name: stats.name,
      location: stats.location,
      dateStart: stats.dateStart,
      dateEnd: stats.dateEnd,
      sharedCosts: parseFloat(stats.sharedCosts) || 0,
      accommodationCost: parseFloat(stats.accommodationCost) || 0,
      foodBudget: parseFloat(stats.foodBudget) || 0,
      otherExpenses: parseFloat(stats.otherExpenses) || 0,
      totalBuyIns,
      totalWinnings,
      totalInvestment,
      netProfit: parseFloat(stats.netProfit) || 0,
      roi:
        totalInvestment > 0
          ? ((totalWinnings - totalInvestment) / totalInvestment) * 100
          : 0,
      eventsPlayed,
      eventsWon,
      winRate: eventsPlayed > 0 ? (eventsWon / eventsPlayed) * 100 : 0,
      averageBuyIn: eventsPlayed > 0 ? totalBuyIns / eventsPlayed : 0,
      averageWinnings: eventsPlayed > 0 ? totalWinnings / eventsPlayed : 0,
      costPerEvent: eventsPlayed > 0 ? totalInvestment / eventsPlayed : 0,
      biggestWin: 0, // TODO: Implement
      bestFinish: undefined, // TODO: Implement
      worstFinish: undefined, // TODO: Implement
    };
  }

  // Bankroll Ledger (deposits/withdrawals only — global, siloed from budget)
  async createBankrollTransaction(
    userId: string,
    dto: CreatePokerBankrollTransactionDto,
  ): Promise<PokerBankrollTransactionDto> {
    const transaction = await this.pokerRepository.createBankrollTransaction({
      type: dto.type,
      amount: dto.amount,
      note: dto.note ?? null,
      date: dto.date ? new Date(dto.date) : new Date(),
      user: { connect: { id: userId } },
    });
    return this.transformBankrollTransactionToDto(transaction);
  }

  async getBankrollTransactions(
    userId: string,
  ): Promise<PokerBankrollTransactionDto[]> {
    const transactions =
      await this.pokerRepository.findBankrollTransactionsByUserId(userId);
    return transactions.map((t) => this.transformBankrollTransactionToDto(t));
  }

  async deleteBankrollTransaction(id: string, userId: string): Promise<void> {
    const transaction =
      await this.pokerRepository.findBankrollTransactionById(id);
    if (!transaction) {
      throw new NotFoundException("Bankroll transaction not found");
    }
    if (transaction.userId !== userId) {
      throw new ForbiddenException(
        "You do not have access to this bankroll transaction",
      );
    }
    await this.pokerRepository.deleteBankrollTransaction(id);
  }

  // Computed bankroll picture: combines the ledger (deposits/withdrawals)
  // with lifetime net profit from play results. The ledger never holds play
  // results, so the two sources stay separate (no double-count).
  async getBankroll(userId: string): Promise<PokerBankrollDto> {
    const [transactions, stats] = await Promise.all([
      this.pokerRepository.findBankrollTransactionsByUserId(userId),
      this.pokerRepository.getUserPokerStats(userId),
    ]);

    const totalDeposits = transactions
      .filter((t) => t.type === "DEPOSIT")
      .reduce((sum, t) => sum + parseFloat(t.amount as any), 0);
    const totalWithdrawals = transactions
      .filter((t) => t.type === "WITHDRAWAL")
      .reduce((sum, t) => sum + parseFloat(t.amount as any), 0);
    const lifetimeNetProfit = stats ? parseFloat(stats.netProfit) || 0 : 0;

    const D = totalDeposits;
    const W = totalWithdrawals;
    const N = lifetimeNetProfit;

    const currentBankroll = D - W + N; // B
    const originalCapital = D; // C
    const capitalAtRisk = Math.max(0, D - W);
    const capitalRecouped = Math.min(W, D);
    // Recouped your whole stake → playing on house money. Requires having staked.
    const isFreerolling = D > 0 && W >= D && currentBankroll > 0;

    let status: PokerBankrollStatus = "BUILDING";
    let suggestedWithdrawal = 0;
    if (originalCapital > 0) {
      if (isFreerolling || N >= 2 * originalCapital) {
        status = "FREEROLL";
        // Freeroll territory: pull any remaining at-risk capital, let profit ride.
        suggestedWithdrawal = capitalAtRisk;
      } else if (N >= originalCapital) {
        status = "IN_PROFIT";
        // In profit: pocket profit above capital, keep your capital riding.
        suggestedWithdrawal = Math.max(0, currentBankroll - originalCapital);
      }
    }
    // Never suggest withdrawing more than is actually in the bankroll.
    suggestedWithdrawal = Math.min(
      suggestedWithdrawal,
      Math.max(0, currentBankroll),
    );

    const round = (n: number) => Math.round(n * 100) / 100;

    return {
      totalDeposits: round(D),
      totalWithdrawals: round(W),
      lifetimeNetProfit: round(N),
      currentBankroll: round(currentBankroll),
      originalCapital: round(originalCapital),
      capitalAtRisk: round(capitalAtRisk),
      capitalRecouped: round(capitalRecouped),
      status,
      isFreerolling,
      suggestedWithdrawal: round(suggestedWithdrawal),
      transactions: transactions.map((t) =>
        this.transformBankrollTransactionToDto(t),
      ),
    };
  }

  // Helper methods
  private transformBankrollTransactionToDto(
    transaction: any,
  ): PokerBankrollTransactionDto {
    return {
      id: transaction.id,
      userId: transaction.userId,
      type: transaction.type,
      amount: parseFloat(transaction.amount),
      note: transaction.note ?? undefined,
      date: transaction.date,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  private transformTournamentToDto(tournament: any): PokerTournamentDto {
    const events = tournament.events || [];
    const totalBuyIns = events.reduce(
      (sum: number, event: any) => sum + parseFloat(event.buyIn),
      0,
    );
    const totalReBuyCosts = events.reduce(
      (sum: number, event: any) => sum + (parseFloat(event.reBuyAmount) || 0),
      0,
    );
    const totalWinnings = events.reduce(
      (sum: number, event: any) => sum + parseFloat(event.winnings),
      0,
    );
    const totalSharedCosts =
      parseFloat(tournament.accommodationCost) +
      parseFloat(tournament.foodBudget) +
      parseFloat(tournament.otherExpenses);
    const totalInvestment = totalSharedCosts + totalBuyIns + totalReBuyCosts;
    const netProfit = totalWinnings - totalInvestment;
    const eventsWon = events.filter(
      (event: any) =>
        parseFloat(event.winnings) >
        parseFloat(event.buyIn) + (parseFloat(event.reBuyAmount) || 0),
    ).length;

    return {
      id: tournament.id,
      userId: tournament.userId,
      name: tournament.name,
      location: tournament.location,
      venue: tournament.venue,
      dateStart: tournament.dateStart,
      dateEnd: tournament.dateEnd,
      accommodationCost: parseFloat(tournament.accommodationCost),
      foodBudget: parseFloat(tournament.foodBudget),
      otherExpenses: parseFloat(tournament.otherExpenses),
      notes: tournament.notes,
      createdAt: tournament.createdAt,
      updatedAt: tournament.updatedAt,
      totalSharedCosts,
      totalBuyIns,
      totalInvestment,
      totalWinnings,
      netProfit,
      eventsPlayed: events.length,
      eventsWon,
      roi: totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0,
      events: events.map((event: any) => this.transformEventToDto(event)),
    };
  }

  private transformEventToDto(event: any): PokerTournamentEventDto {
    return {
      id: event.id,
      tournamentId: event.tournamentId,
      userId: event.userId,
      eventName: event.eventName,
      eventNumber: event.eventNumber,
      buyIn: parseFloat(event.buyIn),
      winnings: parseFloat(event.winnings),
      eventDate: event.eventDate,
      gameType: event.gameType,
      fieldSize: event.fieldSize,
      finishPosition: event.finishPosition,
      notes: event.notes,
      reBuys: event.reBuys,
      reBuyAmount: event.reBuyAmount
        ? parseFloat(event.reBuyAmount)
        : undefined,
      startingStack: event.startingStack,
      isClosed: event.isClosed,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}

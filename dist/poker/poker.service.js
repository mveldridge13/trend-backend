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
exports.PokerService = void 0;
const common_1 = require("@nestjs/common");
const poker_repository_1 = require("./repositories/poker.repository");
let PokerService = class PokerService {
    constructor(pokerRepository) {
        this.pokerRepository = pokerRepository;
    }
    async createTournament(userId, createTournamentDto) {
        if (createTournamentDto.dateEnd) {
            const startDate = new Date(createTournamentDto.dateStart);
            const endDate = new Date(createTournamentDto.dateEnd);
            if (endDate < startDate) {
                throw new common_1.BadRequestException("End date cannot be before start date");
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
        const tournament = await this.pokerRepository.createTournament(tournamentData);
        return this.transformTournamentToDto(tournament);
    }
    async getTournaments(userId) {
        const tournaments = await this.pokerRepository.findTournamentsByUserId(userId);
        return tournaments.map(tournament => this.transformTournamentToDto(tournament));
    }
    async getTournamentById(id, userId) {
        const tournament = await this.pokerRepository.findTournamentByIdWithEvents(id);
        if (!tournament) {
            throw new common_1.NotFoundException("Tournament not found");
        }
        if (tournament.userId !== userId) {
            throw new common_1.ForbiddenException("Access denied to this tournament");
        }
        return this.transformTournamentToDto(tournament);
    }
    async updateTournament(id, userId, updateTournamentDto) {
        const existingTournament = await this.pokerRepository.findTournamentById(id);
        if (!existingTournament) {
            throw new common_1.NotFoundException("Tournament not found");
        }
        if (existingTournament.userId !== userId) {
            throw new common_1.ForbiddenException("Access denied to this tournament");
        }
        if (updateTournamentDto.dateStart || updateTournamentDto.dateEnd) {
            const startDate = new Date(updateTournamentDto.dateStart || existingTournament.dateStart);
            const endDate = updateTournamentDto.dateEnd
                ? new Date(updateTournamentDto.dateEnd)
                : existingTournament.dateEnd;
            if (endDate && endDate < startDate) {
                throw new common_1.BadRequestException("End date cannot be before start date");
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
        const tournament = await this.pokerRepository.updateTournament(id, updateData);
        return this.transformTournamentToDto(tournament);
    }
    async deleteTournament(id, userId) {
        const existingTournament = await this.pokerRepository.findTournamentById(id);
        if (!existingTournament) {
            throw new common_1.NotFoundException("Tournament not found");
        }
        if (existingTournament.userId !== userId) {
            throw new common_1.ForbiddenException("Access denied to this tournament");
        }
        await this.pokerRepository.deleteTournament(id);
    }
    async createTournamentEvent(tournamentId, userId, createEventDto) {
        const tournament = await this.pokerRepository.findTournamentById(tournamentId);
        if (!tournament) {
            throw new common_1.NotFoundException("Tournament not found");
        }
        if (tournament.userId !== userId) {
            throw new common_1.ForbiddenException("Access denied to this tournament");
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
    async updateTournamentEvent(eventId, userId, updateEventDto) {
        const existingEvent = await this.pokerRepository.findEventById(eventId);
        if (!existingEvent) {
            throw new common_1.NotFoundException("Event not found");
        }
        if (existingEvent.userId !== userId) {
            throw new common_1.ForbiddenException("Access denied to this event");
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
    async deleteTournamentEvent(eventId, userId) {
        const existingEvent = await this.pokerRepository.findEventById(eventId);
        if (!existingEvent) {
            throw new common_1.NotFoundException("Event not found");
        }
        if (existingEvent.userId !== userId) {
            throw new common_1.ForbiddenException("Access denied to this event");
        }
        await this.pokerRepository.deleteEvent(eventId);
    }
    async getTournamentEvents(tournamentId, userId) {
        const tournament = await this.pokerRepository.findTournamentById(tournamentId);
        if (!tournament) {
            throw new common_1.NotFoundException("Tournament not found");
        }
        if (tournament.userId !== userId) {
            throw new common_1.ForbiddenException("Access denied to this tournament");
        }
        const events = await this.pokerRepository.findEventsByTournamentId(tournamentId);
        return events.map(event => this.transformEventToDto(event));
    }
    async getPokerAnalytics(userId) {
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
            overallROI: totalInvestment > 0
                ? ((totalWinnings - totalInvestment) / totalInvestment) * 100
                : 0,
            totalEventsPlayed,
            totalEventsWon,
            winRate: totalEventsPlayed > 0
                ? (totalEventsWon / totalEventsPlayed) * 100
                : 0,
            averageBuyIn: totalEventsPlayed > 0
                ? parseFloat(stats.totalBuyIns) / totalEventsPlayed
                : 0,
            averageWinnings: totalEventsPlayed > 0
                ? totalWinnings / totalEventsPlayed
                : 0,
            biggestWin: parseFloat(stats.biggestWin) || 0,
            biggestLoss: parseFloat(stats.biggestLoss) || 0,
            profitableTournaments: 0,
            profitableTournamentsPercentage: 0,
        };
    }
    async getTournamentAnalytics(tournamentId, userId) {
        const tournament = await this.pokerRepository.findTournamentById(tournamentId);
        if (!tournament) {
            throw new common_1.NotFoundException("Tournament not found");
        }
        if (tournament.userId !== userId) {
            throw new common_1.ForbiddenException("Access denied to this tournament");
        }
        const stats = await this.pokerRepository.getTournamentStats(tournamentId);
        if (!stats) {
            throw new common_1.NotFoundException("Tournament statistics not found");
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
            roi: totalInvestment > 0
                ? ((totalWinnings - totalInvestment) / totalInvestment) * 100
                : 0,
            eventsPlayed,
            eventsWon,
            winRate: eventsPlayed > 0 ? (eventsWon / eventsPlayed) * 100 : 0,
            averageBuyIn: eventsPlayed > 0 ? totalBuyIns / eventsPlayed : 0,
            averageWinnings: eventsPlayed > 0 ? totalWinnings / eventsPlayed : 0,
            costPerEvent: eventsPlayed > 0 ? totalInvestment / eventsPlayed : 0,
            biggestWin: 0,
            bestFinish: undefined,
            worstFinish: undefined,
        };
    }
    transformTournamentToDto(tournament) {
        const events = tournament.events || [];
        const totalBuyIns = events.reduce((sum, event) => sum + parseFloat(event.buyIn), 0);
        const totalReBuyCosts = events.reduce((sum, event) => sum + (parseFloat(event.reBuyAmount) || 0), 0);
        const totalWinnings = events.reduce((sum, event) => sum + parseFloat(event.winnings), 0);
        const totalSharedCosts = parseFloat(tournament.accommodationCost) +
            parseFloat(tournament.foodBudget) +
            parseFloat(tournament.otherExpenses);
        const totalInvestment = totalSharedCosts + totalBuyIns + totalReBuyCosts;
        const netProfit = totalWinnings - totalInvestment;
        const eventsWon = events.filter((event) => parseFloat(event.winnings) > (parseFloat(event.buyIn) + (parseFloat(event.reBuyAmount) || 0))).length;
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
            events: events.map((event) => this.transformEventToDto(event)),
        };
    }
    transformEventToDto(event) {
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
            reBuyAmount: event.reBuyAmount ? parseFloat(event.reBuyAmount) : undefined,
            startingStack: event.startingStack,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
        };
    }
};
exports.PokerService = PokerService;
exports.PokerService = PokerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [poker_repository_1.PokerRepository])
], PokerService);
//# sourceMappingURL=poker.service.js.map
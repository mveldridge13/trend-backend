import { PokerRepository } from "./repositories/poker.repository";
import { CreatePokerTournamentDto } from "./dto/create-poker-tournament.dto";
import { UpdatePokerTournamentDto } from "./dto/update-poker-tournament.dto";
import { CreatePokerTournamentEventDto } from "./dto/create-poker-tournament-event.dto";
import { UpdatePokerTournamentEventDto } from "./dto/update-poker-tournament-event.dto";
import { PokerTournamentDto, PokerTournamentEventDto } from "./dto/poker-tournament.dto";
import { PokerAnalyticsDto, TournamentAnalyticsDto } from "./dto/poker-analytics.dto";
export declare class PokerService {
    private readonly pokerRepository;
    constructor(pokerRepository: PokerRepository);
    createTournament(userId: string, createTournamentDto: CreatePokerTournamentDto): Promise<PokerTournamentDto>;
    getTournaments(userId: string): Promise<PokerTournamentDto[]>;
    getTournamentById(id: string, userId: string): Promise<PokerTournamentDto>;
    updateTournament(id: string, userId: string, updateTournamentDto: UpdatePokerTournamentDto): Promise<PokerTournamentDto>;
    deleteTournament(id: string, userId: string): Promise<void>;
    createTournamentEvent(tournamentId: string, userId: string, createEventDto: CreatePokerTournamentEventDto): Promise<PokerTournamentEventDto>;
    updateTournamentEvent(eventId: string, userId: string, updateEventDto: UpdatePokerTournamentEventDto): Promise<PokerTournamentEventDto>;
    deleteTournamentEvent(eventId: string, userId: string): Promise<void>;
    getTournamentEvents(tournamentId: string, userId: string): Promise<PokerTournamentEventDto[]>;
    getPokerAnalytics(userId: string): Promise<PokerAnalyticsDto>;
    getTournamentAnalytics(tournamentId: string, userId: string): Promise<TournamentAnalyticsDto>;
    private transformTournamentToDto;
    private transformEventToDto;
}

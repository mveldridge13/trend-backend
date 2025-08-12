import { PokerService } from "./poker.service";
import { CreatePokerTournamentDto } from "./dto/create-poker-tournament.dto";
import { UpdatePokerTournamentDto } from "./dto/update-poker-tournament.dto";
import { CreatePokerTournamentEventDto } from "./dto/create-poker-tournament-event.dto";
import { UpdatePokerTournamentEventDto } from "./dto/update-poker-tournament-event.dto";
import { PokerTournamentDto, PokerTournamentEventDto } from "./dto/poker-tournament.dto";
import { PokerAnalyticsDto, TournamentAnalyticsDto } from "./dto/poker-analytics.dto";
export declare class PokerController {
    private readonly pokerService;
    constructor(pokerService: PokerService);
    private extractUserId;
    createTournament(req: any, createTournamentDto: CreatePokerTournamentDto): Promise<PokerTournamentDto>;
    getTournaments(req: any): Promise<PokerTournamentDto[]>;
    getTournamentById(req: any, id: string): Promise<PokerTournamentDto>;
    updateTournament(req: any, id: string, updateTournamentDto: UpdatePokerTournamentDto): Promise<PokerTournamentDto>;
    deleteTournament(req: any, id: string): Promise<void>;
    createTournamentEvent(req: any, tournamentId: string, createEventDto: CreatePokerTournamentEventDto): Promise<PokerTournamentEventDto>;
    updateTournamentEvent(req: any, eventId: string, updateEventDto: UpdatePokerTournamentEventDto): Promise<PokerTournamentEventDto>;
    deleteTournamentEvent(req: any, eventId: string): Promise<void>;
    getPokerAnalytics(req: any): Promise<PokerAnalyticsDto>;
    getTournamentAnalytics(req: any, id: string): Promise<TournamentAnalyticsDto>;
}

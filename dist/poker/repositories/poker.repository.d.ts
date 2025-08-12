import { PokerTournament, PokerTournamentEvent, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
export declare class PokerRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createTournament(data: Prisma.PokerTournamentCreateInput): Promise<PokerTournament>;
    findTournamentById(id: string): Promise<PokerTournament | null>;
    findTournamentByIdWithEvents(id: string): Promise<any>;
    findTournamentsByUserId(userId: string): Promise<PokerTournament[]>;
    updateTournament(id: string, data: Prisma.PokerTournamentUpdateInput): Promise<PokerTournament>;
    deleteTournament(id: string): Promise<PokerTournament>;
    createEvent(data: Prisma.PokerTournamentEventCreateInput): Promise<PokerTournamentEvent>;
    findEventById(id: string): Promise<PokerTournamentEvent | null>;
    findEventsByTournamentId(tournamentId: string): Promise<PokerTournamentEvent[]>;
    findEventsByUserId(userId: string): Promise<PokerTournamentEvent[]>;
    updateEvent(id: string, data: Prisma.PokerTournamentEventUpdateInput): Promise<PokerTournamentEvent>;
    deleteEvent(id: string): Promise<PokerTournamentEvent>;
    getTournamentStats(tournamentId: string): Promise<any>;
    getUserPokerStats(userId: string): Promise<any>;
}

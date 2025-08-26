import { GameType } from "./poker-tournament.dto";
export declare class CreatePokerTournamentEventDto {
    eventName: string;
    eventNumber?: string;
    buyIn: number;
    winnings?: number;
    eventDate: string;
    gameType?: GameType;
    fieldSize?: number;
    finishPosition?: number;
    notes?: string;
    reBuys?: number;
    reBuyAmount?: number;
    startingStack?: number;
    isClosed?: boolean;
}

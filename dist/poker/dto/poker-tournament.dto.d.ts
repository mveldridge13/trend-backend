export declare class PokerTournamentDto {
    id: string;
    userId: string;
    name: string;
    location: string;
    venue?: string;
    dateStart: Date;
    dateEnd?: Date;
    accommodationCost: number;
    foodBudget: number;
    otherExpenses: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    totalSharedCosts?: number;
    totalBuyIns?: number;
    totalInvestment?: number;
    totalWinnings?: number;
    netProfit?: number;
    eventsPlayed?: number;
    eventsWon?: number;
    roi?: number;
    events?: PokerTournamentEventDto[];
}
export declare class PokerTournamentEventDto {
    id: string;
    tournamentId: string;
    userId: string;
    eventName: string;
    eventNumber?: string;
    buyIn: number;
    winnings: number;
    eventDate: Date;
    gameType?: string;
    fieldSize?: number;
    finishPosition?: number;
    notes?: string;
    reBuys?: number;
    reBuyAmount?: number;
    startingStack?: number;
    createdAt: Date;
    updatedAt: Date;
}

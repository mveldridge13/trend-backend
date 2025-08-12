export declare class PokerAnalyticsDto {
    totalTournaments: number;
    totalInvestment: number;
    totalWinnings: number;
    netProfit: number;
    overallROI: number;
    totalEventsPlayed: number;
    totalEventsWon: number;
    winRate: number;
    averageBuyIn: number;
    averageWinnings: number;
    biggestWin: number;
    biggestLoss: number;
    profitableTournaments: number;
    profitableTournamentsPercentage: number;
}
export declare class TournamentAnalyticsDto {
    tournamentId: string;
    name: string;
    location: string;
    dateStart: Date;
    dateEnd?: Date;
    sharedCosts: number;
    accommodationCost: number;
    foodBudget: number;
    otherExpenses: number;
    totalBuyIns: number;
    totalWinnings: number;
    totalInvestment: number;
    netProfit: number;
    roi: number;
    eventsPlayed: number;
    eventsWon: number;
    winRate: number;
    averageBuyIn: number;
    averageWinnings: number;
    costPerEvent: number;
    biggestWin: number;
    bestFinish?: number;
    worstFinish?: number;
}

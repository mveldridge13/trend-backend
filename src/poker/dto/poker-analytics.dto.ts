export class PokerAnalyticsDto {
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

export class TournamentAnalyticsDto {
  tournamentId: string;
  name: string;
  location: string;
  dateStart: Date;
  dateEnd?: Date;

  // Costs breakdown
  sharedCosts: number;
  accommodationCost: number;
  foodBudget: number;
  otherExpenses: number;

  // Event performance
  totalBuyIns: number;
  totalWinnings: number;
  totalInvestment: number;
  netProfit: number;
  roi: number;

  // Event statistics
  eventsPlayed: number;
  eventsWon: number;
  winRate: number;
  averageBuyIn: number;
  averageWinnings: number;
  costPerEvent: number;

  // Best performances
  biggestWin: number;
  bestFinish?: number;
  worstFinish?: number;
}

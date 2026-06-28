export enum GameType {
  NO_LIMIT_HOLDEM = "NO_LIMIT_HOLDEM",
  SATELLITE = "SATELLITE",
  FREEZEOUT = "FREEZEOUT",
  BOUNTY = "BOUNTY",
  TURBO = "TURBO",
  DEEPSTACK = "DEEPSTACK",
  TEAM_EVENT = "TEAM_EVENT",
}

export class PokerTournamentDto {
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

  // Calculated fields
  totalSharedCosts?: number;
  totalBuyIns?: number;
  totalInvestment?: number;
  totalWinnings?: number;
  netProfit?: number;
  eventsPlayed?: number;
  eventsWon?: number;
  roi?: number;

  // Related data
  events?: PokerTournamentEventDto[];
}

export class PokerTournamentEventDto {
  id: string;
  tournamentId: string;
  userId: string;
  eventName: string;
  eventNumber?: string;
  buyIn: number;
  winnings: number;
  eventDate: Date;
  gameType?: GameType;
  fieldSize?: number;
  finishPosition?: number;
  notes?: string;
  reBuys?: number;
  reBuyAmount?: number;
  startingStack?: number;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

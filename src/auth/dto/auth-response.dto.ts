import { IncomeFrequency } from "@prisma/client";

export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string | null;
    currency: string;
    timezone: string;
    createdAt: Date;
    income: number | null;
    incomeFrequency: IncomeFrequency | null;
    nextPayDate: Date | null;
    fixedExpenses: number | null;
    setupComplete: boolean;
    hasSeenBalanceCardTour: boolean;
    hasSeenAddTransactionTour: boolean;
    hasSeenTransactionSwipeTour: boolean;
  };
}

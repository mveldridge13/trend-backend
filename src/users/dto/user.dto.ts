import { IncomeFrequency } from "@prisma/client";

export class UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string | null;
  currency: string;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // User setup fields - Enhanced with income frequency
  income?: number;
  incomeFrequency?: IncomeFrequency;
  nextPayDate?: Date;
  fixedExpenses?: number;
  setupComplete: boolean;
  hasSeenWelcome: boolean;

  // Tutorial onboarding fields - removed optional modifiers for consistency
  hasSeenBalanceCardTour: boolean;
  hasSeenAddTransactionTour: boolean;
  hasSeenTransactionSwipeTour: boolean;
}

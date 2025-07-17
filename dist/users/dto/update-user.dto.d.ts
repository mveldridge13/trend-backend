import { IncomeFrequency } from "@prisma/client";
export declare class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    username?: string | null;
    currency?: string;
    timezone?: string;
    isActive?: boolean;
    income?: number;
    incomeFrequency?: IncomeFrequency;
    nextPayDate?: string;
    fixedExpenses?: number;
    setupComplete?: boolean;
    hasSeenWelcome?: boolean;
    hasSeenBalanceCardTour?: boolean;
    hasSeenAddTransactionTour?: boolean;
    hasSeenTransactionSwipeTour?: boolean;
}

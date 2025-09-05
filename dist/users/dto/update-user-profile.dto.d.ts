import { IncomeFrequency } from "@prisma/client";
export declare class UpdateUserProfileDto {
    firstName?: string;
    lastName?: string;
    username?: string;
    currency?: string;
    timezone?: string;
    income?: number;
    incomeFrequency?: IncomeFrequency;
    nextPayDate?: string;
    fixedExpenses?: number;
    setupComplete?: boolean;
    hasSeenWelcome?: boolean;
    hasSeenBalanceCardTour?: boolean;
    hasSeenAddTransactionTour?: boolean;
    hasSeenTransactionSwipeTour?: boolean;
    rolloverAmount?: number;
    lastRolloverDate?: string;
}

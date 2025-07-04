import { IncomeFrequency } from "@prisma/client";
export declare class UserDto {
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
    income?: number;
    incomeFrequency?: IncomeFrequency;
    nextPayDate?: Date;
    fixedExpenses?: number;
    setupComplete: boolean;
    hasSeenWelcome: boolean;
    hasSeenBalanceCardTour: boolean;
    hasSeenAddTransactionTour: boolean;
    hasSeenTransactionSwipeTour: boolean;
}

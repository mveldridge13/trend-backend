import { IncomeFrequency } from "@prisma/client";
import { RolloverEntryDto } from "./rollover-entry.dto";
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
    rolloverAmount?: number;
    lastRolloverDate?: Date;
    rolloverHistory?: RolloverEntryDto[];
    hasSeenBalanceCardTour: boolean;
    hasSeenAddTransactionTour: boolean;
    hasSeenTransactionSwipeTour: boolean;
}

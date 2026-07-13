import { IncomeFrequency } from "@prisma/client";
export declare class UpdateIncomeSourceDto {
    name?: string;
    amount?: number;
    frequency?: IncomeFrequency;
    nextPaymentDate?: string;
    isActive?: boolean;
}

import { IncomeFrequency } from "@prisma/client";
export declare class CreateIncomeSourceDto {
    name: string;
    amount: number;
    frequency: IncomeFrequency;
    nextPaymentDate: string;
    isActive?: boolean;
}

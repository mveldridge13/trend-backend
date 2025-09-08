import { RolloverType } from "@prisma/client";
export declare class CreateRolloverEntryDto {
    amount: number;
    type: RolloverType;
    periodStart: string;
    periodEnd: string;
    description?: string;
}

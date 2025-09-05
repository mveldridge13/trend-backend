import { RolloverType } from "@prisma/client";
export declare class RolloverEntryDto {
    id: string;
    amount: number;
    date: Date;
    type: RolloverType;
    periodStart: Date;
    periodEnd: Date;
    description?: string;
}

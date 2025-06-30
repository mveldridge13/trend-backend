import { ContributionType } from "@prisma/client";
export declare class CreateGoalContributionDto {
    amount: number;
    currency?: string;
    date?: string;
    description?: string;
    type?: ContributionType;
    transactionId?: string;
}

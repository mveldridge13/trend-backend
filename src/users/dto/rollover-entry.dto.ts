import { RolloverType } from "@prisma/client";

export class RolloverEntryDto {
  id: string;
  amount: number;
  date: Date;
  type: RolloverType;
  periodStart: Date;
  periodEnd: Date;
  description?: string;
}

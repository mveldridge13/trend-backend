import { RolloverType } from "@prisma/client";
import { IsNumber, IsEnum, IsString, IsOptional, IsISO8601 } from "class-validator";

export class CreateRolloverEntryDto {
  @IsNumber()
  amount: number;

  @IsEnum(RolloverType)
  type: RolloverType;

  @IsISO8601()
  periodStart: string;

  @IsISO8601()
  periodEnd: string;

  @IsOptional()
  @IsString()
  description?: string;
}
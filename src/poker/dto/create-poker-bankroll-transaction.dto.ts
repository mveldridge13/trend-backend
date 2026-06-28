import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsString,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";
import { PokerBankrollTransactionType } from "@prisma/client";

export class CreatePokerBankrollTransactionDto {
  @IsEnum(PokerBankrollTransactionType)
  type: PokerBankrollTransactionType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999999.99)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  // Optional; defaults to now() on the server when omitted.
  @IsOptional()
  @IsDateString()
  date?: string;
}

import {
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  IsString,
  MaxLength,
  IsDateString,
  IsEnum,
} from "class-validator";
import { IncomeFrequency } from "@prisma/client";

export class UpdateUserProfileDto {
  // Basic profile fields
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  // User setup fields - Enhanced with income frequency
  @IsOptional()
  @IsNumber()
  @Min(0)
  income?: number;

  @IsOptional()
  @IsEnum(IncomeFrequency)
  incomeFrequency?: IncomeFrequency;

  @IsOptional()
  @IsDateString()
  nextPayDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedExpenses?: number;

  @IsOptional()
  @IsBoolean()
  setupComplete?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSeenWelcome?: boolean;

  // Tutorial onboarding fields
  @IsOptional()
  @IsBoolean()
  hasSeenBalanceCardTour?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSeenAddTransactionTour?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSeenTransactionSwipeTour?: boolean;
}

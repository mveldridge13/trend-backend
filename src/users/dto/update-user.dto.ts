import {
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  IsNumber,
  IsDateString,
  Length,
  IsIn,
  IsEnum,
  Min,
} from "class-validator";
import { IncomeFrequency } from "@prisma/client";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(3, 30)
  username?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(["USD", "EUR", "GBP", "CAD", "AUD", "JPY"])
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // ============================================================================
  // INCOME SETUP FIELDS - ENHANCED
  // ============================================================================

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

  // ============================================================================
  // TUTORIAL ONBOARDING FIELDS
  // ============================================================================

  @IsOptional()
  @IsBoolean()
  hasSeenBalanceCardTour?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSeenAddTransactionTour?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSeenTransactionSwipeTour?: boolean;

  // ============================================================================
  // ROLLOVER FIELDS
  // ============================================================================

  @IsOptional()
  @IsNumber()
  @Min(0)
  rolloverAmount?: number;

  @IsOptional()
  @IsDateString()
  lastRolloverDate?: string;
}

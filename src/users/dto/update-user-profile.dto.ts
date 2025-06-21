// UpdateUserProfileDto.ts

import { IsOptional, IsBoolean, IsNumber, Min } from "class-validator";

export class UpdateUserProfileDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  income?: number;

  @IsOptional()
  @IsBoolean()
  setupComplete?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSeenWelcome?: boolean;

  // NEW: Add these fields
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

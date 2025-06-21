import {
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  IsNumber,
  Length,
  IsIn,
  Min,
} from "class-validator";

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

  // User setup fields
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

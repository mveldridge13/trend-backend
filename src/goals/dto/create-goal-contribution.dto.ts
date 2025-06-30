import {
  IsString,
  IsNotEmpty,
  IsDecimal,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ContributionType } from "@prisma/client";

export class CreateGoalContributionDto {
  @IsDecimal({ decimal_digits: "0,2" })
  @Type(() => Number)
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string = "USD";

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(ContributionType)
  type?: ContributionType = ContributionType.MANUAL;

  @IsOptional()
  @IsString()
  transactionId?: string;
}

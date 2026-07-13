import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  MaxLength,
  Min,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { IncomeFrequency } from "@prisma/client";

export class CreateIncomeSourceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  amount: number;

  @IsEnum(IncomeFrequency)
  frequency: IncomeFrequency;

  @IsDateString()
  nextPaymentDate: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

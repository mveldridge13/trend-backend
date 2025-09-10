import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export class CreatePokerTournamentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  venue?: string;

  @IsDateString()
  dateStart: string;

  @IsOptional()
  @IsDateString()
  dateEnd?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999.99)
  @Type(() => Number)
  accommodationCost?: number = 0;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999.99)
  @Type(() => Number)
  foodBudget?: number = 0;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999.99)
  @Type(() => Number)
  otherExpenses?: number = 0;

  @IsOptional()
  @IsString()
  notes?: string;
}

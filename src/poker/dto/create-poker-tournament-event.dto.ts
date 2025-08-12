import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreatePokerTournamentEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  eventName: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  eventNumber?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999.99)
  @Type(() => Number)
  buyIn: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  @Type(() => Number)
  winnings?: number = 0;

  @IsDateString()
  eventDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  gameType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50000)
  @Type(() => Number)
  fieldSize?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50000)
  @Type(() => Number)
  finishPosition?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
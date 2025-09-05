import {
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from "class-validator";

export class UpdateRolloverDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  rolloverAmount?: number;

  @IsOptional()
  @IsDateString()
  lastRolloverDate?: string;
}
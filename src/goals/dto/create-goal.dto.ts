import {
  IsString,
  IsNotEmpty,
  IsDecimal,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
  IsNumber,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { GoalCategory, GoalType, GoalPriority } from "@prisma/client";

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  targetAmount: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string = "USD";

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsEnum(GoalCategory)
  category: GoalCategory;

  @IsOptional()
  @IsString()
  originalCategory?: string;

  @IsOptional()
  @IsEnum(GoalType)
  type?: GoalType = GoalType.SAVINGS;

  @IsOptional()
  @IsEnum(GoalPriority)
  priority?: GoalPriority = GoalPriority.MEDIUM;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  autoContribute?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  monthlyTarget?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  currentAmount?: number;
}

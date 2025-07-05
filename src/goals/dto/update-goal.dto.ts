import {
  IsOptional,
  IsBoolean,
  IsDateString,
  IsString,
  IsNumber,
  IsEnum,
  MaxLength,
  MinLength,
  Min,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { GoalCategory, GoalPriority } from "@prisma/client";

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  targetAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  currentAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsEnum(GoalCategory)
  category?: GoalCategory;

  @IsOptional()
  @IsString()
  originalCategory?: string;

  @IsOptional()
  @IsEnum(GoalPriority)
  priority?: GoalPriority;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  autoContribute?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  monthlyTarget?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}

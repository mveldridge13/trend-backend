import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsString,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { GoalCategory, GoalType, GoalPriority } from "@prisma/client";

export class GoalFiltersDto {
  @IsOptional()
  @IsEnum(GoalCategory)
  category?: GoalCategory;

  @IsOptional()
  @IsEnum(GoalType)
  type?: GoalType;

  @IsOptional()
  @IsEnum(GoalPriority)
  priority?: GoalPriority;

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
  targetDateFrom?: string;

  @IsOptional()
  @IsDateString()
  targetDateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  includeArchived?: boolean = false;

  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc" = "desc";

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

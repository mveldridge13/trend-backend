import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";

export class GoalAllocationDto {
  @IsString()
  goalId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class RolloverContributionDto {
  @IsNumber()
  @Min(0.01)
  totalRolloverAmount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoalAllocationDto)
  goalAllocations: GoalAllocationDto[];

  @IsOptional()
  @IsString()
  description?: string;
}
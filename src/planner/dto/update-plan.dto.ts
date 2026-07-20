import {
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { PlanType, PlanDirection, PlanLinkedEntityType } from "@prisma/client";

// Status transitions to Completed/Cancelled go through their own dedicated
// endpoints, not this general-purpose edit DTO.
export class UpdatePlanDto {
  @IsOptional()
  @IsEnum(PlanType)
  type?: PlanType;

  @IsOptional()
  @IsEnum(PlanDirection)
  direction?: PlanDirection;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PlanLinkedEntityType)
  linkedEntityType?: PlanLinkedEntityType;

  @IsOptional()
  @IsString()
  linkedEntityId?: string;
}

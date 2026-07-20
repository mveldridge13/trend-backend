import {
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PlanType, PlanStatus, PlanDirection, PlanLinkedEntityType } from "@prisma/client";

export class CreatePlanDto {
  @IsEnum(PlanType)
  type: PlanType;

  // Only DRAFT or PLANNED are valid on create — Completed/Cancelled are
  // reached only via their dedicated transition endpoints (enforced in
  // PlansService, not expressible in the type system alone).
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @IsEnum(PlanDirection)
  direction: PlanDirection;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  plannedDate: string;

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

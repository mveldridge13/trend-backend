import { PartialType } from "@nestjs/mapped-types";
import { IsOptional, IsBoolean, IsDateString } from "class-validator";
import { Transform } from "class-transformer";
import { CreateGoalDto } from "./create-goal.dto";

export class UpdateGoalDto extends PartialType(CreateGoalDto) {
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

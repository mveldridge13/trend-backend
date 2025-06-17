import { IsOptional, IsBoolean, IsNumber, Min } from "class-validator";

export class UpdateUserProfileDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  income?: number;

  @IsOptional()
  @IsBoolean()
  setupComplete?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSeenWelcome?: boolean;
}

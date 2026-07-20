import { IsBoolean, IsNumber, IsOptional, Min } from "class-validator";

export class UpdatePlannerSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  safetyBufferAmount?: number;

  // Explicit clear signal, deliberately not "send safetyBufferAmount: null" -
  // relying on null-vs-undefined surviving JSON validation/whitelisting
  // proved unreliable in practice. A boolean present-and-true is unambiguous.
  @IsOptional()
  @IsBoolean()
  clearSafetyBuffer?: boolean;
}

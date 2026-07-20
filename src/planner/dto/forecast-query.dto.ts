import { IsIn, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class ForecastQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsIn([30, 60, 90])
  days?: 30 | 60 | 90 = 30;
}

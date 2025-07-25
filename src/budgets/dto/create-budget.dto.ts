import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  Length,
} from "class-validator";
import { Transform } from "class-transformer";
import { BudgetStatus } from "@prisma/client";

export class CreateBudgetDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0.01)
  @Max(999999999.99)
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return parseFloat(value);
    }
    return value;
  })
  totalAmount: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string = "USD";

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean = true;

  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus = BudgetStatus.ACTIVE;
}

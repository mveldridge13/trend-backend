import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { Transform } from "class-transformer";
import { TransactionType, PaymentStatus } from "@prisma/client";

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = "USD";

  @IsDateString()
  date: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsString()
  @IsOptional()
  budgetId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  subcategoryId?: string;

  @IsString()
  @IsOptional()
  recurrence?: string;
}

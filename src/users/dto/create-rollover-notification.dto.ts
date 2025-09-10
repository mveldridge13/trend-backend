import { IsNumber, IsString, IsDateString, IsOptional } from "class-validator";

export class CreateRolloverNotificationDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  fromPeriod?: string = "last period";

  @IsOptional()
  @IsDateString()
  createdAt?: string;
}

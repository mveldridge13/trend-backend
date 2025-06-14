import {
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  Length,
  IsIn,
} from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(3, 30)
  username?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(["USD", "EUR", "GBP", "CAD", "AUD", "JPY"])
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

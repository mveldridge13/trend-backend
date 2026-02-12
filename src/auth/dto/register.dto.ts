import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  email: string;

  @IsString()
  @MinLength(1, { message: "First name is required" })
  @MaxLength(50, { message: "First name cannot exceed 50 characters" })
  firstName: string;

  @IsString()
  @MinLength(1, { message: "Last name is required" })
  @MaxLength(50, { message: "Last name cannot exceed 50 characters" })
  lastName: string;

  @IsString()
  @MinLength(12, { message: "Password must be at least 12 characters long" })
  @MaxLength(128, { message: "Password cannot exceed 128 characters" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
  })
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: "Username must be at least 3 characters" })
  @MaxLength(30, { message: "Username cannot exceed 30 characters" })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: "Username can only contain letters, numbers, and underscores",
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3, { message: "Currency code cannot exceed 3 characters" })
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

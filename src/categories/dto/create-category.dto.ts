import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
  MinLength,
} from "class-validator";
import { CategoryType } from "@prisma/client";

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7) // Hex color code #FFFFFF
  color?: string;

  @IsEnum(CategoryType)
  type: CategoryType;

  @IsOptional()
  @IsString()
  parentId?: string; // For subcategories

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CurrencyDto {
  @IsString()
  code: string;

  @IsString()
  symbol: string;

  @IsString()
  name: string;

  @IsNumber()
  decimalPlaces: number;
}

export class DetectCurrencyDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;
}
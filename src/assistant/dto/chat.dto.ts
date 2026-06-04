import { IsString, IsOptional, IsObject } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  screenContext?: {
    screen: string;
    data?: Record<string, any>;
  };
}

export class ChatResponseDto {
  response: string;
  toolsUsed?: string[];
}

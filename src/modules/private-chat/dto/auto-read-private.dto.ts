import { IsInt, Min } from 'class-validator';

/**
 * DTO для включения/выключения авточтения приватного чата
 */
export class AutoReadPrivateDto {
  @IsInt()
  @Min(1)
  conversationId: number;
}



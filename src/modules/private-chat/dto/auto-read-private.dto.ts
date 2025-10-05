import { IsInt, IsPositive } from 'class-validator';

/**
 * DTO для включения/выключения авточтения приватного чата с конкретным пользователем.
 * Использует receivedId для авточтения диалога с конкретным пользователем.
 */
export class AutoReadPrivateDto {
  @IsInt()
  @IsPositive()
  receivedId: number;
}



import { IsInt, IsPositive } from 'class-validator';

/**
 * DTO для выхода из приватного чата с конкретным пользователем.
 * Использует receivedId для выхода из диалога с конкретным пользователем.
 */
export class LeavePrivateChatDto {
  @IsInt()
  @IsPositive()
  receivedId: number;
}


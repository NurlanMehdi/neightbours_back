import { IsInt, IsPositive } from 'class-validator';

/**
 * DTO для присоединения к приватному чату с конкретным пользователем.
 * Использует receivedId для создания нового диалога или присоединения к существующему.
 */
export class JoinPrivateChatDto {
  @IsInt()
  @IsPositive()
  receivedId: number;
}


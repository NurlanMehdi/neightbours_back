import { IsInt, IsOptional, IsPositive } from 'class-validator';

/**
 * DTO для включения/выключения авточтения приватного чата с конкретным пользователем.
 * Поддерживает несколько вариантов названий поля для ID получателя:
 * - receiverId (основной вариант, используемый клиентом)
 * - receivedId (альтернативный вариант)
 * - userId (альтернативный вариант)
 * - targetId (альтернативный вариант)
 * Хотя бы один из этих полей должен быть указан.
 */
export class AutoReadPrivateDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  receiverId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  receivedId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  userId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  targetId?: number;

  /**
   * Извлекает ID получателя из любого доступного поля
   */
  getReceiverId(): number {
    return this.receiverId || this.receivedId || this.userId || this.targetId;
  }
}



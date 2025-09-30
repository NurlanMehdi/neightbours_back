import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
} from 'class-validator';

/**
 * DTO для отправки приватного сообщения.
 * Требуется указать либо conversationId (для существующего диалога),
 * либо receiverId (для создания нового диалога или отправки в существующий).
 */
export class SendPrivateMessageDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  @ValidateIf((o) => !o.receiverId)
  conversationId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @ValidateIf((o) => !o.conversationId)
  receiverId?: number;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  replyToMessageId?: number;
}

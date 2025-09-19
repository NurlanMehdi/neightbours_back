import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class SendPrivateMessageDto {
  @ApiProperty({ description: 'Текст сообщения', example: 'Привет!' })
  @IsString()
  @MinLength(1)
  text: string;

  @ApiPropertyOptional({ description: 'ID диалога' })
  @IsOptional()
  @IsInt()
  @Min(1)
  conversationId?: number;

  @ApiPropertyOptional({ description: 'ID получателя (если диалог не создан)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  receiverId?: number;

  @ApiPropertyOptional({ description: 'ID сообщения, на которое формируется ответ' })
  @IsOptional()
  @IsInt()
  @Min(1)
  replyToId?: number;
}


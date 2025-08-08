import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AiChatMessageDto } from './ai-chat-message.dto';

export class AiChatDto {
  @ApiProperty({ description: 'ID чата' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'ID пользователя' })
  @Expose()
  userId: number;

  @ApiProperty({ description: 'Дата создания чата' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Дата последнего обновления чата' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ 
    description: 'Сообщения в чате',
    type: [AiChatMessageDto]
  })
  @Expose()
  @Type(() => AiChatMessageDto)
  messages: AiChatMessageDto[];
} 
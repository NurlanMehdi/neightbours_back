import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { AiChatMessageRole } from '@prisma/client';

export class AiChatMessageDto {
  @ApiProperty({ description: 'ID сообщения' })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Роль отправителя сообщения',
    enum: AiChatMessageRole,
    example: AiChatMessageRole.USER,
  })
  @Expose()
  role: AiChatMessageRole;

  @ApiProperty({
    description: 'Содержание сообщения',
    example: 'Привет! Как дела?',
  })
  @Expose()
  content: string;

  @ApiProperty({ description: 'Дата создания сообщения' })
  @Expose()
  createdAt: Date;
}

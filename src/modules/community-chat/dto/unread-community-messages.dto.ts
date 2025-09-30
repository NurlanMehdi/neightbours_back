import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO для ответа с непрочитанными сообщениями сообществ
 */
export class UnreadCommunityMessagesResponseDto {
  @ApiProperty({
    description: 'Объект с количеством непрочитанных сообщений по сообществам',
    example: { '1': 12, '5': 7 },
    type: 'object',
    additionalProperties: {
      type: 'number',
      description: 'Количество непрочитанных сообщений для сообщества',
    },
  })
  @Expose()
  count: Record<string, number>;

  @ApiProperty({
    description: 'Общее количество непрочитанных сообщений во всех сообществах',
    example: 19,
  })
  @Expose()
  COMMUNITY: number;
}


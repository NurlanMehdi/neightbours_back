import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { Expose } from 'class-transformer';

/**
 * DTO для получения непрочитанных сообщений
 */
export class GetUnreadMessagesDto {
  @ApiProperty({
    description: 'ID пользователя',
    required: true,
    example: 1,
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  userId: number;

  @ApiProperty({
    description: 'ID события для фильтрации сообщений',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  eventId?: number;
}

/**
 * DTO для пользователя в сообщении
 */
export class UnreadMessageUserDto {
  @ApiProperty({
    description: 'ID пользователя',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван',
  })
  @Expose()
  firstName: string;

  @ApiProperty({
    description: 'Фамилия пользователя',
    example: 'Иванов',
  })
  @Expose()
  lastName: string;

  @ApiProperty({
    description: 'Аватар пользователя',
    example: 'avatar.jpg',
    nullable: true,
  })
  @Expose()
  avatar?: string;
}

/**
 * DTO для события в сообщении
 */
export class UnreadMessageEventDto {
  @ApiProperty({
    description: 'ID события',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Название события',
    example: 'Собрание жильцов',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'ID сообщества',
    example: 1,
  })
  @Expose()
  communityId: number;
}

/**
 * DTO для непрочитанного сообщения
 */
export class UnreadMessageDto {
  @ApiProperty({
    description: 'ID сообщения',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Текст сообщения',
    example: 'Добро пожаловать на собрание!',
  })
  @Expose()
  text: string;

  @ApiProperty({
    description: 'Дата создания сообщения',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Дата обновления сообщения',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'ID события',
    example: 1,
  })
  @Expose()
  eventId: number;

  @ApiProperty({
    description: 'ID пользователя-автора',
    example: 2,
  })
  @Expose()
  userId: number;

  @ApiProperty({
    description: 'Информация о пользователе-авторе',
    type: UnreadMessageUserDto,
  })
  @Expose()
  user: UnreadMessageUserDto;

  @ApiProperty({
    description: 'Информация о событии',
    type: UnreadMessageEventDto,
  })
  @Expose()
  event: UnreadMessageEventDto;
}

/**
 * DTO для группировки уведомлений по событию
 */
export class EventNotificationsDto {
  @ApiProperty({
    description: 'Количество уведомлений',
    example: 3,
  })
  @Expose()
  notifications: number;
}

/**
 * DTO для ответа с непрочитанными сообщениями в новом формате
 */
export class UnreadMessagesResponseDto {
  @ApiProperty({
    description: 'Объект с количеством непрочитанных сообщений по событиям',
    example: { "1": 33, "2": 56, "6": 45 },
    type: 'object',
    additionalProperties: {
      type: 'number',
      description: 'Количество непрочитанных сообщений для события',
    },
  })
  @Expose()
  count: Record<string, number>;

  @ApiProperty({
    description: 'Общее количество непрочитанных сообщений во всех событиях',
    example: 134,
  })
  @Expose()
  EVENT: number;

  @ApiProperty({
    description: 'Количество уведомлений (пока всегда 0)',
    example: 0,
  })
  @Expose()
  NOTIFICATION: number;
}

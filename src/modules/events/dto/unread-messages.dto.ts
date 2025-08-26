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
 * Тип для ответа с непрочитанными сообщениями, группированными по событиям
 */
export type UnreadMessagesResponseDto = Record<string, EventNotificationsDto>;

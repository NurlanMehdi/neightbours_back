import { IsEnum, IsString, IsNotEmpty, IsArray, IsInt, IsOptional, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../interfaces/notification.interface';

/**
 * DTO для отправки уведомления пользователям
 */
export class SendNotificationDto {
  @ApiProperty({
    description: 'Массив ID пользователей-получателей',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray({ message: 'Список пользователей должен быть массивом' })
  @ArrayMinSize(1, { message: 'Необходимо выбрать хотя бы одного пользователя' })
  @Type(() => Number)
  @IsInt({ each: true, message: 'Каждый ID пользователя должен быть целым числом' })
  toUserIds: number[];

  @ApiProperty({
    description: 'Тип уведомления',
    enum: NotificationType,
    example: NotificationType.EVENT_CREATED,
  })
  @IsEnum(NotificationType, { message: 'Некорректный тип уведомления' })
  notificationType: NotificationType;

  @ApiProperty({
    description: 'Заголовок уведомления',
    example: 'Новое событие',
    maxLength: 255,
  })
  @IsString({ message: 'Заголовок должен быть строкой' })
  @IsNotEmpty({ message: 'Заголовок не может быть пустым' })
  title: string;

  @ApiProperty({
    description: 'Текст уведомления',
    example: 'Создано новое событие в вашем сообществе',
  })
  @IsString({ message: 'Сообщение должно быть строкой' })
  @IsNotEmpty({ message: 'Сообщение не может быть пустым' })
  message: string;
}

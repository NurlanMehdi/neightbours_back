import { IsEnum, IsString, IsNotEmpty, IsOptional, IsInt, IsPositive, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../interfaces/notification.interface';

/**
 * DTO для создания уведомления
 */
export class CreateNotificationDto {
  @ApiProperty({
    description: 'Тип уведомления',
    enum: NotificationType,
    example: NotificationType.SYSTEM_UPDATE,
  })
  @IsEnum(NotificationType, { message: 'Некорректный тип уведомления' })
  type: NotificationType;

  @ApiProperty({
    description: 'Заголовок уведомления',
    example: 'Системное уведомление',
    maxLength: 255,
  })
  @IsString({ message: 'Заголовок должен быть строкой' })
  @IsNotEmpty({ message: 'Заголовок не может быть пустым' })
  title: string;

  @ApiProperty({
    description: 'Текст уведомления',
    example: 'Это важное системное уведомление для всех пользователей',
  })
  @IsString({ message: 'Сообщение должно быть строкой' })
  @IsNotEmpty({ message: 'Сообщение не может быть пустым' })
  message: string;

  @ApiProperty({
    description: 'ID пользователя-получателя',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'ID пользователя должен быть целым числом' })
  @IsPositive({ message: 'ID пользователя должен быть положительным числом' })
  userId: number;

  @ApiProperty({
    description: 'Payload с данными уведомления и связью с одной сущностью в формате JSON',
    examples: {
      eventNotification: {
        summary: 'Уведомление о событии',
        value: {
          eventId: 5,
          eventTitle: 'Субботник',
          communityName: 'Центральное сообщество',
          createdByName: 'Иван Петров'
        }
      },
      communityNotification: {
        summary: 'Уведомление о сообществе',
        value: {
          communityId: 3,
          communityName: 'Центральное сообщество',
          userName: 'Иван Петров'
        }
      },
      propertyNotification: {
        summary: 'Уведомление о недвижимости',
        value: {
          propertyId: 7,
          propertyName: 'Зеленый дом',
          ownerName: 'Иван Петров',
          verificationCount: 3
        }
      }
    },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'Payload должен быть объектом' })
  payload?: Record<string, any>;
}

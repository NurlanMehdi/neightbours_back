import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO для типа уведомления
 */
export class NotificationTypeDto {
  @Expose()
  @ApiProperty({
    description: 'Значение типа уведомления',
    example: 'EVENT_CREATED',
  })
  value: string;

  @Expose()
  @ApiProperty({
    description: 'Отображаемое название типа уведомления',
    example: 'Событие создано',
  })
  label: string;
}

/**
 * DTO для списка типов уведомлений
 */
export class NotificationTypesDto {
  @Expose()
  @ApiProperty({
    description: 'Список доступных типов уведомлений',
    type: [NotificationTypeDto],
  })
  types: NotificationTypeDto[];
}

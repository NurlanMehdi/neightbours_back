import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationDto } from './notification.dto';

/**
 * DTO для пагинированного списка уведомлений
 */
export class NotificationsPaginatedDto {
  @ApiProperty({
    description: 'Список уведомлений',
    type: [NotificationDto],
  })
  @Expose()
  @Type(() => NotificationDto)
  data: NotificationDto[];

  @ApiProperty({
    description: 'Общее количество уведомлений',
    example: 150,
  })
  @Expose()
  total: number;

  @ApiProperty({
    description: 'Текущая страница',
    example: 1,
  })
  @Expose()
  page: number;

  @ApiProperty({
    description: 'Количество записей на странице',
    example: 10,
  })
  @Expose()
  limit: number;

  @ApiProperty({
    description: 'Общее количество страниц',
    example: 15,
  })
  @Expose()
  totalPages: number;

  @ApiProperty({
    description: 'Количество непрочитанных уведомлений',
    example: 5,
  })
  @Expose()
  unreadCount: number;
}

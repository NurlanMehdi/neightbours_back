import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationDto } from './notification.dto';
import { GroupedMessageNotificationDto } from './grouped-message-notification.dto';

/**
 * DTO для пагинированного списка уведомлений
 */
export class NotificationsPaginatedDto {
  @ApiProperty({
    description:
      'Список уведомлений (может содержать как обычные уведомления, так и сгруппированные MESSAGE_RECEIVED)',
    oneOf: [
      {
        type: 'array',
        items: { $ref: '#/components/schemas/NotificationDto' },
      },
      {
        type: 'array',
        items: { $ref: '#/components/schemas/GroupedMessageNotificationDto' },
      },
    ],
    example: [
      {
        type: 'MESSAGE_RECEIVED_GROUPED',
        title: 'Новые сообщения',
        count: 2,
      },
      {
        id: 15,
        type: 'EVENT_DELETED',
        title: 'Мероприятие удалено',
        message: 'Мероприятие "event notif check" было удалено',
        payload: {
          eventId: 2,
          eventTitle: 'event notif check',
          deletedByName: 'Администратор',
        },
        isRead: false,
        createdAt: '2025-09-07T11:50:50.419Z',
      },
    ],
  })
  @Expose()
  data: (NotificationDto | GroupedMessageNotificationDto)[];

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

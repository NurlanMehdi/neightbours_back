import { Expose, Type } from 'class-transformer';
import { NotificationType } from '../interfaces/notification.interface';

/**
 * DTO для отображения уведомления
 */
export class NotificationDto {
  @Expose()
  id: number;

  @Expose()
  type: NotificationType;

  @Expose()
  title: string;

  @Expose()
  message: string;

  @Expose()
  payload?: any;

  @Expose()
  isRead: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

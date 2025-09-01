import { Injectable } from '@nestjs/common';
import { NotificationType } from '../interfaces/notification.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseNotificationTrigger } from './base-notification.trigger';
import { NotificationService } from '../services/notification.service';
import { 
  ISystemEventData, 
  SystemEventType,
  ICreateNotification 
} from '../interfaces/notification.interface';

/**
 * Триггер уведомлений для событий
 */
@Injectable()
export class EventNotificationTrigger extends BaseNotificationTrigger {
  constructor(
    protected readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {
    super(notificationService);
  }

  /**
   * Обрабатывает события, связанные с мероприятиями
   */
  async handle(eventData: ISystemEventData): Promise<void> {
    this.logger.log(`Обработка события ${eventData.eventType}`);

    const targetUserIds = await this.getTargetUserIds(eventData);
    
    if (targetUserIds.length === 0) {
      this.logger.log('Нет пользователей для уведомления');
      return;
    }

    const notificationType = this.getNotificationType(eventData.eventType);
    const title = this.generateTitle(eventData);
    const message = this.generateMessage(eventData);

    const notifications: ICreateNotification[] = targetUserIds.map(userId => ({
      ...this.createBaseNotificationData(eventData, userId),
      type: notificationType,
      title,
      message,
    }));

    await this.createMultipleNotifications(notifications);
  }

  /**
   * Проверяет, должен ли триггер обрабатывать событие
   */
  protected shouldHandle(eventType: SystemEventType): boolean {
    return [
      SystemEventType.EVENT_CREATED,
      SystemEventType.EVENT_UPDATED,
      SystemEventType.EVENT_CANCELLED,
      SystemEventType.EVENT_DELETED,
      SystemEventType.USER_JOINED_EVENT,
      SystemEventType.USER_LEFT_EVENT,
    ].includes(eventType);
  }

  /**
   * Генерирует заголовок уведомления
   */
  protected generateTitle(eventData: ISystemEventData): string {
    const eventTitle = eventData.additionalData?.eventTitle || 'мероприятие';
    const triggererName = eventData.additionalData?.triggererName || 'Пользователь';

    switch (eventData.eventType) {
      case SystemEventType.EVENT_CREATED:
        return 'Новое мероприятие';
      case SystemEventType.EVENT_UPDATED:
        return 'Мероприятие обновлено';
      case SystemEventType.EVENT_CANCELLED:
        return 'Мероприятие отменено';
      case SystemEventType.EVENT_DELETED:
        return 'Мероприятие удалено';
      case SystemEventType.USER_JOINED_EVENT:
        return 'Новый участник';
      case SystemEventType.USER_LEFT_EVENT:
        return 'Участник покинул мероприятие';
      default:
        return 'Обновление мероприятия';
    }
  }

  /**
   * Генерирует текст уведомления
   */
  protected generateMessage(eventData: ISystemEventData): string {
    const eventTitle = eventData.additionalData?.eventTitle || 'мероприятие';
    const triggererName = eventData.additionalData?.triggererName || 'Пользователь';
    const communityName = eventData.additionalData?.communityName || 'сообществе';

    switch (eventData.eventType) {
      case SystemEventType.EVENT_CREATED:
        return `В ${communityName} создано новое мероприятие "${eventTitle}"`;
      case SystemEventType.EVENT_UPDATED:
        return `Мероприятие "${eventTitle}" было обновлено`;
      case SystemEventType.EVENT_CANCELLED:
        return `Мероприятие "${eventTitle}" было отменено`;
      case SystemEventType.EVENT_DELETED:
        return `Мероприятие "${eventTitle}" было удалено`;
      case SystemEventType.USER_JOINED_EVENT:
        return `${triggererName} присоединился к мероприятию "${eventTitle}"`;
      case SystemEventType.USER_LEFT_EVENT:
        return `${triggererName} покинул мероприятие "${eventTitle}"`;
      default:
        return `Обновление в мероприятии "${eventTitle}"`;
    }
  }

  /**
   * Получает тип уведомления
   */
  protected getNotificationType(eventType: SystemEventType): NotificationType {
    switch (eventType) {
      case SystemEventType.EVENT_CREATED:
        return NotificationType.EVENT_CREATED;
      case SystemEventType.EVENT_UPDATED:
        return NotificationType.EVENT_UPDATED;
      case SystemEventType.EVENT_CANCELLED:
        return NotificationType.EVENT_CANCELLED;
      case SystemEventType.EVENT_DELETED:
        return NotificationType.EVENT_DELETED;
      case SystemEventType.USER_JOINED_EVENT:
        return NotificationType.USER_JOINED_EVENT;
      case SystemEventType.USER_LEFT_EVENT:
        return NotificationType.USER_LEFT_EVENT;
      default:
        return NotificationType.EVENT_UPDATED;
    }
  }

  /**
   * Получает список пользователей для уведомления
   */
  protected async getTargetUserIds(eventData: ISystemEventData): Promise<number[]> {
    if (!eventData.relatedEntityId) {
      this.logger.warn('Отсутствует ID связанного события');
      return [];
    }

    const eventId = eventData.relatedEntityId;

    try {
      // Получаем информацию о мероприятии
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          participants: {
            select: { userId: true },
          },
          community: {
            include: {
              users: {
                select: { userId: true },
              },
            },
          },
          creator: {
            select: { id: true },
          },
        },
      });

      if (!event) {
        this.logger.warn(`Мероприятие с ID ${eventId} не найдено`);
        return [];
      }

      let targetUserIds: number[] = [];

      switch (eventData.eventType) {
        case SystemEventType.EVENT_CREATED:
          // Уведомляем всех участников сообщества
          targetUserIds = event.community.users.map(user => user.userId);
          break;

        case SystemEventType.EVENT_UPDATED:
        case SystemEventType.EVENT_CANCELLED:
        case SystemEventType.EVENT_DELETED:
          // Уведомляем участников мероприятия и создателя
          targetUserIds = [
            ...event.participants.map(p => p.userId),
            event.creator.id,
          ];
          break;

        case SystemEventType.USER_JOINED_EVENT:
        case SystemEventType.USER_LEFT_EVENT:
          // Уведомляем создателя и других участников, кроме самого пользователя
          const triggererUserId = eventData.additionalData?.triggererUserId;
          targetUserIds = [
            ...event.participants.map(p => p.userId),
            event.creator.id,
          ].filter(userId => userId !== triggererUserId);
          break;

        default:
          targetUserIds = event.participants.map(p => p.userId);
      }

      // Убираем дубликаты
      const uniqueUserIds = Array.from(new Set(targetUserIds));
      return this.filterUsers(uniqueUserIds);

    } catch (error) {
      this.logger.error(`Ошибка получения пользователей для уведомления: ${error.message}`, error.stack);
      return [];
    }
  }
}

import { Injectable } from '@nestjs/common';
import { NotificationType } from '../interfaces/notification.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseNotificationTrigger } from './base-notification.trigger';
import { NotificationService } from '../services/notification.service';
import {
  ISystemEventData,
  SystemEventType,
  ICreateNotification,
} from '../interfaces/notification.interface';

/**
 * Триггер уведомлений для сообщений
 */
@Injectable()
export class MessageNotificationTrigger extends BaseNotificationTrigger {
  constructor(
    protected readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {
    super(notificationService);
  }

  /**
   * Обрабатывает события, связанные с сообщениями
   */
  async handle(eventData: ISystemEventData): Promise<void> {
    this.logger.log(`Обработка события ${eventData.eventType}`);

    // Обрабатываем упоминания пользователей
    if (eventData.eventType === SystemEventType.USER_MENTIONED) {
      await this.handleUserMentions(eventData);
      return;
    }

    const targetUserIds = await this.getTargetUserIds(eventData);

    if (targetUserIds.length === 0) {
      this.logger.log('Нет пользователей для уведомления');
      return;
    }

    const notificationType = this.getNotificationType(eventData.eventType);
    const title = this.generateTitle(eventData);
    const message = this.generateMessage(eventData);

    const notifications: ICreateNotification[] = targetUserIds.map(
      (userId) => ({
        ...this.createBaseNotificationData(eventData, userId),
        type: notificationType,
        title,
        message,
      }),
    );

    await this.createMultipleNotifications(notifications);
  }

  /**
   * Обрабатывает упоминания пользователей в сообщениях
   */
  private async handleUserMentions(eventData: ISystemEventData): Promise<void> {
    const mentionedUserIds = eventData.targetUserIds || [];

    if (mentionedUserIds.length === 0) {
      this.logger.log('Нет упомянутых пользователей');
      return;
    }

    const title = this.generateTitle(eventData);
    const message = this.generateMessage(eventData);

    const notifications: ICreateNotification[] = mentionedUserIds.map(
      (userId) => ({
        ...this.createBaseNotificationData(eventData, userId),
        type: NotificationType.USER_MENTIONED,
        title,
        message,
      }),
    );

    await this.createMultipleNotifications(notifications);
  }

  /**
   * Проверяет, должен ли триггер обрабатывать событие
   */
  protected shouldHandle(eventType: SystemEventType): boolean {
    return [
      SystemEventType.MESSAGE_RECEIVED,
      SystemEventType.USER_MENTIONED,
    ].includes(eventType);
  }

  /**
   * Генерирует заголовок уведомления
   */
  protected generateTitle(eventData: ISystemEventData): string {
    const triggererName =
      eventData.additionalData?.triggererName || 'Пользователь';
    const eventTitle = eventData.additionalData?.eventTitle || 'мероприятии';

    switch (eventData.eventType) {
      case SystemEventType.MESSAGE_RECEIVED:
        return 'Новое сообщение';
      case SystemEventType.USER_MENTIONED:
        return 'Вас упомянули';
      default:
        return 'Новое сообщение';
    }
  }

  /**
   * Генерирует текст уведомления
   */
  protected generateMessage(eventData: ISystemEventData): string {
    const triggererName =
      eventData.additionalData?.triggererName || 'Пользователь';
    const eventTitle = eventData.additionalData?.eventTitle || 'мероприятии';
    const messageText = eventData.additionalData?.messageText || '';
    const shortMessage =
      messageText.length > 50
        ? messageText.substring(0, 50) + '...'
        : messageText;

    switch (eventData.eventType) {
      case SystemEventType.MESSAGE_RECEIVED:
        return `${triggererName} написал в "${eventTitle}": ${shortMessage}`;
      case SystemEventType.USER_MENTIONED:
        return `${triggererName} упомянул вас в "${eventTitle}": ${shortMessage}`;
      default:
        return `Новое сообщение от ${triggererName}`;
    }
  }

  /**
   * Получает тип уведомления
   */
  protected getNotificationType(eventType: SystemEventType): NotificationType {
    switch (eventType) {
      case SystemEventType.MESSAGE_RECEIVED:
        return NotificationType.MESSAGE_RECEIVED;
      case SystemEventType.USER_MENTIONED:
        return NotificationType.USER_MENTIONED;
      default:
        return NotificationType.MESSAGE_RECEIVED;
    }
  }

  /**
   * Получает список пользователей для уведомления
   */
  protected async getTargetUserIds(
    eventData: ISystemEventData,
  ): Promise<number[]> {
    if (eventData.eventType === SystemEventType.USER_MENTIONED) {
      return eventData.targetUserIds || [];
    }

    if (!eventData.relatedEntityId || eventData.relatedEntityType !== 'event') {
      this.logger.warn('Отсутствует ID связанного события для сообщения');
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
          creator: {
            select: { id: true },
          },
        },
      });

      if (!event) {
        this.logger.warn(`Мероприятие с ID ${eventId} не найдено`);
        return [];
      }

      // Уведомляем всех участников мероприятия и создателя
      const targetUserIds = [
        ...event.participants.map((p) => p.userId),
        event.creator.id,
      ];

      // Убираем дубликаты
      const uniqueUserIds = Array.from(new Set(targetUserIds));
      return this.filterUsers(uniqueUserIds);
    } catch (error) {
      this.logger.error(
        `Ошибка получения пользователей для уведомления: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}

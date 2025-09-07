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
 * Триггер уведомлений для упоминаний пользователей
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
   * Обрабатывает события упоминаний пользователей
   */
  async handle(eventData: ISystemEventData): Promise<void> {
    this.logger.log(`Обработка события ${eventData.eventType}`);

    if (eventData.eventType === SystemEventType.USER_MENTIONED) {
      await this.handleUserMentions(eventData);
      return;
    }

    this.logger.warn(`Неподдерживаемый тип события: ${eventData.eventType}`);
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
    return eventType === SystemEventType.USER_MENTIONED;
  }

  /**
   * Генерирует заголовок уведомления
   */
  protected generateTitle(eventData: ISystemEventData): string {
    switch (eventData.eventType) {
      case SystemEventType.USER_MENTIONED:
        return 'Вас упомянули';
      default:
        return 'Уведомление';
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
      case SystemEventType.USER_MENTIONED:
        return `${triggererName} упомянул вас в "${eventTitle}": ${shortMessage}`;
      default:
        return `Уведомление от ${triggererName}`;
    }
  }

  /**
   * Получает тип уведомления
   */
  protected getNotificationType(eventType: SystemEventType): NotificationType {
    switch (eventType) {
      case SystemEventType.USER_MENTIONED:
        return NotificationType.USER_MENTIONED;
      default:
        return NotificationType.INFO;
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
    return [];
  }
}

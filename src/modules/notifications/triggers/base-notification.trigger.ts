import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '../interfaces/notification.interface';
import { NotificationService } from '../services/notification.service';
import {
  INotificationTrigger,
  ICreateNotification,
  ISystemEventData,
  SystemEventType,
} from '../interfaces/notification.interface';

/**
 * Базовый класс для триггеров уведомлений
 */
@Injectable()
export abstract class BaseNotificationTrigger implements INotificationTrigger {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly notificationService: NotificationService) {}

  /**
   * Обрабатывает событие системы
   */
  abstract handle(eventData: ISystemEventData): Promise<void>;

  /**
   * Определяет, должен ли триггер обрабатывать данное событие
   */
  protected abstract shouldHandle(eventType: SystemEventType): boolean;

  /**
   * Безопасно обрабатывает событие - проверяет shouldHandle перед обработкой
   */
  async safeHandle(eventData: ISystemEventData): Promise<void> {
    const shouldProcess = this.shouldHandle(eventData.eventType);
    
    this.logger.log(
      `[${this.constructor.name}] Событие: ${eventData.eventType}, Обрабатывать: ${shouldProcess}`,
    );

    if (shouldProcess) {
      await this.handle(eventData);
    } else {
      this.logger.log(
        `[${this.constructor.name}] Пропускаем событие ${eventData.eventType}`,
      );
    }
  }

  /**
   * Создает уведомление
   */
  protected async createNotification(data: ICreateNotification): Promise<void> {
    try {
      await this.notificationService.createNotification(data);
      this.logger.log(
        `Создано уведомление типа ${data.type} для пользователя ${data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Ошибка создания уведомления: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Создает множественные уведомления
   */
  protected async createMultipleNotifications(
    notifications: ICreateNotification[],
  ): Promise<void> {
    try {
      await this.notificationService.createMultipleNotifications(notifications);
      this.logger.log(`Создано ${notifications.length} уведомлений`);
    } catch (error) {
      this.logger.error(
        `Ошибка создания множественных уведомлений: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Генерирует заголовок уведомления
   */
  protected abstract generateTitle(eventData: ISystemEventData): string;

  /**
   * Генерирует текст уведомления
   */
  protected abstract generateMessage(eventData: ISystemEventData): string;

  /**
   * Получает тип уведомления для данного события
   */
  protected abstract getNotificationType(
    eventType: SystemEventType,
  ): NotificationType;

  /**
   * Получает список пользователей, которые должны получить уведомление
   */
  protected abstract getTargetUserIds(
    eventData: ISystemEventData,
  ): Promise<number[]>;

  /**
   * Обрабатывает событие, если триггер должен его обработать
   */
  async processEvent(eventData: ISystemEventData): Promise<void> {
    if (!this.shouldHandle(eventData.eventType)) {
      return;
    }

    this.logger.log(`Обработка события ${eventData.eventType}`);
    await this.handle(eventData);
  }

  /**
   * Создает базовые данные уведомления
   */
  protected createBaseNotificationData(
    eventData: ISystemEventData,
    userId: number,
  ): Omit<ICreateNotification, 'type' | 'title' | 'message'> {
    const payload: any = { ...eventData.additionalData };

    // Добавляем связь с одной сущностью в payload
    if (eventData.relatedEntityType && eventData.relatedEntityId) {
      switch (eventData.relatedEntityType) {
        case 'event':
          payload.eventId = eventData.relatedEntityId;
          break;
        case 'community':
          payload.communityId = eventData.relatedEntityId;
          break;
        case 'property':
          payload.propertyId = eventData.relatedEntityId;
          break;
        case 'message':
          payload.messageId = eventData.relatedEntityId;
          break;
      }
    }

    return {
      userId,
      payload,
    };
  }

  /**
   * Фильтрует пользователей (базовая реализация без исключений)
   */
  protected filterUsers(userIds: number[]): number[] {
    return userIds;
  }
}

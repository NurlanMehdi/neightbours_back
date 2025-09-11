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
 * Триггер уведомлений для сообществ
 */
@Injectable()
export class CommunityNotificationTrigger extends BaseNotificationTrigger {
  constructor(
    protected readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {
    super(notificationService);
  }

  /**
   * Обрабатывает события, связанные с сообществами
   */
  async handle(eventData: ISystemEventData): Promise<void> {
    const triggerId = Math.random().toString(36).substr(2, 9);
    this.logger.log(`🏬 COMMUNITY TRIGGER START [${triggerId}] - Событие: ${eventData.eventType}, Сообщество: ${eventData.relatedEntityId}`);

    const targetUserIds = await this.getTargetUserIds(eventData);

    if (targetUserIds.length === 0) {
      this.logger.log(`🏬 COMMUNITY TRIGGER SKIP [${triggerId}] - Нет пользователей`);
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

    this.logger.log(`🏬 COMMUNITY TRIGGER PROCESS [${triggerId}] - Создаем ${notifications.length} уведомлений для пользователей: ${targetUserIds.join(', ')}`);
    await this.createMultipleNotifications(notifications);
    this.logger.log(`🏬 COMMUNITY TRIGGER END [${triggerId}] - Успешно`);
  }

  /**
   * Проверяет, должен ли триггер обрабатывать событие
   */
  protected shouldHandle(eventType: SystemEventType): boolean {
    return [SystemEventType.USER_JOINED_COMMUNITY].includes(eventType);
  }

  /**
   * Генерирует заголовок уведомления
   */
  protected generateTitle(eventData: ISystemEventData): string {
    switch (eventData.eventType) {
      case SystemEventType.USER_JOINED_COMMUNITY:
        return 'Новый участник';
      default:
        return 'Обновление сообщества';
    }
  }

  /**
   * Генерирует текст уведомления
   */
  protected generateMessage(eventData: ISystemEventData): string {
    const newUserName = eventData.additionalData?.newUserName || 'Пользователь';
    const communityName =
      eventData.additionalData?.communityName || 'сообщество';

    switch (eventData.eventType) {
      case SystemEventType.USER_JOINED_COMMUNITY:
        return `${newUserName} присоединился к сообществу "${communityName}"`;
      default:
        return `Обновление в сообществе "${communityName}"`;
    }
  }

  /**
   * Получает тип уведомления
   */
  protected getNotificationType(eventType: SystemEventType): NotificationType {
    switch (eventType) {
      case SystemEventType.USER_JOINED_COMMUNITY:
        return NotificationType.USER_JOINED_COMMUNITY;
      default:
        return NotificationType.USER_JOINED_COMMUNITY;
    }
  }

  /**
   * Получает список пользователей для уведомления
   */
  protected async getTargetUserIds(
    eventData: ISystemEventData,
  ): Promise<number[]> {
    if (!eventData.relatedEntityId) {
      this.logger.warn('Отсутствует ID связанного сообщества');
      return [];
    }

    const communityId = eventData.relatedEntityId;
    const triggererUserId = eventData.additionalData?.triggererUserId;

    try {
      // Получаем информацию о сообществе
      const community = await this.prisma.community.findUnique({
        where: { id: communityId },
        include: {
          users: {
            select: { userId: true },
          },
          creator: {
            select: { id: true },
          },
        },
      });

      if (!community) {
        this.logger.warn(`Сообщество с ID ${communityId} не найдено`);
        return [];
      }

      // Уведомляем всех участников сообщества, кроме того кто присоединился
      let targetUserIds = [
        ...community.users.map((u) => u.userId),
        community.creator.id,
      ];

      // Исключаем пользователя, который присоединился
      if (triggererUserId) {
        targetUserIds = targetUserIds.filter(
          (userId) => userId !== triggererUserId,
        );
      }

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

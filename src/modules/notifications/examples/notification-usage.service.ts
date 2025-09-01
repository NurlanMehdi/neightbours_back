import { Injectable } from '@nestjs/common';
import { NotificationEventService } from '../services/notification-event.service';
import { IGlobalNotificationData } from '../interfaces/notification.interface';

/**
 * Примеры использования системы уведомлений
 * Этот сервис демонстрирует, как интегрировать уведомления в ваши модули
 */
@Injectable()
export class NotificationUsageService {
  constructor(private readonly notificationEventService: NotificationEventService) {}

  /**
   * Пример 1: Пользователь присоединился к мероприятию
   * Создает уведомление для самого пользователя
   */
  async handleUserJoinedEvent(
    userId: number,
    eventId: number,
    eventTitle: string,
    communityName: string,
  ): Promise<void> {
    await this.notificationEventService.notifyUserJoinedEventConfirmation({
      eventId,
      eventTitle,
      userId,
      communityName,
    });
  }

  /**
   * Пример 2: Мероприятие удалено
   * Уведомляет всех участников об удалении
   */
  async handleEventDeleted(
    eventId: number,
    eventTitle: string,
    participantIds: number[],
    deletedByName: string,
  ): Promise<void> {
    await this.notificationEventService.notifyEventDeleted({
      eventId,
      eventTitle,
      participantIds,
      deletedByName,
    });
  }

  /**
   * Пример 3: Мероприятие создано
   * Уведомляет участников сообщества (используя существующий метод)
   */
  async handleEventCreated(
    eventId: number,
    eventTitle: string,
    communityId: number,
    communityName: string,
    createdByName: string,
  ): Promise<void> {
    await this.notificationEventService.notifyEventCreated({
      eventId,
      eventTitle,
      communityId,
      communityName,
      createdByName,
    });
  }

  /**
   * Пример 4: Пользователь присоединился к сообществу
   * Создает уведомление для самого пользователя
   */
  async handleUserJoinedCommunity(
    userId: number,
    communityId: number,
    communityName: string,
  ): Promise<void> {
    await this.notificationEventService.notifyUserJoinedCommunity({
      userId,
      communityId,
      communityName,
    });
  }

  /**
   * Пример 5: Пользователь написал сообщение в мероприятии
   * Уведомляет всех участников кроме автора
   */
  async handleEventMessagePosted(
    eventId: number,
    eventTitle: string,
    messageText: string,
    authorId: number,
    authorName: string,
    participantIds: number[],
  ): Promise<void> {
    await this.notificationEventService.notifyEventMessagePosted({
      eventId,
      eventTitle,
      messageText,
      authorId,
      authorName,
      participantIds,
    });
  }

  /**
   * Пример 6: Использование глобальной функции уведомлений
   * Для создания пользовательских уведомлений
   */
  async createCustomNotificationExample(): Promise<void> {
    const customNotification: IGlobalNotificationData = {
      type: 'INFO',
      title: 'Системное уведомление',
      message: 'Это пример пользовательского уведомления',
      userId: [1, 2, 3], // Массив ID пользователей
      payload: {
        customData: 'some value',
        eventId: 123,
      },
    };

    await this.notificationEventService.createCustomNotification(customNotification);
  }

  /**
   * Пример 7: Уведомление одного пользователя
   */
  async notifySingleUser(userId: number): Promise<void> {
    const notification: IGlobalNotificationData = {
      type: 'USER_MENTIONED',
      title: 'Вас упомянули',
      message: 'Вас упомянули в обсуждении',
      userId: userId, // Один пользователь
      payload: {
        messageId: 456,
        eventId: 789,
      },
    };

    await this.notificationEventService.createCustomNotification(notification);
  }

  /**
   * Пример интеграции в контроллере событий
   * Показывает, как вызывать уведомления после бизнес-операций
   */
  async exampleEventControllerIntegration(): Promise<void> {
    // Имитация создания события
    const newEvent = {
      id: 1,
      title: 'Субботник',
      communityId: 1,
      communityName: 'Наш район',
      createdBy: 1,
      createdByName: 'Иван Иванов',
    };

    // 1. Сначала выполняем бизнес-логику (создание события в БД)
    // ... код создания события ...

    // 2. Затем отправляем уведомления
    await this.handleEventCreated(
      newEvent.id,
      newEvent.title,
      newEvent.communityId,
      newEvent.communityName,
      newEvent.createdByName,
    );
  }

  /**
   * Пример интеграции в контроллере сообществ
   */
  async exampleCommunityControllerIntegration(): Promise<void> {
    // Имитация присоединения к сообществу
    const joinData = {
      userId: 2,
      communityId: 1,
      communityName: 'Наш район',
    };

    // 1. Сначала выполняем бизнес-логику (добавление пользователя в сообщество)
    // ... код добавления пользователя в сообщество ...

    // 2. Затем отправляем уведомление пользователю
    await this.handleUserJoinedCommunity(
      joinData.userId,
      joinData.communityId,
      joinData.communityName,
    );
  }
}

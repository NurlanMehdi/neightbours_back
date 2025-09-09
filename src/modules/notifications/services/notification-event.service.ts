import { Injectable, Logger } from '@nestjs/common';
import { NotificationTriggerService } from './notification-trigger.service';
import { NotificationService } from './notification.service';
import {
  ISystemEventData,
  SystemEventType,
  IGlobalNotificationData,
} from '../interfaces/notification.interface';

/**
 * Сервис для отправки событий в систему уведомлений
 * Предоставляет удобные методы для интеграции с другими модулями
 */
@Injectable()
export class NotificationEventService {
  private readonly logger = new Logger(NotificationEventService.name);

  constructor(
    private readonly triggerService: NotificationTriggerService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Уведомление о создании нового мероприятия
   */
  async notifyEventCreated(data: {
    eventId: number;
    eventTitle: string;
    communityId: number;
    communityName: string;
    createdByName: string;
  }): Promise<void> {
    const eventData: ISystemEventData = {
      eventType: SystemEventType.EVENT_CREATED,
      relatedEntityId: data.eventId,
      relatedEntityType: 'event',
      additionalData: {
        eventTitle: data.eventTitle,
        communityName: data.communityName,
        createdByName: data.createdByName,
      },
    };

    await this.triggerService.processSystemEvent(eventData);
  }

  /**
   * Уведомление об обновлении мероприятия
   */
  async notifyEventUpdated(data: {
    eventId: number;
    eventTitle: string;
    updatedByName: string;
  }): Promise<void> {
    const eventData: ISystemEventData = {
      eventType: SystemEventType.EVENT_UPDATED,
      relatedEntityId: data.eventId,
      relatedEntityType: 'event',
      additionalData: {
        eventTitle: data.eventTitle,
        updatedByName: data.updatedByName,
      },
    };

    await this.triggerService.processSystemEvent(eventData);
  }

  /**
   * Уведомление об отмене мероприятия
   */
  async notifyEventCancelled(data: {
    eventId: number;
    eventTitle: string;
    cancelledByName: string;
  }): Promise<void> {
    const eventData: ISystemEventData = {
      eventType: SystemEventType.EVENT_CANCELLED,
      relatedEntityId: data.eventId,
      relatedEntityType: 'event',
      additionalData: {
        eventTitle: data.eventTitle,
        cancelledByName: data.cancelledByName,
      },
    };

    await this.triggerService.processSystemEvent(eventData);
  }

  /**
   * Уведомление о присоединении к мероприятию
   */
  async notifyUserJoinedEvent(data: {
    eventId: number;
    eventTitle: string;
    userName: string;
    userId: number;
  }): Promise<void> {
    const eventData: ISystemEventData = {
      eventType: SystemEventType.USER_JOINED_EVENT,
      relatedEntityId: data.eventId,
      relatedEntityType: 'event',
      additionalData: {
        eventTitle: data.eventTitle,
        userName: data.userName,
        triggererUserId: data.userId,
      },
    };

    await this.triggerService.processSystemEvent(eventData);
  }

  /**
   * Уведомление о покидании мероприятия
   */
  async notifyUserLeftEvent(data: {
    eventId: number;
    eventTitle: string;
    userName: string;
    userId: number;
  }): Promise<void> {
    const eventData: ISystemEventData = {
      eventType: SystemEventType.USER_LEFT_EVENT,
      relatedEntityId: data.eventId,
      relatedEntityType: 'event',
      additionalData: {
        eventTitle: data.eventTitle,
        userName: data.userName,
        triggererUserId: data.userId,
      },
    };

    await this.triggerService.processSystemEvent(eventData);
  }

  /**
   * Уведомление об удалении мероприятия (через системные события)
   */
  async notifyEventDeletedViaSystem(data: {
    eventId: number;
    eventTitle: string;
    deletedByName: string;
  }): Promise<void> {
    const eventData: ISystemEventData = {
      eventType: SystemEventType.EVENT_DELETED,
      relatedEntityId: data.eventId,
      relatedEntityType: 'event',
      additionalData: {
        eventTitle: data.eventTitle,
        deletedByName: data.deletedByName,
      },
    };

    await this.triggerService.processSystemEvent(eventData);
  }

  /**
   * Уведомление о новом сообщении
   */
  async notifyMessageReceived(data: {
    eventId: number;
    eventTitle: string;
    messageText: string;
    senderName: string;
  }): Promise<void> {
    const eventData: ISystemEventData = {
      eventType: SystemEventType.USER_MENTIONED,  
      relatedEntityId: data.eventId,
      relatedEntityType: 'event',
      additionalData: {
        eventTitle: data.eventTitle,
        messageText: data.messageText,
        senderName: data.senderName,
      },
    };

    await this.triggerService.processSystemEvent(eventData);
  }

  /**
   * Уведомление об удалении мероприятия
   */
  async notifyEventDeleted(data: {
    eventId: number;
    eventTitle: string;
    participantIds: number[];
    deletedByName: string;
    deletedById?: number;
  }): Promise<void> {
    // Исключаем пользователя, который удалил событие
    const targetUserIds = data.deletedById
      ? data.participantIds.filter((id) => id !== data.deletedById)
      : data.participantIds;

    if (targetUserIds.length === 0) {
      this.logger.log('Нет участников для уведомления об удалении мероприятия');
      return;
    }

    const notificationData: IGlobalNotificationData = {
      type: 'EVENT_DELETED',
      title: 'Мероприятие удалено',
      message: `Мероприятие "${data.eventTitle}" было удалено`,
      userId: targetUserIds,
      payload: {
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        deletedByName: data.deletedByName,
      },
    };

    await this.notificationService.createGlobalNotification(notificationData);
  }

  /**
   * Уведомление о том, что пользователь присоединился к мероприятию (для самого пользователя)
   */
  async notifyUserJoinedEventConfirmation(data: {
    eventId: number;
    eventTitle: string;
    userId: number;
    communityName: string;
  }): Promise<void> {
    const notificationData: IGlobalNotificationData = {
      type: 'USER_JOINED_EVENT',
      title: 'Вы присоединились к мероприятию',
      message: `Вы успешно присоединились к мероприятию "${data.eventTitle}" в сообществе ${data.communityName}`,
      userId: data.userId,
      payload: {
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        communityName: data.communityName,
      },
    };

    await this.notificationService.createGlobalNotification(notificationData);
  }

  /**
   * Уведомление о том, что пользователь присоединился к сообществу (для самого пользователя)
   */
  async notifyUserJoinedCommunity(data: {
    communityId: number;
    communityName: string;
    userId: number;
  }): Promise<void> {
    const notificationData: IGlobalNotificationData = {
      type: 'USER_JOINED_COMMUNITY',
      title: 'Добро пожаловать в сообщество',
      message: `Вы успешно присоединились к сообществу "${data.communityName}"`,
      userId: data.userId,
      payload: {
        communityId: data.communityId,
        communityName: data.communityName,
      },
    };

    await this.notificationService.createGlobalNotification(notificationData);
  }

  /**
   * Уведомление участникам сообщества о новом участнике
   */
  async notifyUserJoinedCommunityToMembers(data: {
    communityId: number;
    communityName: string;
    newUserName: string;
    newUserId: number;
  }): Promise<void> {
    const eventData: ISystemEventData = {
      eventType: SystemEventType.USER_JOINED_COMMUNITY,
      relatedEntityId: data.communityId,
      relatedEntityType: 'community',
      additionalData: {
        communityName: data.communityName,
        newUserName: data.newUserName,
        triggererUserId: data.newUserId,
      },
    };

    await this.triggerService.processSystemEvent(eventData);
  }

  /**
   * Уведомление о новом сообщении в мероприятии (для всех участников кроме автора)
   */
  async notifyEventMessagePosted(data: {
    eventId: number;
    eventTitle: string;
    messageText: string;
    authorId: number;
    authorName: string;
    participantIds: number[];
  }): Promise<void> {
    const recipientIds = data.participantIds.filter(
      (id) => id !== data.authorId,
    );

    if (recipientIds.length === 0) {
      this.logger.log('Нет участников для уведомления о новом сообщении');
      return;
    }

    const notificationData: IGlobalNotificationData = {
      type: 'MESSAGE_RECEIVED',
      title: 'Новое сообщение',
      message: `${data.authorName} написал сообщение в мероприятии "${data.eventTitle}"`,
      userId: recipientIds,
      payload: {
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        messageText:
          data.messageText.substring(0, 100) +
          (data.messageText.length > 100 ? '...' : ''),
        senderName: data.authorName,
      },
    };

    await this.notificationService.createGlobalNotification(notificationData);
  }

  /**
   * Глобальная функция для создания произвольного уведомления
   * Прямой доступ к глобальной функции уведомлений
   */
  async createCustomNotification(data: IGlobalNotificationData): Promise<void> {
    this.logger.log(`Создание пользовательского уведомления типа ${data.type}`);
    await this.notificationService.createGlobalNotification(data);
  }

  /**
   * Отправка произвольного системного события
   */
  async sendSystemEvent(eventData: ISystemEventData): Promise<void> {
    this.logger.log(`Отправка системного события: ${eventData.eventType}`);
    await this.triggerService.processSystemEvent(eventData);
  }
}

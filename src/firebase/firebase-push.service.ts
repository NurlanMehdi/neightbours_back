import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { NotificationType } from '../modules/notifications/interfaces/notification.interface';

export interface IPushNotificationData {
  title: string;
  body: string;
  userId: number;
  type: NotificationType;
  payload?: any;
}

export interface ISendPushNotificationToUser {
  userId: number;
  fcmToken: string;
  pushNotificationsEnabled: boolean;
}

@Injectable()
export class FirebasePushService {
  private readonly logger = new Logger(FirebasePushService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Отправляет push-уведомление конкретному пользователю
   */
  async sendPushNotificationToUser(
    user: ISendPushNotificationToUser,
    data: IPushNotificationData,
  ): Promise<boolean> {
    try {
      if (!user.pushNotificationsEnabled) {
        this.logger.log(
          `Push-уведомления отключены для пользователя ${user.userId}`,
        );
        return false;
      }

      if (!user.fcmToken) {
        this.logger.log(`FCM токен не найден для пользователя ${user.userId}`);
        return false;
      }

      const message = {
        notification: {
          title: data.title,
          body: data.body,
        },
        data: {
          type: data.type,
          userId: data.userId.toString(),
          payload: data.payload ? JSON.stringify(data.payload) : '',
        },
        token: user.fcmToken,
      };

      const result = await this.firebaseService.getMessaging().send(message);

      this.logger.log(
        `Push-уведомление отправлено пользователю ${user.userId}. Message ID: ${result}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Ошибка отправки push-уведомления пользователю ${user.userId}: ${error.message}`,
      );

      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        this.logger.warn(
          `Недействительный FCM токен для пользователя ${user.userId}. Требуется обновление токена.`,
        );
      }

      return false;
    }
  }

  /**
   * Отправляет push-уведомления нескольким пользователям
   */
  async sendPushNotificationToMultipleUsers(
    users: ISendPushNotificationToUser[],
    data: IPushNotificationData,
  ): Promise<{ successCount: number; failureCount: number }> {
    this.logger.log(`Отправка push-уведомлений ${users.length} пользователям`);

    const enabledUsers = users.filter(
      (user) => user.pushNotificationsEnabled && user.fcmToken,
    );

    if (enabledUsers.length === 0) {
      this.logger.log(
        'Нет пользователей с включенными push-уведомлениями и действующими токенами',
      );
      return { successCount: 0, failureCount: 0 };
    }

    const promises = enabledUsers.map((user) =>
      this.sendPushNotificationToUser(user, data),
    );
    const results = await Promise.all(promises);

    const successCount = results.filter((result) => result === true).length;
    const failureCount = results.filter((result) => result === false).length;

    this.logger.log(
      `Push-уведомления отправлены: успешно - ${successCount}, с ошибками - ${failureCount}`,
    );

    return { successCount, failureCount };
  }

  /**
   * Отправляет push-уведомление с использованием multicast для большого количества пользователей
   */
  async sendPushNotificationMulticast(
    fcmTokens: string[],
    data: IPushNotificationData,
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      if (fcmTokens.length === 0) {
        this.logger.log('Список FCM токенов пуст');
        return { successCount: 0, failureCount: 0 };
      }

      const message = {
        notification: {
          title: data.title,
          body: data.body,
        },
        data: {
          type: data.type,
          userId: data.userId.toString(),
          payload: data.payload ? JSON.stringify(data.payload) : '',
        },
        tokens: fcmTokens,
      };

      const result = await this.firebaseService
        .getMessaging()
        .sendEachForMulticast(message);

      this.logger.log(
        `Multicast push-уведомление отправлено: успешно - ${result.successCount}, с ошибками - ${result.failureCount}`,
      );

      if (result.failureCount > 0) {
        result.responses.forEach((response, index) => {
          if (!response.success) {
            this.logger.error(
              `Ошибка отправки push-уведомления для токена ${index}: ${response.error?.message}`,
            );
          }
        });
      }

      return {
        successCount: result.successCount,
        failureCount: result.failureCount,
      };
    } catch (error) {
      this.logger.error(
        `Ошибка multicast отправки push-уведомлений: ${error.message}`,
      );
      return { successCount: 0, failureCount: fcmTokens.length };
    }
  }

  /**
   * Создает заголовок уведомления на основе типа
   */
  generateNotificationTitle(type: NotificationType): string {
    const titleMapping: Record<NotificationType, string> = {
      [NotificationType.INFO]: 'Информация',
      [NotificationType.EVENT_CREATED]: 'Новое событие',
      [NotificationType.EVENT_UPDATED]: 'Событие обновлено',
      [NotificationType.EVENT_CANCELLED]: 'Событие отменено',
      [NotificationType.EVENT_DELETED]: 'Событие удалено',
      [NotificationType.USER_JOINED_EVENT]: 'Новый участник',
      [NotificationType.USER_LEFT_EVENT]: 'Участник покинул событие',
      [NotificationType.USER_MENTIONED]: 'Вас упомянули',
      [NotificationType.MESSAGE_RECEIVED]: 'Новое сообщение',
      [NotificationType.COMMUNITY_INVITE]: 'Приглашение в сообщество',
      [NotificationType.COMMUNITY_APPROVED]: 'Заявка одобрена',
      [NotificationType.COMMUNITY_REJECTED]: 'Заявка отклонена',
      [NotificationType.USER_JOINED_COMMUNITY]: 'Новый участник сообщества',
      [NotificationType.SYSTEM_MAINTENANCE]: 'Техническое обслуживание',
      [NotificationType.SYSTEM_UPDATE]: 'Обновление системы',
    };

    return titleMapping[type] || 'Уведомление';
  }
}

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { NotificationType } from '../modules/notifications/interfaces/notification.interface';
import { UserRepository } from '../modules/users/repositories/user.repository';

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
  private sentNotifications = new Set<string>();

  constructor(
    private readonly firebaseService: FirebaseService,
    @Inject(forwardRef(() => UserRepository))
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Отправляет push-уведомление конкретному пользователю
   */
  async sendPushNotificationToUser(
    user: ISendPushNotificationToUser,
    data: IPushNotificationData,
  ): Promise<boolean> {
    const callId = Math.random().toString(36).substr(2, 9);
    const deduplicationKey = `${user.userId}-${data.type}-${data.title}-${Date.now().toString().slice(0, -3)}`;
    
    this.logger.log(`🔥 FIREBASE CALL START [${callId}] - User: ${user.userId}, Type: ${data.type}, Title: "${data.title}"`);
    
    if (this.sentNotifications.has(deduplicationKey)) {
      this.logger.warn(`🚫 DUPLICATE NOTIFICATION BLOCKED [${callId}] - Key: ${deduplicationKey}`);
      return false;
    }
    
    this.sentNotifications.add(deduplicationKey);
    setTimeout(() => this.sentNotifications.delete(deduplicationKey), 5 * 60 * 1000);
    
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
        `✅ FIREBASE CALL SUCCESS [${callId}] - User: ${user.userId}, Message ID: ${result}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `❌ FIREBASE CALL ERROR [${callId}] - User: ${user.userId}: ${error.message}`,
      );
      this.sentNotifications.delete(deduplicationKey);

      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        this.logger.warn(
          `Недействительный FCM токен для пользователя ${user.userId}. Автоматически очищаем токен.`,
        );
        await this.cleanInvalidFcmToken(user.userId);
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
    const batchId = Math.random().toString(36).substr(2, 9);
    this.logger.log(`📦 FIREBASE BATCH START [${batchId}] - ${users.length} пользователям, Type: ${data.type}`);

    const enabledUsers = users.filter(
      (user) => user.pushNotificationsEnabled && user.fcmToken,
    );

    if (enabledUsers.length === 0) {
      this.logger.log(
        `📦 FIREBASE BATCH SKIP [${batchId}] - Нет пользователей с включенными push-уведомлениями`,
      );
      return { successCount: 0, failureCount: 0 };
    }

    this.logger.log(`📦 FIREBASE BATCH PROCESS [${batchId}] - ${enabledUsers.length} enabled users`);
    const promises = enabledUsers.map((user) =>
      this.sendPushNotificationToUser(user, data),
    );
    const results = await Promise.all(promises);

    const successCount = results.filter((result) => result === true).length;
    const failureCount = results.filter((result) => result === false).length;

    this.logger.log(
      `📦 FIREBASE BATCH END [${batchId}] - успешно: ${successCount}, с ошибками: ${failureCount}`,
    );

    return { successCount, failureCount };
  }


  /**
   * Очищает недействительный FCM токен у пользователя
   */
  private async cleanInvalidFcmToken(userId: number): Promise<void> {
    try {
      await this.userRepository.update(userId, {
        fcmToken: null,
      });
      this.logger.log(
        `Недействительный FCM токен очищен для пользователя ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Ошибка очистки FCM токена для пользователя ${userId}: ${error.message}`,
      );
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
      [NotificationType.PROPERTY_VERIFIED]: 'Объект подтвержден',
      [NotificationType.SYSTEM_MAINTENANCE]: 'Техническое обслуживание',
      [NotificationType.SYSTEM_UPDATE]: 'Обновление системы',
    };

    return titleMapping[type] || 'Уведомление';
  }
}

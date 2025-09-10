import { Injectable, Logger, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { NotificationRepository } from '../repositories/notification.repository';
import { FirebasePushService } from '../../../firebase/firebase-push.service';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { 
  INotificationService, 
  ICreateNotification, 
  INotificationFilters,
  IGlobalNotificationData,
  NotificationType
} from '../interfaces/notification.interface';
import { 
  NotificationDto, 
  NotificationsPaginatedDto, 
  UnreadCountDto, 
  SendNotificationDto, 
  NotificationTypesDto, 
  NotificationTypeDto, 
  UsersSelectionDto, 
  UserSelectionDto 
} from '../dto';

@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly firebasePushService: FirebasePushService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Создает новое уведомление
   */
  async createNotification(data: ICreateNotification): Promise<NotificationDto> {
    this.logger.log(`Создание уведомления типа ${data.type} для пользователя ${data.userId}`);

    const user = await this.notificationRepository.getUserWithPushSettings(data.userId);
    if (!user) {
      this.logger.error(`Попытка создать уведомление для несуществующего пользователя ${data.userId}`);
      throw new NotFoundException(`Пользователь с ID ${data.userId} не найден`);
    }

    let notification: any;
    let notificationDto: NotificationDto;

    if (data.type === NotificationType.MESSAGE_RECEIVED) {
      // Commented out DB saving for MESSAGE_RECEIVED notifications
      // notification = await this.notificationRepository.create(data);
      // notificationDto = this.transformToDto(notification);
      
      notificationDto = {
        id: 0,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: data.userId,
        payload: data.payload,
      } as NotificationDto;
    } else {
      notification = await this.notificationRepository.create(data);
      notificationDto = this.transformToDto(notification);
    }

    await this.sendPushNotificationIfEnabled(user, {
      title: data.title,
      body: data.message,
      userId: data.userId,
      type: data.type,
      payload: data.payload,
    });

    if (data.type !== NotificationType.MESSAGE_RECEIVED) {
      this.sendRealtimeNotification(data.userId, notificationDto);
    }

    return notificationDto;
  }

  /**
   * Создает множественные уведомления
   */
  async createMultipleNotifications(notifications: ICreateNotification[]): Promise<void> {
    this.logger.log(`Создание ${notifications.length} уведомлений`);

    if (notifications.length === 0) {
      this.logger.warn('Попытка создать пустой массив уведомлений');
      return;
    }

    const uniqueUserIds = [...new Set(notifications.map(n => n.userId))];
    const users = await this.notificationRepository.getUsersWithPushSettings(uniqueUserIds);
    
    const foundUserIds = users.map(user => user.id);
    const invalidUsers = uniqueUserIds.filter(userId => !foundUserIds.includes(userId));

    if (invalidUsers.length > 0) {
      this.logger.error(`Найдены несуществующие пользователи: ${invalidUsers.join(', ')}`);
      throw new NotFoundException(`Пользователи с ID ${invalidUsers.join(', ')} не найдены`);
    }

    const messageReceivedNotifications = notifications.filter(n => n.type === NotificationType.MESSAGE_RECEIVED);
    const otherNotifications = notifications.filter(n => n.type !== NotificationType.MESSAGE_RECEIVED);

    let createdNotifications: any[] = [];

    if (otherNotifications.length > 0) {
      createdNotifications = await this.notificationRepository.createMany(otherNotifications);
    }

    // Commented out DB saving for MESSAGE_RECEIVED notifications
    // if (messageReceivedNotifications.length > 0) {
    //   const messageReceivedCreated = await this.notificationRepository.createMany(messageReceivedNotifications);
    //   createdNotifications = [...createdNotifications, ...messageReceivedCreated];
    // }

    await this.sendBulkPushNotifications(users, notifications);

    this.sendBulkRealtimeNotifications(notifications, createdNotifications);

    this.logger.log(`Создано ${notifications.length} уведомлений`);
  }

  /**
   * Получает уведомления пользователя с фильтрацией и пагинацией
   */
  async getUserNotifications(filters: INotificationFilters): Promise<NotificationsPaginatedDto> {
    this.logger.log(`Получение уведомлений для пользователя ${filters.userId}`);

    const processedFilters = this.processFilters(filters);
    const { data, total } = await this.notificationRepository.findByUserId(processedFilters);
    
    // Получаем количество непрочитанных уведомлений
    const unreadCount = await this.notificationRepository.getUnreadCountForUser(filters.userId);

    const notifications = data.map(notification => this.transformToDto(notification));
    const totalPages = Math.ceil(total / (filters.limit || 10));

    return plainToInstance(NotificationsPaginatedDto, {
      data: notifications,
      total,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages,
      unreadCount,
    });
  }

  /**
   * Отмечает уведомление как прочитанное
   */
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    this.logger.log(`Отметка уведомления ${notificationId} как прочитанного пользователем ${userId}`);

    const notification = await this.notificationRepository.findById(notificationId);
    
    if (!notification) {
      throw new NotFoundException('Уведомление не найдено');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Нет доступа к данному уведомлению');
    }

    if (notification.isRead) {
      this.logger.log(`Уведомление ${notificationId} уже прочитано`);
      return;
    }

    await this.notificationRepository.markAsRead(notificationId);
    
    const updatedUnreadCount = await this.notificationRepository.getUnreadCountForUser(userId);
    this.sendUnreadCountUpdate(userId, updatedUnreadCount);
    
    this.logger.log(`Уведомление ${notificationId} отмечено как прочитанное`);
  }

  /**
   * Отмечает все уведомления пользователя как прочитанные
   */
  async markAllAsRead(userId: number): Promise<void> {
    this.logger.log(`Отметка всех уведомлений как прочитанных для пользователя ${userId}`);

    await this.notificationRepository.markAllAsReadForUser(userId);
    
    this.sendUnreadCountUpdate(userId, 0);
    
    this.logger.log(`Все уведомления пользователя ${userId} отмечены как прочитанные`);
  }

  /**
   * Получает количество непрочитанных уведомлений
   */
  async getUnreadCount(userId: number): Promise<UnreadCountDto> {
    this.logger.log(`Получение количества непрочитанных уведомлений для пользователя ${userId}`);

    const count = await this.notificationRepository.getUnreadCountForUser(userId);
    
    return plainToInstance(UnreadCountDto, { count });
  }

  /**
   * Глобальная функция для создания уведомлений
   * Принимает тип, заголовок, сообщение, ID пользователя(ей) и payload
   */
  async createGlobalNotification(data: IGlobalNotificationData): Promise<void> {
    this.logger.log(`Создание глобального уведомления типа ${data.type}`);

    if (data.type === 'MESSAGE_RECEIVED' && !Object.values(NotificationType).includes(NotificationType.MESSAGE_RECEIVED)) {
      this.logger.warn('MESSAGE_RECEIVED тип не найден в enum, пропускаем уведомление');
      return;
    }

    const notificationType = this.mapStringToNotificationType(data.type);
    const userIds = Array.isArray(data.userId) ? data.userId : [data.userId];

    if (userIds.length === 0) {
      this.logger.warn('Не указаны пользователи для уведомления');
      return;
    }

    const notifications: ICreateNotification[] = userIds.map(userId => ({
      type: notificationType,
      title: data.title,
      message: data.message,
      userId,
      payload: data.payload,
    }));

    await this.createMultipleNotifications(notifications);
    this.logger.log(`Создано ${notifications.length} глобальных уведомлений типа ${data.type}`);
  }



  /**
   * Удаляет уведомление
   */
  async deleteNotification(notificationId: number, userId: number): Promise<void> {
    this.logger.log(`Удаление уведомления ${notificationId} пользователем ${userId}`);

    const notification = await this.notificationRepository.findById(notificationId);
    
    if (!notification) {
      throw new NotFoundException('Уведомление не найдено');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Нет доступа к данному уведомлению');
    }

    await this.notificationRepository.delete(notificationId);
    this.logger.log(`Уведомление ${notificationId} удалено`);
  }

  /**
   * Удаляет все уведомления пользователя
   */
  async deleteAllSelfNotifications(userId: number): Promise<void> {
    this.logger.log(`Удаление всех уведомлений пользователя ${userId}`);

    const deletedCount = await this.notificationRepository.deleteAllByUserId(userId);
    this.logger.log(`Удалено ${deletedCount} уведомлений пользователя ${userId}`);
  }

  /**
   * Очищает старые прочитанные уведомления
   */
  async cleanupOldNotifications(olderThanDays: number = 30): Promise<number> {
    this.logger.log(`Очистка прочитанных уведомлений старше ${olderThanDays} дней`);

    const deletedCount = await this.notificationRepository.cleanupOldNotifications(olderThanDays);
    this.logger.log(`Удалено ${deletedCount} старых уведомлений`);
    
    return deletedCount;
  }

  /**
   * Получает список доступных типов уведомлений
   */
  async getNotificationTypes(): Promise<NotificationTypesDto> {
    this.logger.log('Получение списка типов уведомлений');

    const typeLabels: Record<NotificationType, string> = {
      [NotificationType.INFO]: 'Информационное',
      [NotificationType.EVENT_CREATED]: 'Событие создано',
      [NotificationType.EVENT_UPDATED]: 'Событие обновлено',
      [NotificationType.EVENT_CANCELLED]: 'Событие отменено',
      [NotificationType.EVENT_DELETED]: 'Событие удалено',
      [NotificationType.USER_JOINED_EVENT]: 'Пользователь присоединился к событию',
      [NotificationType.USER_LEFT_EVENT]: 'Пользователь покинул событие',
      [NotificationType.USER_MENTIONED]: 'Пользователь упомянут',
      [NotificationType.MESSAGE_RECEIVED]: 'Получено сообщение',
      [NotificationType.COMMUNITY_INVITE]: 'Приглашение в сообщество',
      [NotificationType.COMMUNITY_APPROVED]: 'Сообщество одобрено',
      [NotificationType.COMMUNITY_REJECTED]: 'Сообщество отклонено',
      [NotificationType.USER_JOINED_COMMUNITY]: 'Пользователь присоединился к сообществу',
      [NotificationType.PROPERTY_VERIFIED]: 'Объект недвижимости подтвержден',
      [NotificationType.SYSTEM_MAINTENANCE]: 'Техническое обслуживание',
      [NotificationType.SYSTEM_UPDATE]: 'Обновление системы',
    };

    const types: NotificationTypeDto[] = Object.values(NotificationType).map(type => 
      plainToInstance(NotificationTypeDto, {
        value: type,
        label: typeLabels[type],
      })
    );

    return plainToInstance(NotificationTypesDto, { types });
  }

  /**
   * Получает список пользователей для выбора
   */
  async getUsersForSelection(): Promise<UsersSelectionDto> {
    this.logger.log('Получение списка пользователей для выбора');

    const users = await this.notificationRepository.getAllUsersForSelection();
    
    const userSelectionDtos: UserSelectionDto[] = users.map(user => 
      plainToInstance(UserSelectionDto, {
        id: user.id,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        avatar: user.avatar,
      })
    );

    return plainToInstance(UsersSelectionDto, { users: userSelectionDtos });
  }

  /**
   * Отправляет уведомление выбранным пользователям
   */
  async sendNotificationToUsers(data: SendNotificationDto): Promise<{ success: boolean; message: string; count: number }> {
    this.logger.log(`Отправка уведомления ${data.notificationType} для ${data.toUserIds.length} пользователей`);

    const notifications: ICreateNotification[] = data.toUserIds.map(userId => ({
      type: data.notificationType,
      title: data.title,
      message: data.message,
      userId,
      payload: {
        isAdminMessage: true,
        sentAt: new Date().toISOString(),
        adminAction: 'MANUAL_NOTIFICATION',
      },
    }));

    await this.createMultipleNotifications(notifications);
    this.logger.log(`Отправлено ${notifications.length} уведомлений`);

    return {
      success: true,
      message: `Уведомления успешно отправлены ${notifications.length} пользователям`,
      count: notifications.length,
    };
  }

  /**
   * Обрабатывает фильтры для запроса
   */
  private processFilters(filters: INotificationFilters): INotificationFilters {
    const processed = { ...filters };

    // Преобразуем строковые даты в объекты Date
    if (typeof processed.dateFrom === 'string') {
      processed.dateFrom = new Date(processed.dateFrom);
    }
    
    if (typeof processed.dateTo === 'string') {
      processed.dateTo = new Date(processed.dateTo);
    }

    // Устанавливаем значения по умолчанию
    processed.page = processed.page || 1;
    processed.limit = processed.limit || 10;

    return processed;
  }

  /**
   * Преобразует объект уведомления в DTO
   */
  private transformToDto(notification: any): NotificationDto {
    return plainToInstance(NotificationDto, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      payload: notification.payload,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Проверяет, принадлежит ли уведомление пользователю
   */
  private async validateNotificationOwnership(notificationId: number, userId: number): Promise<any> {
    const notification = await this.notificationRepository.findById(notificationId);
    
    if (!notification) {
      throw new NotFoundException('Уведомление не найдено');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Нет доступа к данному уведомлению');
    }

    return notification;
  }

  /**
   * Преобразует строковый тип в enum NotificationType
   */
  private mapStringToNotificationType(type: string): NotificationType {
    const typeMapping: Record<string, NotificationType> = {
      'INFO': NotificationType.INFO,
      'EVENT_CREATED': NotificationType.EVENT_CREATED,
      'EVENT_UPDATED': NotificationType.EVENT_UPDATED,
      'EVENT_CANCELLED': NotificationType.EVENT_CANCELLED,
      'EVENT_DELETED': NotificationType.EVENT_DELETED,
      'USER_JOINED_EVENT': NotificationType.USER_JOINED_EVENT,
      'USER_LEFT_EVENT': NotificationType.USER_LEFT_EVENT,
      'USER_MENTIONED': NotificationType.USER_MENTIONED,
      'MESSAGE_RECEIVED': NotificationType.MESSAGE_RECEIVED,
      'COMMUNITY_INVITE': NotificationType.COMMUNITY_INVITE,
      'COMMUNITY_APPROVED': NotificationType.COMMUNITY_APPROVED,
      'COMMUNITY_REJECTED': NotificationType.COMMUNITY_REJECTED,
      'USER_JOINED_COMMUNITY': NotificationType.USER_JOINED_COMMUNITY,
      'PROPERTY_VERIFIED': NotificationType.PROPERTY_VERIFIED,
      'SYSTEM_MAINTENANCE': NotificationType.SYSTEM_MAINTENANCE,
      'SYSTEM_UPDATE': NotificationType.SYSTEM_UPDATE,
    };

    return typeMapping[type.toUpperCase()] || NotificationType.INFO;
  }

  /**
   * Отправляет push-уведомление, если оно включено у пользователя
   */
  private async sendPushNotificationIfEnabled(
    user: { id: number; fcmToken?: string; pushNotificationsEnabled: boolean },
    data: { title: string; body: string; userId: number; type: NotificationType; payload?: any },
  ): Promise<void> {
    if (user.pushNotificationsEnabled && user.fcmToken) {
      await this.firebasePushService.sendPushNotificationToUser(
        {
          userId: user.id,
          fcmToken: user.fcmToken,
          pushNotificationsEnabled: user.pushNotificationsEnabled,
        },
        data,
      );
    }
  }

  /**
   * Отправляет множественные push-уведомления
   */
  private async sendBulkPushNotifications(
    users: { id: number; fcmToken?: string; pushNotificationsEnabled: boolean }[],
    notifications: ICreateNotification[],
  ): Promise<void> {
    const notificationsByUser = new Map<number, ICreateNotification[]>();
    
    notifications.forEach(notification => {
      if (!notificationsByUser.has(notification.userId)) {
        notificationsByUser.set(notification.userId, []);
      }
      notificationsByUser.get(notification.userId)!.push(notification);
    });

    const pushPromises: Promise<void>[] = [];

    for (const user of users) {
      const userNotifications = notificationsByUser.get(user.id);
      if (userNotifications && user.pushNotificationsEnabled && user.fcmToken) {
        for (const notification of userNotifications) {
          pushPromises.push(
            this.firebasePushService.sendPushNotificationToUser(
              {
                userId: user.id,
                fcmToken: user.fcmToken,
                pushNotificationsEnabled: user.pushNotificationsEnabled,
              },
              {
                title: notification.title,
                body: notification.message,
                userId: notification.userId,
                type: notification.type,
                payload: notification.payload,
              },
            ).then(() => {})
          );
        }
      }
    }

    await Promise.all(pushPromises);
  }

  /**
   * Отправляет уведомление в реальном времени через WebSocket
   */
  private sendRealtimeNotification(userId: number, notification: NotificationDto): void {
    try {
      if (this.notificationsGateway.isUserConnected(userId)) {
        this.notificationsGateway.sendNotificationToUser(userId, notification);
        this.logger.log(`Уведомление отправлено в реальном времени пользователю ${userId}`);
      } else {
        this.logger.log(`Пользователь ${userId} не подключен к WebSocket, уведомление будет доставлено при следующем подключении`);
      }
    } catch (error) {
      this.logger.error(`Ошибка отправки уведомления в реальном времени пользователю ${userId}: ${error.message}`);
    }
  }

  /**
   * Отправляет множественные уведомления в реальном времени
   */
  private sendBulkRealtimeNotifications(
    notifications: ICreateNotification[],
    createdNotifications: any[],
  ): void {
    try {
      const notificationsByUser = new Map<number, NotificationDto[]>();
      
      createdNotifications.forEach((notification, index) => {
        const userId = notifications[index].userId;
        const notificationDto = this.transformToDto(notification);
        
        if (!notificationsByUser.has(userId)) {
          notificationsByUser.set(userId, []);
        }
        notificationsByUser.get(userId)!.push(notificationDto);
      });

      notificationsByUser.forEach((userNotifications, userId) => {
        if (this.notificationsGateway.isUserConnected(userId)) {
          userNotifications.forEach(notification => {
            this.notificationsGateway.sendNotificationToUser(userId, notification);
          });
          this.logger.log(`Отправлено ${userNotifications.length} уведомлений в реальном времени пользователю ${userId}`);
        }
      });
    } catch (error) {
      this.logger.error(`Ошибка отправки множественных уведомлений в реальном времени: ${error.message}`);
    }
  }

  /**
   * Отправляет обновление счетчика непрочитанных уведомлений
   */
  private sendUnreadCountUpdate(userId: number, count: number): void {
    try {
      if (this.notificationsGateway.isUserConnected(userId)) {
        this.notificationsGateway.sendUnreadCountUpdate(userId, count);
        this.logger.log(`Обновлен счетчик непрочитанных уведомлений для пользователя ${userId}: ${count}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка обновления счетчика непрочитанных уведомлений для пользователя ${userId}: ${error.message}`);
    }
  }
}

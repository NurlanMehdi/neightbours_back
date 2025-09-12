import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  INotificationRepository,
  ICreateNotification,
  IUpdateNotification,
  INotificationFilters,
} from '../interfaces/notification.interface';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  private readonly logger = new Logger(NotificationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Проверяет существование пользователя
   */
  async validateUserExists(userId: number): Promise<boolean> {
    const user = await (this.prisma as any).users.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Получает пользователя с настройками push-уведомлений
   */
  async getUserWithPushSettings(userId: number): Promise<{
    id: number;
    fcmToken?: string;
    pushNotificationsEnabled: boolean;
  } | null> {
    const user = await (this.prisma as any).users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fcmToken: true,
        pushNotificationsEnabled: true,
      },
    });
    return user;
  }

  /**
   * Получает пользователей с настройками push-уведомлений
   */
  async getUsersWithPushSettings(
    userIds: number[],
  ): Promise<
    { id: number; fcmToken?: string; pushNotificationsEnabled: boolean }[]
  > {
    const users = await (this.prisma as any).users.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        fcmToken: true,
        pushNotificationsEnabled: true,
      },
    });
    return users;
  }

  /**
   * Создает новое уведомление
   */
  async create(data: ICreateNotification): Promise<any> {
    this.logger.log(
      `Создание уведомления типа ${data.type} для пользователя ${data.userId}`,
    );

    try {
      const notification = await (this.prisma as any).notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          payload: data.payload || null,
          userId: data.userId,
        },
      });

      this.logger.log(`Уведомление создано с ID ${notification.id}`);
      return notification;
    } catch (error) {
      if (error.code === 'P2003') {
        this.logger.error(`Пользователь с ID ${data.userId} не найден`);
        throw new Error(`Пользователь с ID ${data.userId} не существует`);
      }
      this.logger.error(`Ошибка создания уведомления: ${error.message}`);
      throw error;
    }
  }

  /**
   * Получает уведомления пользователя с фильтрацией и пагинацией
   */
  async findByUserId(
    filters: INotificationFilters,
  ): Promise<{ data: any[]; total: number }> {
    const {
      userId,
      isRead,
      type,
      dateFrom,
      dateTo,
      payload,
      page = 1,
      limit = 10,
    } = filters;
    const skip = (page - 1) * limit;

    this.logger.log(
      `Получение уведомлений для пользователя ${userId} с фильтрами: ${JSON.stringify(filters)}`,
    );

    const where: any = {
      userId,
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    if (payload && Object.keys(payload).length > 0) {
      where.payload = {
        contains: payload,
      };
    }

    const [data, total] = await Promise.all([
      (this.prisma as any).notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (this.prisma as any).notification.count({ where }),
    ]);

    this.logger.log(
      `Найдено ${data.length} уведомлений из ${total} для пользователя ${userId}`,
    );
    return { data, total };
  }

  /**
   * Находит уведомление по ID
   */
  async findById(id: number): Promise<any> {
    this.logger.log(`Поиск уведомления с ID ${id}`);

    const notification = await (this.prisma as any).notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!notification) {
      this.logger.warn(`Уведомление с ID ${id} не найдено`);
    }

    return notification;
  }

  /**
   * Обновляет уведомление
   */
  async update(id: number, data: IUpdateNotification): Promise<any> {
    this.logger.log(`Обновление уведомления с ID ${id}`);

    const notification = await (this.prisma as any).notification.update({
      where: { id },
      data,
    });

    this.logger.log(`Уведомление с ID ${id} обновлено`);
    return notification;
  }

  /**
   * Отмечает уведомление как прочитанное
   */
  async markAsRead(id: number): Promise<void> {
    this.logger.log(`Отметка уведомления ${id} как прочитанного`);

    await (this.prisma as any).notification.update({
      where: { id },
      data: { isRead: true },
    });

    this.logger.log(`Уведомление ${id} отмечено как прочитанное`);
  }

  /**
   * Отмечает все уведомления пользователя как прочитанные
   */
  async markAllAsReadForUser(userId: number): Promise<void> {
    this.logger.log(
      `Отметка всех уведомлений пользователя ${userId} как прочитанных`,
    );

    const result = await (this.prisma as any).notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    this.logger.log(
      `Отмечено ${result.count} уведомлений как прочитанных для пользователя ${userId}`,
    );
  }

  /**
   * Получает количество непрочитанных уведомлений пользователя
   */
  async getUnreadCountForUser(userId: number): Promise<number> {
    this.logger.log(
      `Получение количества непрочитанных уведомлений для пользователя ${userId}`,
    );

    const count = await (this.prisma as any).notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    this.logger.log(
      `У пользователя ${userId} ${count} непрочитанных уведомлений`,
    );
    return count;
  }

  /**
   * Удаляет уведомление
   */
  async delete(id: number): Promise<void> {
    this.logger.log(`Удаление уведомления с ID ${id}`);

    await (this.prisma as any).notification.delete({
      where: { id },
    });

    this.logger.log(`Уведомление с ID ${id} удалено`);
  }

  /**
   * Удаляет все уведомления пользователя
   */
  async deleteAllByUserId(userId: number): Promise<number> {
    this.logger.log(`Удаление всех уведомлений пользователя ${userId}`);

    const result = await (this.prisma as any).notification.deleteMany({
      where: { userId },
    });

    this.logger.log(
      `Удалено ${result.count} уведомлений пользователя ${userId}`,
    );
    return result.count;
  }

  /**
   * Создает множественные уведомления для разных пользователей
   */
  async createMany(notifications: ICreateNotification[]): Promise<any[]> {
    this.logger.log(`Создание ${notifications.length} уведомлений`);

    const data = notifications.map((notification) => ({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      payload: notification.payload || null,
      userId: notification.userId,
    }));

    const createPromises = data.map((notificationData) =>
      (this.prisma as any).notification.create({ data: notificationData }),
    );

    const createdNotifications = await Promise.all(createPromises);
    this.logger.log(`Создано ${notifications.length} уведомлений`);

    return createdNotifications;
  }

  /**
   * Удаляет старые прочитанные уведомления
   */
  async cleanupOldNotifications(olderThanDays: number = 30): Promise<number> {
    this.logger.log(
      `Очистка прочитанных уведомлений старше ${olderThanDays} дней`,
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await (this.prisma as any).notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Удалено ${result.count} старых прочитанных уведомлений`);
    return result.count;
  }

  /**
   * Получает список всех пользователей для выбора
   */
  async getAllUsersForSelection(): Promise<
    {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      avatar: string | null;
    }[]
  > {
    this.logger.log('Получение списка пользователей для выбора');

    const users = await (this.prisma as any).users.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return users;
  }
}

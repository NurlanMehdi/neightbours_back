import { Injectable, Logger } from '@nestjs/common';
import { EventMessage } from '@prisma/client';
import { NotificationEventService } from '../../notifications/services/notification-event.service';
import { UserService } from '../../users/services/user.service';
import { PrismaService } from '../../../prisma/prisma.service';

interface IMessageNotificationData {
  messageId: number;
  eventId: number;
  eventTitle: string;
  eventType: string;
  messageText: string;
  authorId: number;
  authorName: string;
  participantIds: number[];
  source: 'websocket' | 'http' | 'admin';
  requestId?: string;
}

interface INotificationDeduplicationEntry {
  messageId: number;
  userId: number;
  deviceToken?: string;
  timestamp: Date;
  source: string;
  requestId?: string;
}

/**
 * Унифицированный сервис для отправки уведомлений о сообщениях
 * Обеспечивает отправку только одного уведомления на пользователя на сообщение
 */
@Injectable()
export class UnifiedMessageNotificationService {
  private readonly logger = new Logger(UnifiedMessageNotificationService.name);
  
  // In-memory deduplication cache - очищается через 1 час
  private readonly notificationCache = new Map<string, INotificationDeduplicationEntry>();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 час
  
  constructor(
    private readonly notificationEventService: NotificationEventService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {
    // Запускаем очистку кеша каждые 30 минут
    setInterval(() => this.cleanupExpiredCacheEntries(), 30 * 60 * 1000);
  }

  /**
   * Единая точка входа для создания и отправки уведомлений о новом сообщении
   * Гарантирует отправку только одного уведомления на пользователя на сообщение
   */
  async processMessageNotification(
    message: EventMessage,
    data: IMessageNotificationData,
  ): Promise<void> {
    const requestId = data.requestId || this.generateRequestId();
    
    this.logger.log(
      `[${requestId}] Обработка уведомления о сообщении ${data.messageId} от пользователя ${data.authorId} в событии ${data.eventId} (источник: ${data.source})`,
    );

    try {
      // Получаем список участников, исключая автора сообщения
      const recipientIds = data.participantIds.filter(id => id !== data.authorId);
      
      if (recipientIds.length === 0) {
        this.logger.log(`[${requestId}] Нет получателей для уведомления`);
        return;
      }

      // Фильтруем получателей через дедупликацию
      const uniqueRecipientIds = await this.deduplicateNotifications(
        data.messageId,
        recipientIds,
        data.source,
        requestId,
      );

      if (uniqueRecipientIds.length === 0) {
        this.logger.log(
          `[${requestId}] Все уведомления уже были отправлены для сообщения ${data.messageId}`,
        );
        return;
      }

      this.logger.log(
        `[${requestId}] Отправка уведомлений ${uniqueRecipientIds.length} получателям: [${uniqueRecipientIds.join(', ')}]`,
      );

      // Отправляем уведомления только уникальным получателям
      await this.notificationEventService.notifyEventMessagePosted({
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        eventType: data.eventType,
        messageText: data.messageText,
        authorId: data.authorId,
        authorName: data.authorName,
        participantIds: uniqueRecipientIds, // Используем отфильтрованный список
      });

      // Записываем отправленные уведомления в кеш для предотвращения дубликатов
      await this.recordSentNotifications(
        data.messageId,
        uniqueRecipientIds,
        data.source,
        requestId,
      );

      this.logger.log(
        `[${requestId}] Успешно отправлены уведомления о сообщении ${data.messageId} для ${uniqueRecipientIds.length} получателей`,
      );

    } catch (error) {
      this.logger.error(
        `[${requestId}] Ошибка обработки уведомления о сообщении ${data.messageId}: ${error.message}`,
      );
      this.logger.error(`[${requestId}] Stack trace: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Фильтрует получателей, исключая тех, кому уведомление уже было отправлено
   */
  private async deduplicateNotifications(
    messageId: number,
    recipientIds: number[],
    source: string,
    requestId: string,
  ): Promise<number[]> {
    const uniqueRecipients: number[] = [];
    const currentTime = new Date();

    for (const userId of recipientIds) {
      const cacheKey = this.getCacheKey(messageId, userId);
      const existingEntry = this.notificationCache.get(cacheKey);

      if (existingEntry) {
        // Проверяем, не истек ли TTL
        const isExpired = (currentTime.getTime() - existingEntry.timestamp.getTime()) > this.CACHE_TTL_MS;
        
        if (isExpired) {
          // Запись истекла, удаляем из кеша и добавляем пользователя
          this.notificationCache.delete(cacheKey);
          uniqueRecipients.push(userId);
          
          this.logger.log(
            `[${requestId}] Кеш истек для пользователя ${userId}, сообщение ${messageId}`,
          );
        } else {
          // Уведомление уже было отправлено
          this.logger.log(
            `[${requestId}] Дубликат заблокирован для пользователя ${userId}, сообщение ${messageId}. ` +
            `Предыдущая отправка: ${existingEntry.timestamp.toISOString()} (источник: ${existingEntry.source})`,
          );
        }
      } else {
        // Уведомление еще не отправлялось
        uniqueRecipients.push(userId);
      }
    }

    this.logger.log(
      `[${requestId}] Дедупликация: из ${recipientIds.length} получателей, ${uniqueRecipients.length} уникальных`,
    );

    return uniqueRecipients;
  }

  /**
   * Записывает отправленные уведомления в кеш дедупликации
   */
  private async recordSentNotifications(
    messageId: number,
    userIds: number[],
    source: string,
    requestId: string,
  ): Promise<void> {
    const currentTime = new Date();

    for (const userId of userIds) {
      const cacheKey = this.getCacheKey(messageId, userId);
      
      // FCM токен получим позже при необходимости
      let deviceToken: string | undefined;

      const entry: INotificationDeduplicationEntry = {
        messageId,
        userId,
        deviceToken,
        timestamp: currentTime,
        source,
        requestId,
      };

      this.notificationCache.set(cacheKey, entry);
      
      this.logger.log(
        `[${requestId}] Записано в кеш: пользователь ${userId}, сообщение ${messageId}, устройство ${deviceToken || 'нет токена'}`,
      );
    }
  }

  /**
   * Генерирует уникальный ключ кеша для комбинации сообщение + пользователь
   */
  private getCacheKey(messageId: number, userId: number): string {
    return `msg_${messageId}_user_${userId}`;
  }

  /**
   * Генерирует уникальный ID запроса для трассировки
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Очищает истекшие записи из кеша
   */
  private cleanupExpiredCacheEntries(): void {
    const currentTime = new Date();
    let cleanedCount = 0;

    for (const [key, entry] of this.notificationCache.entries()) {
      const isExpired = (currentTime.getTime() - entry.timestamp.getTime()) > this.CACHE_TTL_MS;
      
      if (isExpired) {
        this.notificationCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Очищено ${cleanedCount} истекших записей из кеша дедупликации`);
    }
  }

  /**
   * Получает статистику кеша дедупликации (для отладки)
   */
  getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
    activeEntries: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    const currentTime = new Date();
    let expiredCount = 0;
    let oldestTime: Date | undefined;
    let newestTime: Date | undefined;

    for (const entry of this.notificationCache.values()) {
      const isExpired = (currentTime.getTime() - entry.timestamp.getTime()) > this.CACHE_TTL_MS;
      
      if (isExpired) {
        expiredCount++;
      }

      if (!oldestTime || entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
      }
      
      if (!newestTime || entry.timestamp > newestTime) {
        newestTime = entry.timestamp;
      }
    }

    return {
      totalEntries: this.notificationCache.size,
      expiredEntries: expiredCount,
      activeEntries: this.notificationCache.size - expiredCount,
      oldestEntry: oldestTime,
      newestEntry: newestTime,
    };
  }

  /**
   * Очищает весь кеш дедупликации (для тестирования)
   */
  clearCache(): void {
    const entriesCount = this.notificationCache.size;
    this.notificationCache.clear();
    this.logger.log(`Очищен кеш дедупликации: удалено ${entriesCount} записей`);
  }
}

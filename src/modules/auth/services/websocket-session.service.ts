import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from '../../notifications/gateways/notifications.gateway';
import { EventsGateway } from '../../events/events.gateway';

/**
 * Сервис для управления WebSocket сессиями пользователей
 */
@Injectable()
export class WebSocketSessionService {
  private readonly logger = new Logger(WebSocketSessionService.name);

  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Отключает все WebSocket сессии пользователя при выходе из системы
   */
  async disconnectUserSessions(userId: number): Promise<void> {
    this.logger.log(`Отключение всех WebSocket сессий пользователя ${userId}`);

    try {
      // Отключаем от уведомлений
      this.notificationsGateway.disconnectUserSessions(userId);
      
      // Отключаем от событий
      this.eventsGateway.disconnectUserEventSessions(userId);
      
      this.logger.log(
        `Все WebSocket сессии пользователя ${userId} успешно отключены`,
      );
    } catch (error) {
      this.logger.error(
        `Ошибка при отключении WebSocket сессий пользователя ${userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Получает информацию о подключениях пользователя
   */
  getUserConnectionInfo(userId: number): {
    notificationConnections: number;
    eventConnections: number;
    isConnected: boolean;
  } {
    const notificationConnections = this.notificationsGateway.getUserConnectionCount(userId);
    const eventConnections = this.eventsGateway.userSockets.get(userId)?.size || 0;
    
    return {
      notificationConnections,
      eventConnections,
      isConnected: notificationConnections > 0 || eventConnections > 0,
    };
  }

  /**
   * Получает общую статистику подключений
   */
  getConnectionStats(): {
    totalNotificationUsers: number;
    totalEventUsers: number;
    totalNotificationSockets: number;
    totalEventSockets: number;
  } {
    return {
      totalNotificationUsers: this.notificationsGateway.getConnectedUsersCount(),
      totalEventUsers: this.eventsGateway.userSockets.size,
      totalNotificationSockets: this.notificationsGateway.getTotalSocketsCount(),
      totalEventSockets: Array.from(this.eventsGateway.userSockets.values())
        .reduce((total, sockets) => total + sockets.size, 0),
    };
  }
}

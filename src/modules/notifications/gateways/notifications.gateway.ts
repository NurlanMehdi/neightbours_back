import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationDto } from '../dto';

/**
 * WebSocket Gateway для уведомлений в реальном времени
 */
@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<number, Set<string>> = new Map();
  private socketUser: Map<string, number> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('NotificationsGateway инициализирован');
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Новое подключение: ${client.id}`);

      let token = client.handshake.auth.token;

      if (!token) {
        token = client.handshake.query.token as string;
      }

      if (!token) {
        this.logger.warn(
          `Подключение ${client.id} отклонено: отсутствует токен`,
        );
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      this.disconnectPreviousUserSessions(userId, client.id);

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }

      this.userSockets.get(userId)!.add(client.id);
      this.socketUser.set(client.id, userId);

      client.join(`user:${userId}`);

      this.logger.log(
        `Пользователь ${userId} подключился к уведомлениям (сокет: ${client.id})`,
      );
      this.logger.log(
        `Активных подключений пользователя ${userId}: ${this.getUserConnectionCount(userId)}`,
      );
      this.logger.log(
        `Общее количество подключенных пользователей: ${this.getConnectedUsersCount()}`,
      );

      client.emit('connected', {
        message: 'Подключение к уведомлениям установлено',
        userId,
        connectionCount: this.getUserConnectionCount(userId),
      });
    } catch (error) {
      this.logger.error(
        `Ошибка при подключении ${client.id}: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUser.get(client.id);

    if (userId) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);

        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
          this.logger.log(
            `Все подключения пользователя ${userId} закрыты`,
          );
        }
      }

      this.socketUser.delete(client.id);
      this.logger.log(
        `Пользователь ${userId} отключился от уведомлений (сокет: ${client.id})`,
      );
      this.logger.log(
        `Оставшихся подключений пользователя ${userId}: ${this.getUserConnectionCount(userId)}`,
      );
      this.logger.log(
        `Общее количество подключенных пользователей: ${this.getConnectedUsersCount()}`,
      );
    } else {
      this.logger.warn(
        `Попытка отключения неизвестного сокета: ${client.id}`,
      );
    }
  }

  /**
   * Отправляет уведомление конкретному пользователю в реальном времени
   */
  sendNotificationToUser(userId: number, notification: NotificationDto): void {
    this.logger.log(
      `Отправка уведомления пользователю ${userId}: ${notification.title}`,
    );

    this.server.to(`user:${userId}`).emit('newNotification', notification);

    this.logger.log(`Уведомление отправлено пользователю ${userId}`);
  }

  /**
   * Отправляет уведомления нескольким пользователям
   */
  sendNotificationToUsers(
    userIds: number[],
    notification: NotificationDto,
  ): void {
    this.logger.log(
      `Отправка уведомления ${userIds.length} пользователям: ${notification.title}`,
    );

    userIds.forEach((userId) => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  /**
   * Отправляет обновление счетчика непрочитанных уведомлений
   */
  sendUnreadCountUpdate(userId: number, count: number): void {
    this.logger.log(
      `Обновление счетчика непрочитанных для пользователя ${userId}: ${count}`,
    );

    this.server.to(`user:${userId}`).emit('unreadCountUpdate', { count });
  }

  /**
   * Проверяет, подключен ли пользователь
   */
  isUserConnected(userId: number): boolean {
    return (
      this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0
    );
  }

  /**
   * Получает количество активных подключений пользователя
   */
  getUserConnectionCount(userId: number): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  /**
   * Получает общее количество подключенных пользователей
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Получает общее количество активных сокетов
   */
  getTotalSocketsCount(): number {
    let total = 0;
    this.userSockets.forEach((sockets) => {
      total += sockets.size;
    });
    return total;
  }

  /**
   * Отключает все предыдущие сессии пользователя (кроме текущей)
   */
  private disconnectPreviousUserSessions(userId: number, currentSocketId: string): void {
    const existingSockets = this.userSockets.get(userId);
    if (existingSockets && existingSockets.size > 0) {
      this.logger.log(
        `Отключение ${existingSockets.size} предыдущих сессий пользователя ${userId}`,
      );
      
      existingSockets.forEach((socketId) => {
        if (socketId !== currentSocketId) {
          const socket = this.server.sockets.sockets.get(socketId);
          if (socket) {
            this.logger.log(
              `Отключение предыдущей сессии пользователя ${userId}: ${socketId}`,
            );
            socket.emit('sessionReplaced', {
              message: 'Ваша сессия была заменена новым подключением',
              reason: 'new_session',
            });
            socket.disconnect(true);
          }
        }
      });
      
      existingSockets.clear();
    }
  }

  /**
   * Принудительно отключает все сессии пользователя (для logout)
   */
  disconnectUserSessions(userId: number): void {
    const existingSockets = this.userSockets.get(userId);
    if (existingSockets && existingSockets.size > 0) {
      this.logger.log(
        `Принудительное отключение всех сессий пользователя ${userId} (logout)`,
      );
      
      existingSockets.forEach((socketId) => {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          this.logger.log(
            `Отключение сессии пользователя ${userId}: ${socketId} (logout)`,
          );
          socket.emit('forceDisconnect', {
            message: 'Выход из системы',
            reason: 'logout',
          });
          socket.disconnect(true);
        }
      });
      
      this.userSockets.delete(userId);
      
      existingSockets.forEach((socketId) => {
        this.socketUser.delete(socketId);
      });
    }
  }
}

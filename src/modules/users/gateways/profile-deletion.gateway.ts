import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/profile-deletion',
})
export class ProfileDeletionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ProfileDeletionGateway.name);
  private connectedUsers = new Map<number, string>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      this.connectedUsers.set(userId, client.id);
      client.join(`user-${userId}`);
      
      this.logger.log(`Пользователь ${userId} подключен к мониторингу удаления профиля`);
    } catch (error) {
      this.logger.error(`Ошибка подключения: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.connectedUsers.entries())
      .find(([, socketId]) => socketId === client.id)?.[0];
    
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`Пользователь ${userId} отключен от мониторинга удаления профиля`);
    }
  }

  notifyDeletionWarning(userId: number, daysLeft: number) {
    this.server.to(`user-${userId}`).emit('deletion-warning', {
      message: `Ваш профиль будет удален через ${daysLeft} дней`,
      daysLeft,
      type: 'warning',
    });
  }

  notifyDeletionUrgent(userId: number, hoursLeft: number) {
    this.server.to(`user-${userId}`).emit('deletion-urgent', {
      message: `Ваш профиль будет удален через ${hoursLeft} часов`,
      hoursLeft,
      type: 'urgent',
    });
  }

  notifyDeletionCompleted(userId: number) {
    this.server.to(`user-${userId}`).emit('deletion-completed', {
      message: 'Ваш профиль был удален',
      type: 'completed',
    });
  }

  notifyDeletionCancelled(userId: number) {
    this.server.to(`user-${userId}`).emit('deletion-cancelled', {
      message: 'Удаление профиля отменено',
      type: 'cancelled',
    });
  }
}

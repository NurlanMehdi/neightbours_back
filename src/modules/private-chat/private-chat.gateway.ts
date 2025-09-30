import { Logger, UseGuards, UseFilters } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtAuthGuard } from '../../common/guards/ws-jwt-auth.guard';
import { WsExceptionFilter } from '../../common/filters/ws-exception.filter';
import { PrivateChatService } from './private-chat.service';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  namespace: '/',
})
@UseFilters(WsExceptionFilter)
export class PrivateChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PrivateChatGateway.name);
  private userSockets: Map<number, Set<string>> = new Map();
  private socketUser: Map<string, number> = new Map();

  constructor(private readonly chatService: PrivateChatService) {
    this.logger.log('PrivateChatGateway constructor called');
  }

  @WebSocketServer() io: Server;

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    server.on('error', (error) => {
      this.logger.error(`Server error: ${error.message}`);
    });
  }

  handleConnection(client: Socket, ...args: any[]) {
    try {
      this.logger.log(`Client id: ${client.id} connected`);

      // Отправляем подтверждение подключения
      client.emit('connected', {
        status: 'ok',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error in handleConnection: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      this.logger.log(`Client id: ${client.id} disconnected`);

      // Удаляем пользователя из маппинга
      const userId = this.socketUser.get(client.id);
      if (userId) {
        this.socketUser.delete(client.id);
        const userSockets = this.userSockets.get(userId);
        if (userSockets) {
          userSockets.delete(client.id);
          if (userSockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error in handleDisconnect: ${error.message}`);
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('identify')
  async handleIdentify(@ConnectedSocket() client: Socket) {
    try {
      this.logger.log(`User attempting to identify`);

      const userId = client.data.user.sub;
      this.logger.log(`User ${userId} identifying on socket ${client.id}`);

      // Сохраняем маппинг socket -> user
      this.socketUser.set(client.id, userId);
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);

      // Присоединяем к комнате пользователя
      client.join(`user:${userId}`);

      this.logger.log(
        `User ${userId} successfully identified on socket ${client.id}`,
      );
      this.logger.log(
        `Current rooms for client ${client.id}: ${Array.from(client.rooms)}`,
      );

      // Отправляем подтверждение клиенту
      client.emit('identified', { userId });

      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Error identifying user: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinPrivateChat')
  async handleJoinPrivateChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    try {
      this.logger.log(
        `User attempting to join private chat ${data.conversationId}`,
      );

      const userId = client.data.user.sub;
      this.logger.log(
        `User ${userId} joining private chat ${data.conversationId}`,
      );

      // Проверяем доступ
      await this.chatService.getMessages(userId, data.conversationId, 1, 1);

      // Присоединяем к комнате
      client.join(`conversation:${data.conversationId}`);

      this.logger.log(
        `User ${userId} successfully joined private chat ${data.conversationId}`,
      );
      this.logger.log(
        `Current rooms for client ${client.id}: ${Array.from(client.rooms)}`,
      );

      // Отправляем подтверждение клиенту
      client.emit('joinedPrivateChat', { chatId: data.conversationId });

      return { status: 'joined', chatId: data.conversationId };
    } catch (error) {
      this.logger.error(
        `Error joining private chat ${data.conversationId}: ${error.message}`,
      );
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      text: string;
      conversationId?: number;
      receiverId?: number;
      replyToId?: number;
    },
  ) {
    try {
      this.logger.log(`User attempting to send private message`);

      const userId = client.data.user.sub;
      this.logger.log(`User ${userId} sending private message`);
      this.logger.log(`Message text: ${payload.text}`);

      const message = await this.chatService.sendMessage(userId, payload);
      const convId = message.conversationId;

      this.logger.log(`Message created successfully with ID: ${message.id}`);
      this.logger.log(`Broadcasting to conversation: ${convId}`);

      // Определяем второго участника
      let otherUserId: number | null = null;
      if (payload.receiverId) {
        otherUserId = payload.receiverId;
      } else {
        otherUserId = await this.chatService.getOtherParticipantId(
          convId,
          userId,
        );
      }

      // Отправляем в комнату диалога и обоим пользователям
      this.io.to(`conversation:${convId}`).emit('privateMessage', message);
      this.io.to(`user:${userId}`).emit('privateMessage', message);
      if (otherUserId) {
        this.io.to(`user:${otherUserId}`).emit('privateMessage', message);
      }

      this.logger.log(
        `Message successfully sent by user ${userId} to conversation ${convId}`,
      );

      return { status: 'sent', messageId: message.id };
    } catch (error) {
      this.logger.error(`Error sending private message: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: number; upToMessageId?: number },
  ) {
    try {
      this.logger.log(
        `User attempting to mark conversation ${payload.conversationId} as read`,
      );

      const userId = client.data.user.sub;
      this.logger.log(
        `User ${userId} marking conversation ${payload.conversationId} as read`,
      );

      const result = await this.chatService.markAsRead(
        userId,
        payload.conversationId,
        payload.upToMessageId,
      );

      this.logger.log(
        `Successfully marked conversation ${payload.conversationId} as read for user ${userId}`,
      );
      this.logger.log(
        `Broadcasting to conversation: ${payload.conversationId}`,
      );

      // Уведомляем комнату о прочтении
      this.io
        .to(`conversation:${payload.conversationId}`)
        .emit('messagesRead', {
          conversationId: payload.conversationId,
          userId,
          readAt: result.readAt,
        });

      this.logger.log(
        `Read receipt successfully broadcasted for conversation ${payload.conversationId}`,
      );

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error marking conversation ${payload.conversationId} as read: ${error.message}`,
      );
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }
}

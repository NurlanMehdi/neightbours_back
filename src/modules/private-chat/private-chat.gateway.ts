import { Logger, UseFilters, UseGuards } from '@nestjs/common';
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
import { WsExceptionFilter } from '../../common/filters/ws-exception.filter';
import { WsJwtAuthGuard } from '../../common/guards/ws-jwt-auth.guard';
import { PrivateChatService } from './private-chat.service';
import { AutoReadPrivateDto } from './dto/auto-read-private.dto';
import { JoinPrivateChatDto } from './dto/join-private-chat.dto';
import { LeavePrivateChatDto } from './dto/leave-private-chat.dto';
import { SendPrivateMessageDto } from './dto/send-private-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
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
  private autoReadUsers: Map<number, Set<number>> = new Map();

  @WebSocketServer() io: Server;

  constructor(private readonly chatService: PrivateChatService) {}

  afterInit(server: Server): void {
    this.logger.log('WebSocket Gateway инициализирован');
    server.on('error', (error) => {
      this.logger.error(`Ошибка сервера: ${error.message}`, error.stack);
    });
  }

  handleConnection(client: Socket): void {
    try {
      this.logger.log(`Клиент id: ${client.id} подключен`);
      this.initializeAutoReadStructure(client);
      client.emit('private:connected', {
        status: 'ok',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Ошибка в handleConnection: ${error.message}`,
        error.stack,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    try {
      this.logger.log(`Клиент id: ${client.id} отключен`);
      this.cleanupUserSocket(client.id);
    } catch (error) {
      this.logger.error(
        `Ошибка в handleDisconnect: ${error.message}`,
        error.stack,
      );
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('private:join')
  async handleJoinPrivateChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPrivateChatDto,
  ): Promise<{ status: string; conversationId: number }> {
    try {
      const userId = this.extractUserId(client);
      if (!payload.receivedId) {
        throw new WsException('receivedId is required');
      }

      const conversation = await this.chatService.createConversation(
        userId,
        payload.receivedId,
      );
      const conversationId = conversation.id;

      this.logger.debug(
        `handleJoinPrivateChat -> userId=${userId}, receivedId=${payload.receivedId}, conversationId=${conversationId}`,
      );

      this.registerUserSocket(userId, client.id);

      const roomName = `private:${conversationId}`;
      client.join(roomName);

      this.logger.log(
        `Пользователь ${userId} присоединился к приватному чату с пользователем ${payload.receivedId} (комната: ${roomName})`,
      );

      client.emit('private:joined', { conversationId });
      return { status: 'joined', conversationId };
    } catch (error) {
      this.logger.error(
        `Ошибка при присоединении к приватному чату: ${error.message}`,
        error.stack,
      );
      throw new WsException('Не удалось присоединиться к приватному чату');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('private:leave')
  async handleLeavePrivateChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeavePrivateChatDto,
  ): Promise<{ status: string; conversationId: number }> {
    try {
      const userId = this.extractUserId(client);
      if (!payload.receivedId) {
        throw new WsException('receivedId is required');
      }

      const conversation = await this.chatService.findConversationByUsers(
        userId,
        payload.receivedId,
      );
      const conversationId = conversation.id;
      const roomName = `private:${conversationId}`;

      client.leave(roomName);
      this.logger.log(
        `Пользователь ${userId} покинул приватный чат с пользователем ${payload.receivedId} (комната: ${roomName})`,
      );

      return { status: 'left', conversationId };
    } catch (error) {
      this.logger.error(
        `Ошибка при выходе из приватного чата: ${error.message}`,
        error.stack,
      );
      throw new WsException('Не удалось покинуть приватный чат');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('private:sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendPrivateMessageDto,
  ): Promise<{ status: string; messageId: number; conversationId: number }> {
    try {
      const userId = this.extractUserId(client);

      if (!payload.conversationId && !payload.receiverId) {
        throw new WsException(
          'Требуется указать conversationId или receiverId',
        );
      }

      this.logger.log(
        `Пользователь ${userId} отправляет сообщение. conversationId=${payload.conversationId}, receiverId=${payload.receiverId}`,
      );

      const message = await this.chatService.sendMessage(userId, {
        text: payload.text,
        conversationId: payload.conversationId,
        receiverId: payload.receiverId,
        replyToId: payload.replyToMessageId,
      });

      this.logger.log(
        `Сообщение создано с ID: ${message.id} в диалоге ${message.conversationId}`,
      );

      const roomName = `private:${message.conversationId}`;

      this.autoJoinRoom(client, roomName, message.conversationId, userId);

      if (payload.receiverId) {
        this.autoJoinReceiver(
          payload.receiverId,
          roomName,
          message.conversationId,
        );
      }

      this.io.to(`user:${userId}`).emit('private:message', message);
      if (payload.receiverId) {
        this.io.to(`user:${payload.receiverId}`).emit('private:message', message);
      }
      this.logger.log(`Сообщение отправлено пользователям: ${userId} → ${payload.receiverId}`);

      this.processAutoRead(roomName, userId, message.conversationId);

      return {
        status: 'sent',
        messageId: message.id,
        conversationId: message.conversationId,
      };
    } catch (error) {
      this.logger.error(
        `Ошибка при отправке сообщения: ${error.message}`,
        error.stack,
      );
      throw new WsException('Не удалось отправить сообщение');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('private:autoReadOn')
  async handleAutoReadOn(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AutoReadPrivateDto,
  ): Promise<{ status: string; conversationId: number }> {
    try {
      const userId = this.extractUserId(client);
      if (!payload.receivedId) {
        throw new WsException('receivedId is required');
      }

      const conversation = await this.chatService.createConversation(
        userId,
        payload.receivedId,
      );
      const conversationId = conversation.id;

      this.initializeAutoReadStructure(client);
      client.data.autoRead.private.add(conversationId);

      if (!this.autoReadUsers.has(conversationId)) {
        this.autoReadUsers.set(conversationId, new Set());
      }
      this.autoReadUsers.get(conversationId).add(userId);

      await this.chatService.markPrivateAsReadForUser(userId, conversationId);

      this.logger.log(
        `Пользователь ${userId} включил авточтение для приватного чата с пользователем ${payload.receivedId} (conversationId: ${conversationId})`,
      );

      return { status: 'enabled', conversationId };
    } catch (error) {
      this.logger.error(
        `Ошибка при включении авточтения: ${error.message}`,
        error.stack,
      );
      throw new WsException('Не удалось включить авточтение');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('private:autoReadOff')
  async handleAutoReadOff(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AutoReadPrivateDto,
  ): Promise<{ status: string; conversationId: number }> {
    try {
      const userId = this.extractUserId(client);
      if (!payload.receivedId) {
        throw new WsException('receivedId is required');
      }

      const conversation = await this.chatService.createConversation(
        userId,
        payload.receivedId,
      );
      const conversationId = conversation.id;

      if (client.data.autoRead?.private) {
        client.data.autoRead.private.delete(conversationId);
      }

      if (this.autoReadUsers.has(conversationId)) {
        this.autoReadUsers.get(conversationId).delete(userId);
        if (this.autoReadUsers.get(conversationId).size === 0) {
          this.autoReadUsers.delete(conversationId);
        }
      }

      this.logger.log(
        `Пользователь ${userId} выключил авточтение для приватного чата с пользователем ${payload.receivedId} (conversationId: ${conversationId})`,
      );

      return { status: 'disabled', conversationId };
    } catch (error) {
      this.logger.error(
        `Ошибка при выключении авточтения: ${error.message}`,
        error.stack,
      );
      throw new WsException('Не удалось выключить авточтение');
    }
  }

  private extractUserId(client: Socket): number {
    const userId = client.data.user?.sub;
    if (!userId) {
      throw new WsException('Пользователь не аутентифицирован');
    }
    return userId;
  }

  private initializeAutoReadStructure(client: Socket): void {
    if (!client.data.autoRead) {
      client.data.autoRead = {
        events: new Set<number>(),
        communities: new Set<number>(),
        private: new Set<number>(),
      };
    }
  }

  private registerUserSocket(userId: number, socketId: string): void {
    this.socketUser.set(socketId, userId);
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
  }

  private cleanupUserSocket(socketId: string): void {
    const userId = this.socketUser.get(socketId);
    if (userId) {
      this.socketUser.delete(socketId);
      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socketId);
        if (userSockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
  }

  private autoJoinRoom(
    client: Socket,
    roomName: string,
    conversationId: number,
    userId: number,
  ): void {
    if (!client.rooms.has(roomName)) {
      client.join(roomName);
      this.logger.log(
        `Пользователь ${userId} автоматически присоединен к комнате ${roomName}`,
      );
      client.emit('private:joined', { conversationId });
    }
  }

  private autoJoinReceiver(
    receiverId: number,
    roomName: string,
    conversationId: number,
  ): void {
    const receiverSockets = this.userSockets.get(receiverId);
    if (!receiverSockets) return;

    receiverSockets.forEach((socketId) => {
      const receiverSocket = this.io.sockets.sockets.get(socketId);
      if (receiverSocket && !receiverSocket.rooms.has(roomName)) {
        receiverSocket.join(roomName);
        receiverSocket.emit('private:joined', { conversationId });
        this.logger.log(
          `Получатель ${receiverId} автоматически присоединен к комнате ${roomName}`,
        );
      }
    });
  }

  private processAutoRead(
    roomName: string,
    senderId: number,
    conversationId: number,
  ): void {
    setImmediate(async () => {
      try {
        const autoReadUserIds = this.autoReadUsers.get(conversationId);
        if (!autoReadUserIds || autoReadUserIds.size === 0) {
          return;
        }

        const roomSockets = await this.io.in(roomName).fetchSockets();
        const autoReadPromises: Promise<void>[] = [];

        for (const socket of roomSockets) {
          const socketUserId = this.socketUser.get(socket.id);
          if (
            socketUserId &&
            socketUserId !== senderId &&
            autoReadUserIds.has(socketUserId)
          ) {
            autoReadPromises.push(
              this.chatService
                .markPrivateAsReadForUser(socketUserId, conversationId)
                .then(() => {
                  this.logger.log(
                    `Пользователь ${socketUserId} авточтение приватного чата ${conversationId}`,
                  );
                })
                .catch((error) => {
                  this.logger.error(
                    `Ошибка авточтения для пользователя ${socketUserId}: ${error.message}`,
                    error.stack,
                  );
                }),
            );
          }
        }

        await Promise.allSettled(autoReadPromises);
      } catch (error) {
        this.logger.error(
          `Ошибка при обработке авточтения: ${error.message}`,
          error.stack,
        );
      }
    });
  }
}

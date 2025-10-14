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
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsExceptionFilter } from '../../common/filters/ws-exception.filter';
import { WsJwtAuthGuard } from '../../common/guards/ws-jwt-auth.guard';
import { PrivateChatService } from './private-chat.service';
import { AutoReadPrivateDto } from './dto/auto-read-private.dto';
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
  private lastMessageId: number | null = null;

  @WebSocketServer() io: Server;

  constructor(
    private readonly chatService: PrivateChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server): void {
    this.logger.log('WebSocket Gateway инициализирован');
    server.on('error', (error) => {
      this.logger.error(`Ошибка сервера: ${error.message}`, error.stack);
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      this.logger.log(`Клиент id: ${client.id} подключен`);
      
      let token = client.handshake.auth.token;
      if (!token) {
        token = client.handshake.query.token as string;
      }

      if (!token) {
        this.logger.warn(`Клиент ${client.id} не предоставил токен, отключение`);
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });
      client.data.user = payload;
      
      const userId = payload.sub;
      if (!userId) {
        this.logger.warn(`Клиент ${client.id} не содержит userId в токене, отключение`);
        client.disconnect();
        return;
      }

      const personalRoom = `user:${userId}`;
      await client.join(personalRoom);
      this.registerUserSocket(userId, client.id);
      this.initializeAutoReadStructure(client);
      
      this.logger.log(`Пользователь ${userId} присоединился к личной комнате ${personalRoom}`);
      this.logger.debug(`Комнаты клиента ${client.id}: ${Array.from(client.rooms).join(', ')}`);
      
      client.emit('private:connected', {
        status: 'ok',
        clientId: client.id,
        userId: userId,
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
  @SubscribeMessage('private:sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendPrivateMessageDto,
  ): Promise<{ status: string; messageId: number; conversationId: number }> {
    try {
      const userId = this.extractUserId(client);

      if (!payload.receiverId) {
        throw new WsException('receiverId is required');
      }

      this.logger.log(
        `Пользователь ${userId} отправляет сообщение получателю ${payload.receiverId}`,
      );

      const message = await this.chatService.sendMessage(userId, {
        text: payload.text,
        conversationId: payload.conversationId,
        receiverId: payload.receiverId,
        replyToId: payload.replyToMessageId,
      });

      this.logger.log(
        `Сообщение ${message.id} создано от ${userId} → ${payload.receiverId}`,
      );

      // Проверяем на дублирование сообщений
      if (this.lastMessageId === message.id) {
        this.logger.warn(`Дублирующееся сообщение ${message.id} проигнорировано`);
        return { status: 'ignored', messageId: message.id, conversationId: message.conversationId };
      }
      this.lastMessageId = message.id;

      const senderRoom = `user:${userId}`;
      const receiverRoom = `user:${payload.receiverId}`;

      const senderSockets = await this.io.in(senderRoom).fetchSockets();
      const receiverSockets = await this.io.in(receiverRoom).fetchSockets();

      this.logger.debug(
        `Эмит сообщения в комнату ${senderRoom} (${senderSockets.length} сокетов)`,
      );
      this.logger.debug(
        `Эмит сообщения в комнату ${receiverRoom} (${receiverSockets.length} сокетов)`,
      );

      // Избегаем дублирования сообщений, если отправитель и получатель - один пользователь
      if (userId === payload.receiverId) {
        this.io.to(senderRoom).emit('private:message', message);
      } else {
        this.io.to(senderRoom).emit('private:message', message);
        this.io.to(receiverRoom).emit('private:message', message);
      }

      this.processAutoRead(userId, payload.receiverId, message.conversationId);

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
  ): Promise<{ status: string; conversationId?: number }> {
    try {
      const userId = this.extractUserId(client);
      const receiverId = payload?.receiverId || payload?.receivedId;
      if (!receiverId) {
        throw new WsException('receiverId/receivedId/userId/targetId is required');
      }

      // Ищем существующий диалог, не создаем новый
      const conversation = await this.chatService.findConversationByUsers(userId, receiverId);
      
      if (!conversation) {
        this.logger.warn(
          `Попытка включить авточтение для несуществующего диалога между пользователями ${userId} и ${receiverId}`,
        );
        return { status: 'conversation_not_found' };
      }

      const conversationId = conversation.id;

      this.initializeAutoReadStructure(client);
      client.data.autoRead.private.add(conversationId);

      if (!this.autoReadUsers.has(conversationId)) {
        this.autoReadUsers.set(conversationId, new Set());
      }
      this.autoReadUsers.get(conversationId).add(userId);

      const readData = await this.chatService.markPrivateAsReadForUser(userId, conversationId);

      // Уведомляем всех участников чата, что пользователь прочитал сообщения
      this.io.to(`user:${receiverId}`).emit('private:read', {
        seenAt: readData.seenAt,
        user: readData.user,
        message: readData.message,
      });

      this.logger.log(
        `Пользователь ${userId} включил авточтение для приватного чата с пользователем ${receiverId} (conversationId: ${conversationId})`,
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
  ): Promise<{ status: string; conversationId?: number }> {
    try {
      const userId = this.extractUserId(client);
      const receiverId = payload?.receiverId || payload?.receivedId || payload?.userId || payload?.targetId;
      if (!receiverId) {
        throw new WsException('receiverId/receivedId/userId/targetId is required');
      }

      // Ищем существующий диалог, не создаем новый
      const conversation = await this.chatService.findConversationByUsers(userId, receiverId);
      
      if (!conversation) {
        this.logger.warn(
          `Попытка выключить авточтение для несуществующего диалога между пользователями ${userId} и ${receiverId}`,
        );
        return { status: 'conversation_not_found' };
      }

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
        `Пользователь ${userId} выключил авточтение для приватного чата с пользователем ${receiverId} (conversationId: ${conversationId})`,
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


  private processAutoRead(
    senderId: number,
    receiverId: number,
    conversationId: number,
  ): void {
    setImmediate(async () => {
      try {
        const autoReadUserIds = this.autoReadUsers.get(conversationId);
        if (!autoReadUserIds || autoReadUserIds.size === 0) {
          return;
        }

        const autoReadPromises: Promise<void>[] = [];

        if (autoReadUserIds.has(receiverId) && receiverId !== senderId) {
          const receiverSockets = this.userSockets.get(receiverId);
          if (receiverSockets && receiverSockets.size > 0) {
            autoReadPromises.push(
              this.chatService
                .markPrivateAsReadForUser(receiverId, conversationId)
                .then((readData) => {
                  this.logger.log(
                    `Пользователь ${receiverId} авточтение приватного чата ${conversationId}`,
                  );
                  
                  this.io.to(`user:${senderId}`).emit('private:read', {
                    seenAt: readData.seenAt,
                    user: readData.user,
                    message: readData.message,
                  });
                })
                .catch((error) => {
                  this.logger.error(
                    `Ошибка авточтения для пользователя ${receiverId}: ${error.message}`,
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

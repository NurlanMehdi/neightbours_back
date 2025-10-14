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
import { CommunityChatService } from './community-chat.service';
import { CommunityChatRepository } from './repositories/community-chat.repository';
import { JoinCommunityDto } from './dto/join-community.dto';
import { LeaveCommunityDto } from './dto/leave-community.dto';
import { SendCommunityMessageDto } from './dto/send-community-message.dto';
import { AutoReadCommunityDto } from './dto/auto-read-community.dto';

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
export class CommunityChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(CommunityChatGateway.name);
  private userSockets: Map<number, Set<string>> = new Map();
  private socketUser: Map<string, number> = new Map();
  private lastMessageId: number | null = null;

  constructor(
    private readonly chatService: CommunityChatService,
    private readonly chatRepository: CommunityChatRepository,
  ) {
    this.logger.log('CommunityChatGateway конструктор вызван');
  }

  @WebSocketServer() io: Server;

  afterInit(server: Server): void {
    this.logger.log('WebSocket Gateway инициализирован');
    server.on('error', (error) => {
      this.logger.error(`Ошибка сервера: ${error.message}`);
    });
  }

  handleConnection(client: Socket): void {
    try {
      this.logger.log(`Клиент id: ${client.id} подключен`);

      // Инициализируем структуру авточтения
      if (!client.data.autoRead) {
        client.data.autoRead = {
          events: new Set<number>(),
          communities: new Set<number>(),
          private: new Set<number>(),
        };
      }

      client.emit('community:connected', {
        status: 'ok',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Ошибка в handleConnection: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    try {
      this.logger.log(`Клиент id: ${client.id} отключен`);
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
      this.logger.error(`Ошибка в handleDisconnect: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('community:join')
  async handleJoinCommunity(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinCommunityDto | number | string,
  ): Promise<{ status: string; communityId: number }> {
    try {
      const userId = client.data.user?.sub;
      if (!userId) {
        throw new WsException('Пользователь не аутентифицирован');
      }

      // Extract and validate communityId from payload
      let rawCommunityId: any;
      if (typeof payload === 'number' || typeof payload === 'string') {
        rawCommunityId = payload;
      } else {
        rawCommunityId = (payload as any)?.communityId;
      }
      const communityId = Number(rawCommunityId);
      if (!Number.isFinite(communityId)) {
        throw new WsException('communityId is required');
      }

      // Debug log before querying repository
      this.logger.debug(
        `handleJoinCommunity -> userId=${userId}, communityId=${communityId}`,
      );

      this.logger.log(
        `Пользователь ${userId} присоединяется к сообществу ${communityId}`,
      );
      this.socketUser.set(client.id, userId);
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);
      // Ensure membership check explicitly passes both IDs to repository
      await this.chatRepository.isMember(userId, communityId);
      // Also trigger initial fetch to ensure chat exists
      await this.chatService.getMessages(userId, communityId, 1, 1);
      const roomName = `community:${communityId}`;
      client.join(roomName);
      this.logger.log(
        `Пользователь ${userId} успешно присоединился к комнате ${roomName}`,
      );
      client.emit('community:joined', { communityId });
      return { status: 'joined', communityId };
    } catch (error) {
      this.logger.error(`Ошибка при присоединении к сообществу: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      throw new WsException('Не удалось присоединиться к сообществу');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('community:leave')
  async handleLeaveCommunity(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveCommunityDto,
  ): Promise<{ status: string; communityId: number }> {
    try {
      const userId = client.data.user?.sub;
      if (!userId) {
        throw new WsException('Пользователь не аутентифицирован');
      }
      this.logger.log(
        `Пользователь ${userId} покидает сообщество ${payload.communityId}`,
      );
      const roomName = `community:${payload.communityId}`;
      client.leave(roomName);
      this.logger.log(
        `Пользователь ${userId} успешно покинул комнату ${roomName}`,
      );
      return { status: 'left', communityId: payload.communityId };
    } catch (error) {
      this.logger.error(
        `Ошибка при выходе из сообщества ${payload.communityId}: ${error.message}`,
      );
      this.logger.error(`Stack: ${error.stack}`);
      throw new WsException('Не удалось покинуть сообщество');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('community:sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendCommunityMessageDto,
  ): Promise<{ status: string; messageId: number }> {
    try {
      const userId = client.data.user?.sub;
      if (!userId) {
        throw new WsException('Пользователь не аутентифицирован');
      }
      this.logger.log(
        `Пользователь ${userId} отправляет сообщение в сообщество ${payload.communityId}`,
      );
      this.logger.log(`Текст сообщения: ${payload.text}`);
      const message = await this.chatService.sendMessage(
        userId,
        payload.communityId,
        {
          text: payload.text,
          replyToMessageId: payload.replyToMessageId,
        },
      );
      this.logger.log(`Сообщение создано с ID: ${message.id}`);

      // Проверяем на дублирование сообщений
      if (this.lastMessageId === message.id) {
        this.logger.warn(`Дублирующееся сообщение ${message.id} проигнорировано`);
        return { status: 'ignored', messageId: message.id };
      }
      this.lastMessageId = message.id;

      const roomName = `community:${payload.communityId}`;
      this.io.to(roomName).emit('community:message', message);
      this.logger.log(`Сообщение отправлено в комнату ${roomName}`);

      // Автоматически отмечаем как прочитанное для пользователей с включенным авточтением
      const roomSockets = await this.io.in(roomName).fetchSockets();
      for (const socket of roomSockets) {
        const socketUserId = this.socketUser.get(socket.id);
        if (
          socketUserId &&
          socketUserId !== userId &&
          socket.data.autoRead?.communities?.has(payload.communityId)
        ) {
          try {
            const readData = await this.chatService.markCommunityAsReadForUser(
              socketUserId,
              payload.communityId,
            );
            this.logger.log(
              `Пользователь ${socketUserId} авточтение сообщества ${payload.communityId} на ${new Date().toISOString()}`,
            );
            // Уведомляем отправителя, что сообщение прочитано
            this.io.to(`user:${userId}`).emit('community:read', {
              seenAt: readData.seenAt,
              user: readData.user,
              message: readData.message,
            });
          } catch (error) {
            this.logger.error(
              `Ошибка авточтения для пользователя ${socketUserId}: ${error.message}`,
            );
          }
        }
      }

      // Broadcast unread counts to all members of this community
      try {
        const memberIds = await this.chatRepository.getMemberIds(
          payload.communityId,
        );
        for (const memberId of memberIds) {
          const unreadCounts = await this.chatService.getUnreadCounts(memberId);
          const memberSockets = this.userSockets.get(memberId);
          if (memberSockets) {
            for (const socketId of memberSockets) {
              this.io.to(socketId).emit('community:unread', {
                status: 'ok',
                data: unreadCounts,
              });
            }
          }
        }
        this.logger.debug(
          `Обновлены счётчики непрочитанных для ${memberIds.length} членов сообщества ${payload.communityId}`,
        );
      } catch (error) {
        this.logger.error(`Ошибка при обновлении счётчиков: ${error.message}`);
      }

      return { status: 'sent', messageId: message.id };
    } catch (error) {
      this.logger.error(
        `Ошибка при отправке сообщения в сообщество ${payload.communityId}: ${error.message}`,
      );
      this.logger.error(`Stack: ${error.stack}`);
      throw new WsException('Не удалось отправить сообщение');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('community:unread')
  async handleGetUnreadCounts(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload?: { communityIds?: number[] },
  ): Promise<{ status: string; data: Array<{ communityId: number; unreadCount: number }> }> {
    try {
      const userId = client.data.user?.sub;
      if (!userId) {
        throw new WsException('Пользователь не аутентифицирован');
      }
      this.logger.log(
        `Пользователь ${userId} запрашивает счётчики непрочитанных сообщений`,
      );
      const unreadCounts = await this.chatService.getUnreadCounts(userId);
      this.logger.log(
        `Найдено непрочитанных сообщений для пользователя ${userId}: ${JSON.stringify(unreadCounts)}`,
      );
      return { status: 'ok', data: unreadCounts };
    } catch (error) {
      this.logger.error(
        `Ошибка при получении счётчиков непрочитанных: ${error.message}`,
      );
      this.logger.error(`Stack: ${error.stack}`);
      throw new WsException('Не удалось получить счётчики непрочитанных');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('community:autoReadOn')
  async handleAutoReadOn(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AutoReadCommunityDto | number,
  ): Promise<{ status: string; communityId: number }> {
    try {
      const userId = client.data.user?.sub;
      if (!userId) {
        throw new WsException('Пользователь не аутентифицирован');
      }

      const communityId =
        typeof payload === 'number' ? payload : payload.communityId;

      if (!client.data.autoRead) {
        client.data.autoRead = {
          events: new Set<number>(),
          communities: new Set<number>(),
          private: new Set<number>(),
        };
      }

      client.data.autoRead.communities.add(communityId);

      const readData = await this.chatService.markCommunityAsReadForUser(userId, communityId);

      // Уведомляем комнату сообщества, что пользователь прочитал сообщения
      this.io.to(`community:${communityId}`).emit('community:read', {
        seenAt: readData.seenAt,
        user: readData.user,
        message: readData.message,
      });

      this.logger.log(
        `Пользователь ${userId} включил авточтение для сообщества ${communityId}`,
      );

      return { status: 'enabled', communityId };
    } catch (error) {
      this.logger.error(
        `Ошибка при включении авточтения: ${error.message}`,
      );
      throw new WsException('Не удалось включить авточтение');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('community:autoReadOff')
  async handleAutoReadOff(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AutoReadCommunityDto | number,
  ): Promise<{ status: string; communityId: number }> {
    try {
      const userId = client.data.user?.sub;
      if (!userId) {
        throw new WsException('Пользователь не аутентифицирован');
      }

      const communityId =
        typeof payload === 'number' ? payload : payload.communityId;

      if (client.data.autoRead?.communities) {
        client.data.autoRead.communities.delete(communityId);
      }

      this.logger.log(
        `Пользователь ${userId} выключил авточтение для сообщества ${communityId}`,
      );

      return { status: 'disabled', communityId };
    } catch (error) {
      this.logger.error(
        `Ошибка при выключении авточтения: ${error.message}`,
      );
      throw new WsException('Не удалось выключить авточтение');
    }
  }
}

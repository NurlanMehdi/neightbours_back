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
    @MessageBody() payload: JoinCommunityDto | number,
  ): Promise<{ status: string; communityId: number }> {
    try {
      const userId = client.data.user?.sub;
      if (!userId) {
        throw new WsException('Пользователь не аутентифицирован');
      }

      // Extract and validate communityId from payload (number or { communityId })
      const rawCommunityId: any =
        typeof payload === 'number' ? payload : (payload as any)?.communityId;
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
      const roomName = `community_${communityId}`;
      client.join(roomName);
      this.logger.log(
        `Пользователь ${userId} успешно присоединился к комнате ${roomName}`,
      );
      client.emit('community:joined', { communityId });
      return { status: 'ok', communityId };
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
      const roomName = `community:${payload.communityId}`;
      this.io.to(roomName).emit('community:message', message);
      this.logger.log(`Сообщение отправлено в комнату ${roomName}`);
      return { status: 'sent', messageId: message.id };
    } catch (error) {
      this.logger.error(
        `Ошибка при отправке сообщения в сообщество ${payload.communityId}: ${error.message}`,
      );
      this.logger.error(`Stack: ${error.stack}`);
      throw new WsException('Не удалось отправить сообщение');
    }
  }
}

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

  constructor(private readonly chatService: PrivateChatService) {}

  @WebSocketServer() io: Server;

  afterInit(server: Server) {
    this.logger.log('PrivateChatGateway initialized');
    server.on('error', (e) => this.logger.error(`Server error: ${e.message}`));
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { status: 'ok', clientId: client.id, timestamp: new Date().toISOString() });
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUser.get(client.id);
    if (userId) {
      const set = this.userSockets.get(userId);
      if (set) {
        set.delete(client.id);
        if (set.size === 0) this.userSockets.delete(userId);
      }
      this.socketUser.delete(client.id);
      this.logger.log(`User ${userId} disconnected (${client.id})`);
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('identify')
  async identify(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.user.sub;
      this.socketUser.set(client.id, userId);
      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);
      this.logger.log(`User ${userId} identified on socket ${client.id}`);
      return { status: 'ok' };
    } catch (err) {
      this.logger.error(`identify error: ${err.message}`, err.stack);
      throw new WsException(err.message || 'Ошибка при идентификации пользователя');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    try {
      const userId = client.data.user.sub;
      await this.chatService.getMessages(userId, data.conversationId, 1, 1); // access check
      client.join(`conversation:${data.conversationId}`);
      this.logger.log(`User ${userId} joined conversation ${data.conversationId}`);
      return { status: 'joined', conversationId: data.conversationId };
    } catch (err) {
      this.logger.error(`joinConversation error: ${err.message}`, err.stack);
      throw new WsException(err.message || 'Ошибка при подключении к диалогу');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('sendPrivateMessage')
  async sendPrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { text: string; conversationId?: number; receiverId?: number; replyToId?: number },
  ) {
    try {
      const userId = client.data.user.sub;
      this.logger.log(`sendPrivateMessage called by user ${userId}`);
      const message = await this.chatService.sendMessage(userId, payload);
      const convId = message.conversationId;

      // Emit to conversation room and both users
      this.io.to(`conversation:${convId}`).emit('newPrivateMessage', message);

      // determine receiver
      let otherUserId: number | null = null;
      if (payload.receiverId) {
        otherUserId = payload.receiverId;
      } else {
        otherUserId = await this.chatService.getOtherParticipantId(convId, userId);
      }

      // emit to user rooms
      this.io.to(`user:${userId}`).emit('newPrivateMessage', message);
      if (otherUserId) this.io.to(`user:${otherUserId}`).emit('newPrivateMessage', message);
      this.logger.log(`Message sent by user ${userId} to conversation ${convId}`);
      return message;
    } catch (err) {
      this.logger.error(`sendPrivateMessage error: ${err.message}`, err.stack);
      throw new WsException(err.message || 'Ошибка при отправке сообщения');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('markRead')
  async markRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: number; upToMessageId?: number },
  ) {
    try {
      const userId = client.data.user.sub;
      const res = await this.chatService.markAsRead(userId, payload.conversationId, payload.upToMessageId);
      // notify room about read receipt
      this.io
        .to(`conversation:${payload.conversationId}`)
        .emit('messagesRead', { conversationId: payload.conversationId, userId, readAt: res.readAt });
      this.logger.log(`User ${userId} marked conversation ${payload.conversationId} as read`);
      return { success: true };
    } catch (err) {
      this.logger.error(`markRead error: ${err.message}`, err.stack);
      throw new WsException(err.message || 'Ошибка при отметке сообщений как прочитанных');
    }
  }
}

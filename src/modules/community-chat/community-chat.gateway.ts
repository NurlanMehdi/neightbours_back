import { Inject, Logger, UseFilters, UseGuards, forwardRef } from '@nestjs/common';
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

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  namespace: '/community-chat',
})
@UseFilters(WsExceptionFilter)
export class CommunityChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(CommunityChatGateway.name);
  constructor(@Inject(forwardRef(() => CommunityChatService)) private readonly chatService: CommunityChatService) {}

  @WebSocketServer() io: Server;

  afterInit(server: Server) {
    this.logger.log('CommunityChatGateway initialized');
    server.on('error', (e) => this.logger.error(`Server error: ${e.message}`));
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { status: 'ok', clientId: client.id, timestamp: new Date().toISOString() });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastNewMessage(communityId: number, message: any) {
    this.io.to(`community:${communityId}`).emit('newCommunityMessage', message);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinCommunity')
  async joinCommunity(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { communityId: number },
  ) {
    try {
      const userId = client.data.user.sub;
      await this.chatService.getMessages(userId, payload.communityId, 1, 1);
      client.join(`community:${payload.communityId}`);
      return { status: 'joined', communityId: payload.communityId };
    } catch (err) {
      throw new WsException(err.message || 'Ошибка при подключении к чату');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('sendCommunityMessage')
  async sendCommunityMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { communityId: number; text: string; replyToMessageId?: number },
  ) {
    try {
      const userId = client.data.user.sub;
      const message = await this.chatService.sendMessage(userId, payload.communityId, { text: payload.text, replyToMessageId: payload.replyToMessageId });
      this.io.to(`community:${payload.communityId}`).emit('newCommunityMessage', message);
      return message;
    } catch (err) {
      throw new WsException(err.message || 'Ошибка при отправке сообщения');
    }
  }
}

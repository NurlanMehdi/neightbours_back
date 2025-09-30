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
  
  constructor(private readonly chatService: CommunityChatService) {}

  @WebSocketServer() io: Server;

  afterInit(server: Server) {
    this.logger.log('CommunityChatGateway initialized');
    server.on('error', (e) => this.logger.error(`Server error: ${e.message}`));
  }

  handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: ${client.id}`);
      
      // EventsGateway kimi - sadəcə connected emit edirik
      client.emit('connected', { 
        status: 'ok', 
        clientId: client.id, 
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      this.logger.error(`Error in handleConnection: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      this.logger.log(`Client disconnected: ${client.id}`);
    } catch (error) {
      this.logger.error(`Error in handleDisconnect: ${error.message}`);
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinCommunity')
  async handleJoinCommunity(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { communityId: number },
  ) {
    try {
      this.logger.log(`User attempting to join community ${payload.communityId}`);
      this.logger.log(`Client ID: ${client.id}`);
      this.logger.log(`Raw payload: ${JSON.stringify(payload)}`);
      
      // Получаем userId из аутентифицированного пользователя
      const userId = client.data.user.sub;
      this.logger.log(`User ${userId} joining community ${payload.communityId}`);
      
      // Проверяем доступ - пользователь должен быть членом сообщества
      await this.chatService.getMessages(userId, payload.communityId, 1, 1);
      
      // Присоединяем к комнате
      client.join(`community:${payload.communityId}`);
      
      this.logger.log(`User ${userId} successfully joined community ${payload.communityId}`);
      this.logger.log(`Current rooms for client ${client.id}: ${Array.from(client.rooms)}`);
      
      return { status: 'joined', communityId: payload.communityId };
    } catch (error) {
      this.logger.error(`Error joining community ${payload.communityId}: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('sendCommunityMessage')
  async handleSendCommunityMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { communityId: number; text: string; replyToMessageId?: number },
  ) {
    try {
      this.logger.log(`User attempting to send message to community ${payload.communityId}`);
      
      const userId = client.data.user.sub;
      this.logger.log(`User ${userId} sending message to community ${payload.communityId}`);
      this.logger.log(`Message text: ${payload.text}`);
      
      const message = await this.chatService.sendMessage(
        userId, 
        payload.communityId, 
        { text: payload.text, replyToMessageId: payload.replyToMessageId }
      );
      
      this.logger.log(`Message created successfully with ID: ${message.id}`);
      this.logger.log(`Broadcasting to room: community:${payload.communityId}`);
      
      // Отправляем всем в комнате
      this.io.to(`community:${payload.communityId}`).emit('newCommunityMessage', message);
      
      this.logger.log(`Message successfully broadcasted to community ${payload.communityId}`);
      
      return message;
    } catch (error) {
      this.logger.error(`Error sending message to community ${payload.communityId}: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }
}
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
  async joinCommunity(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { communityId: number },
  ) {
    try {
      this.logger.log(`joinCommunity called for community ${payload.communityId}`);
      this.logger.log(`Client ID: ${client.id}`);
      this.logger.log(`Payload received: ${JSON.stringify(payload)}`);
      
      // EventsGateway kimi - user məlumatını oxuyuruq
      const userId = client.data.user?.sub;
      if (!userId) {
        this.logger.error('User data not found in client.data.user');
        throw new WsException('Пользователь не авторизован');
      }
      
      this.logger.log(`User ${userId} joining community ${payload.communityId}`);
      
      // İlk olaraq access yoxla
      await this.chatService.getMessages(userId, payload.communityId, 1, 1);
      
      // Room-a qoşul
      client.join(`community:${payload.communityId}`);
      
      this.logger.log(`User ${userId} successfully joined community ${payload.communityId}`);
      this.logger.log(`Current rooms for client ${client.id}: ${Array.from(client.rooms)}`);
      
      const response = { 
        status: 'joined', 
        communityId: payload.communityId,
        userId,
        timestamp: new Date().toISOString()
      };
      
      // Həm return edirik (callback üçün), həm də emit edirik (event üçün)
      client.emit('joinedCommunity', response);
      this.logger.log(`Sent joinedCommunity event with response: ${JSON.stringify(response)}`);
      
      return response;
    } catch (err) {
      this.logger.error(`joinCommunity error: ${err.message}`, err.stack);
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
      this.logger.log(`sendCommunityMessage called for community ${payload.communityId}`);
      
      const userId = client.data.user.sub;
      this.logger.log(`User ${userId} sending message to community ${payload.communityId}`);
      this.logger.log(`Message text: ${payload.text}`);
      
      const message = await this.chatService.sendMessage(
        userId, 
        payload.communityId, 
        { text: payload.text, replyToMessageId: payload.replyToMessageId }
      );
      
      this.logger.log(`Message created successfully: ${JSON.stringify(message)}`);
      this.logger.log(`Broadcasting to room: community:${payload.communityId}`);
      
      // Broadcast
      this.io.to(`community:${payload.communityId}`).emit('newCommunityMessage', message);
      
      this.logger.log(`Message successfully sent to community ${payload.communityId}`);
      
      return message;
    } catch (err) {
      this.logger.error(`sendCommunityMessage error: ${err.message}`, err.stack);
      throw new WsException(err.message || 'Ошибка при отправке сообщения');
    }
  }
}
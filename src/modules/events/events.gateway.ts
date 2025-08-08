import { Logger, ParseIntPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from './dto/create-message.dto';
import { EventsService } from './events.service';

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
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);
  private userSockets: Map<number, Set<string>> = new Map();
  private socketUser: Map<string, number> = new Map();

  constructor(private readonly eventsService: EventsService) {
    this.logger.log('EventsGateway constructor called');
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
    } catch (error) {
      this.logger.error(`Error in handleDisconnect: ${error.message}`);
    }
  }

  @SubscribeMessage('events')
  handleEvent(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): string {
    this.logger.log(`Data: ${data}`);
    return data;
  }

  @SubscribeMessage('joinEvent')
  async handleJoinEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() eventId: ParseIntPipe,
  ) {
    try {
      this.logger.log(`User attempting to join event ${eventId}`);
      const userId = 2;
      this.logger.log(`User ${userId} joining event ${eventId}`);

      await this.eventsService.joinEvent(userId, Number(eventId));
      client.join(`event:${eventId}`);

      this.logger.log(`User ${userId} successfully joined event ${eventId}`);
      this.logger.log(
        `Current rooms for client ${client.id}: ${Array.from(client.rooms)}`,
      );

      return { status: 'joined' };
    } catch (error) {
      this.logger.error(`Error joining event ${eventId}: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }

  @SubscribeMessage('leaveEvent')
  async handleLeaveEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() eventId: number,
  ) {
    try {
      this.logger.log(`User attempting to leave event ${eventId}`);
      const userId = this.socketUser.get(client.id);
      this.logger.log(`User ${userId} leaving event ${eventId}`);

      await this.eventsService.leaveEvent(userId, eventId);
      client.leave(`event:${eventId}`);

      this.logger.log(`User ${userId} successfully left event ${eventId}`);
      this.logger.log(
        `Current rooms for client ${client.id}: ${Array.from(client.rooms)}`,
      );

      return { status: 'left' };
    } catch (error) {
      this.logger.error(`Error leaving event ${eventId}: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: string | { eventId: number; message: CreateMessageDto },
  ) {
    try {
      // Парсим данные, если они пришли как строка
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

      this.logger.log(`New message attempt for event ${parsedData.eventId}`);
      this.logger.log(`Message data: ${JSON.stringify(parsedData)}`);
      const userId = 2;
      this.logger.log(
        `User ${userId} sending message to event ${parsedData.eventId}`,
      );

      const message = await this.eventsService.createMessage(
        userId,
        parsedData.eventId,
        parsedData.message,
      );

      this.logger.log(
        `Message created successfully: ${JSON.stringify(message)}`,
      );
      this.logger.log(`Broadcasting to room: event:${parsedData.eventId}`);
      this.logger.log(`Current rooms: ${Array.from(client.rooms)}`);

      this.logger.log(
        `Message successfully sent to event ${parsedData.eventId}`,
      );
      this.logger.log(`Message content: ${message.text}`);

      return message;
    } catch (error) {
      const eventId =
        typeof data === 'string' ? JSON.parse(data).eventId : data.eventId;
      this.logger.error(
        `Error sending message to event ${eventId}: ${error.message}`,
      );
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }
}

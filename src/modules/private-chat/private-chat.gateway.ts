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

  constructor(private readonly chatService: PrivateChatService) {
    this.logger.log('PrivateChatGateway конструктор вызван');
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
      client.emit('private:connected', {
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
  @SubscribeMessage('private:join')
  async handleJoinPrivateChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPrivateChatDto | number | string,
  ): Promise<{ status: string; conversationId: number }> {
    try {
      const userId = client.data.user?.sub;
      if (!userId) {
        throw new WsException('Пользователь не аутентифицирован');
      }

      // Extract and validate conversationId from payload
      let rawConversationId: any;
      if (typeof payload === 'number' || typeof payload === 'string') {
        rawConversationId = payload;
      } else {
        rawConversationId = (payload as any)?.conversationId;
      }
      const conversationId = Number(rawConversationId);
      if (!Number.isFinite(conversationId)) {
        throw new WsException('conversationId is required');
      }

      // Debug log before querying service
      this.logger.debug(
        `handleJoinPrivateChat -> userId=${userId}, conversationId=${conversationId}`,
      );

      this.logger.log(
        `Пользователь ${userId} присоединяется к приватному чату ${conversationId}`,
      );
      this.socketUser.set(client.id, userId);
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);
      // Validate access and ensure participant
      await this.chatService.getMessages(userId, conversationId, 1, 1);
      const roomName = `private:${conversationId}`;
      client.join(roomName);
      this.logger.log(
        `Пользователь ${userId} успешно присоединился к комнате ${roomName}`,
      );
      client.emit('private:joined', { conversationId });
      return { status: 'joined', conversationId };
    } catch (error) {
      this.logger.error(
        `Ошибка при присоединении к приватному чату: ${error.message}`,
      );
      this.logger.error(`Stack: ${error.stack}`);
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
      const userId = client.data.user?.sub;
      if (!userId) {
        throw new WsException('Пользователь не аутентифицирован');
      }
      this.logger.log(
        `Пользователь ${userId} покидает приватный чат ${payload.conversationId}`,
      );
      const roomName = `private:${payload.conversationId}`;
      client.leave(roomName);
      this.logger.log(
        `Пользователь ${userId} успешно покинул комнату ${roomName}`,
      );
      return { status: 'left', conversationId: payload.conversationId };
    } catch (error) {
      this.logger.error(
        `Ошибка при выходе из приватного чата ${payload.conversationId}: ${error.message}`,
      );
      this.logger.error(`Stack: ${error.stack}`);
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
      const userId = client.data.user?.sub;
      if (!userId) {
        throw new WsException('Пользователь не аутентифицирован');
      }
      
      // Валидация: должен быть указан либо conversationId, либо receiverId
      if (!payload.conversationId && !payload.receiverId) {
        throw new WsException(
          'Требуется указать conversationId или receiverId',
        );
      }
      
      this.logger.log(
        `Пользователь ${userId} отправляет сообщение. conversationId=${payload.conversationId}, receiverId=${payload.receiverId}`,
      );
      this.logger.log(`Текст сообщения: ${payload.text}`);
      
      // Запоминаем, использовался ли receiverId для авто-создания
      const isAutoConversation = !payload.conversationId && !!payload.receiverId;
      
      // Отправляем сообщение через сервис (автоматически создаст диалог если нужно)
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
      
      // Автоматически присоединяем отправителя к комнате диалога, если он еще не в ней
      if (!client.rooms.has(roomName)) {
        client.join(roomName);
        this.logger.log(
          `Пользователь ${userId} автоматически присоединен к комнате ${roomName}`,
        );
        
        // Отправляем подтверждение присоединения к комнате
        client.emit('private:joined', { conversationId: message.conversationId });
        this.logger.log(
          `Отправлено подтверждение private:joined для conversationId=${message.conversationId}`,
        );
      }
      
      // Если получатель онлайн, автоматически присоединяем его к комнате
      if (isAutoConversation && payload.receiverId) {
        const receiverSockets = this.userSockets.get(payload.receiverId);
        if (receiverSockets) {
          receiverSockets.forEach((socketId) => {
            const receiverSocket = this.io.sockets.sockets.get(socketId);
            if (receiverSocket && !receiverSocket.rooms.has(roomName)) {
              receiverSocket.join(roomName);
              receiverSocket.emit('private:joined', {
                conversationId: message.conversationId,
              });
              this.logger.log(
                `Получатель ${payload.receiverId} автоматически присоединен к комнате ${roomName}`,
              );
            }
          });
        }
      }
      
      // Отправляем сообщение всем участникам диалога
      this.io.to(roomName).emit('private:message', message);
      this.logger.log(`Сообщение отправлено в комнату ${roomName}`);
      
      return {
        status: 'sent',
        messageId: message.id,
        conversationId: message.conversationId,
      };
    } catch (error) {
      this.logger.error(
        `Ошибка при отправке сообщения: ${error.message}`,
      );
      this.logger.error(`Stack: ${error.stack}`);
      throw new WsException('Не удалось отправить сообщение');
    }
  }
}

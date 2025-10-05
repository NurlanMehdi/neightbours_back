import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GlobalChatSettingsService } from '../chat-admin/services/global-chat-settings.service';
import { NotificationService } from '../notifications/services/notification.service';
import { PrivateChatRepository } from './repositories/private-chat.repository';

@Injectable()
export class PrivateChatService {
  constructor(
    private readonly repo: PrivateChatRepository,
    private readonly notificationService: NotificationService,
    private readonly globalChatSettings: GlobalChatSettingsService,
  ) {}

  async createConversation(currentUserId: number, otherUserId: number) {
    await this.validatePrivateChatAllowed();
    const conversation = await this.repo.getOrCreateConversation(
      currentUserId,
      otherUserId,
    );
    return conversation;
  }

  async findConversationByUsers(currentUserId: number, otherUserId: number) {
    const pairKey = this.buildPairKey(currentUserId, otherUserId);
    const conversation = await this.repo.findConversationByPairKey(pairKey);
    if (!conversation) {
      throw new NotFoundException('Диалог не найден');
    }
    return conversation;
  }

  async getConversationList(currentUserId: number) {
    const conversations =
      await this.repo.getConversationListWithUnreadCounts(currentUserId);

    return conversations.map((conv) => {
      const other = conv.participants.find(
        (p) => p.userId !== currentUserId,
      )?.user;
      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id,
        user: other,
        lastMessage,
        unreadCount: conv.unreadCount,
        updatedAt: conv.updatedAt,
      };
    });
  }

  async deleteConversation(
    currentUserId: number,
    conversationId: number,
  ): Promise<void> {
    await this.repo.deleteConversation(conversationId, currentUserId);
  }

  async getOtherParticipantId(
    conversationId: number,
    currentUserId: number,
  ): Promise<number | null> {
    const conv = await this.repo.findConversationById(conversationId);
    const other = conv.participants.find((p) => p.userId !== currentUserId);
    return other ? other.userId : null;
  }

  async sendMessage(
    currentUserId: number,
    params: {
      text: string;
      conversationId?: number;
      receiverId?: number;
      replyToId?: number;
    },
  ) {
    if (!params.conversationId && !params.receiverId) {
      throw new BadRequestException(
        'Нужно указать conversationId или receiverId',
      );
    }

    await this.validateMessageLength(params.text);
    await this.validatePrivateChatAllowed();

    let message: any;
    let conversationId: number;
    let participants: any[] = [];

    if (params.receiverId) {
      const result = await this.repo.createMessageWithAutoConversation({
        senderId: currentUserId,
        receiverId: params.receiverId,
        text: params.text,
        replyToMessageId: params.replyToId,
      });
      message = result;
      conversationId = result.conversationId;
      participants = result.conversation?.participants || [];
    } else if (params.conversationId) {
      conversationId = params.conversationId;
      await this.repo.ensureParticipant(conversationId, currentUserId);

      if (params.replyToId) {
        await this.validateReplyMessage(params.replyToId, conversationId);
      }

      message = await this.repo.createMessage({
        conversationId,
        senderId: currentUserId,
        text: params.text,
        replyToId: params.replyToId,
      });

      const conv = await this.repo.findConversationById(conversationId);
      participants = conv.participants;
    } else {
      throw new BadRequestException('conversationId не определен');
    }

    await this.sendMessageNotifications(
      message,
      conversationId,
      currentUserId,
      participants,
    );

    return this.formatPrivateMessage(message);
  }

  async getMessages(
    currentUserId: number,
    receiverId: number,
    page = 1,
    limit = 50,
  ) {
    if (currentUserId === receiverId) {
      throw new BadRequestException(
        'Нельзя получить сообщения диалога с самим собой',
      );
    }

    const conversation = await this.repo.getOrCreateConversation(
      currentUserId,
      receiverId,
    );
    const messages = await this.repo.getMessages(
      conversation.id,
      page,
      limit,
      currentUserId,
    );

    return messages.map((msg) => this.formatPrivateMessage(msg));
  }

  async searchMessages(currentUserId: number, q: string, page = 1, limit = 50) {
    return this.repo.searchMessages(currentUserId, q, page, limit);
  }

  async replyToMessage(currentUserId: number, messageId: number, text: string) {
    const replied = await this.repo.findMessageById(messageId);
    return this.sendMessage(currentUserId, {
      text,
      conversationId: replied.conversationId,
      replyToId: messageId,
    });
  }

  async deleteMessage(currentUserId: number, messageId: number): Promise<void> {
    await this.repo.deleteMessage(messageId, currentUserId);
  }

  async markAsRead(
    currentUserId: number,
    conversationId: number,
    upToMessageId?: number,
  ) {
    return this.repo.markAsRead(conversationId, currentUserId, upToMessageId);
  }

  async markConversationAsRead(
    userId: number,
    conversationId: number,
  ): Promise<void> {
    const conversation = await this.repo.findConversationById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Диалог не найден');
    }

    try {
      await this.repo.ensureParticipant(conversationId, userId);
    } catch (error) {
      throw new ForbiddenException(
        'Пользователь не является участником диалога',
      );
    }

    await this.repo.markAsRead(conversationId, userId);
  }

  async markPrivateAsReadForUser(
    userId: number,
    conversationId: number,
  ): Promise<void> {
    await this.repo.markAsRead(conversationId, userId);
  }

  private buildPairKey(userAId: number, userBId: number): string {
    const [minId, maxId] =
      userAId < userBId ? [userAId, userBId] : [userBId, userAId];
    return `${minId}_${maxId}`;
  }

  private async validatePrivateChatAllowed(): Promise<void> {
    const isPrivateChatAllowed =
      await this.globalChatSettings.isPrivateChatAllowed();
    if (!isPrivateChatAllowed) {
      throw new ForbiddenException('Приватные чаты отключены администратором');
    }
  }

  private async validateMessageLength(text: string): Promise<void> {
    const maxMessageLength =
      await this.globalChatSettings.getMaxMessageLength();
    if (text.length > maxMessageLength) {
      throw new BadRequestException(
        `Сообщение слишком длинное. Максимальная длина: ${maxMessageLength} символов`,
      );
    }
  }

  private async validateReplyMessage(
    replyToId: number,
    conversationId: number,
  ): Promise<void> {
    const replied = await this.repo.findMessageById(replyToId);
    if (replied.conversationId !== conversationId) {
      throw new ForbiddenException(
        'Нельзя отвечать на сообщение из другого диалога',
      );
    }
  }

  private async sendMessageNotifications(
    message: any,
    conversationId: number,
    currentUserId: number,
    participants: any[],
  ): Promise<void> {
    const toUserIds = participants
      .map((p) => p.userId)
      .filter((id) => id !== currentUserId);

    if (toUserIds.length === 0) return;

    const senderName = this.formatSenderName(message.sender);

    await this.notificationService.createGlobalNotification({
      type: 'MESSAGE_RECEIVED',
      title: 'New message',
      message: `You received a new message from ${senderName}`,
      userId: toUserIds,
      payload: {
        conversationId,
        messageId: message.id,
        senderId: currentUserId,
        senderName,
        text: message.text.substring(0, 100),
      },
    });
  }

  private formatSenderName(sender: any): string {
    if (!sender) return 'User';
    return (
      [sender.firstName, sender.lastName].filter(Boolean).join(' ').trim() ||
      'User'
    );
  }

  private formatPrivateMessage(msg: any) {
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      userId: msg.senderId,
      text: msg.text,
      replyToMessageId: msg.replyToId ?? null,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      isRead: msg.isRead ?? false,
      readAt: msg.readAt ?? null,
      user: msg.sender
        ? {
            id: msg.sender.id,
            firstName: msg.sender.firstName,
            lastName: msg.sender.lastName,
            avatar: msg.sender.avatar,
          }
        : null,
      replyTo: msg.replyTo
        ? {
            id: msg.replyTo.id,
            text: msg.replyTo.text,
            user: msg.replyTo.sender
              ? {
                  id: msg.replyTo.sender.id,
                  firstName: msg.replyTo.sender.firstName,
                  lastName: msg.replyTo.sender.lastName,
                  avatar: msg.replyTo.sender.avatar,
                }
              : null,
          }
        : null,
    };
  }
}

import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrivateChatRepository } from './repositories/private-chat.repository';
import { NotificationService } from '../notifications/services/notification.service';

@Injectable()
export class PrivateChatService {
  constructor(
    private readonly repo: PrivateChatRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async createConversation(currentUserId: number, otherUserId: number) {
    const conversation = await this.repo.getOrCreateConversation(currentUserId, otherUserId);
    // ensure current user is participant
    await this.repo.ensureParticipant(conversation.id, currentUserId);
    return conversation;
  }

  async sendMessage(currentUserId: number, params: { text: string; conversationId?: number; receiverId?: number; replyToId?: number }) {
    if (!params.conversationId && !params.receiverId) {
      throw new BadRequestException('Нужно указать conversationId или receiverId');
    }

    let conversationId = params.conversationId;
    let receiverId: number | null = null;

    if (!conversationId && params.receiverId) {
      const conversation = await this.repo.getOrCreateConversation(currentUserId, params.receiverId);
      conversationId = conversation.id;
      receiverId = conversation.participants.find((p) => p.userId !== currentUserId)!.userId;
    }

    if (!conversationId) throw new BadRequestException('conversationId не определен');

    // access check
    await this.repo.ensureParticipant(conversationId, currentUserId);

    // validate replyTo belongs to same conversation
    if (params.replyToId) {
      const replied = await this.repo.findMessageById(params.replyToId);
      if (replied.conversationId !== conversationId) {
        throw new ForbiddenException('Нельзя отвечать на сообщение из другого диалога');
      }
    }

    const message = await this.repo.createMessage({
      conversationId,
      senderId: currentUserId,
      text: params.text,
      replyToId: params.replyToId,
    });

    const conv = await this.repo.findConversationById(conversationId);
    const toUserIds = conv.participants
      .map((p) => p.userId)
      .filter((id) => id !== currentUserId);
    if (toUserIds.length > 0) {
      const senderName = [message.sender?.firstName, message.sender?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() || 'User';
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

    return message;
  }

  async getMessages(currentUserId: number, conversationId: number, page = 1, limit = 50) {
    await this.repo.ensureParticipant(conversationId, currentUserId);
    return this.repo.getMessages(conversationId, page, limit);
  }

  async getConversationList(currentUserId: number) {
    const list = await this.repo.getConversationList(currentUserId);
    const result = [] as any[];
    for (const conv of list) {
      const other = conv.participants.find((p) => p.userId !== currentUserId)?.user;
      const me = conv.participants.find((p) => p.userId === currentUserId);
      const lastMessage = conv.messages[0] || null;
      const unreadCount = await this.repo.countUnread(conv.id, currentUserId, me?.lastReadAt);
      result.push({
        id: conv.id,
        user: other,
        lastMessage,
        unreadCount,
        updatedAt: conv.updatedAt,
      });
    }
    return result;
  }

  async markAsRead(currentUserId: number, conversationId: number, upToMessageId?: number) {
    await this.repo.ensureParticipant(conversationId, currentUserId);
    return this.repo.markAsRead(conversationId, currentUserId, upToMessageId);
  }

  async searchMessages(currentUserId: number, q: string, page = 1, limit = 50) {
    return this.repo.searchMessages(currentUserId, q, page, limit);
  }

  async replyToMessage(currentUserId: number, messageId: number, text: string) {
    const replied = await this.repo.findMessageById(messageId);
    return this.sendMessage(currentUserId, { text, conversationId: replied.conversationId, replyToId: messageId });
  }

  async getOtherParticipantId(conversationId: number, currentUserId: number): Promise<number | null> {
    const conv = await this.repo.findConversationById(conversationId);
    const other = conv.participants.find((p) => p.userId !== currentUserId);
    return other ? other.userId : null;
  }

  async deleteConversation(currentUserId: number, conversationId: number): Promise<void> {
    await this.repo.deleteConversation(conversationId, currentUserId);
  }

  async deleteMessage(currentUserId: number, messageId: number): Promise<void> {
    await this.repo.deleteMessage(messageId, currentUserId);
  }
}

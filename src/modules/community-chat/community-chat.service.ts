import { Injectable, ForbiddenException } from '@nestjs/common';
import { CommunityChatRepository } from './repositories/community-chat.repository';
import { NotificationService } from '../notifications/services/notification.service';

@Injectable()
export class CommunityChatService {
  constructor(
    private readonly repo: CommunityChatRepository,
    private readonly notifications: NotificationService,
  ) {}

  async sendMessage(
    userId: number,
    communityId: number,
    params: { text: string; replyToMessageId?: number },
  ) {
    const isMember = await this.repo.isMember(userId, communityId);
    if (!isMember)
      throw new ForbiddenException(
        'Нет доступа: вы не являетесь членом сообщества',
      );
    const message = await this.repo.createMessageWithAutoChat({
      communityId,
      userId,
      text: params.text,
      replyToMessageId: params.replyToMessageId,
    });

    const memberIds = await this.repo.getMemberIds(communityId);
    const title = 'Сообщение в сообществе';
    const authorName =
      [message.user?.firstName, message.user?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() || 'User';
    const recipients = memberIds.filter((id) => id !== userId);
    if (recipients.length > 0) {
      await this.notifications.createGlobalNotification({
        type: 'MESSAGE_RECEIVED',
        title,
        message: `${authorName}: ${message.text}`,
        userId: recipients,
        payload: {
          communityId,
          messageId: message.id,
          senderId: userId,
          senderName: authorName,
          text: message.text.substring(0, 100),
        },
      });
    }

    return message;
  }

  async getMessages(userId: number, communityId: number, page = 1, limit = 50) {
    const isMember = await this.repo.isMember(userId, communityId);
    if (!isMember) throw new ForbiddenException('Нет доступа');
    const chat = await this.repo.ensureChatExists(communityId);
    if (!chat) {
      await this.repo.createChat(communityId);
    }
    return this.repo.getMessages(communityId, page, limit);
  }

  async deleteMessage(userId: number, communityId: number, messageId: number) {
    const isMember = await this.repo.isMember(userId, communityId);
    if (!isMember) throw new ForbiddenException('Нет доступа');
    await this.repo.deleteMessage(messageId, userId);
  }

  async markAsRead(
    userId: number,
    communityId: number,
    upToMessageId?: number,
  ) {
    const isMember = await this.repo.isMember(userId, communityId);
    if (!isMember) throw new ForbiddenException('Нет доступа');
    return this.repo.markAsRead(userId, communityId, upToMessageId);
  }

  async search(
    userId: number,
    query: string,
    communityId?: number,
    page = 1,
    limit = 50,
  ) {
    return this.repo.searchMessages(userId, query, communityId, page, limit);
  }

  async createConversation(adminUserId: number, communityId: number) {
    const isAdmin = await this.repo.isAdmin(adminUserId);
    if (!isAdmin)
      throw new ForbiddenException('Только администратор может создавать чат');
    return this.repo.createChat(communityId);
  }

  async deleteConversation(adminUserId: number, communityId: number) {
    const isAdmin = await this.repo.isAdmin(adminUserId);
    if (!isAdmin)
      throw new ForbiddenException('Только администратор может удалять чат');
    await this.repo.deleteChat(communityId);
  }

  async updateSettings(
    adminUserId: number,
    communityId: number,
    data: { isActive?: boolean; settings?: any },
  ) {
    const isAdmin = await this.repo.isAdmin(adminUserId);
    if (!isAdmin)
      throw new ForbiddenException(
        'Только администратор может изменять настройки',
      );
    return this.repo.updateSettings(communityId, data);
  }
}

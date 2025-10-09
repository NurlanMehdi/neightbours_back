import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PrivateChatRepository {
  private readonly logger = new Logger(PrivateChatRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateConversation(userId: number, otherUserId: number) {
    this.validateUserIds(userId, otherUserId);

    const receiver = await this.prisma.users.findUnique({
      where: { id: otherUserId },
    });
    if (!receiver) {
      throw new NotFoundException('Пользователь не найден');
    }

    const pairKey = this.buildPairKey(userId, otherUserId);
    let conversation = await this.findConversationByPairKey(pairKey);

    if (!conversation) {
      conversation = await this.createNewConversation(
        pairKey,
        userId,
        otherUserId,
      );
    } else {
      conversation = await this.ensureConversationParticipants(
        conversation,
        userId,
        otherUserId,
      );
    }

    return conversation;
  }

  async findConversationByPairKey(pairKey: string) {
    return this.prisma.conversation.findUnique({
      where: { pairKey },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async findConversationById(conversationId: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Диалог не найден');
    }

    return conversation;
  }

  async getConversationListWithUnreadCounts(userId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            replyTo: {
              select: {
                id: true,
                text: true,
                senderId: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const conversationIds = conversations.map((c) => c.id);
    if (conversationIds.length === 0) {
      return [];
    }

    const participants = await this.prisma.conversationParticipant.findMany({
      where: {
        conversationId: { in: conversationIds },
        userId,
      },
      select: {
        conversationId: true,
        lastReadAt: true,
      },
    });

    const lastReadMap = new Map(
      participants.map((p) => [p.conversationId, p.lastReadAt]),
    );

    const unreadCounts = await this.prisma.privateMessage.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        OR: conversationIds.map((convId) => {
          const lastReadAt = lastReadMap.get(convId);
          return lastReadAt
            ? { conversationId: convId, createdAt: { gt: lastReadAt } }
            : { conversationId: convId };
        }),
      },
      _count: { id: true },
    });

    const unreadMap = new Map(
      unreadCounts.map((u) => [u.conversationId, u._count.id]),
    );

    return conversations.map((conv) => ({
      ...conv,
      unreadCount: unreadMap.get(conv.id) || 0,
    }));
  }

  async deleteConversation(
    conversationId: number,
    userId: number,
  ): Promise<void> {
    await this.ensureParticipant(conversationId, userId);
    await this.prisma.conversation.delete({ where: { id: conversationId } });
  }

  async ensureParticipant(conversationId: number, userId: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });
    if (!conversation) {
      throw new NotFoundException('Диалог не найден');
    }

    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) {
      throw new ForbiddenException('Нет доступа к диалогу');
    }

    return participant;
  }

  async createMessage(params: {
    conversationId: number;
    senderId: number;
    text: string;
    replyToId?: number;
  }) {
    const message = await this.prisma.privateMessage.create({
      data: {
        conversationId: params.conversationId,
        senderId: params.senderId,
        text: params.text,
        replyToId: params.replyToId,
      },
      include: this.getMessageInclude(),
    });

    await this.touchConversation(params.conversationId);

    return {
      ...message,
      isRead: false,
      readAt: null,
    };
  }

  async createMessageWithAutoConversation(params: {
    senderId: number;
    receiverId: number;
    text: string;
    replyToMessageId?: number;
  }) {
    this.validateUserIds(params.senderId, params.receiverId);

    const receiver = await this.prisma.users.findUnique({
      where: { id: params.receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('Получатель не найден');
    }

    return this.prisma.$transaction(async (tx) => {
      const pairKey = this.buildPairKey(params.senderId, params.receiverId);

      let conversation = await tx.conversation.findUnique({
        where: { pairKey },
        select: { id: true },
      });

      if (!conversation) {
        this.logger.debug(
          `Creating new conversation for users ${params.senderId} and ${params.receiverId}`,
        );
        conversation = await tx.conversation.create({
          data: {
            pairKey,
            participants: {
              createMany: {
                data: [
                  { userId: params.senderId },
                  { userId: params.receiverId },
                ],
              },
            },
          },
          select: { id: true },
        });
      } else {
        await this.ensureParticipantsInTransaction(
          tx,
          conversation.id,
          params.senderId,
          params.receiverId,
        );
      }

      if (params.replyToMessageId) {
        await this.validateReplyMessageInTransaction(
          tx,
          params.replyToMessageId,
          conversation.id,
        );
      }

      const message = await tx.privateMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: params.senderId,
          text: params.text,
          replyToId: params.replyToMessageId,
        },
        include: this.getMessageInclude(),
      });

      const participants = await tx.conversationParticipant.findMany({
        where: { conversationId: conversation.id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return {
        ...message,
        isRead: false,
        readAt: null,
        conversation: {
          id: conversation.id,
          participants,
        },
      };
    });
  }

  async getMessages(
    conversationId: number,
    page: number = 1,
    limit: number = 50,
    currentUserId?: number,
  ) {
    const messages = await this.prisma.privateMessage.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            text: true,
            senderId: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        seens: currentUserId
          ? {
              select: { userId: true, seenAt: true },
            }
          : false,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (currentUserId) {
      return messages.map((msg) => {
        const { isRead, readAt } = this.computeReadStatus(msg, currentUserId);
        return {
          ...msg,
          isRead,
          readAt,
        };
      });
    }

    return messages;
  }

  async findMessageById(id: number) {
    const message = await this.prisma.privateMessage.findUnique({
      where: { id },
      include: { conversation: true },
    });
    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }
    return message;
  }

  async deleteMessage(messageId: number, userId: number): Promise<void> {
    const message = await this.prisma.privateMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }
    if (message.senderId !== userId) {
      throw new ForbiddenException('Нет доступа к удалению сообщения');
    }
    await this.prisma.privateMessage.delete({ where: { id: messageId } });
  }

  async searchMessages(
    userId: number,
    q: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const convs = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    const convIds = convs.map((c) => c.conversationId);

    if (convIds.length === 0) return [];

    return this.prisma.privateMessage.findMany({
      where: {
        conversationId: { in: convIds },
        text: { contains: q, mode: 'insensitive' },
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async markAsRead(
    conversationId: number,
    userId: number,
    upToMessageId?: number,
  ): Promise<{ updated: number; readAt: Date }> {
    return this.prisma.$transaction(async (tx) => {
      const participant = await tx.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      });

      if (!participant) {
        const conversation = await tx.conversation.findUnique({
          where: { id: conversationId },
          select: { id: true },
        });
        if (!conversation) {
          throw new NotFoundException('Диалог не найден');
        }
        throw new ForbiddenException('Нет доступа к диалогу');
      }

      const previousReadAt = participant.lastReadAt || new Date(0);
      let readUpTo: Date;

      if (upToMessageId) {
        const upTo = await tx.privateMessage.findUnique({
          where: { id: upToMessageId },
          select: { createdAt: true, conversationId: true },
        });
        if (upTo && upTo.conversationId === conversationId) {
          readUpTo = upTo.createdAt;
        } else {
          readUpTo = new Date();
        }
      } else {
        const latestMessage = await tx.privateMessage.findFirst({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });
        readUpTo = latestMessage ? latestMessage.createdAt : new Date();
      }

      this.logger.debug(
        `[markAsRead] userId=${userId}, conversationId=${conversationId}, previousReadAt=${previousReadAt.toISOString()}, readUpTo=${readUpTo.toISOString()}`,
      );

      const unreadMessages = await tx.privateMessage.findMany({
        where: {
          conversationId,
          senderId: { not: userId },
          createdAt: { gt: previousReadAt, lte: readUpTo },
        },
        select: { id: true },
      });

      const messageIds = unreadMessages.map((m) => m.id);
      this.logger.debug(
        `[markAsRead] found ${messageIds.length} unread messages`,
      );

      let updated = 0;

      if (messageIds.length > 0) {
        const alreadySeen = await tx.messageSeen.findMany({
          where: { userId, messageId: { in: messageIds } },
          select: { messageId: true },
        });
        const seenSet = new Set(alreadySeen.map((s) => s.messageId));

        const toInsert = messageIds
          .filter((id) => !seenSet.has(id))
          .map((id) => ({ messageId: id, userId }));

        if (toInsert.length > 0) {
          this.logger.debug(
            `[markAsRead] marking ${toInsert.length} messages as seen`,
          );
          try {
            const result = await tx.messageSeen.createMany({
              data: toInsert,
              skipDuplicates: true,
            });
            updated = result.count ?? toInsert.length;
            this.logger.debug(
              `[markAsRead] successfully marked ${updated} messages`,
            );
          } catch (err: any) {
            this.logger.error(
              `[markAsRead] createMany failed: ${err?.message || err}`,
              err?.stack,
            );
            updated = toInsert.length;
          }
        }
      }

      await tx.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastReadAt: readUpTo },
      });

      this.logger.debug(
        `[markAsRead] lastReadAt updated to ${readUpTo.toISOString()}`,
      );

      return { updated, readAt: readUpTo };
    });
  }

  async countUnread(
    conversationId: number,
    userId: number,
    lastReadAt?: Date | null,
  ) {
    const where: any = {
      conversationId,
      senderId: { not: userId },
    };

    if (lastReadAt) {
      where.createdAt = { gt: lastReadAt };
    }

    return this.prisma.privateMessage.count({ where });
  }

  async markPrivateAsReadByDto(
    userId: number,
    chatId: number,
  ): Promise<void> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: chatId },
      select: { id: true },
    });
    if (!conversation) {
      throw new NotFoundException('Чат не найден');
    }

    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: chatId, userId } },
    });
    if (!participant) {
      throw new ForbiddenException(
        'Пользователь не является частью этого чата',
      );
    }

    await this.markAsRead(chatId, userId);
  }

  private buildPairKey(userAId: number, userBId: number): string {
    const [minId, maxId] =
      userAId < userBId ? [userAId, userBId] : [userBId, userAId];
    return `${minId}_${maxId}`;
  }

  private validateUserIds(userId: number, otherUserId: number): void {
    if (!Number.isInteger(otherUserId) || otherUserId <= 0) {
      throw new BadRequestException('Некорректный receiverId');
    }
    if (userId === otherUserId) {
      throw new ForbiddenException('Нельзя создать диалог с самим собой');
    }
  }

  private async createNewConversation(
    pairKey: string,
    userId: number,
    otherUserId: number,
  ) {
    return this.prisma.conversation.create({
      data: {
        pairKey,
        participants: {
          createMany: {
            data: [{ userId }, { userId: otherUserId }],
            skipDuplicates: true,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  private async ensureConversationParticipants(
    conversation: any,
    userId: number,
    otherUserId: number,
  ) {
    const existingIds = new Set(
      conversation.participants.map((p) => p.userId),
    );
    const toCreate: { conversationId: number; userId: number }[] = [];

    if (!existingIds.has(userId)) {
      toCreate.push({ conversationId: conversation.id, userId });
    }
    if (!existingIds.has(otherUserId)) {
      toCreate.push({ conversationId: conversation.id, userId: otherUserId });
    }

    if (toCreate.length > 0) {
      await this.prisma.conversationParticipant.createMany({
        data: toCreate,
        skipDuplicates: true,
      });

      return this.findConversationByPairKey(
        this.buildPairKey(userId, otherUserId),
      );
    }

    return conversation;
  }

  private async ensureParticipantsInTransaction(
    tx: any,
    conversationId: number,
    senderId: number,
    receiverId: number,
  ): Promise<void> {
    const existingParticipants = await tx.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    const existingIds = new Set(existingParticipants.map((p) => p.userId));
    const toCreate: { conversationId: number; userId: number }[] = [];

    if (!existingIds.has(senderId)) {
      toCreate.push({ conversationId, userId: senderId });
    }
    if (!existingIds.has(receiverId)) {
      toCreate.push({ conversationId, userId: receiverId });
    }

    if (toCreate.length > 0) {
      this.logger.debug(
        `Adding missing participants to conversation ${conversationId}`,
      );
      await tx.conversationParticipant.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }
  }

  private async validateReplyMessageInTransaction(
    tx: any,
    replyToMessageId: number,
    conversationId: number,
  ): Promise<void> {
    const repliedMessage = await tx.privateMessage.findUnique({
      where: { id: replyToMessageId },
      select: { id: true, conversationId: true },
    });

    if (!repliedMessage) {
      throw new NotFoundException('Сообщение для ответа не найдено');
    }

    if (repliedMessage.conversationId !== conversationId) {
      throw new ForbiddenException(
        'Нельзя отвечать на сообщение из другого диалога',
      );
    }
  }

  async getUserAndLastMessage(userId: number, conversationId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    const lastMessage = await this.prisma.privateMessage.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      include: this.getMessageInclude(),
    });

    return {
      user,
      lastMessage: lastMessage ? this.formatMessage(lastMessage) : null,
    };
  }

  private formatMessage(msg: any) {
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      userId: msg.senderId,
      text: msg.text,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      user: msg.sender
        ? {
            id: msg.sender.id,
            firstName: msg.sender.firstName,
            lastName: msg.sender.lastName,
            avatar: msg.sender.avatar,
          }
        : null,
    };
  }

  private async touchConversation(conversationId: number): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  /**
   * Вычисляет статус прочтения сообщения для конкретного пользователя
   * @param msg - Сообщение с данными о прочтении (seens)
   * @param currentUserId - ID текущего пользователя
   * @returns Объект с isRead и readAt
   */
  private computeReadStatus(msg: any, currentUserId: number) {
    const relevantSeens =
      msg.senderId === currentUserId
        ? msg.seens?.filter((s) => s.userId !== currentUserId)
        : msg.seens?.filter((s) => s.userId === currentUserId);
    const isRead = relevantSeens && relevantSeens.length > 0;
    const readAt = relevantSeens?.[0]?.seenAt ?? null;
    
    return { isRead, readAt };
  }

  private getMessageInclude() {
    return {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      replyTo: {
        select: {
          id: true,
          text: true,
          senderId: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
      seens: {
        select: {
          userId: true,
          seenAt: true,
        },
      },
    };
  }
}

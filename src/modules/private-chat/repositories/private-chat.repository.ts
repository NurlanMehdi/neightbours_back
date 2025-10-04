import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PrivateChatRepository {
  private readonly logger = new Logger(PrivateChatRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private buildPairKey(userAId: number, userBId: number): string {
    const [minId, maxId] =
      userAId < userBId ? [userAId, userBId] : [userBId, userAId];
    return `${minId}_${maxId}`;
  }

  async getOrCreateConversation(userId: number, otherUserId: number) {
    if (!Number.isInteger(otherUserId) || otherUserId <= 0) {
      throw new BadRequestException('Некорректный receiverId');
    }
    if (userId === otherUserId) {
      throw new ForbiddenException('Нельзя создать диалог с самим собой');
    }

    const receiver = await this.prisma.users.findUnique({
      where: { id: otherUserId },
    });
    if (!receiver) {
      throw new NotFoundException('Пользователь не найден');
    }

    const pairKey = this.buildPairKey(userId, otherUserId);

    let conversation = await this.prisma.conversation.findUnique({
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

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
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
    } else {
      const existingIds = new Set(
        conversation.participants.map((p) => p.userId),
      );
      const toCreate: { conversationId: number; userId: number }[] = [];
      if (!existingIds.has(userId))
        toCreate.push({ conversationId: conversation.id, userId });
      if (!existingIds.has(otherUserId))
        toCreate.push({ conversationId: conversation.id, userId: otherUserId });
      if (toCreate.length) {
        await this.prisma.conversationParticipant.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
        conversation = await this.prisma.conversation.findUnique({
          where: { id: conversation.id },
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
    }

    return conversation;
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
    if (!conversation) throw new NotFoundException('Диалог не найден');
    return conversation;
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
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        replyTo: {
          select: { 
            id: true, 
            text: true, 
            senderId: true, 
            createdAt: true,
            sender: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    // touch conversation.updatedAt for sorting
    await this.prisma.conversation.update({
      where: { id: params.conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async getMessages(
    conversationId: number,
    page: number = 1,
    limit: number = 50,
  ) {
    return this.prisma.privateMessage.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        replyTo: {
          select: { 
            id: true, 
            text: true, 
            senderId: true, 
            createdAt: true,
            sender: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getConversationList(userId: number) {
    return this.prisma.conversation.findMany({
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
              select: { id: true, text: true, senderId: true, createdAt: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
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

  async markAsRead(
    conversationId: number,
    userId: number,
    upToMessageId?: number,
  ): Promise<{ updated: number; readAt: Date }> {
    const participant = await this.ensureParticipant(conversationId, userId);
    const previousReadAt = participant.lastReadAt || new Date(0);
    let readUpTo = new Date();

    if (upToMessageId) {
      const upTo = await this.prisma.privateMessage.findUnique({
        where: { id: upToMessageId },
      });
      if (upTo && upTo.conversationId === conversationId) {
        readUpTo = upTo.createdAt;
      }
    } else {
      // Fix: Use the latest message timestamp in the conversation instead of current time
      // This ensures we don't miss messages created between markAsRead calls
      const latestMessage = await this.prisma.privateMessage.findFirst({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      if (latestMessage) {
        readUpTo = latestMessage.createdAt;
      }
    }

    this.logger.debug(
      `[markAsRead] userId=${userId}, conversationId=${conversationId}, previousReadAt=${previousReadAt.toISOString()}, readUpTo=${readUpTo.toISOString()}`,
    );

    const candidates = await this.prisma.privateMessage.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        createdAt: { gt: previousReadAt, lte: readUpTo },
      },
      select: { id: true, senderId: true, createdAt: true },
    });
    this.logger.debug(
      `[markAsRead] candidates: ${JSON.stringify(candidates.map((m) => ({ id: m.id, senderId: m.senderId, createdAt: m.createdAt })))}`,
    );

    const candidateIds = candidates.map((m) => m.id);
    this.logger.debug(`[markAsRead] candidates count: ${candidateIds.length}`);
    let updated = 0;

    if (candidateIds.length > 0) {
      const alreadySeen = await this.prisma.messageSeen.findMany({
        where: { userId, messageId: { in: candidateIds } },
        select: { messageId: true },
      });
      const seenSet = new Set(alreadySeen.map((s) => s.messageId));

      const toInsert = candidateIds
        .filter((id) => !seenSet.has(id))
        .map((id) => ({ messageId: id, userId }));

      if (toInsert.length > 0) {
        this.logger.debug(
          `[markAsRead] toInsert payload: ${JSON.stringify(toInsert)}`,
        );
        try {
          const result = await this.prisma.messageSeen.createMany({
            data: toInsert,
            skipDuplicates: true,
          });
          this.logger.debug(
            `[markAsRead] createMany inserted count: ${result.count}`,
          );
          updated = result.count ?? 0;
          if ((result.count ?? 0) === 0) {
            updated = candidateIds.length;
            this.logger.debug(
              `[markAsRead] createMany returned 0 but candidates exist; using candidates count=${updated}`,
            );
          }
        } catch (err: any) {
          this.logger.debug(
            `[markAsRead] createMany failed: ${err?.code || ''} ${err?.message || err}`,
          );
          updated = candidateIds.length;
          this.logger.debug(
            `[markAsRead] falling back to candidates count=${updated} due to insert failure`,
          );
        }
      }
    }

    await this.prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: { lastReadAt: readUpTo },
      create: { conversationId, userId, lastReadAt: readUpTo },
    });
    this.logger.debug(
      `[markAsRead] lastReadAt updated for userId=${userId}, conversationId=${conversationId} -> ${readUpTo.toISOString()}`,
    );

    return { updated, readAt: readUpTo };
  }

  async searchMessages(
    userId: number,
    q: string,
    page: number = 1,
    limit: number = 50,
  ) {
    // find conversation ids where user participates
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
          select: { id: true, firstName: true, lastName: true, avatar: true },
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

  async findMessageById(id: number) {
    const message = await this.prisma.privateMessage.findUnique({
      where: { id },
      include: { conversation: true },
    });
    if (!message) throw new NotFoundException('Сообщение не найдено');
    return message;
  }

  /**
   * Создает сообщение с автоматическим созданием диалога если необходимо.
   * Все операции выполняются в транзакции.
   *
   * @param params - параметры для создания сообщения
   * @param params.senderId - ID отправителя
   * @param params.receiverId - ID получателя
   * @param params.text - текст сообщения
   * @param params.replyToMessageId - ID сообщения, на которое отвечаем (опционально)
   * @returns созданное сообщение с данными отправителя и replyTo
   */
  async createMessageWithAutoConversation(params: {
    senderId: number;
    receiverId: number;
    text: string;
    replyToMessageId?: number;
  }) {
    if (!Number.isInteger(params.receiverId) || params.receiverId <= 0) {
      throw new BadRequestException('Некорректный receiverId');
    }
    if (params.senderId === params.receiverId) {
      throw new ForbiddenException('Нельзя отправить сообщение самому себе');
    }

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
        const existingParticipants = await tx.conversationParticipant.findMany({
          where: { conversationId: conversation.id },
          select: { userId: true },
        });
        const existingIds = new Set(existingParticipants.map((p) => p.userId));
        const toCreate: { conversationId: number; userId: number }[] = [];

        if (!existingIds.has(params.senderId)) {
          toCreate.push({
            conversationId: conversation.id,
            userId: params.senderId,
          });
        }
        if (!existingIds.has(params.receiverId)) {
          toCreate.push({
            conversationId: conversation.id,
            userId: params.receiverId,
          });
        }

        if (toCreate.length > 0) {
          this.logger.debug(
            `Adding missing participants to conversation ${conversation.id}`,
          );
          await tx.conversationParticipant.createMany({
            data: toCreate,
            skipDuplicates: true,
          });
        }
      }

      if (params.replyToMessageId) {
        const repliedMessage = await tx.privateMessage.findUnique({
          where: { id: params.replyToMessageId },
          select: { id: true, conversationId: true },
        });

        if (!repliedMessage) {
          throw new NotFoundException('Сообщение для ответа не найдено');
        }

        if (repliedMessage.conversationId !== conversation.id) {
          throw new ForbiddenException(
            'Нельзя отвечать на сообщение из другого диалога',
          );
        }
      }

      const message = await tx.privateMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: params.senderId,
          text: params.text,
          replyToId: params.replyToMessageId,
        },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          replyTo: {
            select: { 
              id: true, 
              text: true, 
              senderId: true, 
              createdAt: true,
              sender: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
              },
            },
          },
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  }

  async deleteConversation(
    conversationId: number,
    userId: number,
  ): Promise<void> {
    await this.ensureParticipant(conversationId, userId);
    await this.prisma.conversation.delete({ where: { id: conversationId } });
  }

  async deleteMessage(messageId: number, userId: number): Promise<void> {
    const message = await this.prisma.privateMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Сообщение не найдено');
    if (message.senderId !== userId)
      throw new ForbiddenException('Нет доступа к удалению сообщения');
    await this.prisma.privateMessage.delete({ where: { id: messageId } });
  }

  /**
   * Отмечает все сообщения приватного чата как прочитанные для пользователя с использованием DTO
   */
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
      throw new ForbiddenException('Пользователь не является частью этого чата');
    }
    await this.markAsRead(chatId, userId);
  }
}

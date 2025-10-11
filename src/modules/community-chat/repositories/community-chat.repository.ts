import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CommunityChatRepository {
  private readonly logger = new Logger(CommunityChatRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async isMember(userId: number, communityId: number): Promise<boolean> {
    const membership = await this.prisma.usersOnCommunities.findUnique({
      where: {
        userId_communityId: { userId, communityId },
      },
      select: { userId: true },
    });
    return !!membership;
  }

  async isAdmin(userId: number): Promise<boolean> {
    const user = await (this.prisma as any).users.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === 'ADMIN';
  }

  async ensureChatExists(communityId: number) {
    const chat = await (this.prisma as any).communityChat.findUnique({
      where: { communityId },
    });
    if (!chat) return null;
    if (chat.isActive === false)
      throw new ForbiddenException('Чат отключен администратором');
    return chat;
  }

  async createChat(communityId: number) {
    return (this.prisma as any).communityChat.upsert({
      where: { communityId },
      update: {},
      create: { communityId, isActive: true },
    });
  }

  async deleteChat(communityId: number) {
    const chat = await (this.prisma as any).communityChat.findUnique({
      where: { communityId },
    });
    if (!chat) throw new NotFoundException('Чат не найден');

    await (this.prisma as any).communityMessage.deleteMany({
      where: { communityId },
    });
    await (this.prisma as any).communityRead.deleteMany({
      where: { communityId },
    });
    await (this.prisma as any).communityChat.delete({ where: { id: chat.id } });
  }

  async updateSettings(
    communityId: number,
    data: { isActive?: boolean; settings?: any },
  ) {
    const chat = await (this.prisma as any).communityChat.findUnique({
      where: { communityId },
    });
    if (!chat) throw new NotFoundException('Чат не найден');
    return (this.prisma as any).communityChat.update({
      where: { id: chat.id },
      data: {
        isActive: data.isActive ?? chat.isActive,
        settings: data.settings ?? chat.settings,
      },
    });
  }

  async createMessage(params: {
    communityId: number;
    userId: number;
    text: string;
    replyToMessageId?: number;
    isModerated?: boolean;
  }) {
    // optional: validate replyTo belongs to same community
    if (params.replyToMessageId) {
      const replied = await (this.prisma as any).communityMessage.findUnique({
        where: { id: params.replyToMessageId },
      });
      if (!replied || replied.communityId !== params.communityId) {
        throw new ForbiddenException(
          'Нельзя отвечать на сообщение из другого сообщества',
        );
      }
    }

    return (this.prisma as any).communityMessage.create({
      data: {
        communityId: params.communityId,
        userId: params.userId,
        text: params.text,
        replyToMessageId: params.replyToMessageId,
        isModerated: params.isModerated ?? true,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        replyTo: {
          select: {
            id: true,
            text: true,
            userId: true,
            createdAt: true,
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

  async createMessageWithAutoChat(params: {
    communityId: number;
    userId: number;
    text: string;
    replyToMessageId?: number;
    isModerated?: boolean;
  }) {
    return (this.prisma as any).$transaction(async (tx: any) => {
      const existing = await tx.communityChat.findUnique({
        where: { communityId: params.communityId },
      });
      if (!existing) {
        await tx.communityChat.create({
          data: { communityId: params.communityId, isActive: true },
        });
      } else if (existing.isActive === false) {
        throw new ForbiddenException('Чат отключен администратором');
      }

      if (params.replyToMessageId) {
        const replied = await tx.communityMessage.findUnique({
          where: { id: params.replyToMessageId },
        });
        if (!replied || replied.communityId !== params.communityId) {
          throw new ForbiddenException(
            'Нельзя отвечать на сообщение из другого сообщества',
          );
        }
      }

      return tx.communityMessage.create({
        data: {
          communityId: params.communityId,
          userId: params.userId,
          text: params.text,
          replyToMessageId: params.replyToMessageId,
          isModerated: params.isModerated ?? true,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          replyTo: {
            select: {
              id: true,
              text: true,
              userId: true,
              createdAt: true,
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
    });
  }

  async getMessages(communityId: number, page = 1, limit = 50) {
    const messages = await (this.prisma as any).communityMessage.findMany({
      where: {
        communityId,
        isModerated: true,
        isDeleted: false,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        replyTo: {
          select: {
            id: true,
            text: true,
            userId: true,
            createdAt: true,
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
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get seen users for each message
    const messageIds = messages.map(msg => msg.id);
    const seenRecords = await this.prisma.communityRead.findMany({
      where: {
        communityId: communityId,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    // Group seen records by messageId (all messages in community are considered "seen" by users who have read the community)
    const seenByMessage = seenRecords.reduce((acc, record) => {
      // For each message, add all users who have read the community
      messageIds.forEach(messageId => {
        if (!acc[messageId]) {
          acc[messageId] = [];
        }
        acc[messageId].push({
          userId: record.userId,
          seenAt: record.readAt,
          user: record.user,
        });
      });
      return acc;
    }, {});

    // Add seen users to each message
    return messages.map(msg => ({
      ...msg,
      seenUsers: seenByMessage[msg.id] || [],
    }));
  }

  async deleteMessage(messageId: number, userId: number) {
    const msg = await (this.prisma as any).communityMessage.findUnique({
      where: { id: messageId },
    });
    if (!msg) throw new NotFoundException('Сообщение не найдено');
    const isAdmin = await this.isAdmin(userId);
    if (msg.userId !== userId && !isAdmin)
      throw new ForbiddenException('Нет доступа к удалению');
    await (this.prisma as any).communityMessage.delete({
      where: { id: messageId },
    });
  }

  async markAsRead(
    userId: number,
    communityId: number,
    upToMessageId?: number,
  ) {
    let readAt = new Date();
    if (upToMessageId) {
      const msg = await (this.prisma as any).communityMessage.findUnique({
        where: { id: upToMessageId },
        select: { createdAt: true, communityId: true },
      });
      if (msg && msg.communityId === communityId) readAt = msg.createdAt;
    }
    await (this.prisma as any).communityRead.upsert({
      where: { userId_communityId: { userId, communityId } },
      update: { readAt },
      create: { userId, communityId, readAt },
    });
    return { readAt };
  }

  async searchMessages(
    userId: number,
    query: string,
    communityId?: number,
    page = 1,
    limit = 50,
  ) {
    const memberships = await (this.prisma as any).usersOnCommunities.findMany({
      where: { userId },
      select: { communityId: true },
    });
    const allowedIds = memberships.map((m) => m.communityId);
    if (allowedIds.length === 0) return [];
    return (this.prisma as any).communityMessage.findMany({
      where: {
        communityId: communityId ? communityId : { in: allowedIds },
        text: { contains: query, mode: 'insensitive' },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getMemberIds(communityId: number): Promise<number[]> {
    const rows = await (this.prisma as any).usersOnCommunities.findMany({
      where: { communityId },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  /**
   * Получить количество непрочитанных сообщений для пользователя во всех его сообществах
   */
  async getUnreadCounts(
    userId: number,
  ): Promise<Array<{ communityId: number; unreadCount: number }>> {
    // Найти все сообщества, в которых пользователь является членом
    const memberships = await (this.prisma as any).usersOnCommunities.findMany({
      where: { userId },
      select: { communityId: true },
    });
    const communityIds = memberships.map((m) => m.communityId);
    if (communityIds.length === 0) return [];

    // Получить последнее время прочтения для каждого сообщества
    const reads = await (this.prisma as any).communityRead.findMany({
      where: {
        userId,
        communityId: { in: communityIds },
      },
      select: { communityId: true, readAt: true },
    });
    const readMap = new Map(reads.map((r) => [r.communityId, r.readAt]));

    // Для каждого сообщества подсчитать непрочитанные сообщения
    const results = await Promise.all(
      communityIds.map(async (communityId) => {
        const lastReadAt = readMap.get(communityId);
        const where: any = {
          communityId,
          isDeleted: false,
          isModerated: true,
        };
        if (lastReadAt) {
          where.createdAt = { gt: lastReadAt };
        }
        const count = await (this.prisma as any).communityMessage.count({
          where,
        });
        this.logger.debug(
          `User ${userId} has ${count} unread messages in community ${communityId}`,
        );
        return { communityId, unreadCount: count };
      }),
    );
    return results;
  }

  /**
   * Отмечает все сообщения сообщества как прочитанные для пользователя с использованием DTO
   */
  async markCommunityAsReadByDto(
    userId: number,
    communityId: number,
  ): Promise<void> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true, isActive: true },
    });
    if (!community) {
      throw new NotFoundException('Сообщество не найдено');
    }
    const isMember = await this.isMember(userId, communityId);
    if (!isMember) {
      throw new ForbiddenException(
        'Пользователь не является членом сообщества',
      );
    }
    await (this.prisma as any).communityRead.upsert({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        userId,
        communityId,
        readAt: new Date(),
      },
    });
  }

  /**
   * Получает непрочитанные сообщения для пользователя, группированные по сообществам
   */
  async getUnreadMessagesGroupedByCommunity(userId: number): Promise<{
    count: Record<string, number>;
    COMMUNITY: number;
  }> {
    // Получаем сообщества с timestamp когда пользователь их прочитал
    const readCommunities = await (this.prisma as any).communityRead.findMany({
      where: { userId },
      select: { communityId: true, readAt: true },
    });

    // Получаем сообщества, в которых пользователь является членом
    const memberships = await (this.prisma as any).usersOnCommunities.findMany({
      where: { userId },
      select: { communityId: true },
    });
    const communityIds = memberships.map((m) => m.communityId);

    // Если пользователь не является членом ни одного сообщества, возвращаем пустой результат
    if (communityIds.length === 0) {
      return {
        count: {},
        COMMUNITY: 0,
      };
    }

    // Создаем map для быстрого поиска timestamps по communityId
    const readAtMap = new Map(
      readCommunities.map((read) => [read.communityId, read.readAt]),
    );

    // Получаем все сообщения из сообществ, в которых пользователь является членом
    const messages = await (this.prisma as any).communityMessage.findMany({
      where: {
        // Исключаем сообщения самого пользователя
        userId: { not: userId },
        // Только из сообществ, в которых пользователь является членом
        communityId: { in: communityIds },
        // Только активные (не удаленные и модерированные) сообщения
        isDeleted: false,
        isModerated: true,
      },
      select: {
        id: true,
        communityId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Фильтруем сообщения: показываем только те, что созданы ПОСЛЕ readAt timestamp
    const unreadMessages = messages.filter((message) => {
      const readAt = readAtMap.get(message.communityId);

      // Если сообщество никогда не было прочитано - все сообщения непрочитанные
      if (!readAt) {
        return true;
      }

      // Сообщение непрочитанное если оно создано ПОСЛЕ последнего времени прочтения
      return message.createdAt > readAt;
    });

    // Группируем и считаем непрочитанные сообщения по сообществам
    const count: Record<string, number> = {};
    let totalCommunityMessages = 0;

    // Группируем ТОЛЬКО непрочитанные сообщения по communityId
    const groupedByCommunity = unreadMessages.reduce(
      (acc, message) => {
        const communityId = message.communityId;
        if (!acc[communityId]) {
          acc[communityId] = 0;
        }
        acc[communityId]++;
        return acc;
      },
      {} as Record<number, number>,
    );

    // Преобразуем в нужный формат и считаем общее количество
    Object.entries(groupedByCommunity).forEach(
      ([communityIdStr, messageCount]: [string, number]) => {
        count[communityIdStr] = messageCount;
        totalCommunityMessages += messageCount;
      },
    );

    return {
      count,
      COMMUNITY: totalCommunityMessages,
    };
  }

  async getUserAndLastMessage(userId: number, communityId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    const lastMessage = await (this.prisma as any).communityMessage.findFirst({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
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

    return {
      user,
      lastMessage: lastMessage ? {
        id: lastMessage.id,
        communityId: lastMessage.communityId,
        userId: lastMessage.userId,
        text: lastMessage.text,
        createdAt: lastMessage.createdAt,
        updatedAt: lastMessage.updatedAt,
        user: lastMessage.user,
      } : null,
    };
  }
}

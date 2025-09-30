import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesQueryDto, AdminChatType } from './dto/messages-query.dto';
import { ModerationMessageDto } from './dto/moderation-message.dto';
import { UnifiedCommunityDto } from './dto/unified-community.dto';
import { UpdateGlobalChatSettingsDto } from './dto/update-global-chat-settings.dto';
import { GlobalChatSettingsResponseDto } from './dto/global-chat-settings-response.dto';
import { GlobalChatSettingsService } from './services/global-chat-settings.service';

@Injectable()
export class ChatAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly globalChatSettings: GlobalChatSettingsService,
  ) {}

  async getUnifiedCommunitiesList({
    page = 1,
    limit = 100,
    type,
  }: {
    page?: number;
    limit?: number;
    type?: 'COMMUNITY' | 'EVENT';
  }): Promise<{
    data: UnifiedCommunityDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    if (type === 'COMMUNITY') {
      const communityIdsWithMessages = await (
        this.prisma as any
      ).communityMessage.groupBy({
        by: ['communityId'],
        where: { isDeleted: false },
      });

      const communityIds = communityIdsWithMessages.map((c) => c.communityId);

      if (communityIds.length === 0) {
        return { data: [], total: 0, page, limit };
      }

      const [communities, total] = await Promise.all([
        this.prisma.community.findMany({
          where: { id: { in: communityIds } },
          select: {
            id: true,
            name: true,
            status: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.community.count({ where: { id: { in: communityIds } } }),
      ]);

      const communityCounts = await Promise.all(
        communities.map(async (c) => {
          const [messageCount, participantCount] = await Promise.all([
            (this.prisma as any).communityMessage.count({
              where: { communityId: c.id, isDeleted: false },
            }),
            (this.prisma as any).communityMessage
              .groupBy({
                by: ['userId'],
                where: { communityId: c.id, isDeleted: false },
              })
              .then((result: any[]) => result.length),
          ]);

          return {
            community: c,
            messageCount,
            participantCount,
          };
        }),
      );

      const data: UnifiedCommunityDto[] = communityCounts.map(
        ({ community: c, messageCount, participantCount }) => ({
          id: c.id,
          name: c.name,
          type: 'COMMUNITY' as const,
          status: c.status,
          isActive: c.isActive,
          communityId: null,
          createdAt: c.createdAt,
          messageCount,
          participantCount,
        }),
      );

      return { data, total, page, limit };
    }

    if (type === 'EVENT') {
      const eventIdsWithMessages = await (
        this.prisma as any
      ).eventMessage.groupBy({
        by: ['eventId'],
        where: { isDeleted: false },
      });

      const eventIds = eventIdsWithMessages.map((e) => e.eventId);

      if (eventIds.length === 0) {
        return { data: [], total: 0, page, limit };
      }

      const [events, total] = await Promise.all([
        this.prisma.event.findMany({
          where: { id: { in: eventIds } },
          select: {
            id: true,
            title: true,
            isActive: true,
            createdAt: true,
            communityId: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.event.count({ where: { id: { in: eventIds } } }),
      ]);

      const eventCounts = await Promise.all(
        events.map(async (e) => {
          const [messageCount, participantCount] = await Promise.all([
            (this.prisma as any).eventMessage.count({
              where: { eventId: e.id, isDeleted: false },
            }),
            (this.prisma as any).eventMessage
              .groupBy({
                by: ['userId'],
                where: { eventId: e.id, isDeleted: false },
              })
              .then((result: any[]) => result.length),
          ]);

          return {
            event: e,
            messageCount,
            participantCount,
          };
        }),
      );

      const data: UnifiedCommunityDto[] = eventCounts.map(
        ({ event: e, messageCount, participantCount }) => ({
          id: e.id,
          name: e.title,
          type: 'EVENT' as const,
          status: (e.isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
          isActive: e.isActive,
          communityId: e.communityId,
          createdAt: e.createdAt,
          messageCount,
          participantCount,
        }),
      );

      return { data, total, page, limit };
    }

    const [communityIdsWithMessages, eventIdsWithMessages] = await Promise.all([
      (this.prisma as any).communityMessage.groupBy({
        by: ['communityId'],
        where: { isDeleted: false },
      }),
      (this.prisma as any).eventMessage.groupBy({
        by: ['eventId'],
        where: { isDeleted: false },
      }),
    ]);

    const communityIds = communityIdsWithMessages.map((c) => c.communityId);
    const eventIds = eventIdsWithMessages.map((e) => e.eventId);

    const [communityTotal, eventTotal] = await Promise.all([
      this.prisma.community.count({ where: { id: { in: communityIds } } }),
      this.prisma.event.count({ where: { id: { in: eventIds } } }),
    ]);

    const total = communityTotal + eventTotal;

    if (total === 0) {
      return { data: [], total: 0, page, limit };
    }

    const fetchLimit = Math.min(limit * 3, 1000);
    const [communities, events] = await Promise.all([
      this.prisma.community.findMany({
        where: { id: { in: communityIds } },
        select: {
          id: true,
          name: true,
          status: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: fetchLimit,
      }),
      this.prisma.event.findMany({
        where: { id: { in: eventIds } },
        select: {
          id: true,
          title: true,
          isActive: true,
          createdAt: true,
          communityId: true,
        },
        orderBy: { createdAt: 'desc' },
        take: fetchLimit,
      }),
    ]);

    const communityCounts = await Promise.all(
      communities.map(async (c) => {
        const [messageCount, participantCount] = await Promise.all([
          (this.prisma as any).communityMessage.count({
            where: { communityId: c.id, isDeleted: false },
          }),
          (this.prisma as any).communityMessage
            .groupBy({
              by: ['userId'],
              where: { communityId: c.id, isDeleted: false },
            })
            .then((result: any[]) => result.length),
        ]);

        return {
          community: c,
          messageCount,
          participantCount,
        };
      }),
    );

    const eventCounts = await Promise.all(
      events.map(async (e) => {
        const [messageCount, participantCount] = await Promise.all([
          (this.prisma as any).eventMessage.count({
            where: { eventId: e.id, isDeleted: false },
          }),
          (this.prisma as any).eventMessage
            .groupBy({
              by: ['userId'],
              where: { eventId: e.id, isDeleted: false },
            })
            .then((result: any[]) => result.length),
        ]);

        return {
          event: e,
          messageCount,
          participantCount,
        };
      }),
    );

    const communityData: UnifiedCommunityDto[] = communityCounts.map(
      ({ community: c, messageCount, participantCount }) => ({
        id: c.id,
        name: c.name,
        type: 'COMMUNITY' as const,
        status: c.status,
        isActive: c.isActive,
        communityId: null,
        createdAt: c.createdAt,
        messageCount,
        participantCount,
      }),
    );

    const eventData: UnifiedCommunityDto[] = eventCounts.map(
      ({ event: e, messageCount, participantCount }) => ({
        id: e.id,
        name: e.title,
        type: 'EVENT' as const,
        status: (e.isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
        isActive: e.isActive,
        communityId: e.communityId,
        createdAt: e.createdAt,
        messageCount,
        participantCount,
      }),
    );

    const merged = [...communityData, ...eventData].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const start = skip;
    const end = start + limit;
    const data = merged.slice(start, end);

    return { data, total, page, limit };
  }

  async getGlobalChatSettings(): Promise<GlobalChatSettingsResponseDto> {
    const settings = await this.globalChatSettings.getSettings();

    return {
      globalSettings: {
        allowCommunityChat: settings.allowCommunityChat,
        allowEventChat: settings.allowEventChat,
        allowPrivateChat: settings.allowPrivateChat,
        messageRetentionDays: settings.messageRetentionDays,
        maxMessageLength: settings.maxMessageLength,
        moderationEnabled: settings.moderationEnabled,
      },
    };
  }

  async updateGlobalChatSettings(
    dto: UpdateGlobalChatSettingsDto,
  ): Promise<GlobalChatSettingsResponseDto> {
    const settings = await (this.prisma as any).globalChatSettings.upsert({
      where: { id: 1 },
      update: {
        allowCommunityChat: dto.allowCommunityChat,
        allowEventChat: dto.allowEventChat,
        allowPrivateChat: dto.allowPrivateChat,
        messageRetentionDays: dto.messageRetentionDays,
        maxMessageLength: dto.maxMessageLength,
        moderationEnabled: dto.moderationEnabled,
      },
      create: {
        allowCommunityChat: dto.allowCommunityChat,
        allowEventChat: dto.allowEventChat,
        allowPrivateChat: dto.allowPrivateChat,
        messageRetentionDays: dto.messageRetentionDays,
        maxMessageLength: dto.maxMessageLength,
        moderationEnabled: dto.moderationEnabled,
      },
    });

    return {
      globalSettings: {
        allowCommunityChat: settings.allowCommunityChat,
        allowEventChat: settings.allowEventChat,
        allowPrivateChat: settings.allowPrivateChat,
        messageRetentionDays: settings.messageRetentionDays,
        maxMessageLength: settings.maxMessageLength,
        moderationEnabled: settings.moderationEnabled,
      },
    };
  }

  async getModerationMessages(query: MessagesQueryDto): Promise<{
    data: ModerationMessageDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 20, chatType, chatId, userId, q } = query;
    const skip = (page - 1) * limit;

    const textFilter = q
      ? { contains: q, mode: 'insensitive' as const }
      : undefined;

    if (chatType === AdminChatType.COMMUNITY) {
      const where: any = {
        communityId: chatId,
        isDeleted: false,
        ...(userId ? { userId } : {}),
        ...(textFilter ? { text: textFilter } : {}),
      };

      const [rows, total] = await Promise.all([
        (this.prisma as any).communityMessage.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            community: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        (this.prisma as any).communityMessage.count({ where }),
      ]);

      const data: ModerationMessageDto[] = (rows as any[]).map((m: any) => ({
        id: m.id,
        chatId: m.communityId,
        chatType: AdminChatType.COMMUNITY,
        chatName: m.community?.name ?? '',
        communityId: m.communityId,
        eventId: null,
        userId: m.userId,
        userName:
          [m.user?.firstName, m.user?.lastName].filter(Boolean).join(' ') ||
          '—',
        userAvatar: m.user?.avatar ?? null,
        text: m.text,
        isDeleted: !!m.isDeleted,
        createdAt: m.createdAt,
      }));

      return { data, total, page, limit };
    }

    if (chatType === AdminChatType.EVENT) {
      const where: any = {
        eventId: chatId,
        isDeleted: false,
        ...(userId ? { userId } : {}),
        ...(textFilter ? { text: textFilter } : {}),
      };

      const [rows, total] = await Promise.all([
        (this.prisma as any).eventMessage.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            event: { select: { id: true, title: true, communityId: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        (this.prisma as any).eventMessage.count({ where }),
      ]);

      const data: ModerationMessageDto[] = (rows as any[]).map((m: any) => ({
        id: m.id,
        chatId: m.eventId,
        chatType: AdminChatType.EVENT,
        chatName: m.event?.title ?? '',
        communityId: m.event?.communityId ?? null,
        eventId: m.eventId,
        userId: m.userId,
        userName:
          [m.user?.firstName, m.user?.lastName].filter(Boolean).join(' ') ||
          '—',
        userAvatar: m.user?.avatar ?? null,
        text: m.text,
        isDeleted: !!m.isDeleted,
        createdAt: m.createdAt,
      }));

      return { data, total, page, limit };
    }

    return { data: [], total: 0, page, limit };
  }

  async softDeleteMessage(
    id: number | string,
    chatType?: 'COMMUNITY' | 'EVENT',
  ): Promise<{ success: boolean; id: number }> {
    const messageId = Number(id);

    if (isNaN(messageId)) {
      throw new NotFoundException('Invalid message ID');
    }

    if (chatType === 'COMMUNITY') {
      const communityResult = await (
        this.prisma as any
      ).communityMessage.updateMany({
        where: {
          id: messageId,
          isDeleted: false,
        },
        data: { isDeleted: true },
      });

      if (communityResult.count > 0) {
        return { success: true, id: messageId };
      }

      throw new NotFoundException(
        'Community message not found or already deleted',
      );
    }

    if (chatType === 'EVENT') {
      const eventResult = await (this.prisma as any).eventMessage.updateMany({
        where: {
          id: messageId,
          isDeleted: false,
        },
        data: { isDeleted: true },
      });

      if (eventResult.count > 0) {
        return { success: true, id: messageId };
      }

      throw new NotFoundException('Event message not found or already deleted');
    }

    const communityResult = await (
      this.prisma as any
    ).communityMessage.updateMany({
      where: {
        id: messageId,
        isDeleted: false,
      },
      data: { isDeleted: true },
    });

    if (communityResult.count > 0) {
      return { success: true, id: messageId };
    }

    const eventResult = await (this.prisma as any).eventMessage.updateMany({
      where: {
        id: messageId,
        isDeleted: false,
      },
      data: { isDeleted: true },
    });

    if (eventResult.count > 0) {
      return { success: true, id: messageId };
    }

    throw new NotFoundException('Message not found or already deleted');
  }

  async approveMessage(messageId: number): Promise<void> {
    // Try community message first
    const cm = await (this.prisma as any).communityMessage.findUnique({
      where: { id: messageId },
      select: { id: true },
    });
    if (cm) {
      await (this.prisma as any).communityMessage.update({
        where: { id: messageId },
        data: { isModerated: true },
      });
      return;
    }

    const em = await (this.prisma as any).eventMessage.findUnique({
      where: { id: messageId },
      select: { id: true },
    });
    if (em) {
      await (this.prisma as any).eventMessage.update({
        where: { id: messageId },
        data: { isModerated: true },
      });
      return;
    }

    throw new NotFoundException('Message not found');
  }

  async rejectMessage(messageId: number): Promise<void> {
    // Try community message first
    const cm = await (this.prisma as any).communityMessage.findUnique({
      where: { id: messageId },
      select: { id: true },
    });
    if (cm) {
      await (this.prisma as any).communityMessage.update({
        where: { id: messageId },
        data: { isDeleted: true },
      });
      return;
    }

    const em = await (this.prisma as any).eventMessage.findUnique({
      where: { id: messageId },
      select: { id: true },
    });
    if (em) {
      await (this.prisma as any).eventMessage.update({
        where: { id: messageId },
        data: { isDeleted: true },
      });
      return;
    }

    throw new NotFoundException('Message not found');
  }
}

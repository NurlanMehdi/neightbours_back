import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CommunityChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isMember(userId: number, communityId: number): Promise<boolean> {
    const rec = await (this.prisma as any).usersOnCommunities.findUnique({
      where: { userId_communityId: { userId, communityId } },
      select: { userId: true },
    });
    return !!rec;
  }

  async isAdmin(userId: number): Promise<boolean> {
    const user = await (this.prisma as any).users.findUnique({ where: { id: userId }, select: { role: true } });
    return user?.role === 'ADMIN';
  }

  async ensureChatExists(communityId: number) {
    const chat = await (this.prisma as any).communityChat.findUnique({ where: { communityId } });
    if (!chat) return null;
    if (chat.isActive === false) throw new ForbiddenException('Чат отключен администратором');
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
    const chat = await (this.prisma as any).communityChat.findUnique({ where: { communityId } });
    if (!chat) throw new NotFoundException('Чат не найден');
    
    await (this.prisma as any).communityMessage.deleteMany({ where: { communityId } });
    await (this.prisma as any).communityRead.deleteMany({ where: { communityId } });
    await (this.prisma as any).communityChat.delete({ where: { id: chat.id } });
  }

  async updateSettings(communityId: number, data: { isActive?: boolean; settings?: any }) {
    const chat = await (this.prisma as any).communityChat.findUnique({ where: { communityId } });
    if (!chat) throw new NotFoundException('Чат не найден');
    return (this.prisma as any).communityChat.update({
      where: { id: chat.id },
      data: { isActive: data.isActive ?? chat.isActive, settings: data.settings ?? chat.settings },
    });
  }

  async createMessage(params: { communityId: number; userId: number; text: string; replyToMessageId?: number; isModerated?: boolean }) {
    // optional: validate replyTo belongs to same community
    if (params.replyToMessageId) {
      const replied = await (this.prisma as any).communityMessage.findUnique({ where: { id: params.replyToMessageId } });
      if (!replied || replied.communityId !== params.communityId) {
        throw new ForbiddenException('Нельзя отвечать на сообщение из другого сообщества');
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
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        replyTo: {
          select: {
            id: true,
            text: true,
            userId: true,
            createdAt: true,
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
        },
      },
    });
  }

  async createMessageWithAutoChat(params: { communityId: number; userId: number; text: string; replyToMessageId?: number; isModerated?: boolean }) {
    return (this.prisma as any).$transaction(async (tx: any) => {
      const existing = await tx.communityChat.findUnique({ where: { communityId: params.communityId } });
      if (!existing) {
        await tx.communityChat.create({ data: { communityId: params.communityId, isActive: true } });
      } else if (existing.isActive === false) {
        throw new ForbiddenException('Чат отключен администратором');
      }

      if (params.replyToMessageId) {
        const replied = await tx.communityMessage.findUnique({ where: { id: params.replyToMessageId } });
        if (!replied || replied.communityId !== params.communityId) {
          throw new ForbiddenException('Нельзя отвечать на сообщение из другого сообщества');
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
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          replyTo: {
            select: {
              id: true,
              text: true,
              userId: true,
              createdAt: true,
              user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            },
          },
        },
      });
    });
  }

  async getMessages(communityId: number, page = 1, limit = 50) {
    return (this.prisma as any).communityMessage.findMany({
      where: { 
        communityId,
        isModerated: true,
        isDeleted: false,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        replyTo: {
          select: {
            id: true,
            text: true,
            userId: true,
            createdAt: true,
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async deleteMessage(messageId: number, userId: number) {
    const msg = await (this.prisma as any).communityMessage.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Сообщение не найдено');
    const isAdmin = await this.isAdmin(userId);
    if (msg.userId !== userId && !isAdmin) throw new ForbiddenException('Нет доступа к удалению');
    await (this.prisma as any).communityMessage.delete({ where: { id: messageId } });
  }

  async markAsRead(userId: number, communityId: number, upToMessageId?: number) {
    let readAt = new Date();
    if (upToMessageId) {
      const msg = await (this.prisma as any).communityMessage.findUnique({ where: { id: upToMessageId }, select: { createdAt: true, communityId: true } });
      if (msg && msg.communityId === communityId) readAt = msg.createdAt;
    }
    await (this.prisma as any).communityRead.upsert({
      where: { userId_communityId: { userId, communityId } },
      update: { readAt },
      create: { userId, communityId, readAt },
    });
    return { readAt };
  }

  async searchMessages(userId: number, query: string, communityId?: number, page = 1, limit = 50) {
    const memberships = await (this.prisma as any).usersOnCommunities.findMany({ where: { userId }, select: { communityId: true } });
    const allowedIds = memberships.map((m) => m.communityId);
    if (allowedIds.length === 0) return [];
    return (this.prisma as any).communityMessage.findMany({
      where: {
        communityId: communityId ? communityId : { in: allowedIds },
        text: { contains: query, mode: 'insensitive' },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getMemberIds(communityId: number): Promise<number[]> {
    const rows = await (this.prisma as any).usersOnCommunities.findMany({ where: { communityId }, select: { userId: true } });
    return rows.map((r) => r.userId);
  }
}

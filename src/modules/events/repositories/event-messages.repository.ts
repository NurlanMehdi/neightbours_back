import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { EventMessage, Prisma } from '@prisma/client';

@Injectable()
export class EventMessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage(
    userId: number,
    eventId: number,
    dto: CreateMessageDto,
  ): Promise<EventMessage> {
    return this.prisma.eventMessage.create({
      data: {
        text: dto.text,
        userId,
        eventId,
      },
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
  }

  async getEventMessages(
    eventId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<EventMessage[]> {
    return this.prisma.eventMessage.findMany({
      where: {
        eventId,
      },
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
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async isUserParticipant(userId: number, eventId: number): Promise<boolean> {
    const participant = await this.prisma.usersOnEvents.findFirst({
      where: {
        userId,
        eventId,
      },
    });
    return !!participant;
  }

  async findMessageById(messageId: number): Promise<EventMessage | null> {
    return this.prisma.eventMessage.findUnique({
      where: { id: messageId },
    });
  }

  async markMessageAsRead(messageId: number): Promise<EventMessage> {
    return this.prisma.eventMessage.update({
      where: { id: messageId },
      data: { isRead: { set: true } } as unknown as Prisma.EventMessageUpdateInput,
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
  }

  async findUnreadMessagesForUser(
    userId: number,
    page: number = 1,
    limit: number = 50,
    eventId?: number,
  ): Promise<{ items: EventMessage[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = {
      isRead: false,
      event: {
        OR: [
          {
            participants: {
              some: { userId },
            },
          },
          {
            community: {
              users: {
                some: { userId },
              },
            },
          },
        ],
      },
    };
    if (eventId) {
      where.eventId = eventId;
    }
    const whereTyped = where as Prisma.EventMessageWhereInput;

    const [items, total] = await Promise.all([
      this.prisma.eventMessage.findMany({
        where: whereTyped,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          event: {
            select: { id: true, title: true, communityId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.eventMessage.count({ where: whereTyped }),
    ]);

    return { items, total };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { EventMessage } from '@prisma/client';

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

  /**
   * Отмечает событие как прочитанное для пользователя (upsert)
   */
  async markEventAsRead(userId: number, eventId: number): Promise<void> {
    await this.prisma.eventRead.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        userId,
        eventId,
        readAt: new Date(),
      },
    });
  }

  /**
   * Получает непрочитанные сообщения для пользователя
   */
  async getUnreadMessages(
    userId: number,
    eventId?: number,
  ): Promise<EventMessage[]> {
    // Подзапрос для получения прочитанных событий пользователя
    const readEventIds = await this.prisma.eventRead.findMany({
      where: {
        userId,
      },
      select: {
        eventId: true,
      },
    });

    const readEventIdList = readEventIds.map(read => read.eventId);

    // Получаем сообщения из событий, которые пользователь НЕ читал
    const whereClause: any = {
      // Исключаем сообщения самого пользователя
      userId: {
        not: userId,
      },
    };

    // Если указан конкретный eventId
    if (eventId) {
      // Проверяем, прочитано ли это конкретное событие
      if (readEventIdList.includes(eventId)) {
        // Если событие прочитано, возвращаем пустой массив
        return [];
      } else {
        // Если событие не прочитано, фильтруем по этому eventId
        whereClause.eventId = eventId;
      }
    } else {
      // Если eventId не указан, исключаем все прочитанные события
      whereClause.eventId = {
        notIn: readEventIdList,
      };
    }

    return this.prisma.eventMessage.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            communityId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

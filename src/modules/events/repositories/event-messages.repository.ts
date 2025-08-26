import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { AddMessageDto } from '../dto/add-message.dto';
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

  async addMessage(dto: AddMessageDto): Promise<EventMessage> {
    return this.prisma.eventMessage.create({
      data: {
        text: dto.text,
        userId: dto.userId,
        eventId: dto.eventId,
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
   * Отмечает событие как прочитанное для пользователя с использованием DTO
   */
  async markEventAsReadWithDto(userId: number, eventId: number): Promise<void> {
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

    // Получаем ID сообществ, членом которых является пользователь
    const userCommunities = await this.prisma.usersOnCommunities.findMany({
      where: {
        userId,
      },
      select: {
        communityId: true,
      },
    });

    const userCommunityIds = userCommunities.map(uc => uc.communityId);

    // Если у пользователя нет сообществ, возвращаем пустой массив
    if (userCommunityIds.length === 0) {
      return [];
    }

    // Получаем сообщения из событий, которые пользователь НЕ читал
    const whereClause: any = {
      // Исключаем сообщения самого пользователя
      userId: {
        not: userId,
      },
      // Фильтруем только по событиям из сообществ пользователя
      event: {
        communityId: {
          in: userCommunityIds,
        },
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

  /**
   * Получает группированные непрочитанные сообщения по событиям
   */
  async getUnreadMessagesGroupedByEvent(
    userId: number,
    eventId?: number,
  ): Promise<{ count: Record<string, number>; EVENT: number; NOTIFICATION: number }> {
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

    // Получаем ID сообществ, членом которых является пользователь
    const userCommunities = await this.prisma.usersOnCommunities.findMany({
      where: {
        userId,
      },
      select: {
        communityId: true,
      },
    });

    const userCommunityIds = userCommunities.map(uc => uc.communityId);

    // Если у пользователя нет сообществ, возвращаем пустой результат
    if (userCommunityIds.length === 0) {
      return {
        count: {},
        EVENT: 0,
        NOTIFICATION: 0,
      };
    }

    // Получаем сообщения из событий, которые пользователь НЕ читал
    const whereClause: any = {
      // Исключаем сообщения самого пользователя
      userId: {
        not: userId,
      },
      // Фильтруем только по событиям из сообществ пользователя
      event: {
        communityId: {
          in: userCommunityIds,
        },
      },
    };

    // Если указан конкретный eventId
    if (eventId) {
      // Проверяем, прочитано ли это конкретное событие
      if (readEventIdList.includes(eventId)) {
        // Если событие прочитано, возвращаем пустой результат
        return {
          count: {},
          EVENT: 0,
          NOTIFICATION: 0,
        };
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

    // Группируем сообщения по eventId и считаем количество
    const groupedMessages = await this.prisma.eventMessage.groupBy({
      by: ['eventId'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // Преобразуем результат в новый формат
    const count: Record<string, number> = {};
    let totalEventMessages = 0;
    
    groupedMessages.forEach(group => {
      const eventIdStr = group.eventId.toString();
      const messageCount = group._count.id;
      count[eventIdStr] = messageCount;
      totalEventMessages += messageCount;
    });

    return {
      count,
      EVENT: totalEventMessages,
      NOTIFICATION: 0,
    };
  }
}

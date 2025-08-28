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

    // Получаем ID событий, в которых пользователь участвует
    const userParticipations = await this.prisma.usersOnEvents.findMany({
      where: {
        userId,
      },
      select: {
        eventId: true,
      },
    });

    const userEventIds = userParticipations.map(up => up.eventId);

    // Если пользователь не участвует ни в одном событии, возвращаем пустой массив
    if (userEventIds.length === 0) {
      return [];
    }

    // Получаем сообщения из событий, в которых пользователь участвует и которые он НЕ читал
    const whereClause: any = {
      // Исключаем сообщения самого пользователя
      userId: {
        not: userId,
      },
      // Фильтруем только по событиям, в которых пользователь участвует
      event: {
        id: {
          in: userEventIds,
        },
        // Учитываем только активные события
        isActive: true,
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
   * Получает группированные непрочитанные сообщения по событиям для пользователя
   */
  async getUnreadMessagesGroupedByEvent(
    userId: number,
  ): Promise<{ count: Record<string, number>; EVENT: number; NOTIFICATION: number }> {
    // Получаем события с timestamp когда пользователь их прочитал
    const readEvents = await this.prisma.eventRead.findMany({
      where: { userId },
      select: { eventId: true, readAt: true },
    });

    // Получаем события, в которых пользователь участвует
    const userParticipations = await this.prisma.usersOnEvents.findMany({
      where: { userId },
      select: { eventId: true },
    });
    const userEventIds = userParticipations.map(up => up.eventId);

    // Если пользователь не участвует ни в одном событии, возвращаем пустой результат
    if (userEventIds.length === 0) {
      return {
        count: {},
        EVENT: 0,
        NOTIFICATION: 0,
      };
    }

    // Создаем map для быстрого поиска readAt времени по eventId
    const readAtMap = new Map(
      readEvents.map(read => [read.eventId, read.readAt])
    );

    // Получаем все сообщения из событий, в которых пользователь участвует
    const messages = await this.prisma.eventMessage.findMany({
      where: {
        // Исключаем сообщения самого пользователя
        userId: { not: userId },
        // Только из событий, в которых пользователь участвует
        eventId: { in: userEventIds },
        // Только из активных событий
        event: { isActive: true },
      },
      include: {
        event: {
          select: { id: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Фильтруем сообщения: показываем только те, что созданы ПОСЛЕ readAt timestamp
    const unreadMessages = messages.filter(message => {
      const readAt = readAtMap.get(message.eventId);
      // Если событие никогда не было прочитано - все сообщения непрочитанные
      if (!readAt) return true;
      // Если сообщение создано ПОСЛЕ того как событие было прочитано - оно непрочитанное
      return message.createdAt > readAt;
    });

    // Группируем и считаем непрочитанные сообщения по типу события
    const count: Record<string, number> = {};
    let totalEventMessages = 0;
    let totalNotificationMessages = 0;

    // Группируем ТОЛЬКО непрочитанные сообщения по eventId
    const groupedByEvent = unreadMessages.reduce((acc, message) => {
      const eventId = message.eventId;
      if (!acc[eventId]) {
        acc[eventId] = {
          count: 0,
          type: message.event.type,
        };
      }
      acc[eventId].count++;
      return acc;
    }, {} as Record<number, { count: number; type: string }>);

    // Преобразуем в нужный формат и считаем по типам
    Object.entries(groupedByEvent).forEach(([eventIdStr, data]) => {
      count[eventIdStr] = data.count;
      
      if (data.type === 'EVENT') {
        totalEventMessages += data.count;
      } else if (data.type === 'NOTIFICATION') {
        totalNotificationMessages += data.count;
      }
    });

    return {
      count,
      EVENT: totalEventMessages,
      NOTIFICATION: totalNotificationMessages,
    };
  }
}

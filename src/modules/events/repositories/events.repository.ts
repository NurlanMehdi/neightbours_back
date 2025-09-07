import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { GetEventsDto } from '../dto/get-events.dto';
import { EventNotFoundException } from '../../../common/exceptions/event.exception';
import { Prisma } from '@prisma/client';
import { CreateVotingOptionDto } from '../dto/create-event.dto';
import { Event } from '@prisma/client';

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создает новое событие
   */
  async create(
    data: CreateEventDto & { createdBy: number; image?: string },
  ): Promise<any> {
    const eventData: any = {
      title: data.title,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      type: data.type as any,
      hasVoting: data.hasVoting ?? false,
      votingQuestion: data.votingQuestion,
      hasMoneyCollection: data.hasMoneyCollection ?? false,
      moneyAmount: data.moneyAmount,
      image: data.image ?? null,
      creator: { connect: { id: data.createdBy } },
      community: { connect: { id: data.communityId } },
      eventDateTime: data.eventDateTime ?? null,
    };
    // Проверяем существование категории (теперь обязательное поле)
    const category = await this.prisma.eventCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new BadRequestException(
        `Категория события с ID ${data.categoryId} не найдена`,
      );
    }
    eventData.category = { connect: { id: data.categoryId } };
    const event = await this.prisma.event.create({ data: eventData });
    const fullEvent = await this.prisma.event.findUnique({
      where: { id: event.id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            latitude: true,
            longitude: true,
            address: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                latitude: true,
                longitude: true,
                address: true,
              },
            },
          },
        },
        category: true,
        votingOptions: true,
      },
    });
    return fullEvent;
  }

  /**
   * Создает новое мероприятие с вариантами голосования (если есть)
   */
  async createWithVotingOptions(
    data: CreateEventDto & { createdBy: number; image?: string },
    votingOptions?: CreateVotingOptionDto[],
  ): Promise<any> {
    if (data.hasVoting && votingOptions && votingOptions.length > 0) {
      const eventId = await this.prisma.$transaction(async (prisma) => {
        const eventData: any = {
          title: data.title,
          description: data.description,
          latitude: data.latitude,
          longitude: data.longitude,
          type: data.type as any,
          hasVoting: data.hasVoting ?? false,
          votingQuestion: data.votingQuestion,
          hasMoneyCollection: data.hasMoneyCollection ?? false,
          moneyAmount: data.moneyAmount,
          image: data.image ?? null,
          creator: { connect: { id: data.createdBy } },
          community: { connect: { id: data.communityId } },
          eventDateTime: data.eventDateTime ?? null,
        };
        // Проверяем существование категории (теперь обязательное поле)
        const category = await prisma.eventCategory.findUnique({
          where: { id: data.categoryId },
        });
        if (!category) {
          throw new BadRequestException(
            `Категория события с ID ${data.categoryId} не найдена`,
          );
        }
        eventData.category = { connect: { id: data.categoryId } };
        const event = await prisma.event.create({ data: eventData });
        for (const option of votingOptions) {
          if (!option.text || typeof option.text !== 'string') {
            throw new BadRequestException(
              `Некорректный текст варианта голосования: ${JSON.stringify(option)}`,
            );
          }
          await prisma.votingOption.create({
            data: {
              eventId: event.id,
              text: option.text,
            },
          });
        }
        return event.id;
      });
      return this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              latitude: true,
              longitude: true,
              address: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  latitude: true,
                  longitude: true,
                  address: true,
                },
              },
            },
          },
          category: true,
          votingOptions: true,
        },
      });
    } else {
      const event = await this.create(data);
      return event;
    }
  }

  /**
   * Получает события сообщества с фильтрацией и пагинацией
   */
  async findManyByCommunity(
    communityId: number,
    filters: GetEventsDto,
  ): Promise<{ events: any[]; total: number }> {
    const { type, categoryId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      communityId,
      isActive: true,
      ...(type && { type }),
      ...(categoryId && { categoryId }),
    };

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              latitude: true,
              longitude: true,
              address: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  latitude: true,
                  longitude: true,
                  address: true,
                },
              },
            },
          },
          category: true,
          community: true,
          votingOptions: true,
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return { events, total };
  }

  /**
   * Получает событие по ID
   */
  async findById(id: number): Promise<any> {
    try {
      const event = await this.prisma.event.findFirst({
        where: {
          id,
          isActive: true,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              latitude: true,
              longitude: true,
              address: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  latitude: true,
                  longitude: true,
                  address: true,
                },
              },
            },
          },
          category: true,
          community: true,
          votingOptions: true,
        },
      });

      if (!event) {
        console.log(`Event with ID ${id} not found or not active`);
        throw new EventNotFoundException();
      }

      return event;
    } catch (error) {
      if (error instanceof EventNotFoundException) {
        throw error;
      }
      console.error(`Database error in findById for event ${id}:`, error);
      throw new Error(
        `Ошибка базы данных при поиске события: ${error.message}`,
      );
    }
  }

  /**
   * Обновляет событие
   */
  async update(id: number, data: UpdateEventDto): Promise<any> {
    const { categoryId, communityId, votingOptions, eventDateTime, ...rest } =
      data;
    const updateData: any = { ...rest };
    if (eventDateTime !== undefined) {
      updateData.eventDateTime = eventDateTime;
    }

    // Обработка категории
    if (categoryId !== undefined) {
      if (categoryId === null) {
        updateData.category = { disconnect: true };
      } else {
        updateData.category = { connect: { id: categoryId } };
      }
    }

    // Обработка сообщества
    if (communityId !== undefined) {
      updateData.community = { connect: { id: communityId } };
    }

    // Обработка голосования
    if (data.hasVoting !== undefined) {
      if (data.hasVoting === false) {
        // Если голосование отключено, удаляем все связанные данные
        updateData.votingQuestion = null;
        updateData.votingOptions = { deleteMany: {} };
      } else if (
        data.hasVoting === true &&
        votingOptions &&
        votingOptions.length > 0
      ) {
        // Если голосование включено и есть варианты, обновляем их
        const validOptions = votingOptions.filter(
          (option) => option.text && typeof option.text === 'string',
        );

        if (validOptions.length < 2) {
          throw new BadRequestException(
            'Необходимо указать минимум 2 корректных варианта ответа',
          );
        }

        updateData.votingOptions = {
          deleteMany: {},
          create: validOptions.map((option) => ({
            text: option.text,
          })),
        };
      }
    }

    await this.prisma.event.update({
      where: { id },
      data: updateData,
    });

    return this.findById(id);
  }

  /**
   * Удаляет событие
   */
  async delete(id: number): Promise<void> {
    await this.prisma.event.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Проверяет, является ли пользователь участником сообщества
   */
  async isUserInCommunity(
    userId: number,
    communityId: number,
  ): Promise<boolean> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      include: { users: true },
    });

    if (!community) {
      return false;
    }

    return community.users.some((user) => user.userId === userId);
  }

  /**
   * Проверяет права доступа к событию
   */
  async checkEventAccess(userId: number, eventId: number): Promise<boolean> {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        isActive: true,
      },
      include: {
        creator: true,
      },
    });

    if (!event) {
      throw new EventNotFoundException();
    }

    if (event.createdBy === userId) {
      return true;
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    return user.role === UserRole.ADMIN;
  }

  /**
   * Проверяет, является ли пользователь участником события
   */
  async isUserParticipant(userId: number, eventId: number): Promise<boolean> {
    const participant = await this.prisma.usersOnEvents.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    return !!participant;
  }

  /**
   * Добавляет пользователя в участники события
   */
  async addParticipant(userId: number, eventId: number): Promise<void> {
    await this.prisma.usersOnEvents.create({
      data: {
        userId,
        eventId,
      },
    });
  }

  /**
   * Удаляет пользователя из участников события
   */
  async removeParticipant(userId: number, eventId: number): Promise<void> {
    await this.prisma.usersOnEvents.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });
  }

  /**
   * Получает все события с фильтрами и пагинацией (для админ-панели)
   */
  async findAllWithPaginationForAdmin(
    query: import('../dto/get-events-admin.dto').GetEventsAdminDto,
  ): Promise<{ data: any[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      communityId,
      categoryId,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query as any;

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };
    if (search) {
      where.title = { contains: search, mode: 'insensitive' as const };
    }
    if (type) {
      where.type = type;
    }
    if (communityId) {
      where.communityId = communityId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              latitude: true,
              longitude: true,
              address: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  latitude: true,
                  longitude: true,
                  address: true,
                },
              },
            },
          },
          category: true,
          community: true,
          votingOptions: true,
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Получает события, созданные пользователем
   */
  async findUserEvents(
    userId: number,
    filters: any,
  ): Promise<{ data: any[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      communityId,
      categoryId,
      dateFrom,
      dateTo,
      includeParticipating,
    } = filters;
    const skip = (page - 1) * limit;

    // Базовые условия для поиска событий пользователя
    const where: any = {
      isActive: true,
    };

    // Если включен параметр includeParticipating, то ищем события где пользователь создатель ИЛИ участник
    if (includeParticipating) {
      where.OR = [
        { createdBy: userId },
        {
          participants: {
            some: {
              userId: userId,
            },
          },
        },
      ];
    } else {
      // По умолчанию только события, созданные пользователем
      where.createdBy = userId;
    }

    // Добавляем фильтры
    if (search) {
      where.title = { contains: search, mode: 'insensitive' as const };
    }

    if (type) {
      where.type = type;
    }

    if (communityId) {
      where.communityId = communityId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              latitude: true,
              longitude: true,
              address: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  latitude: true,
                  longitude: true,
                  address: true,
                },
              },
            },
          },
          category: true,
          community: true,
          votingOptions: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.event.count({ where }),
    ]);

    return { data, total };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Community } from '@prisma/client';
import {
  GetCommunitiesAdminDto,
  CommunitySortBy,
  SortOrder,
} from '../dto/get-communities-admin.dto';
import { UserAlreadyMemberException } from '../../../common/exceptions/community.exception';

@Injectable()
export class CommunityRepository {
  private readonly logger = new Logger(CommunityRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip: number, limit: number) {
    return this.prisma.community.findMany({
      where: {
        isActive: true,
      },
      skip: skip,
      take: limit,
      orderBy: { id: 'asc' },
      include: {
        creator: true,
        users: true,
      },
    });
  }

  async findAllWithFilters(filters: GetCommunitiesAdminDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = CommunitySortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = filters;
    const skip = (page - 1) * limit;

    // Строим условия фильтрации
    const where: any = {
      isActive: true, // Фильтруем только активные сообщества
    };

    // Поиск по названию
    if (filters.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    // Фильтр по датам
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
      }
    }

    // Примечание: Фильтрация по количеству участников и размеру сообщества
    // будет обрабатываться на уровне приложения после получения данных
    // так как Prisma не поддерживает агрегированные условия в where

    // Определяем поле для сортрации
    const orderBy: any = {};
    switch (sortBy) {
      case CommunitySortBy.ID:
        orderBy.id = sortOrder.toLowerCase();
        break;
      case CommunitySortBy.NAME:
        orderBy.name = sortOrder.toLowerCase();
        break;
      case CommunitySortBy.CREATED_AT:
        orderBy.createdAt = sortOrder.toLowerCase();
        break;
      case CommunitySortBy.NUMBER_OF_USERS:
        // Prisma не поддерживает сортировку по агрегированным полям
        // Используем сортировку по дате создания как fallback
        orderBy.createdAt = sortOrder.toLowerCase();
        break;
      default:
        orderBy.createdAt = sortOrder.toLowerCase();
    }

    this.logger.log(
      `Репозиторий: получение сообществ с фильтрами: ${JSON.stringify(filters)}`,
    );

    return this.prisma.community.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        creator: true,
        users: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async count() {
    return this.prisma.community.count({
      where: {
        isActive: true,
      },
    });
  }

  /**
   * Получение всех сообществ с минимальной информацией
   * @returns Список сообществ с id и названием
   */
  async findAllMinimal() {
    this.logger.log(
      'Репозиторий: получение всех сообществ с минимальной информацией.',
    );
    return this.prisma.community.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Поиск сообщества по ID пользователя
   * @param userId ID пользователя
   * @returns Сообщество
   */
  async findByUserId(userId: number): Promise<Community | null> {
    this.logger.log(
      `Репозиторий: поиск сообщества по ID пользователя: ${userId}.`,
    );
    return this.prisma.community.findFirst({
      where: {
        isActive: true,
        users: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        creator: true,
      },
    });
  }

  /**
   * Поиск сообщества по коду для вступления
   * @param code Код для вступления
   * @returns Сообщество
   */
  async findByJoinCode(code: string): Promise<Community | null> {
    this.logger.log(`Репозиторий: поиск сообщества по коду: ${code}.`);
    return this.prisma.community.findFirst({
      where: {
        isActive: true,
        joinCode: code,
      },
      include: {
        creator: true,
      },
    });
  }

  /**
   * Поиск сообщества по ID
   * @param id ID сообщества
   * @returns Сообщество
   */
  async findById(id: number): Promise<Community | null> {
    this.logger.log(`Репозиторий: поиск сообщества по ID: ${id}.`);
    return this.prisma.community.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: {
        creator: true,
      },
    });
  }

  /**
   * Находит сообщество по ID со всеми связями для администратора
   * @param id Идентификатор сообщества
   * @returns Сообщество со всеми связанными данными
   */
  async findByIdForAdmin(id: number): Promise<Community | null> {
    this.logger.log(
      `Репозиторий: поиск сообщества с полной информацией для админа с id: ${id}.`,
    );
    return this.prisma.community.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                role: true,
                status: true,
                avatar: true,
                createdAt: true,
                Properties: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    verificationStatus: true,
                    verifications: {
                      select: {
                        userId: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        events: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  /**
   * Создание нового сообщества
   * @param data Данные сообщества
   * @returns Созданное сообщество
   */
  async create(data: {
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdBy: number;
  }): Promise<Community> {
    this.logger.log(`Репозиторий: создание сообщества: ${data.name}.`);
    return this.prisma.community.create({
      data: {
        name: data.name,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status,
        createdBy: data.createdBy,
        joinCode: Math.floor(100000 + Math.random() * 900000).toString(),
      },
    });
  }

  /**
   * Добавление пользователя в сообщество
   * @param communityId ID сообщества
   * @param userId ID пользователя
   */
  async addUser(communityId: number, userId: number): Promise<void> {
    this.logger.log(
      `Репозиторий: добавление пользователя ${userId} в сообщество ${communityId}.`,
    );

    const existingMembership = await this.prisma.usersOnCommunities.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    });

    if (existingMembership) {
      this.logger.warn(
        `Пользователь ${userId} уже является участником сообщества ${communityId}.`,
      );
      throw new UserAlreadyMemberException();
    }

    await this.prisma.usersOnCommunities.create({
      data: {
        communityId,
        userId,
      },
    });
  }

  /**
   * Обновление данных сообщества
   * @param id ID сообщества
   * @param data Данные для обновления
   * @returns Обновленное сообщество
   */
  async update(id: number, data: Partial<Community>): Promise<Community> {
    this.logger.log(`Репозиторий: обновление сообщества ${id}.`);
    return this.prisma.community.update({
      where: {
        id,
      },
      data,
    });
  }

  /**
   * Получение пользователей сообщества
   * @param communityId ID сообщества
   * @returns Список пользователей сообщества
   */
  async getCommunityUsers(communityId: number) {
    this.logger.log(
      `Репозиторий: получение пользователей сообщества ${communityId}.`,
    );
    return this.prisma.usersOnCommunities.findMany({
      where: {
        communityId,
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

  /**
   * Мягкое удаление сообщества (установка isActive = false)
   * @param id ID сообщества
   * @returns Обновленное сообщество
   */
  async softDelete(id: number): Promise<Community> {
    this.logger.log(`Репозиторий: мягкое удаление сообщества ${id}.`);
    return this.prisma.community.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });
  }
}

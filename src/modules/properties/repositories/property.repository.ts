import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  PropertyCategory,
  PropertyVerificationStatus,
  Prisma,
} from '@prisma/client';
import { GetPropertiesAdminDto } from '../dto/get-properties-admin.dto';

@Injectable()
export class PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создает новый объект недвижимости
   */
  async create(data: {
    name: string;
    category: PropertyCategory;
    latitude: number;
    longitude: number;
    photo?: string;
    userId: number;
  }) {
    return this.prisma.property.create({
      data: {
        name: data.name,
        category: data.category,
        latitude: data.latitude,
        longitude: data.longitude,
        photo: data.photo || '',
        userId: data.userId,
      } as any,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            Communities: {
              select: {
                community: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        verifications: {
          select: {
            userId: true,
          },
        },
      },
    });
  }

  /**
   * Получает список объектов с пагинацией и фильтрами
   */
  async findAllWithPagination(query: GetPropertiesAdminDto) {
    const {
      page = 1,
      limit = 50,
      search,
      category,
      type,
      isVerified,
      communityId,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true, // Фильтруем только активные объекты
    };

    if (search) {
      where.OR = [
        {
          name: { contains: search, mode: 'insensitive' },
        },
        {
          user: {
            firstName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          user: {
            lastName: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Используем category или type (type как alias для category)
    const categoryFilter = category || type;
    if (categoryFilter) {
      where.category = categoryFilter;
    }

    // Фильтрация по статусу верификации пользователя
    if (isVerified !== undefined) {
      if (!where.user) {
        where.user = {};
      }
      where.user.isVerified = isVerified;
    }

    // Фильтрация по сообществу
    if (communityId) {
      if (!where.user) {
        where.user = {};
      }
      where.user.Communities = {
        some: {
          communityId: communityId,
        },
      };
    }

    // Фильтрация по датам создания
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    // Определяем поле для сортировки
    const orderBy: any = {};
    const sortOrderValue =
      sortOrder.toUpperCase() === 'ASC'
        ? Prisma.SortOrder.asc
        : Prisma.SortOrder.desc;

    switch (sortBy) {
      case 'id':
        orderBy.id = sortOrderValue;
        break;
      case 'category':
        orderBy.category = sortOrderValue;
        break;
      case 'createdAt':
        orderBy.createdAt = sortOrderValue;
        break;
      case 'confirmations':
        // Пока сортируем по ID, так как логика подтверждений не реализована
        orderBy.id = sortOrderValue;
        break;
      default:
        orderBy.createdAt = sortOrderValue;
    }

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              isVerified: true,
              Communities: {
                select: {
                  community: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          verifications: {
            select: {
              userId: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      properties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Получает объект по ID
   */
  async findById(id: number) {
    return this.prisma.property.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            isVerified: true,
            Communities: {
              select: {
                community: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        verifications: {
          select: {
            userId: true,
          },
        },
      },
    });
  }

  /**
   * Получает все объекты недвижимости пользователя
   */
  async findByUserId(userId: number) {
    return this.prisma.property.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        verifications: {
          select: {
            userId: true,
          },
        },
      },
    });
  }

  /**
   * Обновляет объект недвижимости
   */
  async update(
    id: number,
    userId: number,
    data: {
      name?: string;
      category?: PropertyCategory;
      latitude?: number;
      longitude?: number;
      photo?: string;
    },
  ) {
    return this.prisma.property.update({
      where: {
        id,
        userId, // Проверяем, что объект принадлежит пользователю
      },
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            Communities: {
              select: {
                community: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        verifications: {
          select: {
            userId: true,
          },
        },
      },
    });
  }

  /**
   * Обновляет объект недвижимости администратором (без проверки владельца)
   */
  async updateByAdmin(
    id: number,
    data: {
      name?: string;
      category?: PropertyCategory;
      latitude?: number;
      longitude?: number;
      photo?: string;
      userId?: number;
      verificationStatus?: PropertyVerificationStatus;
    },
  ) {
    return this.prisma.property.update({
      where: {
        id, // Только по ID, без проверки владельца
      },
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            Communities: {
              select: {
                community: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        verifications: {
          select: {
            userId: true,
          },
        },
      },
    });
  }

  /**
   * Удаляет объект недвижимости
   */
  async delete(id: number, userId: number) {
    return this.prisma.property.delete({
      where: {
        id,
        userId, // Проверяем, что объект принадлежит пользователю
      },
    });
  }

  /**
   * Получает объект недвижимости по ID с проверкой принадлежности пользователю
   */
  async findByIdAndUserId(id: number, userId: number) {
    return this.prisma.property.findFirst({
      where: {
        id,
        userId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            Communities: {
              select: {
                community: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        verifications: {
          select: {
            userId: true,
          },
        },
      },
    });
  }

  /**
   * Получает объекты недвижимости, принадлежащие сообществу
   */
  async findByCommunityId(communityId: number, category?: PropertyCategory) {
    const where: any = {
      isActive: true, // Фильтруем только активные объекты
      user: {
        Communities: {
          some: {
            communityId: communityId,
          },
        },
      },
    };

    if (category) {
      where.category = category;
    }

    return this.prisma.property.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        verifications: {
          select: {
            userId: true,
          },
        },
      },
    });
  }

  /**
   * Получает объект с подтверждениями
   */
  async findByIdWithVerifications(id: number) {
    return this.prisma.property.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        verifications: {
          select: {
            userId: true,
          },
        },
      },
    });
  }

  /**
   * Проверяет, подтверждал ли пользователь объект
   */
  async hasUserVerified(propertyId: number, userId: number): Promise<boolean> {
    const verification = await this.prisma.propertyVerification.findUnique({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
    });
    return !!verification;
  }

  /**
   * Возвращает запись подтверждения объекта пользователем (для получения даты)
   */
  async findUserVerification(
    propertyId: number,
    userId: number,
  ): Promise<{ createdAt: Date } | null> {
    return this.prisma.propertyVerification.findUnique({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
      select: { createdAt: true },
    });
  }

  /**
   * Добавляет подтверждение объекта
   */
  async addVerification(propertyId: number, userId: number) {
    return this.prisma.propertyVerification.create({
      data: {
        propertyId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Получает количество подтверждений объекта
   */
  async getVerificationCount(propertyId: number): Promise<number> {
    return this.prisma.propertyVerification.count({
      where: { propertyId },
    });
  }

  /**
   * Обновляет статус подтверждения объекта
   */
  async updateVerificationStatus(
    propertyId: number,
    status: 'UNVERIFIED' | 'VERIFIED',
  ) {
    return this.prisma.property.update({
      where: { id: propertyId },
      data: { verificationStatus: status },
    });
  }

  /**
   * Получает все чужие неподтвержденные объекты недвижимости
   * @param userId ID текущего пользователя
   * @returns Список чужих неподтвержденных объектов недвижимости
   */
  async findUnverifiedOthers(userId: number) {
    return this.prisma.property.findMany({
      where: {
        isActive: true,
        NOT: { userId },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        verifications: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Мягкое удаление объекта недвижимости (установка isActive = false)
   * @param id ID объекта недвижимости
   * @returns Обновленный объект недвижимости
   */
  async softDelete(id: number) {
    return this.prisma.property.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Получает объекты недвижимости, подтвержденные пользователем
   */
  async findUserVerifications(
    userId: number,
    filters: any,
  ): Promise<{ data: any[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      isVerified,
      dateFrom,
      dateTo,
    } = filters;
    const skip = (page - 1) * limit;

    // Базовые условия для поиска подтверждений пользователя
    const where: any = {
      verifications: {
        some: {
          userId: userId,
        },
      },
      isActive: true,
    };

    // Добавляем фильтры
    if (search) {
      where.name = { contains: search, mode: 'insensitive' as const };
    }

    if (category) {
      where.category = category;
    }

    // Удаляем фильтрацию по verificationStatus из базы данных
    // Статус будет рассчитываться динамически в сервисе
    // if (isVerified !== undefined) {
    //   where.verificationStatus = isVerified ? 'VERIFIED' : 'UNVERIFIED';
    // }

    // Обработка фильтра по датам
    if (dateFrom || dateTo) {
      where.verifications = {
        some: {
          userId: userId,
          createdAt: {},
        },
      };
      if (dateFrom) {
        where.verifications.some.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.verifications.some.createdAt.lte = new Date(dateTo);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          verifications: {
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.property.count({ where }),
    ]);

    return { data, total };
  }
}

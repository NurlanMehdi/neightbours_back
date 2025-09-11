import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAdminDto } from '../dto/create.admin.dto';
import {
  BlockingAlreadyInactiveException,
  BlockingNotFoundException,
  UserAlreadyUnblockedException,
  UserNotFoundException,
} from '../../../common/exceptions/user.exception';
import { Users, Blocking } from '@prisma/client';
import { CreateUserAdminDto } from '../dto/create-user-admin.dto';
import {
  GetUsersAdminDto,
  UserSortBy,
  SortOrder,
} from '../dto/get-users-admin.dto';

type UserWithBlocking = Users & {
  Blocking?: Blocking[];
  Communities?: { community: any }[];
  deletionScheduledAt?: Date | null;
};

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Находит пользователя по номеру телефона.
   * @param phone Номер телефона пользователя (только цифры).
   * @returns Найденный пользователь или null.
   */
  async findByPhone(phone: string): Promise<UserWithBlocking | null> {
    this.logger.log(`Репозиторий: поиск пользователя по телефону: ${phone}.`);
    return this.prisma.users.findUnique({
      where: { phone },
      include: {
        Blockings: true,
        Communities: {
          include: {
            community: {
              include: {
                creator: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Находит пользователя по id.
   * @param id Идентификатор пользователя.
   * @returns Найденный пользователь или null.
   */
  async findById(id: number): Promise<UserWithBlocking | null> {
    this.logger.log(`Репозиторий: поиск пользователя с id: ${id}.`);
    return this.prisma.users.findUnique({
      where: { id },
      include: {
        Blockings: true,
        Communities: {
          include: {
            community: {
              include: {
                creator: true,
              },
            },
          },
        },
        Properties: {
          include: {
            verifications: {
              select: {
                userId: true,
              },
            },
          },
        },
        familyType: true,
      },
    });
  }

  /**
   * Создаёт нового пользователя.
   * @param data Данные для создания пользователя.
   * @returns Созданный пользователь.
   */
  async createUser(data: {
    phone: string;
    smsCode: string;
    smsCodeExpiresAt: Date;
  }) {
    this.logger.log('Репозиторий: создание нового пользователя.');
    return this.prisma.users.create({
      data,
    });
  }

  async createAdmin(dto: CreateAdminDto) {
    return this.prisma.users.create({
      data: {
        ...dto,
      },
    });
  }

  /**
   * Обновляет данные пользователя.
   * @param id Идентификатор пользователя.
   * @param data Данные для обновления.
   * @returns Обновлённый пользователь.
   */
  async update(id: number, data: any): Promise<UserWithBlocking> {
    this.logger.log(`Репозиторий: обновление пользователя с id: ${id}.`);
    return this.prisma.users.update({
      where: { id },
      data,
      include: {
        Blockings: true,
        Communities: {
          include: {
            community: {
              include: {
                creator: true,
              },
            },
          },
        },
        familyType: true,
      },
    });
  }

  /**
   * Обновляет роль пользователя.
   * @param id Идентификатор пользователя.
   * @param role Новая роль пользователя.
   * @returns Обновлённый пользователь.
   */
  async updateRole(id: number, role: any) {
    this.logger.log(`Репозиторий: обновление роли пользователя с id: ${id}.`);
    return this.prisma.users.update({
      where: { id },
      data: { role },
      include: {
        Blockings: true,
      },
    });
  }

  /**
   * Обновляет SMS код пользователя.
   * @param id Идентификатор пользователя.
   * @param smsCode Новый SMS код.
   * @param smsCodeExpiresAt Время истечения SMS кода.
   * @returns Обновлённый пользователь.
   */
  async updateSmsCode(id: number, code: string, expiresAt: Date) {
    this.logger.log(
      `Репозиторий: обновление SMS кода пользователя с id: ${id}.`,
    );
    return this.prisma.users.update({
      where: { id },
      data: {
        smsCode: code,
        smsCodeExpiresAt: expiresAt,
      },
    });
  }

  /**
   * Подтверждает пользователя.
   * @param id Идентификатор пользователя.
   * @returns Обновлённый пользователь.
   */
  async verifyUser(id: number) {
    this.logger.log(`Репозиторий: подтверждение пользователя с id: ${id}.`);
    return this.prisma.users.update({
      where: { id },
      data: {
        isVerified: true,
      },
    });
  }

  /**
   * Поиск пользователя по логину (номеру телефона)
   * @param login Логин (номер телефона).
   * @returns Пользователь
   */
  async findByLogin(login: string) {
    return this.prisma.users.findUnique({
      where: { login: login },
    });
  }

  async unblockUser(userId: number, blockingId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UserNotFoundException();
    }
    if (user.status != 'BLOCKED') {
      throw new UserAlreadyUnblockedException();
    }
    const blocking = await this.prisma.blocking.findUnique({
      where: { id: blockingId },
    });
    if (!blocking) {
      throw new BlockingNotFoundException();
    }
    if (blocking.status != 'ACTIVE') {
      throw new BlockingAlreadyInactiveException();
    }
    await this.prisma.blocking.update({
      where: { id: blockingId },
      data: {
        status: 'INACTIVE',
      },
    });
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
      },
      include: {
        Blockings: true,
      },
    });
  }

  async createBlocking(userId: number, reason?: string) {
    return this.prisma.blocking.create({
      data: {
        userId: userId,
        reason,
      },
    });
  }

  async findBlocking(id: number) {
    return this.prisma.blocking.findUnique({
      where: { id: id },
    });
  }

  async updateBlocking(id: number, data: any) {
    return this.prisma.blocking.update({
      where: { id },
      data,
    });
  }

  async findAllUsers(skip: number, take: number): Promise<UserWithBlocking[]> {
    this.logger.log(
      `Репозиторий: получение списка пользователей. Пропуск: ${skip}, лимит: ${take}.`,
    );
    return this.prisma.users.findMany({
      skip,
      take,
      include: {
        Blockings: true,
        Communities: {
          include: {
            community: {
              include: {
                creator: true,
              },
            },
          },
        },
      },
    });
  }

  async countUsers() {
    return this.prisma.users.count();
  }

  async findAllUserBlockings(skip: number, limit: number) {
    return this.prisma.blocking.findMany({
      skip: skip,
      take: limit,
      orderBy: { id: 'asc' },
      include: {
        user: {
          include: {
            Blockings: true,
            Communities: {
              include: {
                community: {
                  include: {
                    creator: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async countUserBlockings() {
    return this.prisma.blocking.count();
  }

  async delete(id: number) {
    return this.prisma.users.delete({
      where: { id },
    });
  }

  /**
   * Жесткое удаление пользователя из базы данных с очисткой связанных данных
   * @param id Идентификатор пользователя
   * @returns Удаленный пользователь
   */
  async hardDelete(id: number): Promise<Users> {
    this.logger.log(`Репозиторий: жесткое удаление пользователя с id: ${id}.`);

    return this.prisma.$transaction(async (tx) => {
      await tx.blocking.deleteMany({
        where: { userId: id },
      });

      await tx.usersOnCommunities.deleteMany({
        where: { userId: id },
      });

      const admin = await tx.users.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      if (admin) {
        await tx.community.updateMany({
          where: { createdBy: id },
          data: { createdBy: admin.id },
        });
      } else {
        await tx.community.deleteMany({
          where: { createdBy: id },
        });
      }

      await tx.usersOnEvents.deleteMany({
        where: { userId: id },
      });

      if (admin) {
        await tx.event.updateMany({
          where: { createdBy: id },
          data: { createdBy: admin.id },
        });
      } else {
        const userEvents = await tx.event.findMany({
          where: { createdBy: id },
          select: { id: true },
        });

        for (const event of userEvents) {
          await tx.eventMessage.deleteMany({ where: { eventId: event.id } });
          await tx.usersOnEvents.deleteMany({ where: { eventId: event.id } });
          await tx.voting.deleteMany({ where: { eventId: event.id } });
          await tx.$executeRaw`DELETE FROM event_reads WHERE "eventId" = ${event.id}`;
          await tx.votingOption.deleteMany({ where: { eventId: event.id } });
        }

        await tx.event.deleteMany({
          where: { createdBy: id },
        });
      }

      await tx.eventMessage.deleteMany({
        where: { userId: id },
      });

      await tx.voting.deleteMany({
        where: { userId: id },
      });

      await tx.$executeRaw`DELETE FROM event_reads WHERE "userId" = ${id}`;

      await tx.propertyVerification.deleteMany({
        where: { userId: id },
      });

      const userProperties = await tx.property.findMany({
        where: { userId: id },
        select: { id: true },
      });

      for (const property of userProperties) {
        await tx.propertyResource.deleteMany({
          where: { propertyId: property.id },
        });
        await tx.propertyVerification.deleteMany({
          where: { propertyId: property.id },
        });
      }

      await tx.property.deleteMany({
        where: { userId: id },
      });

      return tx.users.delete({
        where: { id },
      });
    });
  }

  /**
   * Массовое жесткое удаление пользователей из базы данных
   * @param ids Массив ID пользователей для удаления
   * @returns Количество удаленных записей
   */
  async bulkHardDelete(ids: number[]): Promise<number> {
    this.logger.log(
      `Репозиторий: массовое жесткое удаление пользователей с ids: ${ids.join(', ')}.`,
    );

    let deletedCount = 0;

    for (const id of ids) {
      try {
        await this.hardDelete(id);
        deletedCount++;
        this.logger.log(`Пользователь с id ${id} успешно удален`);
      } catch (error) {
        this.logger.error(
          `Ошибка при удалении пользователя с id ${id}: ${error.message}`,
        );
      }
    }

    return deletedCount;
  }

  /**
   * Проверяет существование пользователей по массиву ID
   * @param ids Массив ID пользователей
   * @returns Массив существующих ID
   */
  async findExistingIds(ids: number[]): Promise<number[]> {
    this.logger.log(
      `Репозиторий: проверка существования пользователей с ids: ${ids.join(', ')}.`,
    );
    const users = await this.prisma.users.findMany({
      where: {
        id: { in: ids },
      },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  async updateLastAccess(id: number) {
    return this.prisma.users.update({
      where: { id },
      data: {
        lastAccess: new Date(),
      },
    });
  }

  async findByEmail(email: string): Promise<UserWithBlocking | null> {
    this.logger.log(`Репозиторий: поиск пользователя по email: ${email}.`);
    return this.prisma.users.findUnique({
      where: { email },
      include: {
        Blockings: true,
      },
    });
  }

  /**
   * Создает нового пользователя администратором
   * @param dto Данные для создания пользователя
   * @returns Созданный пользователь
   */
  async createUserByAdmin(dto: CreateUserAdminDto): Promise<UserWithBlocking> {
    this.logger.log(
      'Репозиторий: создание нового пользователя администратором.',
    );

    const userData: any = {
      phone: dto.phone,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      middleName: dto.middleName,
      role: dto.role,
      isVerified: true,
    };

    if (dto.role === 'ADMIN') {
      userData.login = dto.login;
      userData.password = dto.password;
    }

    return this.prisma.users.create({
      data: userData,
      include: {
        Blockings: true,
      },
    });
  }

  /**
   * Находит пользователя по телефону или email
   * @param phone Номер телефона
   * @param email Email
   * @returns Найденный пользователь или null
   */
  async findByPhoneOrEmail(
    phone: string,
    email: string,
  ): Promise<UserWithBlocking | null> {
    this.logger.log(
      `Репозиторий: поиск пользователя по телефону: ${phone} или email: ${email}.`,
    );
    return this.prisma.users.findFirst({
      where: {
        OR: [{ phone }, { email }],
      },
      include: {
        Blockings: true,
      },
    });
  }

  /**
   * Получение пользователей с фильтрацией для администратора
   * @param filters Параметры фильтрации, сортировки и пагинации
   * @returns Список пользователей
   */
  async findAllWithFilters(filters: GetUsersAdminDto) {
    const { sortBy = UserSortBy.CREATED_AT, sortOrder = SortOrder.DESC } =
      filters;

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
      }
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
      this.logger.log(
        `Применяем фильтр isVerified: ${filters.isVerified}, тип: ${typeof filters.isVerified}`,
      );
    }

    let orderBy: any = {};
    switch (sortBy) {
      case UserSortBy.ID:
        orderBy.id = sortOrder.toLowerCase();
        break;
      case UserSortBy.NAME:
        orderBy = [
          { firstName: sortOrder.toLowerCase() },
          { lastName: sortOrder.toLowerCase() },
        ];
        break;
      case UserSortBy.PHONE:
        orderBy.phone = sortOrder.toLowerCase();
        break;
      case UserSortBy.CREATED_AT:
        orderBy.createdAt = sortOrder.toLowerCase();
        break;
      default:
        orderBy.createdAt = sortOrder.toLowerCase();
    }

    this.logger.log(
      `Репозиторий: получение пользователей с фильтрами: ${JSON.stringify(filters)}`,
    );
    this.logger.log(
      `Репозиторий: условия фильтрации: ${JSON.stringify(where)}`,
    );

    return this.prisma.users.findMany({
      where,
      orderBy,
      include: {
        Blockings: true,
        Communities: {
          include: {
            community: {
              include: {
                creator: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Проверяет, принадлежит ли пользователь к сообществу.
   * @param userId Идентификатор пользователя.
   * @param communityId Идентификатор сообщества.
   * @returns true, если пользователь принадлежит к сообществу, иначе false.
   */
  async isUserInCommunity(
    userId: number,
    communityId: number,
  ): Promise<boolean> {
    const userInCommunity = await this.prisma.usersOnCommunities.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    });
    return !!userInCommunity;
  }

  /**
   * Находит пользователя по ID со всеми связями для администратора
   * @param id Идентификатор пользователя
   * @returns Пользователь со всеми связанными данными
   */
  async findByIdForAdmin(id: number): Promise<UserWithBlocking | null> {
    this.logger.log(
      `Репозиторий: поиск пользователя с полной информацией для админа с id: ${id}.`,
    );
    return this.prisma.users.findUnique({
      where: { id },
      include: {
        Blockings: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        Communities: {
          include: {
            community: {
              include: {
                creator: true,
                users: {
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
            },
          },
        },
        Properties: {
          include: {
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
        },
        CreatedCommunities: {
          include: {
            users: {
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
        },
        familyType: true,
      },
    });
  }

  /**
   * Очищает FCM токен у всех пользователей, кроме указанного
   * @param currentUserId ID текущего пользователя (исключается из очистки)
   * @param fcmToken FCM токен для очистки
   */
  async clearFcmTokenFromOtherUsers(
    currentUserId: number,
    fcmToken: string,
  ): Promise<void> {
    this.logger.log(
      `Репозиторий: очистка FCM токена "${fcmToken}" у других пользователей, кроме ${currentUserId}`,
    );

    try {
      const result = await this.prisma.users.updateMany({
        where: {
          fcmToken: fcmToken,
          id: {
            not: currentUserId,
          },
        },
        data: {
          fcmToken: null,
          pushNotificationsEnabled: false,
        },
      });

      this.logger.log(
        `Репозиторий: очищен FCM токен у ${result.count} пользователей`,
      );
    } catch (error) {
      this.logger.error(
        `Репозиторий: ошибка при очистке FCM токена: ${error.message}`,
      );
      throw error;
    }
  }
}

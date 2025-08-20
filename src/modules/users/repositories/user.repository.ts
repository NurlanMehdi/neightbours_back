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

/**
 * Репозиторий для работы с сущностью "User".
 */
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

  /**
   * Создать администратора
   */
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
      isVerified: true, // Все пользователи, созданные админом, верифицированы
    };

    // Для администраторов добавляем логин и пароль
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

    // Строим условия фильтрации
    const where: any = {};

    // Поиск по тексту
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Фильтр по датам регистрации
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
      }
    }

    // Фильтр по статусу верификации
    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
      this.logger.log(
        `Применяем фильтр isVerified: ${filters.isVerified}, тип: ${typeof filters.isVerified}`,
      );
    }

    // Определяем поле для сортировки
    let orderBy: any = {};
    switch (sortBy) {
      case UserSortBy.ID:
        orderBy.id = sortOrder.toLowerCase();
        break;
      case UserSortBy.NAME:
        // Сортировка по имени (firstName, затем lastName)
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
   * Проверяет, принадлежит ли пользователь к сообществу
   */
  async isUserInCommunity(userId: number, communityId: number): Promise<boolean> {
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
    this.logger.log(`Репозиторий: поиск пользователя с полной информацией для админа с id: ${id}.`);
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
}

import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { CommunityRepository } from '../repositories/community.repository';
import { PaginationQueryDto } from '../../../common/models/paginated-query.dto';
import { Paginated } from '../../../common/interfaces/paginated';
import { Community } from '@prisma/client';
import { CommunityDto } from '../dto/community.dto';
import { plainToInstance } from 'class-transformer';
import { CreateCommunityAdminDto } from '../dto/create-community-admin.dto';
import { UpdateCommunityAdminDto } from '../dto/update-community-admin.dto';
import { GetCommunitiesAdminDto } from '../dto/get-communities-admin.dto';
import { CommunityMinimalDto } from '../dto/community-minimal.dto';
import { isWithinRadius } from '../../../common/utils/geo.utils';
import { CommunityCreatorException } from '../../../common/exceptions/community.exception';
import { GeoModerationService } from '../../geo-moderation/services/geo-moderation.service';
import { CommunityUserDto } from '../dto/community-user.dto';
import { CommunityFullDto } from '../dto/community-full.dto';
import { NotificationEventService } from '../../notifications/services/notification-event.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly geoModerationService: GeoModerationService,
    private readonly notificationEventService: NotificationEventService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    pagination: PaginationQueryDto,
  ): Promise<Paginated<CommunityDto>> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const [entities, total]: [Community[], number] = await Promise.all([
      this.communityRepository.findAll(skip, limit),
      this.communityRepository.count(),
    ]);
    const data = entities.map((entity) => this.buildCommunityDto(entity));
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  /**
   * Получение всех сообществ с минимальной информацией
   * @returns Список сообществ с id и названием
   */
  async findAllMinimal(): Promise<CommunityMinimalDto[]> {
    this.logger.log(
      'Сервис: получение всех сообществ с минимальной информацией.',
    );

    const entities = await this.communityRepository.findAllMinimal();

    return entities.map((entity) =>
      plainToInstance(CommunityMinimalDto, entity, {
        excludeExtraneousValues: true,
      }),
    );
  }

  /**
   * Получение списка сообществ для администратора с фильтрацией
   * @param filters Параметры фильтрации, сортировки и пагинации
   * @returns Отфильтрованный список сообществ
   */
  async findAllForAdmin(
    filters: GetCommunitiesAdminDto,
  ): Promise<Paginated<CommunityDto> | CommunityDto[]> {
    this.logger.log(
      `Сервис: получение сообществ для администратора с фильтрами: ${JSON.stringify(filters)}`,
    );

    // Получаем все сообщества без фильтрации по количеству участников
    const allEntities =
      await this.communityRepository.findAllWithFilters(filters);

    // Применяем фильтрацию по количеству участников на уровне приложения
    let filteredEntities = allEntities;

    if (
      filters.minParticipants !== undefined ||
      filters.maxParticipants !== undefined ||
      filters.size
    ) {
      filteredEntities = allEntities.filter((community) => {
        const userCount = community.users?.length || 0;

        // Фильтр по минимальному количеству участников
        if (
          filters.minParticipants !== undefined &&
          userCount < filters.minParticipants
        ) {
          return false;
        }

        // Фильтр по максимальному количеству участников
        if (
          filters.maxParticipants !== undefined &&
          userCount > filters.maxParticipants
        ) {
          return false;
        }

        // Фильтр по размеру сообщества
        if (filters.size) {
          switch (filters.size) {
            case 'small':
              if (userCount >= 20) return false;
              break;
            case 'medium':
              if (userCount < 20 || userCount > 100) return false;
              break;
            case 'large':
              if (userCount <= 100) return false;
              break;
          }
        }

        return true;
      });
    }

    // Применяем фильтрацию по радиусу
    if (
      filters.latitude !== undefined &&
      filters.longitude !== undefined &&
      filters.radius !== undefined
    ) {
      filteredEntities = filteredEntities.filter((community) => {
        return isWithinRadius(
          filters.latitude!,
          filters.longitude!,
          community.latitude,
          community.longitude,
          filters.radius!,
        );
      });
    }

    // Если запрос без пагинации, возвращаем все отфильтрованные записи
    if (filters.withoutPagination) {
      return filteredEntities.map((entity) => this.buildCommunityDto(entity));
    }

    // Применяем пагинацию
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedEntities = filteredEntities.slice(startIndex, endIndex);

    const data = paginatedEntities.map((entity) =>
      this.buildCommunityDto(entity),
    );
    const total = filteredEntities.length;
    const totalPages = Math.ceil(total / filters.limit);

    return {
      data,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
    };
  }

  /**
   * Создание нового сообщества
   * @param userId ID пользователя
   * @param name Название сообщества
   * @param latitude Широта местоположения сообщества
   * @param longitude Долгота местоположения сообщества
   * @returns Созданное сообщество с кодом для присоединения
   */
  async createCommunity(userId: number, name: string, latitude: number, longitude: number) {
    this.logger.log(
      `Сервис: создание сообщества пользователем с id: ${userId}.`,
    );

    // Создаем сообщество с координатами пользователя
    const community = await this.communityRepository.create({
      name,
      createdBy: userId,
      latitude,
      longitude,
      status: 'ACTIVE',
    });

    // Добавляем пользователя в сообщество
    await this.communityRepository.addUser(community.id, userId);

    return {
      ...community,
      joinCode: community.joinCode, // Возвращаем код для присоединения
    };
  }

  /**
   * Вступление в сообщество по коду
   * @param userId ID пользователя
   * @param code Код для вступления
   * @param userLatitude Широта местоположения пользователя
   * @param userLongitude Долгота местоположения пользователя
   * @returns Сообщество
   */
  async joinCommunity(
    userId: number,
    code: string,
    userLatitude?: number,
    userLongitude?: number,
  ) {
    this.logger.log(
      `Сервис: вступление в сообщество пользователем с id: ${userId}.`,
    );

    // Находим сообщество по коду
    const community = await this.communityRepository.findByJoinCode(code);
    if (!community) {
      throw new BadRequestException('Неверный код сообщества');
    }

    // Проверяем, не является ли пользователь создателем сообщества
    if (community.createdBy === userId) {
      throw new CommunityCreatorException();
    }

    // Проверяем расстояние с помощью гео-модерации, если переданы координаты пользователя
    if (userLatitude !== undefined && userLongitude !== undefined) {
      const geoCheck = await this.geoModerationService.checkCommunityJoin(
        userId,
        userLatitude,
        userLongitude,
        community.latitude,
        community.longitude,
      );

      if (!geoCheck.allowed) {
        this.geoModerationService.throwGeoModerationError(geoCheck);
      }
    }

    // Добавляем пользователя в сообщество
    await this.communityRepository.addUser(community.id, userId);

    // Отправляем уведомление другим участникам сообщества о новом участнике
    try {
      // Получаем информацию о пользователе для уведомления
      const newUser = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true }
      });
      
      if (newUser) {
        const userName = `${newUser.firstName} ${newUser.lastName}`;
        
        await this.notificationEventService.notifyUserJoinedCommunityToMembers({
          communityId: community.id,
          communityName: community.name,
          newUserName: userName,
          newUserId: userId,
        });
        
        this.logger.log(`Уведомления отправлены участникам сообщества ${community.id} о присоединении пользователя ${userId}`);
      }
    } catch (notificationError) {
      this.logger.error(`Ошибка отправки уведомления о присоединении к сообществу: ${notificationError.message}`);
    }

    return community;
  }

  /**
   * Генерация кода для вступления в сообщество
   * @param userId ID пользователя
   * @returns Сгенерированный код
   */
  async generateJoinCode(userId: number): Promise<string> {
    this.logger.log(
      `Сервис: генерация кода для вступления в сообщество пользователем с id: ${userId}.`,
    );

    // Проверяем, состоит ли пользователь в сообществе
    const community = await this.communityRepository.findByUserId(userId);
    if (!community) {
      throw new BadRequestException('Пользователь не состоит в сообществе');
    }

    // Генерируем код из 6 случайных цифр
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Обновляем код в сообществе
    await this.communityRepository.update(community.id, {
      joinCode: code,
    });

    return code;
  }

  /**
   * Создание нового сообщества администратором
   * @param dto Данные для создания сообщества
   * @returns Созданное сообщество с кодом для присоединения
   */
  async createCommunityByAdmin(
    dto: CreateCommunityAdminDto,
  ): Promise<CommunityDto> {
    this.logger.log('Сервис: создание нового сообщества администратором.');
    const community = await this.communityRepository.create({
      name: dto.name,
      description: dto.description,
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: 'ACTIVE',
      createdBy: 1, // ID администратора
    });
    return this.buildCommunityDto(community);
  }

  /**
   * Получение пользователей сообщества
   * @param communityId ID сообщества
   * @param userId ID текущего пользователя
   * @returns Список пользователей сообщества
   */
  async getCommunityUsers(communityId: number, userId: number): Promise<CommunityUserDto[]> {
    this.logger.log(
      `Сервис: получение пользователей сообщества с id: ${communityId} пользователем ${userId}.`,
    );

    // Проверяем, существует ли сообщество
    const community = await this.communityRepository.findById(communityId);
    if (!community) {
      throw new BadRequestException('Сообщество не найдено');
    }

    // Проверяем доступ: пользователь должен быть создателем или участником сообщества
    const isCreator = community.createdBy === userId;
    
    if (!isCreator) {
      // Проверяем, является ли пользователь участником сообщества
      const userInCommunity = await this.communityRepository.findByUserId(userId);
      if (!userInCommunity || userInCommunity.id !== communityId) {
        throw new ForbiddenException('Доступ запрещен - вы не являетесь участником или создателем этого сообщества');
      }
    }
    
    const usersOnCommunities = await this.communityRepository.getCommunityUsers(communityId);

    return usersOnCommunities.map((uc) => {
      return plainToInstance(
        CommunityUserDto,
        {
          id: uc.user.id,
          firstName: uc.user.firstName,
          lastName: uc.user.lastName,
          avatar: uc.user.avatar,
        },
        {
          excludeExtraneousValues: true,
        },
      );
    });
  }

  private buildCommunityDto(community: any): CommunityDto {
    // Формируем ФИО создателя
    const createdByName = community.creator 
      ? `${community.creator.firstName} ${community.creator.lastName}`.trim()
      : 'Неизвестный пользователь';

    return plainToInstance(
      CommunityDto,
      {
        id: community.id,
        name: community.name,
        description: community.description ?? '',
        numberOfUsers: community.users?.length ?? 0,
        status: community.status,
        createdBy: createdByName,
        createdAt: community.createdAt,
        latitude: community.latitude ?? 0.0,
        longitude: community.longitude ?? 0.0,
        isPrivate: community.isPrivate,
        joinCode: community.joinCode,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  private buildCommunityFullDto(community: any): CommunityFullDto {
    return plainToInstance(
      CommunityFullDto,
      {
        id: community.id,
        name: community.name,
        description: community.description ?? '',
        status: community.status,
        creator: community.creator,
        users: community.users?.map((uc: any) => ({
          id: uc.user.id,
          firstName: uc.user.firstName,
          lastName: uc.user.lastName,
          phone: uc.user.phone,
          email: uc.user.email,
          role: uc.user.role,
          status: uc.user.status,
          avatar: uc.user.avatar,
          createdAt: uc.user.createdAt,
          properties: uc.user.Properties?.map((property: any) => ({
            id: property.id,
            name: property.name,
            category: property.category,
            verificationStatus: property.verificationStatus,
            verifiedUserIds: property.verifications?.map((verification: any) => verification.userId) || [],
          })) || [],
        })) || [],
        events: community.events?.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          category: event.category,
          type: event.type,
          creator: event.creator,
          participants: event.participants?.map((p: any) => ({
            id: p.user.id,
            firstName: p.user.firstName,
            lastName: p.user.lastName,
          })) || [],
          createdAt: event.createdAt,
        })) || [],
        numberOfUsers: community.users?.length ?? 0,
        numberOfEvents: community.events?.length ?? 0,
        createdAt: community.createdAt,
        latitude: community.latitude ?? 0.0,
        longitude: community.longitude ?? 0.0,
        isPrivate: community.isPrivate,
        joinCode: community.joinCode,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  /**
   * Получить полную информацию о сообществе для администратора
   * @param id Идентификатор сообщества
   * @returns Сообщество со всеми связанными данными
   */
  async getCommunityForAdmin(id: number): Promise<CommunityFullDto> {
    this.logger.log(`Получение полной информации о сообществе ${id} для администратора.`);

    const community = await this.communityRepository.findByIdForAdmin(id);
    if (!community) {
      throw new BadRequestException('Сообщество не найдено.');
    }

    return this.buildCommunityFullDto(community);
  }

  /**
   * Обновление сообщества администратором
   * @param id ID сообщества
   * @param dto Данные для обновления
   * @returns Обновленное сообщество
   */
  async updateCommunityByAdmin(
    id: number,
    dto: UpdateCommunityAdminDto,
  ): Promise<CommunityDto> {
    this.logger.log(`Сервис: обновление сообщества ${id} администратором.`);

    // Проверяем существование сообщества
    const community = await this.communityRepository.findById(id);
    if (!community) {
      throw new BadRequestException('Сообщество не найдено.');
    }

    // Создаем объект с данными для обновления
    const updateData: any = {};
    
    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }
    if (dto.latitude !== undefined) {
      updateData.latitude = dto.latitude;
    }
    if (dto.longitude !== undefined) {
      updateData.longitude = dto.longitude;
    }
    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    // Обновляем сообщество
    const updatedCommunity = await this.communityRepository.update(id, updateData);
    
    return this.buildCommunityDto(updatedCommunity);
  }

  /**
   * Мягкое удаление сообщества администратором
   * @param id ID сообщества
   * @returns Успешность операции
   */
  async softDeleteCommunityByAdmin(id: number): Promise<void> {
    this.logger.log(`Сервис: мягкое удаление сообщества ${id} администратором.`);

    // Проверяем существование сообщества
    const community = await this.communityRepository.findByIdForAdmin(id);
    if (!community) {
      throw new BadRequestException('Сообщество не найдено.');
    }

    // Выполняем мягкое удаление
    await this.communityRepository.softDelete(id);
    
    this.logger.log(`Сообщество ${id} успешно мягко удалено.`);
  }
}

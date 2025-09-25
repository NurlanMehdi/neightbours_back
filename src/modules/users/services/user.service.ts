import { UserRepository } from '../repositories/user.repository';
import { UserDto } from '../dto/user.dto';
import { CreateAdminDto } from '../dto/create.admin.dto';
import * as bcrypt from 'bcryptjs';
import { BlockUserDto } from '../dto/block.user.dto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Blocking, UserRole, Users } from '@prisma/client';
import {
  BlockingAlreadyInactiveException,
  BlockingNotFoundException,
  EmailAlreadyException,
  UserAlreadyBlockedException,
  UserAlreadyUnblockedException,
  UserNotFoundException,
} from '../../../common/exceptions/user.exception';
import { PaginationQueryDto } from '../../../common/models/paginated-query.dto';
import { Paginated } from '../../../common/interfaces/paginated';
import { UserBlockingDto } from '../dto/user-blocking.dto';
import { UpdateUserDto } from '../dto/update.user.dto';
import { FilesService } from '../../files/services/files.service';
import { plainToInstance } from 'class-transformer';
import { RegistrationStep1Dto } from '../dto/registration-step1.dto';
import { RegistrationStep2Dto } from '../dto/registration-step2.dto';
import { RegistrationStep3Dto } from '../dto/registration-step3.dto';
import { RegistrationStep4Dto } from '../dto/registration-step4.dto';
import { CommunityService } from '../../communities/services/community.service';
import { CreateUserAdminDto } from '../dto/create-user-admin.dto';
import { GetUsersAdminDto } from '../dto/get-users-admin.dto';
import { PropertyDto } from '../../properties/dto/property.dto';
import { PropertyRepository } from '../../properties/repositories/property.repository';
import { EventsRepository } from '../../events/repositories/events.repository';
import { QualificationsService } from '../../qualifications/services/qualifications.service';
import { ProductsService } from '../../products/services/products.service';
import { FamilyTypesService } from '../../family-types/family-types.service';
import { GetUserVerificationsDto } from '../dto/get-user-verifications.dto';
import { UserVerificationsPaginatedDto } from '../dto/user-verifications-paginated.dto';
import { GetUserEventsDto } from '../dto/get-user-events.dto';
import { UserEventsPaginatedDto } from '../dto/user-events-paginated.dto';
import { BulkDeleteUsersDto } from '../dto/bulk-delete-users.dto';
import { DeleteResponseDto } from '../dto/delete-response.dto';
import {
  UpdateFcmTokenDto,
  PushNotificationSettingsDto,
  FcmTokenResponseDto,
} from '../dto/fcm-token.dto';
import { UserInfoDto } from '../dto/user-info.dto';
import { UserPropertyResponseDto } from '../dto/user-properties.dto';

type UserWithBlocking = Users & {
  Blocking?: Blocking[];
  Communities?: { community: any }[];
  Properties?: any[];
  CreatedCommunities?: any[];
  familyType?: any;
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly filesService: FilesService,
    private readonly communityService: CommunityService,
    private readonly propertyRepository: PropertyRepository,
    private readonly eventsRepository: EventsRepository,
    private readonly qualificationsService: QualificationsService,
    private readonly productsService: ProductsService,
    private readonly familyTypesService: FamilyTypesService,
  ) {}

  private buildUserDto(
    user: UserWithBlocking,
    blockingId?: number | null,
  ): UserDto {
    const communities =
      user.Communities?.map((c) => ({
        id: c.community.id,
        name: c.community.name,
        description: c.community.description,
        numberOfUsers: 0, // TODO: добавить подсчет пользователей
        status: c.community.status,
        createdBy: c.community.creator
          ? `${c.community.creator.firstName || ''} ${c.community.creator.lastName || ''}`.trim()
          : 'Неизвестный пользователь',
        createdAt: c.community.createdAt,
        latitude: c.community.latitude ? Number(c.community.latitude) : null,
        longitude: c.community.longitude ? Number(c.community.longitude) : null,
        isPrivate: c.community.isPrivate,
        joinCode: c.community.joinCode,
      })) ?? [];

    const properties =
      user.Properties?.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        latitude: p.latitude,
        longitude: p.longitude,
        photo: p.photo,
        verificationStatus: p.verificationStatus,
        verificationCount: p.verifications?.length || 0,
        verifiedUserIds:
          p.verifications?.map((verification: any) => verification.userId) ||
          [],
        createdById: p.userId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })) ?? [];

    const createdCommunities =
      user.CreatedCommunities?.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        numberOfUsers: c.users?.length || 0,
        status: c.status,
        createdBy: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        createdAt: c.createdAt,
        latitude: c.latitude ? Number(c.latitude) : null,
        longitude: c.longitude ? Number(c.longitude) : null,
        isPrivate: c.isPrivate,
        joinCode: c.joinCode,
      })) ?? [];

    return plainToInstance(
      UserDto,
      {
        ...user,
        blockingId: blockingId ?? null,
        communities,
        properties,
        createdCommunities,
        familyType: (user as any).familyType,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  private buildUserDtoForStep4(
    user: UserWithBlocking,
    communityId: number,
    communityJoinCode?: string,
    communityName?: string,
    isNewCommunity?: boolean,
    blockingId?: number | null,
  ): UserDto {
    const communities =
      user.Communities?.map((c) => ({
        id: c.community.id,
        name: c.community.name,
        description: c.community.description,
        numberOfUsers: 0, // TODO: добавить подсчет пользователей
        status: c.community.status,
        createdBy: c.community.creator
          ? `${c.community.creator.firstName || ''} ${c.community.creator.lastName || ''}`.trim()
          : 'Неизвестный пользователь',
        createdAt: c.community.createdAt,
        latitude: c.community.latitude ? Number(c.community.latitude) : null,
        longitude: c.community.longitude ? Number(c.community.longitude) : null,
        isPrivate: c.community.isPrivate,
        joinCode: c.community.joinCode,
        // Добавляем дополнительные поля только к нужному сообществу
        ...(c.community.id === communityId && {
          communityJoinCode: communityJoinCode,
          communityName: communityName,
          isNewCommunity: isNewCommunity,
        }),
      })) ?? [];

    return plainToInstance(
      UserDto,
      {
        ...user,
        blockingId: blockingId ?? null,
        communities,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async findById(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }
    const blocking = (user as any).Blockings?.sort(
      (a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime(),
    )?.[0];
    return this.buildUserDto(user, blocking?.id);
  }

  /**
   * Получение информации о пользователе по id с учетом общих сообществ
   * Всегда возвращает базовую информацию; при наличии общего сообщества
   * добавляет communityId и communityName
   */
  async getUserInfoById(
    requestedUserId: number,
    currentUserId: number,
  ): Promise<UserInfoDto> {
    const requested = await this.userRepository.findBasicById(requestedUserId);
    if (!requested) {
      throw new UserNotFoundException();
    }

    // Получаем сообщества текущего пользователя
    const current = await this.userRepository.findBasicById(currentUserId);
    // Теоретически текущий пользователь всегда существует, но на всякий случай
    if (!current) {
      throw new UserNotFoundException();
    }

    const requestedCommunitiesMap = new Map<number, string>(
      (requested.Communities || []).map((c: any) => [c.community.id, c.community.name]),
    );
    const currentCommunityIds = new Set<number>(
      (current.Communities || []).map((c: any) => c.community.id),
    );

    const sharedCommunities = Array.from(requestedCommunitiesMap.entries())
      .filter(([cid]) => currentCommunityIds.has(cid))
      .map(([id, name]) => ({ id, name }));

    const latestBlockingId = requested.Blockings?.[0]?.id ?? null;

    return plainToInstance(
      UserInfoDto,
      {
        id: requested.id,
        firstName: requested.firstName ?? null,
        lastName: requested.lastName ?? null,
        email: requested.email ?? null,
        avatar: requested.avatar ?? null,
        createdAt: requested.createdAt,
        isVerified: requested.isVerified,
        gender: (requested as any).gender ?? null,
        birthDate: requested.birthDate ?? null,
        blockingId: latestBlockingId,
        ...(sharedCommunities.length > 0 && { communities: sharedCommunities }),
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Получение списка объектов недвижимости, созданных пользователем
   */
  async getUserPropertiesById(
    userId: number,
  ): Promise<UserPropertyResponseDto[]> {
    const user = await this.userRepository.findBasicById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const properties = await this.propertyRepository.findByUserId(userId);
    return properties.map((p) =>
      plainToInstance(
        UserPropertyResponseDto,
        {
          id: p.id,
          name: p.name,
          picture: (p as any).photo ?? null,
          verificationStatus: (p as any).verificationStatus,
        },
        { excludeExtraneousValues: true },
      ),
    );
  }

  async createAdmin(dto: CreateAdminDto): Promise<UserDto> {
    dto.password = await bcrypt.hash(dto.password, 10);
    dto.phone = dto.login;
    dto.role = UserRole.ADMIN;
    const user = await this.userRepository.createAdmin(dto);
    return this.buildUserDto(user);
  }

  async findAllUsers(pagination: PaginationQueryDto) {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;
    const entities = await this.userRepository.findAllUsers(skip, limit);
    const total = await this.userRepository.countUsers();
    const data = entities.map((user) => {
      const blocking = user.Blocking?.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0];
      return this.buildUserDto(user, blocking?.id);
    });
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Получение списка пользователей для администратора с фильтрацией
   * @param filters Параметры фильтрации, сортировки и пагинации
   * @returns Отфильтрованный список пользователей
   */
  async findAllForAdmin(
    filters: GetUsersAdminDto,
  ): Promise<Paginated<UserDto>> {
    this.logger.log(
      `Сервис: получение пользователей для администратора с фильтрами: ${JSON.stringify(filters)}`,
    );

    // Получаем пользователей с базовой фильтрацией (без communityId)
    const baseFilters = { ...filters };
    delete baseFilters.communityId;

    const allEntities =
      await this.userRepository.findAllWithFilters(baseFilters);
    this.logger.log(`Сервис: получено ${allEntities.length} записей из БД`);

    // Применяем фильтрацию по сообществу на уровне приложения
    let filteredEntities = allEntities;

    if (filters.communityId) {
      filteredEntities = allEntities.filter((user) => {
        const userCommunities = user.Communities || [];

        if (filters.communityId === 'none') {
          return userCommunities.length === 0;
        } else {
          const communityId = parseInt(filters.communityId);
          return userCommunities.some((uc) => uc.community.id === communityId);
        }
      });
      this.logger.log(
        `Сервис: после фильтрации по сообществу осталось ${filteredEntities.length} записей`,
      );
    }

    // Применяем пагинацию
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedEntities = filteredEntities.slice(startIndex, endIndex);
    this.logger.log(
      `Сервис: пагинация: страница ${filters.page}, лимит ${filters.limit}, индексы ${startIndex}-${endIndex}, получено ${paginatedEntities.length} записей`,
    );

    const data = paginatedEntities.map((user) => {
      const blocking = user.Blockings?.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0];
      return this.buildUserDto(user, blocking?.id);
    });

    const total = filteredEntities.length;
    const totalPages = Math.ceil(total / filters.limit);

    this.logger.log(
      `Сервис: итоговый результат: ${data.length} записей, всего ${total}, страниц ${totalPages}`,
    );

    return {
      data,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
    };
  }

  async findAllBlockings(
    pagination: PaginationQueryDto,
  ): Promise<Paginated<UserBlockingDto>> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const [entities, total]: [Blocking[], number] = await Promise.all([
      this.userRepository.findAllUserBlockings(skip, limit),
      this.userRepository.countUserBlockings(),
    ]);
    const data = entities.map((entity) => this.buildUserBlockingDto(entity));
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  async blockUser(id: number, dto: BlockUserDto): Promise<UserDto> {
    let user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException();
    }
    if (user.status != 'ACTIVE') {
      throw new UserAlreadyBlockedException();
    }
    await this.userRepository.createBlocking(user.id, dto.reason);

    user = await this.userRepository.update(id, { status: 'BLOCKED' });

    return this.buildUserDto(user);
  }

  async unblockUser(userId: number, blockingId: number) {
    let user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }
    if (user.status != 'BLOCKED') {
      throw new UserAlreadyUnblockedException();
    }
    const blocking = await this.userRepository.findBlocking(blockingId);
    if (!blocking) {
      throw new BlockingNotFoundException();
    }
    if (blocking.status != 'ACTIVE') {
      throw new BlockingAlreadyInactiveException();
    }
    await this.userRepository.updateBlocking(blockingId, {
      status: 'INACTIVE',
    });
    user = await this.userRepository.update(userId, { status: 'ACTIVE' });
    return this.buildUserDto(user);
  }

  /**
   * Обновление данных пользователя
   * @param id ID пользователя
   * @param updateUserDto Данные для обновления
   * @param avatar Файл аватара
   * @returns Обновленные данные пользователя
   */
  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
    avatar?: Express.Multer.File,
  ): Promise<UserDto> {
    this.logger.log(`Обновление пользователя с id: ${id}`);
    this.logger.log(`Полученные данные: ${JSON.stringify(updateUserDto)}`);

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // Проверяем уникальность email
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(
        updateUserDto.email,
      );
      if (existingUser) {
        throw new EmailAlreadyException();
      }
    }

    // Создаем объект с данными для обновления
    const updateData: any = {};

    // Проверяем и добавляем только изменившиеся поля
    if (
      updateUserDto.firstName !== undefined &&
      updateUserDto.firstName !== user.firstName
    ) {
      updateData.firstName = updateUserDto.firstName;
      this.logger.log(
        `Обновление firstName: "${user.firstName}" -> "${updateUserDto.firstName}"`,
      );
    }

    if (
      updateUserDto.lastName !== undefined &&
      updateUserDto.lastName !== user.lastName
    ) {
      updateData.lastName = updateUserDto.lastName;
      this.logger.log(
        `Обновление lastName: "${user.lastName}" -> "${updateUserDto.lastName}"`,
      );
    }

    if (
      updateUserDto.gender !== undefined &&
      updateUserDto.gender !== user.gender
    ) {
      updateData.gender = updateUserDto.gender;
      this.logger.log(
        `Обновление gender: "${user.gender}" -> "${updateUserDto.gender}"`,
      );
    }

    if (updateUserDto.birthDate !== undefined) {
      const newBirthDate = new Date(updateUserDto.birthDate);
      const currentBirthDate = user.birthDate;

      // Сравниваем даты, учитывая возможные различия в формате
      if (
        !currentBirthDate ||
        newBirthDate.getTime() !== currentBirthDate.getTime()
      ) {
        updateData.birthDate = newBirthDate;
        this.logger.log(
          `Обновление birthDate: "${currentBirthDate}" -> "${newBirthDate}"`,
        );
      }
    }

    if (
      updateUserDto.email !== undefined &&
      updateUserDto.email !== user.email
    ) {
      updateData.email = updateUserDto.email;
      this.logger.log(
        `Обновление email: "${user.email}" -> "${updateUserDto.email}"`,
      );
    }

    if (
      updateUserDto.familyTypeId !== undefined &&
      updateUserDto.familyTypeId !== (user as any).familyTypeId
    ) {
      // Проверяем, что указанный тип семьи существует и активен
      if (updateUserDto.familyTypeId !== null) {
        try {
          await this.familyTypesService.findById(updateUserDto.familyTypeId);
        } catch (error) {
          throw new BadRequestException(
            'Указанный тип семьи не найден или неактивен',
          );
        }
      }

      updateData.familyTypeId = updateUserDto.familyTypeId;
      this.logger.log(
        `Обновление familyTypeId: "${(user as any).familyTypeId}" -> "${updateUserDto.familyTypeId}"`,
      );
    }

    // Обрабатываем аватар
    if (avatar && avatar.filename) {
      updateData.avatar = avatar.filename;
      this.logger.log(
        `Обновление avatar: "${user.avatar}" -> "${avatar.filename}"`,
      );
    }

    // Обновляем пользователя в базе данных
    let updatedUser = user;
    if (Object.keys(updateData).length > 0) {
      this.logger.log(`Данные для обновления: ${JSON.stringify(updateData)}`);
      updatedUser = await this.userRepository.update(id, updateData);
    }

    // Обрабатываем квалификации
    if (updateUserDto.qualificationIds !== undefined) {
      this.logger.log(
        `Обновление квалификаций: ${JSON.stringify(updateUserDto.qualificationIds)}`,
      );

      // Получаем текущие квалификации пользователя
      const currentQualifications =
        await this.qualificationsService.getUserQualifications(id);
      const currentQualificationIds = currentQualifications.map((q) => q.id);

      // Находим квалификации для добавления
      const qualificationsToAdd = updateUserDto.qualificationIds.filter(
        (qId) => !currentQualificationIds.includes(qId),
      );

      // Находим квалификации для удаления
      const qualificationsToRemove = currentQualificationIds.filter(
        (qId) => !updateUserDto.qualificationIds.includes(qId),
      );

      // Добавляем новые квалификации
      for (const qualificationId of qualificationsToAdd) {
        await this.qualificationsService.addUserQualification(
          id,
          qualificationId,
        );
      }

      // Удаляем старые квалификации
      for (const qualificationId of qualificationsToRemove) {
        await this.qualificationsService.removeUserQualification(
          id,
          qualificationId,
        );
      }
    }

    // Обрабатываем продукты
    if (updateUserDto.productIds !== undefined) {
      this.logger.log(
        `Обновление продуктов: ${JSON.stringify(updateUserDto.productIds)}`,
      );

      // Получаем текущие продукты пользователя
      const currentProducts = await this.productsService.getUserProducts(id);
      const currentProductIds = currentProducts.map((p) => p.id);

      // Находим продукты для добавления
      const productsToAdd = updateUserDto.productIds.filter(
        (pId) => !currentProductIds.includes(pId),
      );

      // Находим продукты для удаления
      const productsToRemove = currentProductIds.filter(
        (pId) => !updateUserDto.productIds.includes(pId),
      );

      // Добавляем новые продукты
      for (const productId of productsToAdd) {
        await this.productsService.addUserProduct(id, productId);
      }

      // Удаляем старые продукты
      for (const productId of productsToRemove) {
        await this.productsService.removeUserProduct(id, productId);
      }
    }

    // Получаем обновленного пользователя с квалификациями и продуктами
    const finalUser = await this.userRepository.findById(id);
    return this.buildUserDto(finalUser);
  }

  private buildUserBlockingDto(entity: any): UserBlockingDto {
    return plainToInstance(
      UserBlockingDto,
      {
        id: entity.id,
        userPhone: entity.user.phone,
        userId: entity.user.id,
        reason: entity.reason,
        status: entity.status,
        blockedAt: entity.createdAt,
        user: this.buildUserDto(entity.user),
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  /**
   * Обработка первого шага регистрации
   * @param userId ID пользователя
   * @param dto Данные первого шага регистрации
   * @returns Обновленный пользователь
   */
  async handleRegistrationStep1(
    userId: number,
    dto: RegistrationStep1Dto,
  ): Promise<UserDto> {
    this.logger.log(
      `Сервис: обработка первого шага регистрации для пользователя с id: ${userId}.`,
    );

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const updatedUser = await this.userRepository.update(userId, {
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: dto.address,
      registrationStep: 2,
    });

    return this.buildUserDto(updatedUser);
  }

  /**
   * Создает нового пользователя администратором
   * @param dto - Данные для создания пользователя
   * @returns Созданный пользователь
   */
  async createUserByAdmin(dto: CreateUserAdminDto): Promise<UserDto> {
    // Проверяем уникальность телефона
    const existingUserByPhone = await this.userRepository.findByPhone(
      dto.phone,
    );
    if (existingUserByPhone) {
      throw new ConflictException(
        'Пользователь с таким телефоном уже существует',
      );
    }

    // Проверяем уникальность email, если он передан
    if (dto.email) {
      const existingUserByEmail = await this.userRepository.findByEmail(
        dto.email,
      );
      if (existingUserByEmail) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
    }

    // Для администраторов проверяем уникальность логина
    if (dto.role === UserRole.ADMIN && dto.login) {
      const existingUserByLogin = await this.userRepository.findByLogin(
        dto.login,
      );
      if (existingUserByLogin) {
        throw new ConflictException(
          'Пользователь с таким логином уже существует',
        );
      }
    }

    // Хешируем пароль только для администраторов
    if (dto.role === UserRole.ADMIN && dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.userRepository.createUserByAdmin(dto);
    return this.buildUserDto(user);
  }

  /**
   * Обработка второго шага регистрации
   * @param userId ID пользователя
   * @param dto Данные второго шага регистрации
   * @param avatar Файл аватара
   * @returns Обновленный пользователь
   */
  async handleRegistrationStep2(
    userId: number,
    dto: RegistrationStep2Dto,
    avatar?: Express.Multer.File,
  ): Promise<UserDto> {
    this.logger.log(
      `Сервис: обработка второго шага регистрации для пользователя с id: ${userId}.`,
    );

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    // Проверяем, что пользователь на правильном шаге
    if (user.registrationStep !== 2) {
      throw new BadRequestException('Неверный шаг регистрации');
    }

    if (dto.email) {
      // Проверяем уникальность email
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email уже используется');
      }
    }

    // Используем существующий метод обновления профиля
    const updateUserDto = new UpdateUserDto();
    updateUserDto.firstName = dto.firstName;
    updateUserDto.lastName = dto.lastName;
    updateUserDto.email = dto.email;

    const updatedUser = await this.updateUser(userId, updateUserDto, avatar);

    // Обновляем шаг регистрации
    const finalUpdatedUser = await this.userRepository.update(userId, {
      registrationStep: 3,
    });

    // Возвращаем обновленные данные пользователя с правильным шагом регистрации
    return this.buildUserDto(finalUpdatedUser);
  }

  /**
   * Обработка третьего шага регистрации
   * @param userId ID пользователя
   * @param dto Данные третьего шага регистрации
   * @param photo Фотография объекта
   * @returns Созданный объект недвижимости
   */
  async handleRegistrationStep3(
    userId: number,
    dto: RegistrationStep3Dto,
    photo?: Express.Multer.File,
  ): Promise<PropertyDto> {
    this.logger.log(
      `Сервис: обработка третьего шага регистрации для пользователя с id: ${userId}.`,
    );

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    // Проверяем, что пользователь на правильном шаге
    if (user.registrationStep !== 3) {
      throw new BadRequestException('Неверный шаг регистрации');
    }

    // Создаем объект недвижимости
    const createdProperty = await this.propertyRepository.create({
      name: dto.name,
      category: dto.category,
      latitude: dto.latitude,
      longitude: dto.longitude,
      photo: photo?.filename || null,
      userId: userId,
      confirmationCode: Math.floor(100000 + Math.random() * 900000).toString(),
      confirmationCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Получаем количество подтверждений для созданного объекта
    const verificationCount =
      await this.propertyRepository.getVerificationCount(createdProperty.id);

    // Обновляем шаг регистрации
    await this.userRepository.update(userId, {
      registrationStep: 4,
    });

    // Возвращаем созданный объект недвижимости
    return plainToInstance(PropertyDto, {
      id: createdProperty.id,
      name: createdProperty.name,
      picture: createdProperty.photo,
      verificationStatus: createdProperty.verificationStatus,
    });
  }

  /**
   * Обработка четвертого шага регистрации
   * @param userId ID пользователя
   * @param dto Данные четвертого шага регистрации
   * @returns Обновленный пользователь с информацией о сообществе
   */
  async handleRegistrationStep4(
    userId: number,
    dto: RegistrationStep4Dto,
  ): Promise<{ user: UserDto }> {
    this.logger.log(
      `Сервис: обработка четвертого шага регистрации для пользователя с id: ${userId}.`,
    );

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    // Проверяем, что пользователь на правильном шаге
    if (user.registrationStep !== 4) {
      throw new BadRequestException('Неверный шаг регистрации');
    }

    // Проверяем, что у пользователя есть подтвержденный объект недвижимости
    const userProperties = await this.propertyRepository.findByUserId(userId);
    if (!userProperties || userProperties.length === 0) {
      throw new BadRequestException(
        'У вас должен быть объект недвижимости для вступления в сообщество',
      );
    }

    // Проверяем, что хотя бы один объект подтвержден
    const hasVerifiedProperty = userProperties.some(
      (property: any) => property.verificationStatus === 'VERIFIED',
    );

    // if (!hasVerifiedProperty) {
    //   throw new BadRequestException('Для вступления в сообщество необходимо иметь подтвержденный объект недвижимости. Дождитесь 3 подтверждений от других пользователей.');
    // }

    let communityJoinCode: string | undefined;
    let communityName: string | undefined;
    let isNewCommunity = false;
    let communityId: number;

    // Если передан код сообщества, пытаемся вступить
    if (dto.communityCode) {
      const community = await this.communityService.joinCommunity(
        userId,
        dto.communityCode,
        dto.userLatitude,
        dto.userLongitude,
      );
      communityId = community.id;
      communityName = community.name;
      isNewCommunity = false;
    }
    // Если передано название, создаем новое сообщество
    else if (dto.communityName) {
      // Используем координаты сообщества, если переданы, иначе координаты пользователя
      const latitude = dto.communityLatitude ?? dto.userLatitude;
      const longitude = dto.communityLongitude ?? dto.userLongitude;

      const community = await this.communityService.createCommunity(
        userId,
        dto.communityName,
        latitude,
        longitude,
      );
      communityId = community.id;
      communityJoinCode = community.joinCode;
      communityName = community.name;
      isNewCommunity = true;
    } else {
      throw new BadRequestException(
        'Необходимо указать код сообщества или название нового сообщества',
      );
    }

    // Обновляем шаг регистрации
    const updatedUser = await this.userRepository.update(userId, {
      registrationStep: 5,
    });

    return {
      user: this.buildUserDtoForStep4(
        updatedUser,
        communityId,
        communityJoinCode,
        communityName,
        isNewCommunity,
      ),
    };
  }

  /**
   * Вступление в сообщество по коду
   * @param userId ID пользователя
   * @param communityCode Код сообщества
   * @param userLatitude Широта местоположения пользователя
   * @param userLongitude Долгота местоположения пользователя
   */
  async joinCommunity(
    userId: number,
    communityCode: string,
    userLatitude: number,
    userLongitude: number,
  ): Promise<void> {
    this.logger.log(
      `Сервис: вступление в сообщество пользователем с id: ${userId}.`,
    );

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    await this.communityService.joinCommunity(
      userId,
      communityCode,
      userLatitude,
      userLongitude,
    );
  }

  /**
   * Генерация кода для вступления в сообщество
   * @param userId ID пользователя
   * @returns Сгенерированный код
   */
  async generateCommunityCode(userId: number): Promise<string> {
    this.logger.log(
      `Сервис: генерация кода для вступления в сообщество пользователем с id: ${userId}.`,
    );

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    // Проверяем, что пользователь на правильном шаге
    if (user.registrationStep !== 4 && user.registrationStep !== 5) {
      throw new BadRequestException('Неверный шаг регистрации');
    }

    return this.communityService.generateJoinCode(userId);
  }

  /**
   * Получить полную информацию о пользователе для администратора
   * @param id Идентификатор пользователя
   * @returns Пользователь со всеми связанными данными
   */
  async getUserForAdmin(id: number): Promise<UserDto> {
    this.logger.log(
      `Получение полной информации о пользователе ${id} для администратора.`,
    );

    const user = await this.userRepository.findByIdForAdmin(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // Получаем квалификации и продукты пользователя
    const [qualifications, products] = await Promise.all([
      this.qualificationsService.getUserQualifications(id),
      this.productsService.getUserProducts(id),
    ]);

    const userDto = this.buildUserDto(user);

    // Добавляем квалификации и продукты к DTO
    return {
      ...userDto,
      qualifications,
      products,
    };
  }

  /**
   * Получает квалификации пользователя
   */
  async getUserQualifications(userId: number) {
    return this.qualificationsService.getUserQualifications(userId);
  }

  /**
   * Добавляет квалификацию пользователю
   */
  async addUserQualification(
    userId: number,
    qualificationId: number,
  ): Promise<void> {
    await this.qualificationsService.addUserQualification(
      userId,
      qualificationId,
    );
  }

  /**
   * Удаляет квалификацию у пользователя
   */
  async removeUserQualification(
    userId: number,
    qualificationId: number,
  ): Promise<void> {
    await this.qualificationsService.removeUserQualification(
      userId,
      qualificationId,
    );
  }

  /**
   * Получает продукты пользователя
   */
  async getUserProducts(userId: number) {
    return this.productsService.getUserProducts(userId);
  }

  /**
   * Добавляет продукт пользователю
   */
  async addUserProduct(userId: number, productId: number): Promise<void> {
    await this.productsService.addUserProduct(userId, productId);
  }

  /**
   * Удаляет продукт у пользователя
   */
  async removeUserProduct(userId: number, productId: number): Promise<void> {
    await this.productsService.removeUserProduct(userId, productId);
  }

  /**
   * Получает объекты недвижимости, подтвержденные пользователем
   */
  async getUserVerifications(
    userId: number,
    filters: GetUserVerificationsDto,
  ): Promise<UserVerificationsPaginatedDto> {
    this.logger.log(`Получение подтверждений пользователя ${userId}`);

    const { page = 1, limit = 10 } = filters;
    const { data, total } = await this.propertyRepository.findUserVerifications(
      userId,
      filters,
    );
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((property) => {
        // Находим дату подтверждения текущим пользователем
        const currentUserVerification = property.verifications?.find(
          (v: any) => v.userId === userId,
        );
        const verifiedAt = currentUserVerification?.createdAt;

        return {
          property: {
            id: property.id,
            name: property.name,
            category: property.category,
            latitude: property.latitude,
            longitude: property.longitude,
            photo: property.photo,
            verificationStatus: property.verifications?.length >= 2 ? 'VERIFIED' : 'UNVERIFIED',
            verificationCount: property.verifications?.length || 0,
            verifiedUserIds:
              property.verifications?.map(
                (verification: any) => verification.userId,
              ) || [],
            createdById: property.userId,
            createdBy: property.user
              ? `${property.user.firstName || ''} ${property.user.lastName || ''}`.trim()
              : 'Неизвестный пользователь',
            createdAt: property.createdAt,
            updatedAt: property.updatedAt,
          },
          verifiedAt: verifiedAt,
        };
      }),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Преобразует объект недвижимости в DTO
   */
  private transformPropertyToDto(property: any): UserPropertyResponseDto {
    return {
      id: property.id,
      name: property.name,
      picture: property.photo,
      verificationStatus: property.verificationStatus,
    } as UserPropertyResponseDto;
  }

  /**
   * Получает события пользователя (созданные и/или участвующие)
   */
  async getUserEvents(
    userId: number,
    filters: GetUserEventsDto,
  ): Promise<UserEventsPaginatedDto> {
    const { includeParticipating = false } = filters;
    this.logger.log(
      `Получение событий пользователя ${userId}, включая участвующие: ${includeParticipating}`,
    );

    const { page = 1, limit = 10 } = filters;
    const { data, total } = await this.eventsRepository.findUserEvents(
      userId,
      filters,
    );
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((event) => this.transformEventToDto(event)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Преобразует событие в DTO
   */
  private transformEventToDto(event: any): any {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      image: event.image,
      latitude: event.latitude,
      longitude: event.longitude,
      type: event.type,
      hasVoting: event.hasVoting,
      votingQuestion: event.votingQuestion,
      hasMoneyCollection: event.hasMoneyCollection,
      moneyAmount: event.moneyAmount,
      eventDateTime: event.eventDateTime,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      participants:
        event.participants?.map((p: any) => ({
          id: p.user.id,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          avatar: p.user.avatar,
          latitude: p.user.latitude,
          longitude: p.user.longitude,
          address: p.user.address,
        })) || [],
      votingOptions: event.votingOptions || [],
      category: event.category
        ? {
            id: event.category.id,
            name: event.category.name,
            icon: event.category.icon,
            color: event.category.color,
            type: event.category.type,
            isActive: event.category.isActive,
          }
        : undefined,
      community: event.community
        ? {
            id: event.community.id,
            name: event.community.name,
            description: event.community.description,
          }
        : undefined,
    };
  }

  /**
   * Удаление одного пользователя (жесткое удаление из БД)
   * @param id ID пользователя
   * @returns Результат операции удаления
   */
  async deleteUser(id: number): Promise<DeleteResponseDto> {
    this.logger.log(`Сервис: удаление пользователя с id: ${id}`);

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    await this.userRepository.hardDelete(id);

    return {
      success: true,
      message: 'Пользователь успешно удален',
    };
  }

  /**
   * Массовое удаление пользователей (жесткое удаление из БД)
   * @param dto DTO с массивом ID пользователей
   * @returns Результат операции удаления
   */
  async bulkDeleteUsers(dto: BulkDeleteUsersDto): Promise<DeleteResponseDto> {
    this.logger.log(
      `Сервис: массовое удаление пользователей с ids: ${dto.ids.join(', ')}`,
    );

    // Проверяем, какие пользователи существуют
    const existingIds = await this.userRepository.findExistingIds(dto.ids);

    if (existingIds.length === 0) {
      throw new UserNotFoundException();
    }

    // Выполняем массовое жесткое удаление
    const deletedCount = await this.userRepository.bulkHardDelete(existingIds);

    // Логируем несуществующие ID, если есть
    const nonExistingIds = dto.ids.filter((id) => !existingIds.includes(id));
    if (nonExistingIds.length > 0) {
      this.logger.warn(
        `Пользователи с ids ${nonExistingIds.join(', ')} не найдены`,
      );
    }

    return {
      success: true,
      message: 'Пользователи успешно удалены',
      deletedCount,
    };
  }

  async updateFcmToken(
    userId: number,
    updateFcmTokenDto: UpdateFcmTokenDto,
  ): Promise<FcmTokenResponseDto> {
    this.logger.log(`Обновление FCM токена для пользователя ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const existingUserWithToken = await this.userRepository.findByFcmToken(
      updateFcmTokenDto.fcmToken,
    );

    if (existingUserWithToken && existingUserWithToken.id !== userId) {
      this.logger.warn(
        `FCM токен уже используется пользователем ${existingUserWithToken.id}, очищаем токен у предыдущего пользователя`,
      );
      await this.userRepository.clearFcmTokenFromOtherUsers(
        updateFcmTokenDto.fcmToken,
        userId,
      );
    }

    const updateData: any = {
      fcmToken: updateFcmTokenDto.fcmToken,
    };

    if (updateFcmTokenDto.pushNotificationsEnabled !== undefined) {
      updateData.pushNotificationsEnabled =
        updateFcmTokenDto.pushNotificationsEnabled;
    }

    await this.userRepository.update(userId, updateData);

    this.logger.log(`FCM токен для пользователя ${userId} успешно обновлен`);

    return {
      message: 'FCM токен успешно обновлен',
      pushNotificationsEnabled:
        updateFcmTokenDto.pushNotificationsEnabled ??
        (user as any).pushNotificationsEnabled ??
        true,
    };
  }

  async updatePushNotificationSettings(
    userId: number,
    settings: PushNotificationSettingsDto,
  ): Promise<FcmTokenResponseDto> {
    this.logger.log(
      `Обновление настроек push-уведомлений для пользователя ${userId}`,
    );

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    await this.userRepository.update(userId, {
      pushNotificationsEnabled: settings.pushNotificationsEnabled,
    });

    this.logger.log(
      `Настройки push-уведомлений для пользователя ${userId} успешно обновлены`,
    );

    return {
      message: 'Настройки push-уведомлений успешно обновлены',
      pushNotificationsEnabled: settings.pushNotificationsEnabled ?? true,
    };
  }

  async removeFcmToken(userId: number): Promise<FcmTokenResponseDto> {
    this.logger.log(`Удаление FCM токена для пользователя ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    await this.userRepository.update(userId, {
      fcmToken: null,
      pushNotificationsEnabled: false,
    });

    this.logger.log(`FCM токен для пользователя ${userId} успешно удален`);

    return {
      message: 'FCM токен успешно удален',
      pushNotificationsEnabled: false,
    };
  }
}

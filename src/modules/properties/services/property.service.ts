import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PropertyRepository } from '../repositories/property.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { CreatePropertyAdminDto } from '../dto/create-property-admin.dto';
import { UpdatePropertyAdminDto } from '../dto/update-property-admin.dto';
import { GetPropertiesAdminDto } from '../dto/get-properties-admin.dto';
import { PropertyAdminDto } from '../dto/property-admin.dto';
import { PropertyDto } from '../dto/property.dto';
import { UpdatePropertyDto } from '../dto/update-property.dto';
import { CreatePropertyDto } from '../dto/create-property.dto';
import { GetCommunityPropertiesDto } from '../dto/get-community-properties.dto';
import { VerifyPropertyDto } from '../dto/verify-property.dto';
import { plainToInstance } from 'class-transformer';
import { isWithinRadius } from '../../../common/utils/geo.utils';
import { UserNotFoundException } from '../../../common/exceptions/user.exception';
import {
  PropertyAlreadyVerifiedException,
  PropertyOwnVerificationException,
} from '../../../common/exceptions/property.exception';
import { GeoModerationService } from '../../geo-moderation/services/geo-moderation.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/interfaces/notification.interface';
import { PropertyConfirmationService } from './property-confirmation.service';

/**
 * Параметры фильтрации чужих неподтвержденных объектов
 */
export type GetUnverifiedOthersParams = {
  userId: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
};

@Injectable()
export class PropertyService {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly userRepository: UserRepository,
    private readonly geoModerationService: GeoModerationService,
    private readonly notificationService: NotificationService,
    private readonly propertyConfirmationService: PropertyConfirmationService,
  ) {}

  /**
   * Создает новый объект недвижимости
   */
  async createProperty(
    createPropertyDto: CreatePropertyAdminDto,
    photo?: Express.Multer.File,
  ): Promise<PropertyAdminDto> {
    console.log('Service createProperty called with:', {
      createPropertyDto,
      photo,
    });
    const propertyData = {
      ...createPropertyDto,
      photo: photo?.filename || null,
    };
    console.log('Property data to create:', propertyData);
    // Generate confirmation code and expiry
    const confirmationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const confirmationCodeExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );
    const property = await this.propertyRepository.create({
      ...propertyData,
      confirmationCode,
      confirmationCodeExpiresAt,
    });
    return this.transformToAdminDto(property);
  }

  /**
   * Получает список объектов с пагинацией или без
   */
  async getProperties(query: GetPropertiesAdminDto) {
    const result = await this.propertyRepository.findAllWithPagination(query);

    let properties = result.properties.map((property) =>
      this.transformToAdminDto(property),
    );

    // Применяем фильтрацию по радиусу
    if (
      query.latitude !== undefined &&
      query.longitude !== undefined &&
      query.radius !== undefined
    ) {
      properties = properties.filter((property) => {
        return isWithinRadius(
          query.latitude!,
          query.longitude!,
          property.latitude,
          property.longitude,
          query.radius!,
        );
      });
    }

    // Если запрос без пагинации, возвращаем все отфильтрованные записи
    if (query.withoutPagination) {
      return properties;
    }

    // Пересчитываем пагинацию после фильтрации по радиусу
    if (
      query.latitude !== undefined &&
      query.longitude !== undefined &&
      query.radius !== undefined
    ) {
      const total = properties.length;
      const totalPages = Math.ceil(total / query.limit);

      // Применяем пагинацию к отфильтрованным данным
      const startIndex = (query.page - 1) * query.limit;
      const endIndex = startIndex + query.limit;
      properties = properties.slice(startIndex, endIndex);

      return {
        properties,
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
      };
    }

    return {
      ...result,
      properties,
    };
  }

  /**
   * Получает объект по ID
   */
  async getPropertyById(id: number): Promise<PropertyAdminDto> {
    const property = await this.propertyRepository.findById(id);

    if (!property) {
      throw new NotFoundException(`Объект с ID ${id} не найден`);
    }

    return this.transformToAdminDto(property);
  }

  /**
   * Получить объект по ID для пользователя с проверкой доступа по сообществам
   */
  async getPropertyByIdForUser(
    id: number,
    userId: number,
  ): Promise<PropertyDto> {
    // Проверяем существование пользователя
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    // Ищем объект
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new NotFoundException(`Объект с ID ${id} не найден`);
    }

    // Если объект принадлежит другому пользователю — проверяем общее сообщество
    if (property.userId !== userId) {
      const ownerCommunityIds =
        property.user?.Communities?.map((uc: any) => uc?.community?.id).filter(
          Boolean,
        ) || [];

      let sameCommunity = false;
      for (const communityId of ownerCommunityIds) {
        if (await this.userRepository.isUserInCommunity(userId, communityId)) {
          sameCommunity = true;
          break;
        }
      }

      if (!sameCommunity) {
        throw new ForbiddenException('Forbidden');
      }
    }

    // Преобразуем в PropertyDto и добавим verifiedAt (если текущий пользователь подтверждал)
    const dto = this.transformToUserDto(property, userId);
    const verification = await this.propertyRepository.findUserVerification(
      id,
      userId,
    );
    return { ...dto, verifiedAt: verification?.createdAt } as PropertyDto;
  }

  /**
   * Обновляет объект недвижимости администратором
   */
  async updatePropertyByAdmin(
    id: number,
    updatePropertyDto: UpdatePropertyAdminDto,
    photo?: Express.Multer.File,
  ): Promise<PropertyAdminDto> {
    console.log('updatePropertyByAdmin called with:', {
      id,
      updatePropertyDto,
      photo,
    });

    // Проверяем существование объекта
    const existingProperty = await this.propertyRepository.findById(id);
    if (!existingProperty) {
      throw new NotFoundException(`Объект с ID ${id} не найден`);
    }

    // Создаем объект только с переданными полями
    const updateData: any = {};

    if (updatePropertyDto.name !== undefined) {
      updateData.name = updatePropertyDto.name;
    }
    if (updatePropertyDto.category !== undefined) {
      updateData.category = updatePropertyDto.category;
    }
    if (updatePropertyDto.latitude !== undefined) {
      updateData.latitude = updatePropertyDto.latitude;
    }
    if (updatePropertyDto.longitude !== undefined) {
      updateData.longitude = updatePropertyDto.longitude;
    }
    if (updatePropertyDto.verificationStatus !== undefined) {
      updateData.verificationStatus = updatePropertyDto.verificationStatus;
    }
    if (updatePropertyDto.userId !== undefined) {
      // Проверяем существование нового владельца
      const newOwner = await this.userRepository.findById(
        updatePropertyDto.userId,
      );
      if (!newOwner) {
        throw new NotFoundException(
          `Пользователь с ID ${updatePropertyDto.userId} не найден`,
        );
      }
      updateData.userId = updatePropertyDto.userId;
    }
    if (photo) {
      console.log('Photo received:', photo);
      updateData.photo = photo.filename;
    } else {
      console.log('No photo received');
    }

    console.log('Final update data:', { updateData });

    // Обновляем объект администратором (без проверки владельца)
    const property = await this.propertyRepository.updateByAdmin(
      id,
      updateData,
    );

    return this.transformToAdminDto(property);
  }

  /**
   * Получает объекты недвижимости пользователя
   */
  async getUserProperties(userId: number): Promise<PropertyDto[]> {
    // Проверяем существование пользователя
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const properties = await this.propertyRepository.findByUserId(userId);
    return properties.map((property) => this.transformToUserDto(property));
  }

  /**
   * Обновляет объект недвижимости пользователя
   */
  async updateProperty(
    id: number,
    userId: number,
    updatePropertyDto: UpdatePropertyDto,
    photo?: Express.Multer.File,
  ): Promise<PropertyDto> {
    // Проверяем существование пользователя
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    // Проверяем существование объекта и принадлежность пользователю
    const existingProperty = await this.propertyRepository.findByIdAndUserId(
      id,
      userId,
    );
    if (!existingProperty) {
      throw new NotFoundException(
        `Объект с ID ${id} не найден или не принадлежит вам`,
      );
    }

    // Если объект уже VERIFIED — запрещаем любые изменения
    if (existingProperty.verificationStatus === 'VERIFIED') {
      throw new ForbiddenException('Нельзя изменять подтвержденный объект');
    }

    // Создаем объект только с переданными полями
    const updateData: any = {};

    if (updatePropertyDto.name !== undefined) {
      updateData.name = updatePropertyDto.name;
    }
    if (updatePropertyDto.category !== undefined) {
      updateData.category = updatePropertyDto.category;
    }
    if (updatePropertyDto.latitude !== undefined) {
      updateData.latitude = updatePropertyDto.latitude;
    }
    if (updatePropertyDto.longitude !== undefined) {
      updateData.longitude = updatePropertyDto.longitude;
    }
    if (photo) {
      updateData.photo = photo.filename;
    }

    const property = await this.propertyRepository.update(
      id,
      userId,
      updateData,
    );
    return this.transformToUserDto(property);
  }

  /**
   * Удаляет объект недвижимости пользователя
   */
  async deleteProperty(id: number, userId: number): Promise<void> {
    // Проверяем существование пользователя
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    // Проверяем существование объекта и принадлежность пользователю
    const existingProperty = await this.propertyRepository.findByIdAndUserId(
      id,
      userId,
    );
    if (!existingProperty) {
      throw new NotFoundException(
        `Объект с ID ${id} не найден или не принадлежит вам`,
      );
    }

    await this.propertyRepository.delete(id, userId);
  }

  /**
   * Получает объекты недвижимости, принадлежащие сообществу
   */
  async getCommunityProperties(
    query: GetCommunityPropertiesDto,
    userId: number,
  ): Promise<PropertyDto[]> {
    // Проверяем существование пользователя
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    // Проверяем принадлежность пользователя к сообществу
    const isUserInCommunity = await this.userRepository.isUserInCommunity(
      userId,
      query.communityId,
    );
    if (!isUserInCommunity) {
      throw new NotFoundException(
        `Пользователь не является участником сообщества с ID ${query.communityId}`,
      );
    }

    const properties = await this.propertyRepository.findByCommunityId(
      query.communityId,
      query.category,
    );
    let filtered = properties;

    // Применяем фильтрацию по радиусу до трансформации
    if (
      query.latitude !== undefined &&
      query.longitude !== undefined &&
      query.radius !== undefined
    ) {
      filtered = filtered.filter((p) =>
        isWithinRadius(
          query.latitude!,
          query.longitude!,
          p.latitude,
          p.longitude,
          query.radius!,
        ),
      );
    }

    return filtered.map((property) => this.transformToUserDto(property));
  }

  /**
   * Создает новый объект недвижимости для пользователя
   */
  async createUserProperty(
    userId: number,
    createPropertyDto: CreatePropertyDto,
    photo?: Express.Multer.File,
  ): Promise<PropertyDto> {
    // Проверяем существование пользователя
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    // Проверяем расстояние с помощью гео-модерации
    const geoCheck = await this.geoModerationService.checkPropertyCreation(
      userId,
      createPropertyDto.userLatitude,
      createPropertyDto.userLongitude,
      createPropertyDto.latitude,
      createPropertyDto.longitude,
    );

    if (!geoCheck.allowed) {
      this.geoModerationService.throwGeoModerationError(geoCheck);
    }

    const propertyData: any = {
      name: createPropertyDto.name,
      category: createPropertyDto.category,
      latitude: createPropertyDto.latitude,
      longitude: createPropertyDto.longitude,
      photo: photo?.filename || null,
      userId,
    };
    // Автоматически генерируем код подтверждения и срок истечения
    propertyData.confirmationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    propertyData.confirmationCodeExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    const property = await this.propertyRepository.create(propertyData);
    return this.transformToUserDto(property);
  }

  /**
   * Трансформирует данные объекта в DTO для админки
   */
  private transformToAdminDto(property: any): PropertyAdminDto {
    const ownerName =
      property.user.firstName || property.user.lastName
        ? `${property.user.firstName || ''} ${property.user.lastName || ''}`.trim()
        : 'Не указано';

    const communityName =
      property.user.Communities?.[0]?.community?.name || 'Не указано';

    // Подсчитываем количество подтверждений
    const verificationCount = property.verifications?.length || 0;
    const confirmations = `${verificationCount}/2`;

    // Определяем статус проверки на основе количества подтверждений
    const isVerified = verificationCount >= 2;

    return plainToInstance(PropertyAdminDto, {
      id: property.id,
      name: property.name,
      category: property.category,
      latitude: property.latitude,
      longitude: property.longitude,
      photo: property.photo,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      createdById: property.userId,
      userId: property.userId,
      ownerName,
      communityName,
      isVerified,
      confirmations,
    });
  }

  /**
   * Трансформирует данные объекта в DTO для пользователей
   */
  public transformToUserDto(
    property: any,
    requestingUserId?: number,
  ): PropertyDto {
    const createdBy = property.user
      ? `${property.user.firstName || ''} ${property.user.lastName || ''}`.trim()
      : '';

    // Извлекаем список ID пользователей, которые подтвердили объект
    const verifiedUserIds =
      property.verifications?.map((verification: any) => verification.userId) ||
      [];
    const verificationCount = property.verifications?.length || 0;

    // Определяем статус проверки на основе количества подтверждений
    // Статус VERIFIED только если есть минимум 2 подтверждения
    const verificationStatus =
      verificationCount >= 2 ? 'VERIFIED' : 'UNVERIFIED';

    // Определяем статус кодового подтверждения
    let confirmationStatus = 'PENDING';
    if (property.confirmationCodeExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(property.confirmationCodeExpiresAt);
      if (now > expiresAt) {
        confirmationStatus = 'EXPIRED';
      } else if (verificationStatus === 'VERIFIED') {
        confirmationStatus = 'CONFIRMED';
      }
    }

    const dtoData: any = {
      id: property.id,
      name: property.name,
      category: property.category,
      latitude: property.latitude,
      longitude: property.longitude,
      photo: property.photo,
      verificationStatus,
      verificationCount,
      verifiedUserIds,
      confirmationStatus,
      createdById: property.userId,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      createdBy,
    };

    if (requestingUserId && property.userId === requestingUserId) {
      dtoData.confirmationCode = property.confirmationCode;
    }

    return plainToInstance(PropertyDto, dtoData);
  }

  /**
   * Подтверждает объект недвижимости
   * @param propertyId ID объекта недвижимости
   * @param userId ID пользователя
   * @param verifyPropertyDto Данные для подтверждения
   * @returns Обновленный объект недвижимости
   */
  async verifyProperty(
    propertyId: number,
    userId: number,
    verifyPropertyDto: VerifyPropertyDto,
  ): Promise<PropertyDto> {
    // Проверяем существование пользователя
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    // Получаем объект недвижимости
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundException(`Объект с ID ${propertyId} не найден`);
    }

    // Запрещаем верификацию, если объект не подтвержден кодом
    if (property.verificationStatus !== 'VERIFIED') {
      throw new ForbiddenException(
        'Объект должен быть подтвержден по коду перед верификацией',
      );
    }

    // Проверяем, не является ли пользователь владельцем объекта
    if (property.userId === userId) {
      throw new PropertyOwnVerificationException();
    }

    // Проверяем, не подтверждал ли пользователь уже этот объект
    const hasVerified = await this.propertyRepository.hasUserVerified(
      propertyId,
      userId,
    );
    if (hasVerified) {
      throw new PropertyAlreadyVerifiedException();
    }

    // Проверяем расстояние с помощью гео-модерации
    const geoCheck = await this.geoModerationService.checkPropertyVerification(
      userId,
      verifyPropertyDto.userLatitude,
      verifyPropertyDto.userLongitude,
      property.latitude,
      property.longitude,
    );

    if (!geoCheck.allowed) {
      this.geoModerationService.throwGeoModerationError(geoCheck);
    }

    // Добавляем подтверждение
    await this.propertyRepository.addVerification(propertyId, userId);

    // Получаем количество подтверждений
    const verificationCount =
      await this.propertyRepository.getVerificationCount(propertyId);

    // Если достигнуто 3 подтверждения, обновляем статус
    if (verificationCount >= 3) {
      await this.propertyRepository.updateVerificationStatus(
        propertyId,
        'VERIFIED',
      );
    }

    // Создаем уведомление для владельца объекта
    try {
      await this.notificationService.createNotification({
        type: NotificationType.PROPERTY_VERIFIED,
        title: 'Ваш объект подтвержден',
        message: `Ваш объект недвижимости "${property.name}" был подтвержден другим пользователем.`,
        userId: property.userId,
        payload: {
          propertyId: propertyId,
          propertyName: property.name,
          verificationCount: verificationCount,
        },
      });
    } catch (error) {
      console.error(
        'Ошибка создания уведомления о подтверждении объекта:',
        error,
      );
    }

    // Возвращаем обновленный объект
    const updatedProperty =
      await this.propertyRepository.findByIdWithVerifications(propertyId);
    return this.transformToUserDto(updatedProperty);
  }

  /**
   * Получает все чужие неподтвержденные объекты недвижимости с фильтрацией по радиусу
   * @param params Параметры фильтрации
   * @returns Список чужих неподтвержденных объектов недвижимости
   */
  async getUnverifiedOthers(
    params: GetUnverifiedOthersParams,
  ): Promise<PropertyDto[]> {
    const { userId, latitude, longitude, radius } = params;
    let properties = await this.propertyRepository.findUnverifiedOthers(userId);

    // Применяем фильтрацию по радиусу на уровне базы данных
    if (
      latitude !== undefined &&
      longitude !== undefined &&
      radius !== undefined
    ) {
      properties = properties.filter((property) =>
        isWithinRadius(
          latitude,
          longitude,
          property.latitude,
          property.longitude,
          radius,
        ),
      );
    }

    // Трансформируем в DTO и фильтруем только неподтвержденные (< 2 подтверждений)
    return properties
      .map((property) => this.transformToUserDto(property))
      .filter((property) => property.verificationStatus === 'UNVERIFIED');
  }

  /**
   * Мягкое удаление объекта недвижимости администратором
   * @param id ID объекта недвижимости
   * @returns Успешность операции
   */
  async softDeletePropertyByAdmin(id: number): Promise<void> {
    // Проверяем существование объекта недвижимости
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new NotFoundException(`Объект с ID ${id} не найден`);
    }

    // Выполняем мягкое удаление
    await this.propertyRepository.softDelete(id);
  }
}

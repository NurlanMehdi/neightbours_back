import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { GeoModerationRepository } from '../repositories/geo-moderation.repository';
import { GeoModerationSettingsDto } from '../dto/geo-moderation-settings.dto';
import { UpdateGeoModerationSettingsDto } from '../dto/update-geo-moderation-settings.dto';
import { GeoModerationRejectionDto } from '../dto/geo-moderation-rejection.dto';
import { GetGeoModerationRejectionsDto } from '../dto/get-geo-moderation-rejections.dto';
import { calculateDistance } from '../../../common/utils/geo.utils';

// Временные типы до создания миграции
enum GeoModerationAction {
  COMMUNITY_JOIN = 'COMMUNITY_JOIN',
  PROPERTY_VERIFICATION = 'PROPERTY_VERIFICATION',
  PROPERTY_CREATION = 'PROPERTY_CREATION',
}

interface GeoCheckResult {
  allowed: boolean;
  distance?: number;
  maxDistance?: number;
  reason?: string;
}

@Injectable()
export class GeoModerationService {
  private readonly logger = new Logger(GeoModerationService.name);

  constructor(
    private readonly geoModerationRepository: GeoModerationRepository,
  ) {}

  /**
   * Получает настройки гео-модерации
   */
  async getSettings(): Promise<GeoModerationSettingsDto> {
    this.logger.log('Получение настроек гео-модерации');
    
    const settings = await this.geoModerationRepository.getSettings();
    return plainToInstance(GeoModerationSettingsDto, settings);
  }

  /**
   * Обновляет настройки гео-модерации
   */
  async updateSettings(dto: UpdateGeoModerationSettingsDto): Promise<GeoModerationSettingsDto> {
    this.logger.log('Обновление настроек гео-модерации');
    
    const updatedSettings = await this.geoModerationRepository.updateSettings(dto);
    return plainToInstance(GeoModerationSettingsDto, updatedSettings);
  }

  /**
   * Проверяет возможность вступления в сообщество
   */
  async checkCommunityJoin(
    userId: number,
    userLatitude: number,
    userLongitude: number,
    communityLatitude: number,
    communityLongitude: number,
  ): Promise<GeoCheckResult> {
    const settings = await this.geoModerationRepository.getSettings();
    
    if (!settings.communityJoinEnabled) {
      return { allowed: true };
    }

    const distance = calculateDistance(
      userLatitude,
      userLongitude,
      communityLatitude,
      communityLongitude,
    );

    const distanceInMeters = Math.round(distance * 1000);
    
    if (distanceInMeters > settings.communityJoinMaxDistance) {
      const reason = `Радиус > ${settings.communityJoinMaxDistance}м`;
      
      // Логируем отказ
      await this.geoModerationRepository.createRejection({
        userId,
        action: GeoModerationAction.COMMUNITY_JOIN,
        distance: distanceInMeters,
        maxDistance: settings.communityJoinMaxDistance,
        reason,
        userLatitude,
        userLongitude,
        targetLatitude: communityLatitude,
        targetLongitude: communityLongitude,
      });

      return {
        allowed: false,
        distance: distanceInMeters,
        maxDistance: settings.communityJoinMaxDistance,
        reason,
      };
    }

    return { allowed: true, distance: distanceInMeters };
  }

  /**
   * Проверяет возможность подтверждения объекта недвижимости
   */
  async checkPropertyVerification(
    userId: number,
    userLatitude: number,
    userLongitude: number,
    propertyLatitude: number,
    propertyLongitude: number,
  ): Promise<GeoCheckResult> {
    const settings = await this.geoModerationRepository.getSettings();
    
    if (!settings.propertyVerificationEnabled) {
      return { allowed: true };
    }

    const distance = calculateDistance(
      userLatitude,
      userLongitude,
      propertyLatitude,
      propertyLongitude,
    );

    const distanceInMeters = Math.round(distance * 1000);
    
    if (distanceInMeters > settings.propertyVerificationMaxDistance) {
      const reason = `Радиус > ${settings.propertyVerificationMaxDistance}м`;
      
      // Логируем отказ
      await this.geoModerationRepository.createRejection({
        userId,
        action: GeoModerationAction.PROPERTY_VERIFICATION,
        distance: distanceInMeters,
        maxDistance: settings.propertyVerificationMaxDistance,
        reason,
        userLatitude,
        userLongitude,
        targetLatitude: propertyLatitude,
        targetLongitude: propertyLongitude,
      });

      return {
        allowed: false,
        distance: distanceInMeters,
        maxDistance: settings.propertyVerificationMaxDistance,
        reason,
      };
    }

    return { allowed: true, distance: distanceInMeters };
  }

  /**
   * Проверяет возможность создания объекта недвижимости
   */
  async checkPropertyCreation(
    userId: number,
    userLatitude: number,
    userLongitude: number,
    propertyLatitude: number,
    propertyLongitude: number,
  ): Promise<GeoCheckResult> {
    const settings = await this.geoModerationRepository.getSettings();
    
    if (!settings.propertyCreationEnabled) {
      return { allowed: true };
    }

    const distance = calculateDistance(
      userLatitude,
      userLongitude,
      propertyLatitude,
      propertyLongitude,
    );

    const distanceInMeters = Math.round(distance * 1000);
    
    if (distanceInMeters > settings.propertyCreationMaxDistance) {
      const reason = `Радиус > ${settings.propertyCreationMaxDistance}м`;
      
      // Логируем отказ
      await this.geoModerationRepository.createRejection({
        userId,
        action: GeoModerationAction.PROPERTY_CREATION,
        distance: distanceInMeters,
        maxDistance: settings.propertyCreationMaxDistance,
        reason,
        userLatitude,
        userLongitude,
        targetLatitude: propertyLatitude,
        targetLongitude: propertyLongitude,
      });

      return {
        allowed: false,
        distance: distanceInMeters,
        maxDistance: settings.propertyCreationMaxDistance,
        reason,
      };
    }

    return { allowed: true, distance: distanceInMeters };
  }

  /**
   * Получает список отказов с пагинацией
   */
  async getRejections(query: GetGeoModerationRejectionsDto) {
    this.logger.log('Получение списка отказов гео-модерации');
    
    const result = await this.geoModerationRepository.getRejections(query);
    
    return {
      ...result,
      rejections: result.rejections.map(rejection => 
        plainToInstance(GeoModerationRejectionDto, rejection)
      ),
    };
  }

  /**
   * Получает статистику отказов
   */
  async getRejectionStats() {
    this.logger.log('Получение статистики отказов гео-модерации');
    
    return this.geoModerationRepository.getRejectionStats();
  }

  /**
   * Выбрасывает исключение при отказе в доступе
   */
  throwGeoModerationError(checkResult: GeoCheckResult): never {
    throw new BadRequestException(
      `Вы слишком далеко, попробуйте еще раз. ${checkResult.reason || ''}`
    );
  }
} 
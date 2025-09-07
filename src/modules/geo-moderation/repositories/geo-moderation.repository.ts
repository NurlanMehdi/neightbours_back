import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateGeoModerationSettingsDto } from '../dto/update-geo-moderation-settings.dto';
import { GetGeoModerationRejectionsDto } from '../dto/get-geo-moderation-rejections.dto';

// Временный enum до создания миграции
enum GeoModerationAction {
  COMMUNITY_JOIN = 'COMMUNITY_JOIN',
  PROPERTY_VERIFICATION = 'PROPERTY_VERIFICATION',
  PROPERTY_CREATION = 'PROPERTY_CREATION',
}

@Injectable()
export class GeoModerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получает настройки гео-модерации (создает если не существуют)
   */
  async getSettings() {
    let settings = await this.prisma.geoModerationSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.geoModerationSettings.create({
        data: {
          communityJoinEnabled: true,
          communityJoinMaxDistance: 500,
          propertyVerificationEnabled: true,
          propertyVerificationMaxDistance: 100,
          propertyCreationEnabled: true,
          propertyCreationMaxDistance: 100,
        },
      });
    }

    return settings;
  }

  /**
   * Обновляет настройки гео-модерации
   */
  async updateSettings(dto: UpdateGeoModerationSettingsDto) {
    const settings = await this.getSettings();

    return this.prisma.geoModerationSettings.update({
      where: { id: settings.id },
      data: dto,
    });
  }

  /**
   * Создает запись об отказе в гео-модерации
   */
  async createRejection(data: {
    userId: number;
    action: GeoModerationAction;
    distance: number;
    maxDistance: number;
    reason: string;
    userLatitude?: number;
    userLongitude?: number;
    targetLatitude?: number;
    targetLongitude?: number;
  }) {
    return this.prisma.geoModerationRejection.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Получает список отказов с фильтрацией и пагинацией
   */
  async getRejections(query: GetGeoModerationRejectionsDto) {
    const { page = 1, limit = 20, search, action, dateFrom, dateTo } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    // Поиск по пользователю
    if (search) {
      where.OR = [
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
        {
          user: {
            phone: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Фильтр по типу действия
    if (action) {
      where.action = action;
    }

    // Фильтр по датам
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    const [rejections, total] = await Promise.all([
      this.prisma.geoModerationRejection.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.geoModerationRejection.count({ where }),
    ]);

    return {
      rejections,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Получает статистику отказов
   */
  async getRejectionStats() {
    const [
      totalRejections,
      communityJoinRejections,
      propertyVerificationRejections,
      propertyCreationRejections,
      recentRejections,
    ] = await Promise.all([
      this.prisma.geoModerationRejection.count(),
      this.prisma.geoModerationRejection.count({
        where: { action: GeoModerationAction.COMMUNITY_JOIN },
      }),
      this.prisma.geoModerationRejection.count({
        where: { action: GeoModerationAction.PROPERTY_VERIFICATION },
      }),
      this.prisma.geoModerationRejection.count({
        where: { action: GeoModerationAction.PROPERTY_CREATION },
      }),
      this.prisma.geoModerationRejection.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // последние 24 часа
          },
        },
      }),
    ]);

    return {
      totalRejections,
      communityJoinRejections,
      propertyVerificationRejections,
      propertyCreationRejections,
      recentRejections,
    };
  }
}

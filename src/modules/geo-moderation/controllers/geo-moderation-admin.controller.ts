import { Controller, Get, Put, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiStandardResponses } from '../../../common/decorators/api-responses.decorator';
import { GeoModerationService } from '../services/geo-moderation.service';
import { GeoModerationSettingsDto } from '../dto/geo-moderation-settings.dto';
import { UpdateGeoModerationSettingsDto } from '../dto/update-geo-moderation-settings.dto';
import { GetGeoModerationRejectionsDto } from '../dto/get-geo-moderation-rejections.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Гео-модерация (Админ)')
@Controller('admin/geo-moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@ApiBearerAuth()
export class GeoModerationAdminController {
  constructor(private readonly geoModerationService: GeoModerationService) {}

  @Get('settings')
  @ApiOperation({
    summary: 'Получить настройки гео-модерации',
    description: 'Получает текущие настройки автоматической гео-модерации',
  })
  @ApiResponse({
    status: 200,
    description: 'Настройки гео-модерации',
    type: GeoModerationSettingsDto,
  })
  @ApiStandardResponses()
  async getSettings(): Promise<GeoModerationSettingsDto> {
    return this.geoModerationService.getSettings();
  }

  @Put('settings')
  @ApiOperation({
    summary: 'Обновить настройки гео-модерации',
    description: 'Обновляет настройки автоматической гео-модерации',
  })
  @ApiResponse({
    status: 200,
    description: 'Обновленные настройки гео-модерации',
    type: GeoModerationSettingsDto,
  })
  @ApiStandardResponses()
  async updateSettings(
    @Body() dto: UpdateGeoModerationSettingsDto,
  ): Promise<GeoModerationSettingsDto> {
    return this.geoModerationService.updateSettings(dto);
  }

  @Get('rejections')
  @ApiOperation({
    summary: 'Получить список отказов',
    description:
      'Получает список пользователей, которым было отказано в действиях из-за превышения расстояния',
  })
  @ApiResponse({
    status: 200,
    description: 'Список отказов с пагинацией',
    schema: {
      type: 'object',
      properties: {
        rejections: {
          type: 'array',
          items: { $ref: '#/components/schemas/GeoModerationRejectionDto' },
        },
        total: { type: 'number', example: 150 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 8 },
      },
    },
  })
  @ApiStandardResponses()
  async getRejections(@Query() query: GetGeoModerationRejectionsDto) {
    return this.geoModerationService.getRejections(query);
  }

  @Get('rejections/stats')
  @ApiOperation({
    summary: 'Получить статистику отказов',
    description: 'Получает статистику отказов по типам действий',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика отказов',
    schema: {
      type: 'object',
      properties: {
        totalRejections: { type: 'number', example: 45 },
        communityJoinRejections: { type: 'number', example: 20 },
        propertyVerificationRejections: { type: 'number', example: 15 },
        propertyCreationRejections: { type: 'number', example: 10 },
        recentRejections: { type: 'number', example: 5 },
      },
    },
  })
  @ApiStandardResponses()
  async getRejectionStats() {
    return this.geoModerationService.getRejectionStats();
  }
}

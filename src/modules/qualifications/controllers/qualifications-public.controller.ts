import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { QualificationsService } from '../services/qualifications.service';
import { GetQualificationsDto } from '../dto/get-qualifications.dto';
import { QualificationsListDto } from '../dto/qualification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Квалификации')
@Controller('qualifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.MODERATOR)
@ApiBearerAuth()
export class QualificationsUserController {
  constructor(private readonly qualificationsService: QualificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список всех активных квалификаций' })
  @ApiResponse({
    status: 200,
    description: 'Список активных квалификаций',
    type: QualificationsListDto,
  })
  async findAll(
    @Query() filters: GetQualificationsDto,
  ): Promise<QualificationsListDto> {
    // Для публичного API показываем только активные квалификации
    return this.qualificationsService.getQualifications({
      ...filters,
      isActive: true,
    });
  }
}

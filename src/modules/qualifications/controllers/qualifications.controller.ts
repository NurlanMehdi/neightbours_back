import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { QualificationsService } from '../services/qualifications.service';
import { CreateQualificationDto } from '../dto/create-qualification.dto';
import { UpdateQualificationDto } from '../dto/update-qualification.dto';
import { GetQualificationsDto } from '../dto/get-qualifications.dto';
import { QualificationDto, QualificationsListDto } from '../dto/qualification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Квалификации (Админ)')
@Controller('admin/qualifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class QualificationsController {
  constructor(private readonly qualificationsService: QualificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать квалификацию' })
  @ApiResponse({
    status: 201,
    description: 'Квалификация успешно создана',
    type: QualificationDto,
  })
  async create(@Body() createQualificationDto: CreateQualificationDto): Promise<QualificationDto> {
    return this.qualificationsService.createQualification(createQualificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список квалификаций' })
  @ApiResponse({
    status: 200,
    description: 'Список квалификаций',
    type: QualificationsListDto,
  })
  async findAll(@Query() filters: GetQualificationsDto): Promise<QualificationsListDto> {
    return this.qualificationsService.getQualifications(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить квалификацию по ID' })
  @ApiResponse({
    status: 200,
    description: 'Квалификация найдена',
    type: QualificationDto,
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<QualificationDto> {
    return this.qualificationsService.getQualificationById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить квалификацию' })
  @ApiResponse({
    status: 200,
    description: 'Квалификация успешно обновлена',
    type: QualificationDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQualificationDto: UpdateQualificationDto,
  ): Promise<QualificationDto> {
    return this.qualificationsService.updateQualification(id, updateQualificationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Деактивировать квалификацию (мягкое удаление)' })
  @ApiResponse({
    status: 200,
    description: 'Квалификация успешно деактивирована',
    type: QualificationDto,
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<QualificationDto> {
    return this.qualificationsService.deactivateQualification(id);
  }
} 
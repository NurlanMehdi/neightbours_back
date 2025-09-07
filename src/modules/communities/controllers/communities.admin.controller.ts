import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CommunityService } from '../services/community.service';
import { CommunityDto } from '../dto/community.dto';
import { CreateCommunityAdminDto } from '../dto/create-community-admin.dto';
import { UpdateCommunityAdminDto } from '../dto/update-community-admin.dto';
import { GetCommunitiesAdminDto } from '../dto/get-communities-admin.dto';
import { CommunityMinimalDto } from '../dto/community-minimal.dto';
import { CommunityFullDto } from '../dto/community-full.dto';
import { ApiStandardResponses } from '../../../common/decorators/api-responses.decorator';

@ApiTags('Управление сообществами')
@Controller('admin/communities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
export class CommunitiesAdminController {
  constructor(private readonly communityService: CommunityService) {}

  @Post()
  @ApiOperation({
    summary: 'Создание нового сообщества администратором',
    description:
      'Создает новое сообщество и возвращает его данные включая код для присоединения',
  })
  @ApiBody({
    type: CreateCommunityAdminDto,
  })
  @ApiStandardResponses()
  async createCommunity(
    @Body() dto: CreateCommunityAdminDto,
  ): Promise<CommunityDto> {
    return this.communityService.createCommunityByAdmin(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список сообществ с фильтрацией',
    description:
      'Получение списка сообществ с поддержкой пагинации, сортировки и фильтрации',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description:
      'Номер страницы (по умолчанию: 1, не используется если withoutPagination=true)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description:
      'Количество записей на странице (по умолчанию: 10, не используется если withoutPagination=true)',
  })
  @ApiQuery({
    name: 'withoutPagination',
    required: false,
    type: Boolean,
    description: 'Получить все записи без пагинации (по умолчанию: false)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['id', 'name', 'numberOfUsers', 'createdAt'],
    description: 'Поле для сортировки',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Порядок сортировки',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Поиск по названию сообщества',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Начальная дата периода создания (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Конечная дата периода создания (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'minParticipants',
    required: false,
    type: Number,
    description: 'Минимальное количество участников',
  })
  @ApiQuery({
    name: 'maxParticipants',
    required: false,
    type: Number,
    description: 'Максимальное количество участников',
  })
  @ApiQuery({
    name: 'size',
    required: false,
    enum: ['small', 'medium', 'large'],
    description: 'Фильтр по размеру сообщества',
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    type: Number,
    description: 'Широта центра для фильтрации по радиусу',
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    type: Number,
    description: 'Долгота центра для фильтрации по радиусу',
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description:
      'Радиус поиска в километрах (используется вместе с latitude и longitude)',
  })
  @ApiStandardResponses()
  async findAllForAdmin(@Query() filters: GetCommunitiesAdminDto) {
    return this.communityService.findAllForAdmin(filters);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Получить все сообщества с минимальной информацией',
    description:
      'Возвращает список всех сообществ с id и названием, отсортированный по названию',
  })
  @ApiStandardResponses()
  async findAllMinimal(): Promise<CommunityMinimalDto[]> {
    return this.communityService.findAllMinimal();
  }

  @Get(':id/full')
  @ApiOperation({ summary: 'Получить полную информацию о сообществе' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID сообщества' })
  @ApiResponse({
    status: 200,
    description: 'Информация о сообществе',
    type: CommunityFullDto,
  })
  async getCommunityFull(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CommunityFullDto> {
    return this.communityService.getCommunityForAdmin(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Обновить сообщество',
    description: 'Обновляет информацию о сообществе администратором',
  })
  @ApiParam({
    name: 'id',
    description: 'ID сообщества',
    type: 'number',
  })
  @ApiBody({
    type: UpdateCommunityAdminDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Сообщество успешно обновлено',
    type: CommunityDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Сообщество не найдено',
  })
  @ApiStandardResponses()
  async updateCommunity(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommunityDto: UpdateCommunityAdminDto,
  ): Promise<CommunityDto> {
    return this.communityService.updateCommunityByAdmin(id, updateCommunityDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Мягкое удаление сообщества',
    description:
      'Устанавливает флаг isActive = false для сообщества (мягкое удаление)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID сообщества',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Сообщество успешно мягко удалено',
  })
  @ApiResponse({
    status: 404,
    description: 'Сообщество не найдено',
  })
  @ApiStandardResponses()
  async softDeleteCommunity(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.communityService.softDeleteCommunityByAdmin(id);
  }
}

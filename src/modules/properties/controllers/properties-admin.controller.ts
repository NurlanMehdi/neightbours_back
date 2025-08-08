import {
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PropertyService } from '../services/property.service';
import { CreatePropertyAdminDto } from '../dto/create-property-admin.dto';
import { UpdatePropertyAdminDto } from '../dto/update-property-admin.dto';
import { GetPropertiesAdminDto } from '../dto/get-properties-admin.dto';
import { PropertyAdminDto } from '../dto/property-admin.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiStandardResponses } from '../../../common/decorators/api-responses.decorator';
import { PropertyCategory } from '@prisma/client';

@ApiTags('Админка - Объекты недвижимости')
@Controller('admin/properties')
export class PropertiesAdminController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Название объекта',
          example: 'Дом на улице Ленина',
        },
        category: {
          type: 'string',
          enum: Object.values(PropertyCategory),
          description: 'Категория объекта',
          example: PropertyCategory.PRIVATE_HOUSE,
        },
        latitude: {
          type: 'number',
          description: 'Широта',
          example: 55.7558,
        },
        longitude: {
          type: 'number',
          description: 'Долгота',
          example: 37.6176,
        },
        userId: {
          type: 'number',
          description: 'ID пользователя-владельца',
          example: 1,
        },
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Фотография объекта',
        },
      },
      required: ['name', 'category', 'latitude', 'longitude', 'userId'],
    },
  })
  @ApiOperation({
    summary: 'Создать объект недвижимости',
    description: 'Создает новый объект недвижимости администратором',
  })
  @ApiResponse({
    status: 201,
    description: 'Объект успешно создан',
    type: PropertyAdminDto,
  })
  @ApiStandardResponses()
  @UseInterceptors(FileInterceptor('photo'))
  async createProperty(
    @Body() createPropertyDto: CreatePropertyAdminDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<PropertyAdminDto> {
    console.log('Controller createProperty called with:', { createPropertyDto, photo });
    return this.propertyService.createProperty(createPropertyDto, photo);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить список объектов',
    description:
      'Получает список объектов недвижимости с пагинацией и фильтрами',
  })
  @ApiResponse({
    status: 200,
    description: 'Список объектов получен',
    schema: {
      type: 'object',
      properties: {
        properties: {
          type: 'array',
          items: { $ref: '#/components/schemas/PropertyAdminDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
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
      'Количество записей на странице (по умолчанию: 50, не используется если withoutPagination=true)',
  })
  @ApiQuery({
    name: 'withoutPagination',
    required: false,
    type: Boolean,
    description: 'Получить все записи без пагинации (по умолчанию: false)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Поиск по названию объекта или имени владельца',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: Object.values(PropertyCategory),
    description: 'Фильтр по типу объекта',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: Object.values(PropertyCategory),
    description: 'Фильтр по типу объекта (alias для category)',
  })
  @ApiQuery({
    name: 'isVerified',
    required: false,
    type: Boolean,
    description: 'Фильтр по статусу верификации владельца',
  })
  @ApiQuery({
    name: 'communityId',
    required: false,
    type: Number,
    description: 'Фильтр по ID сообщества',
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
    name: 'sortBy',
    required: false,
    enum: ['id', 'category', 'createdAt', 'confirmations'],
    description: 'Поле для сортировки',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Порядок сортировки',
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
  async getProperties(@Query() query: GetPropertiesAdminDto) {
    return this.propertyService.getProperties(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить объект по ID',
    description: 'Получает детальную информацию об объекте недвижимости',
  })
  @ApiResponse({
    status: 200,
    description: 'Объект найден',
    type: PropertyAdminDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Объект не найден',
  })
  @ApiStandardResponses()
  async getPropertyById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PropertyAdminDto> {
    return this.propertyService.getPropertyById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Обновить объект недвижимости',
    description: 'Обновляет информацию об объекте недвижимости администратором',
  })
  @ApiParam({
    name: 'id',
    description: 'ID объекта недвижимости',
    type: 'number',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Название объекта',
          example: 'Дом на улице Ленина',
        },
        category: {
          type: 'string',
          enum: ['PRIVATE_HOUSE', 'TOWNHOUSE', 'COTTAGE', 'LAND'],
          description: 'Категория объекта',
          example: 'PRIVATE_HOUSE',
        },
        latitude: {
          type: 'number',
          description: 'Широта',
          example: 55.7558,
        },
        longitude: {
          type: 'number',
          description: 'Долгота',
          example: 37.6176,
        },
        verificationStatus: {
          type: 'string',
          enum: ['UNVERIFIED', 'VERIFIED'],
          description: 'Статус верификации',
          example: 'VERIFIED',
        },
        userId: {
          type: 'number',
          description: 'ID пользователя-владельца',
          example: 1,
        },
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Фотография объекта',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Объект успешно обновлен',
    type: PropertyAdminDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Объект не найден',
  })
  @ApiStandardResponses()
  @UseInterceptors(FileInterceptor('photo'))
  async updateProperty(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyDto: UpdatePropertyAdminDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<PropertyAdminDto> {
    console.log('Controller updateProperty called with:', { id, updatePropertyDto, photo });
    return this.propertyService.updatePropertyByAdmin(id, updatePropertyDto, photo);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Мягкое удаление объекта недвижимости',
    description: 'Устанавливает флаг isActive = false для объекта недвижимости (мягкое удаление)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID объекта недвижимости',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Объект успешно мягко удален',
  })
  @ApiResponse({
    status: 404,
    description: 'Объект не найден',
  })
  @ApiStandardResponses()
  async softDeleteProperty(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.propertyService.softDeletePropertyByAdmin(id);
  }
}

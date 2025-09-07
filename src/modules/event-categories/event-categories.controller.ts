import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventCategoriesService } from './event-categories.service';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';
import { EventCategoryDto } from './dto/event-category.dto';
import { GetEventCategoriesAdminDto } from './dto/get-event-categories-admin.dto';
import { EventCategoriesPaginatedDto } from './dto/event-categories-paginated.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Категории событий (Админ)')
@Controller('admin/event-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EventCategoriesController {
  constructor(
    private readonly eventCategoriesService: EventCategoriesService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('icon'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Название категории',
          example: 'Собрание жильцов',
        },
        type: {
          type: 'string',
          enum: ['NOTIFICATION', 'EVENT'],
          description: 'Тип категории',
          example: 'EVENT',
        },
        color: {
          type: 'string',
          description: 'Цвет категории (обязателен только для оповещений)',
          example: '#FF5733',
        },
        icon: {
          type: 'string',
          format: 'binary',
          description:
            'Иконка категории (файл изображения). Для уведомлений разрешены только SVG файлы',
        },
      },
      required: ['name', 'type', 'icon'],
    },
  })
  @ApiOperation({ summary: 'Создать категорию события' })
  @ApiResponse({
    status: 201,
    description: 'Категория события успешно создана',
    type: EventCategoryDto,
  })
  async create(
    @Body() createEventCategoryDto: CreateEventCategoryDto,
    @UploadedFile() icon: Express.Multer.File,
  ): Promise<EventCategoryDto> {
    return this.eventCategoriesService.create(createEventCategoryDto, icon);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Получить все активные категории событий с пагинацией',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Номер страницы (начиная с 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Количество элементов на странице',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Поиск по названию категории',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Фильтр по типу события (EVENT или NOTIFICATION)',
  })
  @ApiResponse({
    status: 200,
    description: 'Список активных категорий событий с пагинацией',
    type: EventCategoriesPaginatedDto,
  })
  async findAll(
    @Query() query: GetEventCategoriesAdminDto,
  ): Promise<EventCategoriesPaginatedDto> {
    return this.eventCategoriesService.findAllWithPagination(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить активную категорию события по ID' })
  @ApiResponse({
    status: 200,
    description: 'Активная категория события найдена',
    type: EventCategoryDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventCategoryDto> {
    return this.eventCategoriesService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('icon'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Название категории',
          example: 'Собрание жильцов',
        },
        type: {
          type: 'string',
          enum: ['NOTIFICATION', 'EVENT'],
          description: 'Тип категории',
          example: 'EVENT',
        },
        color: {
          type: 'string',
          description: 'Цвет категории (обязателен только для оповещений)',
          example: '#FF5733',
        },
        icon: {
          type: 'string',
          format: 'binary',
          description:
            'Иконка категории (файл изображения). Для уведомлений разрешены только SVG файлы',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Обновить категорию события' })
  @ApiResponse({
    status: 200,
    description: 'Категория события успешно обновлена',
    type: EventCategoryDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventCategoryDto: UpdateEventCategoryDto,
    @UploadedFile() icon: Express.Multer.File,
  ): Promise<EventCategoryDto> {
    return this.eventCategoriesService.update(id, updateEventCategoryDto, icon);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Мягко удалить категорию события' })
  @ApiResponse({
    status: 200,
    description: 'Категория события успешно мягко удалена',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.eventCategoriesService.delete(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Восстановить мягко удаленную категорию события' })
  @ApiResponse({
    status: 200,
    description: 'Категория события успешно восстановлена',
    type: EventCategoryDto,
  })
  async restore(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventCategoryDto> {
    return this.eventCategoriesService.restore(id);
  }
}

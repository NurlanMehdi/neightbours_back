import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EventCategoriesService } from '../event-categories.service';
import { EventCategoryDto } from '../dto/event-category.dto';
import { GetEventCategoriesPublicDto } from '../dto/get-event-categories-public.dto';

@ApiTags('Категории событий')
@Controller('event-categories')
export class EventCategoriesPublicController {
  constructor(private readonly eventCategoriesService: EventCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все активные категории событий' })
  @ApiQuery({ name: 'type', required: false, description: 'Фильтр по типу события (EVENT или NOTIFICATION)' })
  @ApiResponse({
    status: 200,
    description: 'Список всех активных категорий событий',
    type: [EventCategoryDto],
  })
  async findAll(@Query() query: GetEventCategoriesPublicDto): Promise<EventCategoryDto[]> {
    return this.eventCategoriesService.findAllByType(query.type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить активную категорию события по ID' })
  @ApiParam({
    name: 'id',
    description: 'ID категории события',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Активная категория события найдена',
    type: EventCategoryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Активная категория события не найдена',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<EventCategoryDto> {
    return this.eventCategoriesService.findActiveById(id);
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { Paginated } from '../../../common/interfaces/paginated';
import { EventCategoryDto } from './event-category.dto';

/**
 * DTO для пагинированного ответа категорий событий
 */
export class EventCategoriesPaginatedDto implements Paginated<EventCategoryDto> {
  @ApiProperty({
    description: 'Список категорий событий',
    type: [EventCategoryDto],
  })
  data: EventCategoryDto[];

  @ApiProperty({
    description: 'Общее количество категорий',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Номер текущей страницы',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Количество элементов на странице',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Общее количество страниц',
    example: 5,
  })
  totalPages: number;
} 
import { ApiProperty } from '@nestjs/swagger';
import { Paginated } from '../../../common/interfaces/paginated';
import { EventDto } from './event.dto';

/**
 * DTO для пагинированного списка событий (админ)
 */
export class EventsPaginatedAdminDto implements Paginated<EventDto> {
  @ApiProperty({ description: 'События', type: [EventDto] })
  data: EventDto[];

  @ApiProperty({ description: 'Общее количество событий' })
  total: number;

  @ApiProperty({ description: 'Номер текущей страницы' })
  page: number;

  @ApiProperty({ description: 'Количество элементов на странице' })
  limit: number;

  @ApiProperty({ description: 'Общее количество страниц' })
  totalPages: number;
} 
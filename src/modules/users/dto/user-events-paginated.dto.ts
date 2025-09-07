import { ApiProperty } from '@nestjs/swagger';
import { EventDto } from '../../events/dto/event.dto';

export class UserEventsPaginatedDto {
  @ApiProperty({
    description: 'Список событий, созданных пользователем',
    type: [EventDto],
  })
  data: EventDto[];

  @ApiProperty({
    description: 'Общее количество событий',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Номер текущей страницы',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Количество элементов на странице',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Общее количество страниц',
    example: 3,
  })
  totalPages: number;
}

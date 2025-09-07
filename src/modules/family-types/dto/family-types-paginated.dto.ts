import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { FamilyTypeDto } from './family-type.dto';

export class FamilyTypesPaginatedDto {
  @ApiProperty({ description: 'Список типов семьи', type: [FamilyTypeDto] })
  @Expose()
  data: FamilyTypeDto[];

  @ApiProperty({ description: 'Общее количество типов семьи' })
  @Expose()
  total: number;

  @ApiProperty({ description: 'Текущая страница' })
  @Expose()
  page: number;

  @ApiProperty({ description: 'Количество элементов на странице' })
  @Expose()
  limit: number;

  @ApiProperty({ description: 'Общее количество страниц' })
  @Expose()
  totalPages: number;
}

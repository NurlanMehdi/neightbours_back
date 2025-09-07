import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO для категории события
 */
export class EventCategoryDto {
  @ApiProperty({ description: 'ID категории' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Название категории' })
  @Expose()
  name: string;
}

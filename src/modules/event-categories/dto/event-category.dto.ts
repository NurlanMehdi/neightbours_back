import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { EventType } from '@prisma/client';

/**
 * DTO для категории события в ответе
 */
export class EventCategoryDto {
  @ApiProperty({ description: 'ID категории' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Название категории' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Иконка категории' })
  @Expose()
  icon: string;

  @ApiProperty({
    description: 'Цвет категории',
    example: '#FF5733',
    required: false,
  })
  @Expose()
  color?: string;

  @ApiProperty({
    description: 'Тип категории',
    enum: EventType,
    example: EventType.EVENT,
  })
  @Expose()
  type: EventType;

  @ApiProperty({ description: 'Активна ли категория' })
  @Expose()
  isActive: boolean;
}

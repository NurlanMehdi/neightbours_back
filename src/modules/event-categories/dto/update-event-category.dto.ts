import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { EventType } from '@prisma/client';

/**
 * DTO для обновления категории события
 */
export class UpdateEventCategoryDto {
  @ApiProperty({
    description: 'Название категории',
    example: 'Собрание жильцов',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Тип категории',
    enum: EventType,
    example: EventType.EVENT,
    required: false,
  })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiProperty({
    description: 'Цвет категории (обязателен только для оповещений)',
    example: '#FF5733',
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;
} 
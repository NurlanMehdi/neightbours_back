import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { EventType } from '@prisma/client';

/**
 * DTO для создания категории события
 */
export class CreateEventCategoryDto {
  @ApiProperty({
    description: 'Название категории',
    example: 'Собрание жильцов',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Тип категории',
    enum: EventType,
    example: EventType.EVENT,
  })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({
    description: 'Цвет категории (обязателен только для оповещений)',
    example: '#FF5733',
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;
} 
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyCategory } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/models/paginated-query.dto';
import { TransformToFloat, TransformToInt, TransformToBoolean } from '../../../common/utils/form-data-transformers.util';

export class GetPropertiesAdminDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'Получить все записи без пагинации',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @TransformToBoolean()
  withoutPagination?: boolean = false;

  @ApiProperty({
    description: 'Поиск по названию',
    required: false,
    example: 'дом',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Фильтр по типу объекта',
    enum: PropertyCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(PropertyCategory)
  category?: PropertyCategory;

  @ApiProperty({
    description: 'Фильтр по типу объекта (alias для category)',
    enum: PropertyCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(PropertyCategory)
  type?: PropertyCategory;

  @ApiProperty({
    description: 'Фильтр по статусу верификации',
    required: false,
    example: true,
  })
  @IsOptional()
  @TransformToBoolean()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({
    description: 'Фильтр по ID сообщества',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @TransformToInt()
  communityId?: number;

  @ApiProperty({
    description: 'Начальная дата периода создания (YYYY-MM-DD)',
    required: false,
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({
    description: 'Конечная дата периода создания (YYYY-MM-DD)',
    required: false,
    example: '2024-12-31',
  })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({
    description: 'Сортировка по полю',
    required: false,
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'id' | 'category' | 'createdAt' | 'confirmations';

  @ApiProperty({
    description: 'Порядок сортировки',
    required: false,
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({
    description: 'Широта центра для фильтрации по радиусу',
    example: 55.7558,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  @TransformToFloat()
  latitude?: number;

  @ApiProperty({
    description: 'Долгота центра для фильтрации по радиусу',
    example: 37.6176,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  @TransformToFloat()
  longitude?: number;

  @ApiProperty({
    description:
      'Радиус поиска в километрах (используется вместе с latitude и longitude)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  @TransformToFloat()
  radius?: number;
}

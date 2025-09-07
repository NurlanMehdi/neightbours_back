import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '@prisma/client';
import { TransformToInt } from '../../../common/utils/form-data-transformers.util';

/**
 * DTO фильтров и пагинации для получения списка событий администратором
 */
export class GetEventsAdminDto {
  @ApiPropertyOptional({ description: 'Поиск по названию события' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Тип события', enum: EventType })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional({ description: 'ID сообщества' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @TransformToInt()
  communityId?: number;

  @ApiPropertyOptional({ description: 'ID категории события' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @TransformToInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Дата создания от (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Дата создания до (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Номер страницы', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @TransformToInt()
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Количество записей на странице',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @TransformToInt()
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Поле для сортировки',
    enum: ['id', 'title', 'createdAt'],
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'id' | 'title' | 'createdAt' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Порядок сортировки',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { EventType } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/models/paginated-query.dto';
import { Type } from 'class-transformer';
import { TransformToInt } from '../../../common/utils/form-data-transformers.util';

export class GetUserEventsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Поиск по названию события',
    example: 'встреча',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Фильтр по типу события',
    enum: EventType,
  })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional({
    description: 'Включить события, где пользователь является участником',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeParticipating?: boolean;

  @ApiPropertyOptional({
    description: 'ID сообщества',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @TransformToInt()
  communityId?: number;

  @ApiPropertyOptional({
    description: 'ID категории события',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @TransformToInt()
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Дата создания от (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Дата создания до (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsString()
  dateTo?: string;
}

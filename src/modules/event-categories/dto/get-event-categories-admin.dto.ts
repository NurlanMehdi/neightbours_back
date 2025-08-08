import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../common/models/paginated-query.dto';
import { EventType } from '@prisma/client';

/**
 * DTO для получения списка категорий событий в админке
 */
export class GetEventCategoriesAdminDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Поиск по названию категории',
    example: 'собрание',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Фильтр по типу события',
    enum: EventType,
    example: EventType.EVENT,
  })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;
} 
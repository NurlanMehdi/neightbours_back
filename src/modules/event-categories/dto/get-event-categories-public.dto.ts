import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { EventType } from '@prisma/client';

/**
 * DTO для получения списка активных категорий событий (публичный API)
 */
export class GetEventCategoriesPublicDto {
  @ApiPropertyOptional({
    description: 'Фильтр по типу события',
    enum: EventType,
    example: EventType.EVENT,
  })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;
}

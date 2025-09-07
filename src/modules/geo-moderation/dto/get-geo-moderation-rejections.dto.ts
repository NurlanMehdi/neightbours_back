import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../common/models/paginated-query.dto';

// Временный enum до создания миграции
enum GeoModerationAction {
  COMMUNITY_JOIN = 'COMMUNITY_JOIN',
  PROPERTY_VERIFICATION = 'PROPERTY_VERIFICATION',
  PROPERTY_CREATION = 'PROPERTY_CREATION',
}

export class GetGeoModerationRejectionsDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'Поиск по сообществу, объекту или пользователю',
    required: false,
    example: 'user123',
  })
  @IsOptional()
  @IsString({ message: 'Поисковый запрос должен быть строкой' })
  search?: string;

  @ApiProperty({
    description: 'Фильтр по типу действия',
    enum: GeoModerationAction,
    required: false,
    example: GeoModerationAction.COMMUNITY_JOIN,
  })
  @IsOptional()
  @IsEnum(GeoModerationAction, { message: 'Неверный тип действия' })
  action?: GeoModerationAction;

  @ApiProperty({
    description: 'Дата начала периода (YYYY-MM-DD)',
    required: false,
    example: '2025-01-01',
  })
  @IsOptional()
  @IsString({ message: 'Дата должна быть строкой' })
  dateFrom?: string;

  @ApiProperty({
    description: 'Дата окончания периода (YYYY-MM-DD)',
    required: false,
    example: '2025-01-31',
  })
  @IsOptional()
  @IsString({ message: 'Дата должна быть строкой' })
  dateTo?: string;
}

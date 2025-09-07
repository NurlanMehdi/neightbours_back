import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyCategory } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/models/paginated-query.dto';
import { TransformToInt } from '../../../common/utils/form-data-transformers.util';

export class GetUserVerificationsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Поиск по названию объекта',
    example: 'дом',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Фильтр по категории объекта',
    enum: PropertyCategory,
  })
  @IsOptional()
  @IsEnum(PropertyCategory)
  category?: PropertyCategory;

  @ApiPropertyOptional({
    description: 'Фильтр по статусу подтверждения',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Дата подтверждения от (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Дата подтверждения до (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsString()
  dateTo?: string;
}

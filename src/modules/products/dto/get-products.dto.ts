import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { TransformToInt, TransformToBoolean } from '../../../common/utils/form-data-transformers.util';

export class GetProductsDto {
  @ApiProperty({
    description: 'Номер страницы',
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @TransformToInt()
  page?: number = 1;

  @ApiProperty({
    description: 'Количество элементов на странице',
    example: 10,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @TransformToInt()
  limit?: number = 10;

  @ApiProperty({
    description: 'Поиск по названию',
    example: 'молоток',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Фильтр по статусу активности',
    example: true,
    required: false,
  })
  @IsOptional()
  @TransformToBoolean()
  isActive?: boolean;
} 
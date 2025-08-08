import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { PropertyCategory } from '@prisma/client';
import { TransformToFloat, TransformToInt } from '../../../common/utils/form-data-transformers.util';

export class GetCommunityPropertiesDto {
  @ApiProperty({
    description: 'ID сообщества',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  @TransformToInt()
  communityId: number;

  @ApiProperty({
    description: 'Категория объекта недвижимости',
    enum: PropertyCategory,
    example: PropertyCategory.PRIVATE_HOUSE,
    required: false,
  })
  @IsOptional()
  @IsEnum(PropertyCategory)
  category?: PropertyCategory;

  @ApiProperty({
    description: 'Широта для фильтрации по радиусу',
    example: 55.7558,
    required: false,
  })
  @IsOptional()
  @IsLatitude()
  @TransformToFloat()
  latitude?: number;

  @ApiProperty({
    description: 'Долгота для фильтрации по радиусу',
    example: 37.6176,
    required: false,
  })
  @IsOptional()
  @IsLongitude()
  @TransformToFloat()
  longitude?: number;

  @ApiProperty({
    description: 'Радиус поиска в километрах',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @TransformToFloat()
  radius?: number;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PropertyCategory } from '@prisma/client';
import { TransformToFloat } from '../../../common/utils/form-data-transformers.util';

export class UpdatePropertyDto {
  @ApiProperty({
    description: 'Название объекта недвижимости',
    example: 'Мой дом',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Категория объекта недвижимости',
    enum: PropertyCategory,
    example: PropertyCategory.PRIVATE_HOUSE,
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsEnum(PropertyCategory)
  category?: PropertyCategory;

  @ApiProperty({
    description: 'Широта',
    example: 55.7558,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsLatitude()
  @TransformToFloat()
  latitude?: number;

  @ApiProperty({
    description: 'Долгота',
    example: 37.6176,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsLongitude()
  @TransformToFloat()
  longitude?: number;

  @ApiProperty({
    description: 'Фотография объекта недвижимости',
    type: 'string',
    format: 'binary',
    required: false,
  })
  photo?: Express.Multer.File;
}

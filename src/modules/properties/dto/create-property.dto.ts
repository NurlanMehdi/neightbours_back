import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsString,
  MaxLength,
} from 'class-validator';
import { PropertyCategory } from '@prisma/client';
import { TransformToFloat } from '../../../common/utils/form-data-transformers.util';

export class CreatePropertyDto {
  @ApiProperty({
    description: 'Название объекта недвижимости',
    example: 'Мой дом',
    type: 'string',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Категория объекта недвижимости',
    enum: PropertyCategory,
    example: PropertyCategory.PRIVATE_HOUSE,
    type: 'string',
  })
  @IsEnum(PropertyCategory)
  category: PropertyCategory;

  @ApiProperty({
    description: 'Широта объекта недвижимости',
    example: 55.7558,
    type: 'number',
  })
  @IsLatitude()
  @TransformToFloat()
  latitude: number;

  @ApiProperty({
    description: 'Долгота объекта недвижимости',
    example: 37.6176,
    type: 'number',
  })
  @IsLongitude()
  @TransformToFloat()
  longitude: number;

  @ApiProperty({
    description: 'Широта местоположения пользователя',
    example: 55.7558,
    type: 'number',
  })
  @IsLatitude()
  @TransformToFloat()
  userLatitude: number;

  @ApiProperty({
    description: 'Долгота местоположения пользователя',
    example: 37.6176,
    type: 'number',
  })
  @IsLongitude()
  @TransformToFloat()
  userLongitude: number;

  @ApiProperty({
    description: 'Фотография объекта недвижимости',
    type: 'string',
    format: 'binary',
    required: false,
  })
  photo?: Express.Multer.File;
}

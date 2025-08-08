import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyCategory } from '@prisma/client';
import { TransformToFloat, TransformToInt } from '../../../common/utils/form-data-transformers.util';

export class CreatePropertyAdminDto {
  @ApiProperty({
    description: 'Название объекта',
    example: 'Дом на улице Ленина',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Категория объекта',
    enum: PropertyCategory,
    example: PropertyCategory.PRIVATE_HOUSE,
  })
  @IsEnum(PropertyCategory)
  category: PropertyCategory;

  @ApiProperty({
    description: 'Широта',
    example: 55.7558,
  })
  @Type(() => Number)
  @IsNumber()
  @TransformToFloat()
  latitude: number;

  @ApiProperty({
    description: 'Долгота',
    example: 37.6176,
  })
  @Type(() => Number)
  @IsNumber()
  @TransformToFloat()
  longitude: number;

  @ApiProperty({
    description: 'ID пользователя-владельца',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @TransformToInt()
  userId: number;
}

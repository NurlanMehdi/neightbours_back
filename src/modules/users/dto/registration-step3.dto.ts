import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Expose } from 'class-transformer';
import { PropertyCategory } from './property-category.dto';
import { TransformToFloat } from '../../../common/utils/form-data-transformers.util';

export class RegistrationStep3Dto {
  @ApiProperty({
    description: 'Название объекта недвижимости',
    example: 'Дом на улице Ленина',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Категория недвижимости',
    enum: PropertyCategory,
    example: PropertyCategory.PRIVATE_HOUSE,
  })
  @IsEnum(PropertyCategory)
  @IsNotEmpty()
  @Expose()
  category: PropertyCategory;

  @ApiProperty({
    description: 'Широта',
    example: 55.7558,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  @TransformToFloat()
  latitude: number;

  @ApiProperty({
    description: 'Долгота',
    example: 37.6173,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  @TransformToFloat()
  longitude: number;
}

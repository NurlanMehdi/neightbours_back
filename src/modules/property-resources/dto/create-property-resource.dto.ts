import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { TransformToInt } from '../../../common/utils/form-data-transformers.util';

export enum PropertyResourceCategory {
  WELL = 'WELL',
  GENERATOR = 'GENERATOR',
  SEPTIC = 'SEPTIC',
  OTHER = 'OTHER',
}

export class CreatePropertyResourceDto {
  @ApiProperty({
    description: 'Название ресурса',
    example: 'Скважина на участке',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Категория ресурса',
    enum: PropertyResourceCategory,
    example: PropertyResourceCategory.WELL,
  })
  @IsEnum(PropertyResourceCategory)
  category: PropertyResourceCategory;

  @ApiProperty({
    description: 'ID объекта недвижимости',
    example: 1,
  })
  @TransformToInt()
  @IsNumber()
  propertyId: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PropertyResourceCategory } from './create-property-resource.dto';

export class UpdatePropertyResourceDto {
  @ApiProperty({
    description: 'Название ресурса',
    example: 'Скважина на участке',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Категория ресурса',
    enum: PropertyResourceCategory,
    example: PropertyResourceCategory.WELL,
    required: false,
  })
  @IsEnum(PropertyResourceCategory)
  @IsOptional()
  category?: PropertyResourceCategory;
}

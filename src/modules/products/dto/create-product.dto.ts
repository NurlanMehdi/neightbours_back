import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Название продукта',
    example: 'Молоток',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Описание продукта',
    example: 'Качественный молоток для строительных работ',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Цена продукта',
    example: 1500.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({
    description: 'Изображение продукта',
    example: 'product-image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({
    description: 'Активен ли продукт',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

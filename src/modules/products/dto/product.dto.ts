import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ProductDto {
  @ApiProperty({
    description: 'ID продукта',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Название продукта',
    example: 'Молоток',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Описание продукта',
    example: 'Качественный молоток для строительных работ',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Цена продукта',
    example: 1500.5,
    required: false,
  })
  @Expose()
  price?: number;

  @ApiProperty({
    description: 'Изображение продукта',
    example: 'product-image.jpg',
    required: false,
  })
  @Expose()
  image?: string;

  @ApiProperty({
    description: 'Активен ли продукт',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Дата создания',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Дата обновления',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}

export class ProductsListDto {
  @ApiProperty({
    description: 'Список продуктов',
    type: [ProductDto],
  })
  @Expose()
  data: ProductDto[];

  @ApiProperty({
    description: 'Общее количество',
    example: 10,
  })
  @Expose()
  total: number;

  @ApiProperty({
    description: 'Номер текущей страницы',
    example: 1,
  })
  @Expose()
  page: number;

  @ApiProperty({
    description: 'Количество элементов на странице',
    example: 20,
  })
  @Expose()
  limit: number;

  @ApiProperty({
    description: 'Общее количество страниц',
    example: 5,
  })
  @Expose()
  totalPages: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PropertyResourceCategory } from './create-property-resource.dto';

export class PropertyResourceDto {
  @ApiProperty({
    description: 'ID ресурса',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Название ресурса',
    example: 'Скважина на участке',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Фотография ресурса',
    example: 'well_photo.jpg',
    required: false,
  })
  @Expose()
  photo: string | null;

  @ApiProperty({
    description: 'Категория ресурса',
    enum: PropertyResourceCategory,
    example: PropertyResourceCategory.WELL,
  })
  @Expose()
  category: PropertyResourceCategory;

  @ApiProperty({
    description: 'ID объекта недвижимости',
    example: 1,
  })
  @Expose()
  propertyId: number;

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

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PropertyCategory } from '@prisma/client';

export class PropertyAdminDto {
  @ApiProperty({
    description: 'ID объекта',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Название объекта',
    example: 'Дом на улице Ленина',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Категория объекта',
    enum: PropertyCategory,
    example: PropertyCategory.PRIVATE_HOUSE,
  })
  @Expose()
  category: PropertyCategory;

  @ApiProperty({
    description: 'Широта',
    example: 55.7558,
  })
  @Expose()
  latitude: number;

  @ApiProperty({
    description: 'Долгота',
    example: 37.6176,
  })
  @Expose()
  longitude: number;

  @ApiProperty({
    description: 'Фотография объекта',
    example: 'property-photo.jpg',
    required: false,
  })
  @Expose()
  photo?: string;

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

  @ApiProperty({
    description: 'ID пользователя, создавшего объект недвижимости',
    example: 1,
  })
  @Expose()
  createdById: number;

  @ApiProperty({
    description: 'ID владельца',
    example: 1,
  })
  @Expose()
  userId: number;

  @ApiProperty({
    description: 'Имя владельца',
    example: 'Иван Иванов',
  })
  @Expose()
  ownerName: string;

  @ApiProperty({
    description: 'Название сообщества',
    example: 'ЖК Солнечный',
  })
  @Expose()
  communityName: string;

  @ApiProperty({
    description: 'Статус верификации',
    example: true,
  })
  @Expose()
  isVerified: boolean;

  @ApiProperty({
    description: 'Количество подтверждений',
    example: '1/2',
  })
  @Expose()
  confirmations: string;
}

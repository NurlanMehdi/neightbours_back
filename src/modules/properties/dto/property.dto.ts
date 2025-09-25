import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PropertyCategory } from '@prisma/client';

export class PropertyDto {
  @ApiProperty({ description: 'ID объекта недвижимости' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Название объекта недвижимости' })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Категория объекта недвижимости',
    enum: PropertyCategory,
    example: PropertyCategory.PRIVATE_HOUSE,
  })
  @Expose()
  category: PropertyCategory;

  @ApiProperty({ description: 'Широта', example: 55.7558 })
  @Expose()
  latitude: number;

  @ApiProperty({ description: 'Долгота', example: 37.6176 })
  @Expose()
  longitude: number;

  @ApiProperty({ description: 'Фотография объекта', required: false })
  @Expose()
  photo?: string;

  @ApiProperty({
    description: 'Статус подтверждения объекта',
    enum: ['UNVERIFIED', 'VERIFIED'],
    example: 'UNVERIFIED',
  })
  @Expose()
  verificationStatus: string;

  @ApiProperty({
    description: 'Статус кодового подтверждения объекта',
    enum: ['PENDING', 'CONFIRMED', 'EXPIRED'],
    example: 'PENDING',
  })
  @Expose()
  confirmationStatus: string;

  @ApiProperty({
    description: 'Количество подтверждений объекта',
    example: 2,
  })
  @Expose()
  verificationCount: number;

  @ApiProperty({
    description: 'Список ID пользователей, которые подтвердили объект',
    type: [Number],
    example: [1, 2, 3],
  })
  @Expose()
  verifiedUserIds: number[];

  @ApiProperty({
    description: 'ID пользователя, создавшего объект недвижимости',
    example: 1,
  })
  @Expose()
  createdById: number;

  @ApiProperty({
    description: 'Создатель объекта недвижимости (имя и фамилия)',
    type: String,
    required: true,
    example: 'Иван Иванов',
  })
  @Expose()
  createdBy: string;

  @ApiProperty({ description: 'Дата создания объекта недвижимости' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления объекта недвижимости' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Дата подтверждения объекта текущим пользователем',
    required: false,
  })
  @Expose()
  verifiedAt?: Date;
}

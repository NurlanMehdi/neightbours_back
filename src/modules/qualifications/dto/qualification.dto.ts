import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class QualificationDto {
  @ApiProperty({
    description: 'ID квалификации',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Название квалификации',
    example: 'Электрик',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Описание квалификации',
    example: 'Специалист по электромонтажным работам',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Иконка квалификации',
    example: '⚡',
    required: false,
  })
  @Expose()
  icon?: string;

  @ApiProperty({
    description: 'Цвет квалификации',
    example: '#FF5733',
    required: false,
  })
  @Expose()
  color?: string;

  @ApiProperty({
    description: 'Активна ли квалификация',
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

export class QualificationsListDto {
  @ApiProperty({
    description: 'Список квалификаций',
    type: [QualificationDto],
  })
  @Expose()
  data: QualificationDto[];

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
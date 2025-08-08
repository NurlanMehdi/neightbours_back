import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FamilyTypeDto {
  @ApiProperty({ description: 'ID типа семьи' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Название типа семьи' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Описание типа семьи', required: false })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Иконка типа семьи', required: false })
  @Expose()
  icon?: string;

  @ApiProperty({ description: 'Цвет типа семьи', required: false })
  @Expose()
  color?: string;

  @ApiProperty({ description: 'Активен ли тип семьи' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Дата создания' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  @Expose()
  updatedAt: Date;
} 
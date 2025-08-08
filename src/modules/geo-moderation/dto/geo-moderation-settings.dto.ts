import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GeoModerationSettingsDto {
  @ApiProperty({ description: 'ID настроек' })
  @Expose()
  id: number;

  @ApiProperty({ 
    description: 'Включить гео-модерацию вступления в сообщество',
    example: true
  })
  @Expose()
  communityJoinEnabled: boolean;

  @ApiProperty({ 
    description: 'Максимальное расстояние для вступления в сообщество (в метрах)',
    example: 500
  })
  @Expose()
  communityJoinMaxDistance: number;

  @ApiProperty({ 
    description: 'Включить гео-модерацию подтверждения объекта',
    example: true
  })
  @Expose()
  propertyVerificationEnabled: boolean;

  @ApiProperty({ 
    description: 'Максимальное расстояние для подтверждения объекта (в метрах)',
    example: 100
  })
  @Expose()
  propertyVerificationMaxDistance: number;

  @ApiProperty({ 
    description: 'Включить гео-модерацию добавления объекта',
    example: true
  })
  @Expose()
  propertyCreationEnabled: boolean;

  @ApiProperty({ 
    description: 'Максимальное расстояние для добавления объекта (в метрах)',
    example: 100
  })
  @Expose()
  propertyCreationMaxDistance: number;

  @ApiProperty({ description: 'Дата создания' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  @Expose()
  updatedAt: Date;
} 
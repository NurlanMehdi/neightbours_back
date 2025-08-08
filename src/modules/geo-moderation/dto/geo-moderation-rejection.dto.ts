import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// Временный enum до создания миграции
enum GeoModerationAction {
  COMMUNITY_JOIN = 'COMMUNITY_JOIN',
  PROPERTY_VERIFICATION = 'PROPERTY_VERIFICATION',
  PROPERTY_CREATION = 'PROPERTY_CREATION',
}

export class GeoModerationRejectionDto {
  @ApiProperty({ description: 'ID записи об отказе' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'ID пользователя' })
  @Expose()
  userId: number;

  @ApiProperty({ 
    description: 'Тип действия',
    enum: GeoModerationAction,
    example: GeoModerationAction.COMMUNITY_JOIN
  })
  @Expose()
  action: GeoModerationAction;

  @ApiProperty({ 
    description: 'Фактическое расстояние в метрах',
    example: 620
  })
  @Expose()
  distance: number;

  @ApiProperty({ 
    description: 'Максимально допустимое расстояние в метрах',
    example: 500
  })
  @Expose()
  maxDistance: number;

  @ApiProperty({ 
    description: 'Причина отказа',
    example: 'Радиус > 500м'
  })
  @Expose()
  reason: string;

  @ApiProperty({ 
    description: 'Широта пользователя',
    example: 55.7558,
    required: false
  })
  @Expose()
  userLatitude?: number;

  @ApiProperty({ 
    description: 'Долгота пользователя',
    example: 37.6176,
    required: false
  })
  @Expose()
  userLongitude?: number;

  @ApiProperty({ 
    description: 'Широта цели',
    example: 55.7558,
    required: false
  })
  @Expose()
  targetLatitude?: number;

  @ApiProperty({ 
    description: 'Долгота цели',
    example: 37.6176,
    required: false
  })
  @Expose()
  targetLongitude?: number;

  @ApiProperty({ description: 'Дата создания' })
  @Expose()
  createdAt: Date;

  // Информация о пользователе
  @ApiProperty({ 
    description: 'Информация о пользователе',
    type: 'object',
    properties: {
      id: { type: 'number' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      phone: { type: 'string' }
    }
  })
  @Expose()
  @Type(() => Object)
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
} 
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateCommunityResponseDto {
  @ApiProperty({
    description: 'ID сообщества',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Название сообщества',
    example: 'Мой район',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Статус сообщества',
    example: 'INACTIVE',
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'Код для присоединения',
    example: '123456',
  })
  @Expose()
  joinCode: string;

  @ApiProperty({
    description: 'Срок подтверждения',
    example: '2024-01-01T12:00:00Z',
  })
  @Expose()
  confirmationDeadline: Date;

  @ApiProperty({
    description: 'Широта местоположения',
    example: 55.7558,
    required: false,
  })
  @Expose()
  latitude?: number;

  @ApiProperty({
    description: 'Долгота местоположения',
    example: 37.6173,
    required: false,
  })
  @Expose()
  longitude?: number;
}

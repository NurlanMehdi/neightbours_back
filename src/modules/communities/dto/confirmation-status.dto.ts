import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ConfirmationStatusDto {
  @ApiProperty({
    description: 'Статус сообщества',
    example: 'INACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'Дедлайн подтверждения',
    example: '2024-10-03T18:56:27.000Z',
    nullable: true,
  })
  @Expose()
  deadline: Date | null;

  @ApiProperty({
    description: 'Количество присоединившихся пользователей',
    example: 1,
  })
  @Expose()
  joinedCount: number;

  @ApiProperty({
    description: 'Требуемое количество пользователей для подтверждения',
    example: 2,
  })
  @Expose()
  requiredCount: number;

  @ApiProperty({
    description: 'Дата подтверждения',
    example: '2024-10-03T18:56:27.000Z',
    nullable: true,
  })
  @Expose()
  confirmedAt: Date | null;
}


import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class JoinByCodeResponseDto {
  @ApiProperty({
    description: 'ID сообщества',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Название сообщества',
    example: 'ЖК "Солнечный"',
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
    description: 'Количество присоединившихся пользователей',
    example: 1,
  })
  @Expose()
  joinedCount: number;

  @ApiProperty({
    description: 'Требуемое количество пользователей',
    example: 2,
  })
  @Expose()
  requiredCount: number;
}


import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class JoinCommunityResponseDto {
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

  @ApiProperty({
    description: 'Статус сообщества',
    example: 'INACTIVE',
  })
  @Expose()
  status: string;
}

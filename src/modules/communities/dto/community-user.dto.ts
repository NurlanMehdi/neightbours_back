import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CommunityUserDto {
  @ApiProperty({
    description: 'ID пользователя',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'ФИО пользователя',
    example: 'Иван Иванов',
  })
  @Expose()
  fullName: string;

  @ApiProperty({
    description: 'Аватар пользователя',
    example: 'avatars/123.jpg',
    nullable: true,
  })
  @Expose()
  avatar: string | null;
} 
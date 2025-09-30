import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserGender } from '@prisma/client';
import { IsOptional } from 'class-validator';
import { CommunityShortDto } from '../../communities/dto/community-short.dto';

@Exclude()
export class UserInfoDto {
  @Expose()
  @ApiProperty({ description: 'ID пользователя', example: 1 })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван',
    nullable: true,
  })
  firstName: string | null;

  @Expose()
  @ApiProperty({
    description: 'Фамилия пользователя',
    example: 'Иванов',
    nullable: true,
  })
  lastName: string | null;

  @Expose()
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
    nullable: true,
  })
  email: string | null;

  @Expose()
  @ApiProperty({
    description: 'Путь к аватару',
    example: 'avatars/123.jpg',
    nullable: true,
  })
  avatar: string | null;

  @Expose()
  @ApiProperty({
    description: 'Дата создания',
    example: '2024-03-20T12:00:00Z',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'Подтвержден ли пользователь', example: true })
  isVerified: boolean;

  @Expose()
  @ApiProperty({
    description: 'ID активной блокировки (если есть)',
    example: 42,
    nullable: true,
  })
  blockingId: number | null;

  @Expose()
  @ApiProperty({
    description: 'Пол пользователя',
    enum: UserGender,
    nullable: true,
  })
  gender: UserGender | null;

  @Expose()
  @ApiProperty({
    description: 'Дата рождения',
    example: '1990-01-01',
    nullable: true,
  })
  birthDate: Date | null;

  @Expose()
  @IsOptional()
  @ApiProperty({
    description: 'Список общих сообществ с текущим пользователем (если есть)',
    type: [CommunityShortDto],
    required: false,
    example: [
      { id: 2, name: 'Тестовое сообщество "Центр"' },
      { id: 3, name: 'ЖК Солнечный' },
    ],
  })
  communities?: CommunityShortDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO для пользователя в списке выбора
 */
export class UserSelectionDto {
  @Expose()
  @ApiProperty({
    description: 'ID пользователя',
    example: 1,
  })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'Полное имя пользователя',
    example: 'Иван Иванов',
  })
  fullName: string;

  @Expose()
  @ApiProperty({
    description: 'Email пользователя',
    example: 'ivan@example.com',
  })
  email: string;

  @Expose()
  @ApiProperty({
    description: 'Аватар пользователя',
    example: 'avatars/123.jpg',
    nullable: true,
  })
  avatar: string | null;
}

/**
 * DTO для списка пользователей для выбора
 */
export class UsersSelectionDto {
  @Expose()
  @ApiProperty({
    description: 'Список пользователей',
    type: [UserSelectionDto],
  })
  users: UserSelectionDto[];
}

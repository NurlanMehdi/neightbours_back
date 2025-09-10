import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CommunityInfoDto {
  @ApiProperty({
    description: 'Идентификатор сообщества',
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
    description: 'Количество пользователей в сообществе',
    example: 25,
  })
  @Expose()
  numberOfUsers: number;

  @ApiProperty({
    description: 'Статус сообщества',
    example: 'ACTIVE',
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'Код для присоединения к сообществу',
    example: '123456',
  })
  @Expose()
  joinCode: string;

  @ApiProperty({
    description: 'ФИО создателя сообщества',
    example: 'Иван Иванов',
  })
  @Expose()
  createdBy: string;

  @ApiProperty({
    description: 'Дата создания сообщества',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Описание сообщества',
    example: 'Описание нашего района',
    required: false,
  })
  @Expose()
  description?: string;
}

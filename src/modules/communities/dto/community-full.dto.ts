import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  CommunityStatus,
  PropertyCategory,
  PropertyVerificationStatus,
  EventCategory,
  EventType,
} from '@prisma/client';

export class CommunityUserFullDto {
  @ApiProperty({ description: 'ID пользователя' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Имя пользователя' })
  @Expose()
  firstName: string;

  @ApiProperty({ description: 'Фамилия пользователя' })
  @Expose()
  lastName: string;

  @ApiProperty({ description: 'Номер телефона' })
  @Expose()
  phone: string;

  @ApiProperty({ description: 'Email пользователя' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Роль пользователя' })
  @Expose()
  role: string;

  @ApiProperty({ description: 'Статус пользователя' })
  @Expose()
  status: string;

  @ApiProperty({ description: 'Аватар пользователя' })
  @Expose()
  avatar: string | null;

  @ApiProperty({ description: 'Дата регистрации' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Объекты недвижимости пользователя' })
  @Expose()
  properties: {
    id: number;
    name: string;
    category: PropertyCategory;
    verificationStatus: PropertyVerificationStatus;
    verifiedUserIds: number[];
  }[];
}

export class CommunityEventDto {
  @ApiProperty({ description: 'ID события' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Название события' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Описание события' })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Категория события' })
  @Expose()
  category: EventCategory;

  @ApiProperty({ description: 'Тип события' })
  @Expose()
  type: EventType;

  @ApiProperty({ description: 'Создатель события' })
  @Expose()
  creator: {
    id: number;
    firstName: string;
    lastName: string;
  };

  @ApiProperty({ description: 'Участники события' })
  @Expose()
  participants: {
    id: number;
    firstName: string;
    lastName: string;
  }[];

  @ApiProperty({ description: 'Дата создания события' })
  @Expose()
  createdAt: Date;
}

export class CommunityFullDto {
  @ApiProperty({ description: 'ID сообщества' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Название сообщества' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Описание сообщества' })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Статус сообщества' })
  @Expose()
  status: CommunityStatus;

  @ApiProperty({ description: 'Создатель сообщества' })
  @Expose()
  creator: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    role: string;
    status: string;
    createdAt: Date;
  };

  @ApiProperty({ description: 'Участники сообщества' })
  @Expose()
  users: CommunityUserFullDto[];

  @ApiProperty({ description: 'События сообщества' })
  @Expose()
  events: CommunityEventDto[];

  @ApiProperty({ description: 'Количество участников' })
  @Expose()
  numberOfUsers: number;

  @ApiProperty({ description: 'Количество событий' })
  @Expose()
  numberOfEvents: number;

  @ApiProperty({ description: 'Дата создания сообщества' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Широта' })
  @Expose()
  @Transform(({ value }) => (value ? Number(value) : null))
  latitude: number;

  @ApiProperty({ description: 'Долгота' })
  @Expose()
  @Transform(({ value }) => (value ? Number(value) : null))
  longitude: number;

  @ApiProperty({ description: 'Приватное ли сообщество' })
  @Expose()
  isPrivate: boolean;

  @ApiProperty({ description: 'Код для присоединения' })
  @Expose()
  joinCode: string | null;

  @ApiProperty({
    description: 'Крайний срок подтверждения сообщества',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @Expose()
  confirmationDeadline: Date | null;

  @ApiProperty({
    description: 'Дата и время подтверждения сообщества',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @Expose()
  confirmedAt: Date | null;
}

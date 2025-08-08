import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { UserGender, UserRole, UserStatus } from '@prisma/client';
import { CommunityDto } from '../../communities/dto/community.dto';
import { PropertyDto } from '../../properties/dto/property.dto';
import { IsOptional } from 'class-validator';
import { QualificationDto } from '../../qualifications/dto/qualification.dto';
import { ProductDto } from '../../products/dto/product.dto';
import { FamilyTypeDto } from '../../family-types/dto/family-type.dto';

@Exclude()
export class UserDto {
  @Expose()
  @ApiProperty({
    description: 'ID пользователя',
    example: 1,
  })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван',
  })
  firstName: string;

  @Expose()
  @ApiProperty({
    description: 'Фамилия пользователя',
    example: 'Иванов',
  })
  lastName: string;

  @Expose()
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  email: string;

  @Expose()
  @ApiProperty({
    description: 'Номер телефона',
    example: '79001234567',
  })
  phone: string;

  @Expose()
  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    example: UserRole.USER,
  })
  role: UserRole;

  @Expose()
  @ApiProperty({
    description: 'Статус пользователя',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Expose()
  @ApiProperty({
    description: 'Дата последнего доступа',
    example: '2024-03-20T12:00:00Z',
    nullable: true,
  })
  lastAccess: Date | null;

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
  @ApiProperty({
    description: 'Дата обновления',
    example: '2024-03-20T12:00:00Z',
  })
  updatedAt: Date;

  @Expose()
  @ApiProperty({
    description: 'Подтвержден ли пользователь',
    example: true,
  })
  isVerified: boolean;

  @Expose()
  @ApiProperty({
    description: 'Логин пользователя',
    example: 'ivanov',
    nullable: true,
  })
  login: string | null;

  @Expose()
  @ApiProperty({
    description: 'ID блокировки',
    example: 1,
    nullable: true,
  })
  blockingId: number | null;

  @Expose()
  @ApiProperty({
    description: 'Пол пользователя',
    enum: UserGender,
    example: UserGender.MALE,
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

  @Exclude()
  password: string | null;

  @Expose()
  smsCode: string;

  @Exclude()
  smsCodeExpiresAt: Date;

  @Exclude()
  Blocking: any[];

  @ApiProperty({
    description: 'Шаг регистрации',
    example: 1,
  })
  @Expose()
  registrationStep: number;

  @Expose()
  @ApiProperty({
    description: 'Сообщества пользователя',
    type: [CommunityDto],
    example: [
      {
        id: 1,
        name: 'Мой дом',
        description: 'Сообщество жителей дома',
        numberOfUsers: 100,
        status: 'ACTIVE',
        createdBy: 'Иван Иванов',
        createdAt: '2024-03-20T12:00:00Z',
        communityJoinCode: '123456',
        communityName: 'Мой район',
        isNewCommunity: true,
      },
    ],
  })
  communities: CommunityDto[];

  @Exclude()
  Communities: any[];

  @Expose()
  @ApiProperty({
    description: 'Широта местоположения',
    example: 55.7558,
    nullable: true,
  })
  @Transform(({ value }) => (value ? Number(value) : null))
  latitude: number | null;

  @Expose()
  @ApiProperty({
    description: 'Долгота местоположения',
    example: 37.6173,
    nullable: true,
  })
  @Transform(({ value }) => (value ? Number(value) : null))
  longitude: number | null;

  @Expose()
  @ApiProperty({
    description: 'Адрес',
    example: 'ул. Пушкина, д. 10',
    nullable: true,
  })
  address: string | null;

  @Expose()
  @IsOptional()
  @ApiProperty({
    description: 'Объекты недвижимости пользователя',
    type: [PropertyDto],
    required: false,
  })
  properties?: PropertyDto[];

  @Expose()
  @IsOptional()
  @ApiProperty({
    description: 'Квалификации пользователя',
    type: [QualificationDto],
    required: false,
  })
  qualifications?: QualificationDto[];

  @Expose()
  @IsOptional()
  @ApiProperty({
    description: 'Продукты пользователя',
    type: [ProductDto],
    required: false,
  })
  products?: ProductDto[];

  @Expose()
  @ApiProperty({
    description: 'Сообщества, созданные пользователем',
    type: [CommunityDto],
    required: false,
  })
  createdCommunities?: CommunityDto[];

  @Expose()
  @ApiProperty({
    description: 'Тип семьи пользователя',
    type: FamilyTypeDto,
    required: false,
    nullable: true,
  })
  familyType?: FamilyTypeDto | null;
}

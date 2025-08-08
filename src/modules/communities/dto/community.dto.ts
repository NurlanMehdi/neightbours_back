import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { CommunityStatus } from '@prisma/client';

export class CommunityDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty()
  @Expose()
  numberOfUsers: number;

  @ApiProperty()
  @Expose()
  status: CommunityStatus;

  @ApiProperty({
    description: 'ФИО создателя сообщества',
    example: 'Иван Иванов'
  })
  @Expose()
  createdBy: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => (value ? Number(value) : null))
  latitude: number;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => (value ? Number(value) : null))
  longitude: number;

  @ApiProperty()
  @Expose()
  isPrivate: boolean;

  @ApiProperty()
  @Expose()
  joinCode: string | null;

  @ApiProperty({
    description: 'Код для присоединения к сообществу',
    example: '123456',
    required: false,
  })
  @Expose()
  communityJoinCode?: string;

  @ApiProperty({
    description: 'Название сообщества',
    example: 'Мой район',
    required: false,
  })
  @Expose()
  communityName?: string;

  @ApiProperty({
    description: 'Было ли создано новое сообщество',
    example: true,
    required: false,
  })
  @Expose()
  isNewCommunity?: boolean;
}

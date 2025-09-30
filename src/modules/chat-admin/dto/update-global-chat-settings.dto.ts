import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, Min, Max, IsPositive } from 'class-validator';

export class UpdateGlobalChatSettingsDto {
  @ApiProperty({
    description: 'Разрешить чаты сообществ',
    example: true,
  })
  @IsBoolean()
  allowCommunityChat: boolean;

  @ApiProperty({
    description: 'Разрешить чаты событий',
    example: true,
  })
  @IsBoolean()
  allowEventChat: boolean;

  @ApiProperty({
    description: 'Разрешить приватные чаты',
    example: true,
  })
  @IsBoolean()
  allowPrivateChat: boolean;

  @ApiProperty({
    description:
      '0 = never delete messages, otherwise number of days (1–3650).',
    example: 365,
    minimum: 0,
    maximum: 3650,
  })
  @IsInt()
  @Min(0)
  @Max(3650)
  messageRetentionDays: number;

  @ApiProperty({
    description: 'Максимальная длина сообщения',
    example: 1000,
    minimum: 100,
    maximum: 10000,
  })
  @IsInt()
  @IsPositive()
  @Min(100)
  @Max(10000)
  maxMessageLength: number;

  @ApiProperty({
    description: 'Включена ли модерация',
    example: true,
  })
  @IsBoolean()
  moderationEnabled: boolean;
}

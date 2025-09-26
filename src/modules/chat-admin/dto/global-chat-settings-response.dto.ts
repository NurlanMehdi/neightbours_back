import { ApiProperty } from '@nestjs/swagger';

export class GlobalChatSettingsDto {
  @ApiProperty({ 
    description: 'Разрешить чаты сообществ', 
    example: true 
  })
  allowCommunityChat: boolean;

  @ApiProperty({ 
    description: 'Разрешить чаты событий', 
    example: true 
  })
  allowEventChat: boolean;

  @ApiProperty({ 
    description: 'Разрешить приватные чаты', 
    example: true 
  })
  allowPrivateChat: boolean;

  @ApiProperty({ 
    description: 'Количество дней хранения сообщений', 
    example: 365
  })
  messageRetentionDays: number;

  @ApiProperty({ 
    description: 'Максимальная длина сообщения', 
    example: 1000
  })
  maxMessageLength: number;

  @ApiProperty({ 
    description: 'Включена ли модерация', 
    example: true 
  })
  moderationEnabled: boolean;
}

export class GlobalChatSettingsResponseDto {
  @ApiProperty({ 
    description: 'Глобальные настройки чата',
    type: GlobalChatSettingsDto
  })
  globalSettings: GlobalChatSettingsDto;
}

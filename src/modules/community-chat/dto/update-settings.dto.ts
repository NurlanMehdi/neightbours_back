import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateCommunityChatSettingsDto {
  @ApiPropertyOptional({ description: 'Включен ли чат', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Произвольные настройки чата' })
  @IsOptional()
  settings?: Record<string, any>;
}


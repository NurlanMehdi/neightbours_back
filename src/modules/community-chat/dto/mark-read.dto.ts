import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class MarkCommunityReadDto {
  @ApiPropertyOptional({ description: 'Отметить прочитанным до указанного сообщения (включительно)' })
  @IsOptional()
  @IsInt()
  upToMessageId?: number;
}


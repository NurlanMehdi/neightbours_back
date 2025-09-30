import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class MarkMessagesReadDto {
  @ApiProperty({ description: 'ID диалога', example: 1 })
  @IsInt()
  @Min(1)
  conversationId: number;

  @ApiPropertyOptional({
    description: 'До какого сообщения отметить как прочитанные (включительно)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  upToMessageId?: number;
}

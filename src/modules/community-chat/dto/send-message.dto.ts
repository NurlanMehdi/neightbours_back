import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendCommunityMessageDto {
  @ApiProperty({ description: 'Текст сообщения', example: 'Привет, соседи!' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ description: 'ID сообщения, на которое отвечаем' })
  @IsOptional()
  @IsInt()
  replyToMessageId?: number;
}


import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Текст сообщения',
    example: 'Привет всем!',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'ID of parent message being replied to',
  })
  @IsOptional()
  @IsInt()
  replyToMessageId?: number;
}

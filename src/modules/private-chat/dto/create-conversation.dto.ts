import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'ID пользователя-собеседника', example: 2 })
  @IsInt()
  @Min(1)
  receiverId: number;
}


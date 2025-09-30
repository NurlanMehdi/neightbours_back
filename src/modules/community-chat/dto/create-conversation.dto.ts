import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateCommunityConversationDto {
  @ApiProperty({ description: 'ID сообщества', example: 1 })
  @IsInt()
  communityId: number;
}

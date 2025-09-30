import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MessageUserDto {
  @ApiProperty() id: number;
  @ApiProperty({ required: false }) firstName?: string;
  @ApiProperty({ required: false }) lastName?: string;
  @ApiProperty({ required: false }) avatar?: string | null;
}

export class CommunityMessageDto {
  @ApiProperty() id: number;
  @ApiProperty() communityId: number;
  @ApiProperty() userId: number;
  @ApiProperty() text: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional({ description: 'Родительское сообщение' })
  replyTo?: Partial<CommunityMessageDto> | null;
  @ApiProperty({ type: MessageUserDto }) user: MessageUserDto;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PrivateMessageUserDto {
  @ApiProperty() id: number;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiPropertyOptional({ required: false }) avatar?: string | null;
}

export class PrivateMessageDto {
  @ApiProperty() id: number;
  @ApiProperty() conversationId: number;
  @ApiProperty() senderId: number;
  @ApiProperty() text: string;
  @ApiPropertyOptional({ description: 'ID сообщения, на которое отвечают' })
  replyToMessageId?: number | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() isDeleted: boolean;
  @ApiPropertyOptional({ description: 'Родительское сообщение' })
  replyTo?: Partial<PrivateMessageDto> | null;
  @ApiProperty({ type: PrivateMessageUserDto }) user: PrivateMessageUserDto;
}

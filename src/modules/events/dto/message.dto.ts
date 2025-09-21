import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReplyMessageDto {
  @ApiProperty() id: number;
  @ApiProperty() text: string;
  @ApiProperty() userId: number;
}

class EventMessageUserDto {
  @ApiProperty() id: number;
  @ApiPropertyOptional() firstName?: string;
  @ApiPropertyOptional() lastName?: string;
  @ApiPropertyOptional() avatar?: string | null;
}

export class EventMessageDto {
  @ApiProperty() id: number;
  @ApiProperty() text: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() eventId: number;
  @ApiProperty() userId: number;
  @ApiPropertyOptional({ type: () => ReplyMessageDto }) replyTo?: ReplyMessageDto | null;
  @ApiProperty({ type: EventMessageUserDto }) user: EventMessageUserDto;
}


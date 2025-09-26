import { ApiProperty } from '@nestjs/swagger';
import { AdminChatType } from './messages-query.dto';

export class ModerationMessageDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  chatId!: number;

  @ApiProperty({ enum: AdminChatType })
  chatType!: AdminChatType;

  @ApiProperty()
  chatName!: string;

  @ApiProperty({ nullable: true })
  communityId!: number | null;

  @ApiProperty({ nullable: true })
  eventId!: number | null;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  userName!: string;

  @ApiProperty({ nullable: true })
  userAvatar!: string | null;

  @ApiProperty()
  text!: string;

  @ApiProperty()
  isDeleted!: boolean;

  @ApiProperty()
  createdAt!: Date;
}

export class ModerationMessagesResponseDto {
  @ApiProperty({ type: [ModerationMessageDto] })
  data!: ModerationMessageDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}


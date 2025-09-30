import { IsInt, IsPositive } from 'class-validator';

export class LeavePrivateChatDto {
  @IsInt()
  @IsPositive()
  conversationId: number;
}


import { IsInt, IsPositive } from 'class-validator';

export class JoinPrivateChatDto {
  @IsInt()
  @IsPositive()
  conversationId: number;
}


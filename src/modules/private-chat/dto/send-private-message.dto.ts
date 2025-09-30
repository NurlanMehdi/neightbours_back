import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class SendPrivateMessageDto {
  @IsInt()
  @IsPositive()
  conversationId: number;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  replyToMessageId?: number;
}

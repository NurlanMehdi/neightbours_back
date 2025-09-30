import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class SendCommunityMessageDto {
  @IsInt()
  @IsPositive()
  communityId: number;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  replyToMessageId?: number;
}

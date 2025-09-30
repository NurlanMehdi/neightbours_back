import { IsInt, IsPositive } from 'class-validator';

export class JoinCommunityDto {
  @IsInt()
  @IsPositive()
  communityId: number;
}

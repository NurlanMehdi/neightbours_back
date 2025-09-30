import { IsInt, IsPositive } from 'class-validator';

export class LeaveCommunityDto {
  @IsInt()
  @IsPositive()
  communityId: number;
}

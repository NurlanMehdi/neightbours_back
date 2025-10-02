import { IsInt, Min } from 'class-validator';

/**
 * DTO для включения/выключения авточтения сообщества
 */
export class AutoReadCommunityDto {
  @IsInt()
  @Min(1)
  communityId: number;
}



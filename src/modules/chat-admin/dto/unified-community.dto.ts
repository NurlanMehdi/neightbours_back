import { ApiProperty } from '@nestjs/swagger';

export class UnifiedCommunityDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['COMMUNITY', 'EVENT'] })
  type!: 'COMMUNITY' | 'EVENT';

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  status!: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ nullable: true })
  communityId!: number | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  messageCount!: number;

  @ApiProperty()
  participantCount!: number;
}

export class UnifiedCommunitiesResponseDto {
  @ApiProperty({ type: [UnifiedCommunityDto] })
  data!: UnifiedCommunityDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}

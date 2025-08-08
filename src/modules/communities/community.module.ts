import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunityRepository } from './repositories/community.repository';
import { CommunityService } from './services/community.service';
import { CommunitiesAdminController } from './controllers/communities.admin.controller';
import { GeoModerationModule } from '../geo-moderation/geo-moderation.module';

@Module({
  imports: [GeoModerationModule],
  controllers: [CommunitiesAdminController],
  providers: [CommunityRepository, PrismaService, CommunityService],
  exports: [CommunityRepository, CommunityService],
})
export class CommunityModule {}

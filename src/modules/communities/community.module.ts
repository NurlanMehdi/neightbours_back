import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunityRepository } from './repositories/community.repository';
import { CommunityService } from './services/community.service';
import { CommunitiesAdminController } from './controllers/communities.admin.controller';
import { CommunitiesController } from './controllers/communities.controller';
import { GeoModerationModule } from '../geo-moderation/geo-moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommunityConfirmationService } from './services/community-confirmation.service';
import { CommunityConfirmationCron } from './cron/community-confirmation.cron';

@Module({
  imports: [GeoModerationModule, NotificationsModule],
  controllers: [CommunitiesAdminController, CommunitiesController],
  providers: [
    CommunityRepository,
    PrismaService,
    CommunityService,
    CommunityConfirmationService,
    CommunityConfirmationCron,
  ],
  exports: [CommunityRepository, CommunityService],
})
export class CommunityModule {}

import { Module } from '@nestjs/common';
import { GeoModerationAdminController } from './controllers/geo-moderation-admin.controller';
import { GeoModerationService } from './services/geo-moderation.service';
import { GeoModerationRepository } from './repositories/geo-moderation.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GeoModerationAdminController],
  providers: [GeoModerationService, GeoModerationRepository],
  exports: [GeoModerationService],
})
export class GeoModerationModule {}

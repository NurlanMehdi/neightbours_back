import { Module } from '@nestjs/common';
import { PropertiesAdminController } from './controllers/properties-admin.controller';
import { PropertiesController } from './controllers/properties.controller';
import { PropertyService } from './services/property.service';
import { PropertyConfirmationService } from './services/property-confirmation.service';
import { PropertyConfirmationCronService } from './services/property-confirmation-cron.service';
import { PropertyRepository } from './repositories/property.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { MulterConfigModule } from '../files/multer.module';
import { GeoModerationModule } from '../geo-moderation/geo-moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    MulterConfigModule,
    GeoModerationModule,
    NotificationsModule,
  ],
  controllers: [PropertiesAdminController, PropertiesController],
  providers: [
    PropertyService,
    PropertyRepository,
    UserRepository,
    PropertyConfirmationService,
    PropertyConfirmationCronService,
  ],
  exports: [PropertyService],
})
export class PropertiesModule {}

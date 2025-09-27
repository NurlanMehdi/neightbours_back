import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UserRepository } from './repositories/user.repository';
import { ProfileDeletionRepository } from './repositories/profile-deletion.repository';
import { UsersController } from './controllers/users.controller';
import { UsersAdminController } from './controllers/users-admin.controller';
import { ProfileDeletionController } from './controllers/profile-deletion.controller';
import { FilesModule } from '../files/files.module';
import { CommunityService } from '../communities/services/community.service';
import { CommunityRepository } from '../communities/repositories/community.repository';
import { UserService } from './services/user.service';
import { ProfileDeletionService } from './services/profile-deletion.service';
import { ProfileDeletionCronService } from './services/profile-deletion-cron.service';
import { ProfileDeletionNotificationService } from './services/profile-deletion-notification.service';
import { ProfileDeletionGateway } from './gateways/profile-deletion.gateway';
import { PropertyRepository } from '../properties/repositories/property.repository';
import { EventsRepository } from '../events/repositories/events.repository';
import { GeoModerationModule } from '../geo-moderation/geo-moderation.module';
import { QualificationsModule } from '../qualifications/qualifications.module';
import { ProductsModule } from '../products/products.module';
import { FamilyTypesModule } from '../family-types/family-types.module';
import { SmsService } from '../auth/services/sms.service';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsModule } from '../notifications/notifications.module';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [
    FilesModule,
    GeoModerationModule,
    QualificationsModule,
    ProductsModule,
    FamilyTypesModule,
    PropertiesModule,
    ScheduleModule.forRoot(),
    JwtModule.register({}),
    NotificationsModule,
  ],
  controllers: [
    UsersController,
    UsersAdminController,
    ProfileDeletionController,
  ],
  providers: [
    UserRepository,
    ProfileDeletionRepository,
    UserService,
    ProfileDeletionService,
    ProfileDeletionCronService,
    ProfileDeletionNotificationService,
    ProfileDeletionGateway,
    SmsService,
    CommunityRepository,
    CommunityService,
    PropertyRepository,
    EventsRepository,
  ],
  exports: [UserRepository, ProfileDeletionRepository, UserService],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { UsersController } from './controllers/users.controller';
import { UsersAdminController } from './controllers/users-admin.controller';
import { FilesModule } from '../files/files.module';
import { CommunityService } from '../communities/services/community.service';
import { CommunityRepository } from '../communities/repositories/community.repository';
import { UserService } from './services/user.service';
import { PropertyRepository } from '../properties/repositories/property.repository';
import { EventsRepository } from '../events/repositories/events.repository';
import { GeoModerationModule } from '../geo-moderation/geo-moderation.module';
import { QualificationsModule } from '../qualifications/qualifications.module';
import { ProductsModule } from '../products/products.module';
import { FamilyTypesModule } from '../family-types/family-types.module';

@Module({
  imports: [FilesModule, GeoModerationModule, QualificationsModule, ProductsModule, FamilyTypesModule],
  controllers: [UsersController, UsersAdminController],
  providers: [
    UserRepository,
    UserService,
    CommunityRepository,
    CommunityService,
    PropertyRepository,
    EventsRepository,
  ],
  exports: [UserRepository],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { PropertiesAdminController } from './controllers/properties-admin.controller';
import { PropertiesController } from './controllers/properties.controller';
import { PropertyService } from './services/property.service';
import { PropertyRepository } from './repositories/property.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { MulterConfigModule } from '../files/multer.module';
import { GeoModerationModule } from '../geo-moderation/geo-moderation.module';

@Module({
  imports: [PrismaModule, MulterConfigModule, GeoModerationModule],
  controllers: [PropertiesAdminController, PropertiesController],
  providers: [PropertyService, PropertyRepository, UserRepository],
  exports: [PropertyService],
})
export class PropertiesModule {}

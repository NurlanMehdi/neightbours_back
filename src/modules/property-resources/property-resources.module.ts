import { Module } from '@nestjs/common';
import { PropertyResourcesController } from './controllers/property-resources.controller';
import { PropertyResourceService } from './services/property-resource.service';
import { PropertyResourceRepository } from './repositories/property-resource.repository';
import { PropertyRepository } from '../properties/repositories/property.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { MulterConfigModule } from '../files/multer.module';

@Module({
  imports: [PrismaModule, MulterConfigModule],
  controllers: [PropertyResourcesController],
  providers: [
    PropertyResourceService,
    PropertyResourceRepository,
    PropertyRepository,
  ],
  exports: [PropertyResourceService],
})
export class PropertyResourcesModule {}

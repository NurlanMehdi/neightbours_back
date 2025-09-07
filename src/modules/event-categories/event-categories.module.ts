import { Module } from '@nestjs/common';
import { EventCategoriesController } from './event-categories.controller';
import { EventCategoriesPublicController } from './controllers/event-categories-public.controller';
import { EventCategoriesService } from './event-categories.service';
import { EventCategoriesRepository } from './repositories/event-categories.repository';
import { MulterConfigModule } from '../files/multer.module';

@Module({
  imports: [MulterConfigModule],
  controllers: [EventCategoriesController, EventCategoriesPublicController],
  providers: [EventCategoriesService, EventCategoriesRepository],
  exports: [EventCategoriesService],
})
export class EventCategoriesModule {}

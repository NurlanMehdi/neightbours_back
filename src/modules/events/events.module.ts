import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventsAdminController } from './controllers/events.admin.controller';
import { EventsRepository } from './repositories/events.repository';
import { EventMessagesRepository } from './repositories/event-messages.repository';
import { VotingRepository } from './repositories/voting.repository';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';
import { MulterConfigModule } from '../files/multer.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
    MulterConfigModule,
  ],
  controllers: [EventsController, EventsAdminController],
  providers: [
    EventsService,
    EventsRepository,
    EventMessagesRepository,
    VotingRepository,
    EventsGateway,
  ],
  exports: [EventsService, EventsGateway],
})
export class EventsModule {}

import { Module } from '@nestjs/common';
import { QualificationsController } from './controllers/qualifications.controller';
import { QualificationsUserController } from './controllers/qualifications-public.controller';
import { QualificationsService } from './services/qualifications.service';
import { QualificationsRepository } from './repositories/qualifications.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QualificationsController, QualificationsUserController],
  providers: [QualificationsService, QualificationsRepository],
  exports: [QualificationsService],
})
export class QualificationsModule {} 
import { Module } from '@nestjs/common';
import { DocumentsController } from './controllers/documents.controller';
import { DocumentService } from './services/document.service';
import { DocumentRepository } from './repositories/document.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [DocumentService, DocumentRepository],
  exports: [DocumentService],
})
export class DocumentsModule {}
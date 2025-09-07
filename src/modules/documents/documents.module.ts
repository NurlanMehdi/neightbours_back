import { Module } from '@nestjs/common';
import { DocumentsController } from './controllers/documents.controller';
import { DocumentsAdminController } from './controllers/documents-admin.controller';
import { DocumentService } from './services/document.service';
import { DocumentRepository } from './repositories/document.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController, DocumentsAdminController],
  providers: [DocumentService, DocumentRepository],
  exports: [DocumentService],
})
export class DocumentsModule {}

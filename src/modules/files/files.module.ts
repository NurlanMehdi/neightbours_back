import { Module } from '@nestjs/common';
import { FilesService } from './services/files.service';
import { FilesController } from './controllers/files.controller';
import { MulterConfigModule } from './multer.module';

@Module({
  imports: [MulterConfigModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService, MulterConfigModule],
})
export class FilesModule {}

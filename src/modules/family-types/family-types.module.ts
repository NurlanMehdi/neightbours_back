import { Module } from '@nestjs/common';
import { FamilyTypesController } from './controllers/family-types.controller';
import { FamilyTypesPublicController } from './controllers/family-types-public.controller';
import { FamilyTypesService } from './family-types.service';
import { FamilyTypesRepository } from './repositories/family-types.repository';

@Module({
  controllers: [FamilyTypesController, FamilyTypesPublicController],
  providers: [FamilyTypesService, FamilyTypesRepository],
  exports: [FamilyTypesService],
})
export class FamilyTypesModule {} 
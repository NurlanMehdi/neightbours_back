import { Module } from '@nestjs/common';
import { ProductsController } from './controllers/products.controller';
import { ProductsUserController } from './controllers/products-public.controller';
import { ProductsService } from './services/products.service';
import { ProductsRepository } from './repositories/products.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController, ProductsUserController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService],
})
export class ProductsModule {}

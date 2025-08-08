import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { GetProductsDto } from '../dto/get-products.dto';
import { ProductsListDto } from '../dto/product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Продукты')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.MODERATOR)
@ApiBearerAuth()
export class ProductsUserController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список всех активных продуктов' })
  @ApiResponse({
    status: 200,
    description: 'Список активных продуктов',
    type: ProductsListDto,
  })
  async findAll(@Query() filters: GetProductsDto): Promise<ProductsListDto> {
    // Для публичного API показываем только активные продукты
    return this.productsService.getProducts({
      ...filters,
      isActive: true,
    });
  }
} 
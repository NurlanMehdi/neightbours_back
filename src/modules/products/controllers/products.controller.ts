import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { GetProductsDto } from '../dto/get-products.dto';
import { ProductDto, ProductsListDto } from '../dto/product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Продукты (Админ)')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать продукт' })
  @ApiResponse({
    status: 201,
    description: 'Продукт успешно создан',
    type: ProductDto,
  })
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductDto> {
    return this.productsService.createProduct(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список продуктов' })
  @ApiResponse({
    status: 200,
    description: 'Список продуктов',
    type: ProductsListDto,
  })
  async findAll(@Query() filters: GetProductsDto): Promise<ProductsListDto> {
    return this.productsService.getProducts(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить продукт по ID' })
  @ApiResponse({
    status: 200,
    description: 'Продукт найден',
    type: ProductDto,
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductDto> {
    return this.productsService.getProductById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить продукт' })
  @ApiResponse({
    status: 200,
    description: 'Продукт успешно обновлен',
    type: ProductDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductDto> {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Деактивировать продукт (мягкое удаление)' })
  @ApiResponse({
    status: 200,
    description: 'Продукт успешно деактивирован',
    type: ProductDto,
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ProductDto> {
    return this.productsService.deactivateProduct(id);
  }
}

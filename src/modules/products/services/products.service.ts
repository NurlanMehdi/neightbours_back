import { Injectable } from '@nestjs/common';
import { ProductsRepository } from '../repositories/products.repository';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { GetProductsDto } from '../dto/get-products.dto';
import { ProductDto, ProductsListDto } from '../dto/product.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  /**
   * Создает новый продукт
   */
  async createProduct(dto: CreateProductDto): Promise<ProductDto> {
    const product = await this.productsRepository.create(dto);
    return this.transformProductToDto(product);
  }

  /**
   * Получает все продукты с фильтрацией и пагинацией
   */
  async getProducts(filters: GetProductsDto): Promise<ProductsListDto> {
    const result = await this.productsRepository.findMany(filters);
    return {
      data: result.products.map(product => 
        this.transformProductToDto(product)
      ),
      total: result.total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(result.total / filters.limit),
    };
  }

  /**
   * Получает продукт по ID
   */
  async getProductById(id: number): Promise<ProductDto> {
    const product = await this.productsRepository.findById(id);
    return this.transformProductToDto(product);
  }

  /**
   * Обновляет продукт
   */
  async updateProduct(id: number, dto: UpdateProductDto): Promise<ProductDto> {
    const product = await this.productsRepository.update(id, dto);
    return this.transformProductToDto(product);
  }

  /**
   * Деактивирует продукт (мягкое удаление)
   */
  async deactivateProduct(id: number): Promise<ProductDto> {
    const product = await this.productsRepository.deactivate(id);
    return this.transformProductToDto(product);
  }

  /**
   * Получает продукты пользователя
   */
  async getUserProducts(userId: number): Promise<ProductDto[]> {
    const userProducts = await this.productsRepository.getUserProducts(userId);
    return userProducts.map(item => this.transformProductToDto(item.product));
  }

  /**
   * Добавляет продукт пользователю
   */
  async addUserProduct(userId: number, productId: number): Promise<void> {
    await this.productsRepository.addUserProduct(userId, productId);
  }

  /**
   * Удаляет продукт у пользователя
   */
  async removeUserProduct(userId: number, productId: number): Promise<void> {
    await this.productsRepository.removeUserProduct(userId, productId);
  }

  /**
   * Преобразует данные продукта в DTO
   */
  private transformProductToDto(product: any): ProductDto {
    return plainToInstance(ProductDto, product, {
      excludeExtraneousValues: true,
    });
  }
} 
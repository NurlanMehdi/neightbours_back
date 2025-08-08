import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { GetProductsDto } from '../dto/get-products.dto';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создает новый продукт
   */
  async create(data: CreateProductDto): Promise<any> {
    return this.prisma.product.create({
      data,
    });
  }

  /**
   * Получает все продукты с фильтрацией и пагинацией
   */
  async findMany(filters: GetProductsDto): Promise<{ products: any[]; total: number }> {
    const { search, page = 1, limit = 10, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Фильтр по активности (по умолчанию только активные)
    if (isActive !== undefined) {
      where.isActive = isActive;
    } else {
      where.isActive = true;
    }
    
    if (search) {
      where.name = { contains: search, mode: 'insensitive' as const };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  /**
   * Получает продукт по ID
   */
  async findById(id: number): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new BadRequestException(`Продукт с ID ${id} не найден`);
    }

    return product;
  }

  /**
   * Обновляет продукт
   */
  async update(id: number, data: UpdateProductDto): Promise<any> {
    await this.prisma.product.update({
      where: { id },
      data,
    });

    return this.findById(id);
  }

  /**
   * Деактивирует продукт (мягкое удаление)
   */
  async deactivate(id: number): Promise<any> {
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Получает продукты пользователя
   */
  async getUserProducts(userId: number): Promise<any[]> {
    return this.prisma.usersOnProducts.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  /**
   * Добавляет продукт пользователю
   */
  async addUserProduct(userId: number, productId: number): Promise<void> {
    await this.prisma.usersOnProducts.create({
      data: {
        userId,
        productId,
      },
    });
  }

  /**
   * Удаляет продукт у пользователя
   */
  async removeUserProduct(userId: number, productId: number): Promise<void> {
    await this.prisma.usersOnProducts.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }
} 
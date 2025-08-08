import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEventCategoryDto } from '../dto/create-event-category.dto';
import { UpdateEventCategoryDto } from '../dto/update-event-category.dto';
import { GetEventCategoriesAdminDto } from '../dto/get-event-categories-admin.dto';
import { EventType } from '@prisma/client';

@Injectable()
export class EventCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создает новую категорию события
   */
  async create(data: { 
    name: string; 
    icon: string; 
    type: EventType; 
    color?: string; 
  }): Promise<any> {
    return this.prisma.eventCategory.create({
      data,
    });
  }

  /**
   * Получает все активные категории событий
   */
  async findAll(): Promise<any[]> {
    return this.prisma.eventCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Получает активные категории событий с фильтром по типу
   */
  async findAllByType(type?: EventType): Promise<any[]> {
    const where: any = { isActive: true };
    
    if (type) {
      where.type = type;
    }
    
    return this.prisma.eventCategory.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Получает все категории событий (включая неактивные) для админки
   */
  async findAllForAdmin(): Promise<any[]> {
    return this.prisma.eventCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Получает все категории событий (включая неактивные) с пагинацией для админки
   */
  async findAllWithPaginationForAdmin(query: GetEventCategoriesAdminDto): Promise<{
    data: any[];
    total: number;
  }> {
    const { page = 1, limit = 50, search, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive' as const,
      };
    }
    
    if (type) {
      where.type = type;
    }

    const [data, total] = await Promise.all([
      this.prisma.eventCategory.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.eventCategory.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Получает активные категории событий с пагинацией и поиском
   */
  async findAllWithPagination(query: GetEventCategoriesAdminDto): Promise<{
    data: any[];
    total: number;
  }> {
    const { page = 1, limit = 50, search, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive' as const,
      };
    }
    
    if (type) {
      where.type = type;
    }

    const [data, total] = await Promise.all([
      this.prisma.eventCategory.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.eventCategory.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Получает категорию события по ID (включая неактивные)
   */
  async findById(id: number): Promise<any> {
    return this.prisma.eventCategory.findUnique({
      where: { id },
    });
  }

  /**
   * Получает активную категорию события по ID
   */
  async findActiveById(id: number): Promise<any> {
    return this.prisma.eventCategory.findFirst({
      where: { id, isActive: true },
    });
  }

  /**
   * Получает категорию события по названию (включая неактивные)
   */
  async findByName(name: string): Promise<any> {
    return this.prisma.eventCategory.findUnique({
      where: { name },
    });
  }

  /**
   * Обновляет категорию события
   */
  async update(id: number, data: Partial<{ 
    name: string; 
    icon: string; 
    type: EventType; 
    color?: string; 
    isActive: boolean; 
  }>): Promise<any> {
    return this.prisma.eventCategory.update({
      where: { id },
      data,
    });
  }

  /**
   * Мягко удаляет категорию события (устанавливает isActive = false)
   */
  async softDelete(id: number): Promise<void> {
    await this.prisma.eventCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Проверяет, используется ли категория в событиях
   */
  async isUsedInEvents(id: number): Promise<boolean> {
    const eventsCount = await this.prisma.event.count({
      where: { categoryId: id },
    });
    return eventsCount > 0;
  }
} 
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PropertyResourceCategory } from '../dto/create-property-resource.dto';

export interface CreatePropertyResourceData {
  name: string;
  photo?: string;
  category: PropertyResourceCategory;
  propertyId: number;
}

export interface UpdatePropertyResourceData {
  name?: string;
  photo?: string;
  category?: PropertyResourceCategory;
}

@Injectable()
export class PropertyResourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создает новый ресурс объекта недвижимости
   */
  async create(data: CreatePropertyResourceData) {
    return await this.prisma.propertyResource.create({
      data,
      include: {
        property: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Получает ресурс по ID
   */
  async findById(id: number) {
    return await this.prisma.propertyResource.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Получает все ресурсы объекта недвижимости
   */
  async findByPropertyId(propertyId: number) {
    return await this.prisma.propertyResource.findMany({
      where: { propertyId },
      include: {
        property: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Получает все ресурсы пользователя
   */
  async findByUserId(userId: number) {
    return await this.prisma.propertyResource.findMany({
      where: {
        property: {
          userId,
        },
      },
      include: {
        property: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Обновляет ресурс
   */
  async update(id: number, data: UpdatePropertyResourceData) {
    return await this.prisma.propertyResource.update({
      where: { id },
      data,
      include: {
        property: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Удаляет ресурс
   */
  async delete(id: number) {
    return await this.prisma.propertyResource.delete({
      where: { id },
    });
  }
}

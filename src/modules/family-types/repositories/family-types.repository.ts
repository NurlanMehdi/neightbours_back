import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FamilyType } from '@prisma/client';

@Injectable()
export class FamilyTypesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<FamilyType[]> {
    return this.prisma.familyType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAllActive(): Promise<FamilyType[]> {
    return this.prisma.familyType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number): Promise<FamilyType | null> {
    return this.prisma.familyType.findFirst({
      where: {
        id,
        isActive: true,
      },
    });
  }

  async create(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }): Promise<FamilyType> {
    return this.prisma.familyType.create({
      data,
    });
  }

  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      isActive?: boolean;
    },
  ): Promise<FamilyType> {
    return this.prisma.familyType.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<FamilyType> {
    return this.prisma.familyType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findActiveByIds(ids: number[]): Promise<FamilyType[]> {
    return this.prisma.familyType.findMany({
      where: {
        id: { in: ids },
        isActive: true,
      },
    });
  }

  async findAllAdmin(
    where: any,
    skip: number,
    take: number,
  ): Promise<FamilyType[]> {
    return this.prisma.familyType.findMany({
      where: {
        ...where,
        isActive: true, // Всегда возвращаем только активные
      },
      skip,
      take,
      orderBy: { name: 'asc' },
    });
  }

  async count(where: any): Promise<number> {
    return this.prisma.familyType.count({
      where: {
        ...where,
        isActive: true, // Всегда считаем только активные
      },
    });
  }
}

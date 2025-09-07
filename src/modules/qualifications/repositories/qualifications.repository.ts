import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateQualificationDto } from '../dto/create-qualification.dto';
import { UpdateQualificationDto } from '../dto/update-qualification.dto';
import { GetQualificationsDto } from '../dto/get-qualifications.dto';

@Injectable()
export class QualificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создает новую квалификацию
   */
  async create(data: CreateQualificationDto): Promise<any> {
    return this.prisma.qualification.create({
      data,
    });
  }

  /**
   * Получает все квалификации с фильтрацией и пагинацией
   */
  async findMany(
    filters: GetQualificationsDto,
  ): Promise<{ qualifications: any[]; total: number }> {
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

    const [qualifications, total] = await Promise.all([
      this.prisma.qualification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.qualification.count({ where }),
    ]);

    return { qualifications, total };
  }

  /**
   * Получает квалификацию по ID
   */
  async findById(id: number): Promise<any> {
    const qualification = await this.prisma.qualification.findUnique({
      where: { id },
    });

    if (!qualification) {
      throw new BadRequestException(`Квалификация с ID ${id} не найдена`);
    }

    return qualification;
  }

  /**
   * Обновляет квалификацию
   */
  async update(id: number, data: UpdateQualificationDto): Promise<any> {
    await this.prisma.qualification.update({
      where: { id },
      data,
    });

    return this.findById(id);
  }

  /**
   * Деактивирует квалификацию (мягкое удаление)
   */
  async deactivate(id: number): Promise<any> {
    return this.prisma.qualification.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Получает квалификации пользователя
   */
  async getUserQualifications(userId: number): Promise<any[]> {
    return this.prisma.usersOnQualifications.findMany({
      where: { userId },
      include: {
        qualification: true,
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  /**
   * Добавляет квалификацию пользователю
   */
  async addUserQualification(
    userId: number,
    qualificationId: number,
  ): Promise<void> {
    await this.prisma.usersOnQualifications.create({
      data: {
        userId,
        qualificationId,
      },
    });
  }

  /**
   * Удаляет квалификацию у пользователя
   */
  async removeUserQualification(
    userId: number,
    qualificationId: number,
  ): Promise<void> {
    await this.prisma.usersOnQualifications.delete({
      where: {
        userId_qualificationId: {
          userId,
          qualificationId,
        },
      },
    });
  }
}

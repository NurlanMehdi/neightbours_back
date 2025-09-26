import { Injectable, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PropertyRepository } from '../repositories/property.repository';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/interfaces/notification.interface';
import { PropertyDto } from '../dto/property.dto';
import { plainToInstance } from 'class-transformer';
// Note: Using string literals to avoid dependency on regenerated Prisma enums

@Injectable()
export class PropertyConfirmationService {
  private readonly CODE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

  constructor(
    private readonly prisma: PrismaService,
    private readonly propertyRepository: PropertyRepository,
    private readonly notificationService: NotificationService,
  ) {}

  // Note: Code generation on creation is handled in PropertyService

  async confirmProperty(propertyId: number, userId: number, code: string): Promise<PropertyDto> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property || !property.isActive) {
      throw new NotFoundException(`Объект с ID ${propertyId} не найден`);
    }
    const currentStatus = ((property as any).verificationStatus || '') as string;
    if (currentStatus === 'VERIFIED') {
      // idempotent: already verified - return current property data
      const updatedProperty = await this.propertyRepository.findByIdWithVerifications(propertyId);
      return this.transformToUserDto(updatedProperty, userId);
    }

    const storedCode = (property as any).confirmationCode as string | undefined;
    const expiresAt = (property as any).confirmationCodeExpiresAt as Date | undefined;
    if (!storedCode || !expiresAt) {
      throw new BadRequestException('Код подтверждения не найден');
    }

    if (storedCode !== code) {
      throw new BadRequestException('Неверный код подтверждения');
    }

    if (new Date(expiresAt).getTime() < Date.now()) {
      // Code expired; do not update status
      throw new BadRequestException('Срок действия кода подтверждения истек');
    }

    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        verificationStatus: 'VERIFIED' as any,
      },
    });

    // Notify owner
    try {
      await this.notificationService.createNotification({
        type: NotificationType.INFO,
        title: 'Объект подтвержден',
        message: 'Ваш объект успешно подтвержден.',
        userId: property.userId,
        payload: { propertyId },
      });
    } catch (e) {
      // Swallow notification errors
    }

    // Return updated property data
    const updatedProperty = await this.propertyRepository.findByIdWithVerifications(propertyId);
    return this.transformToUserDto(updatedProperty, userId);
  }

  async cleanupExpiredProperties(): Promise<number> {
    const now = new Date();
    const res = await this.prisma.property.deleteMany({
      where: {
        isActive: true,
        verificationStatus: 'UNVERIFIED' as any,
        // @ts-ignore: field exists after prisma generate
        confirmationCodeExpiresAt: { lt: now },
      } as any,
    });
    return res.count;
  }

  private generateCode(): string {
    // 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Трансформирует данные объекта в DTO для пользователей
   */
  private transformToUserDto(property: any, requestingUserId?: number): PropertyDto {
    const createdBy = property.user
      ? `${property.user.firstName || ''} ${property.user.lastName || ''}`.trim()
      : '';

    // Извлекаем список ID пользователей, которые подтвердили объект
    const verifiedUserIds =
      property.verifications?.map((verification: any) => verification.userId) ||
      [];
    const verificationCount = property.verifications?.length || 0;

    // Определяем статус проверки на основе количества подтверждений
    // Статус VERIFIED только если есть минимум 2 подтверждения
    const verificationStatus =
      verificationCount >= 2 ? 'VERIFIED' : 'UNVERIFIED';

    // Определяем статус кодового подтверждения
    let confirmationStatus = 'PENDING';
    if (property.confirmationCodeExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(property.confirmationCodeExpiresAt);
      if (now > expiresAt) {
        confirmationStatus = 'EXPIRED';
      } else if (verificationStatus === 'VERIFIED') {
        confirmationStatus = 'CONFIRMED';
      }
    }

    const dtoData: any = {
      id: property.id,
      name: property.name,
      category: property.category,
      latitude: property.latitude,
      longitude: property.longitude,
      photo: property.photo,
      verificationStatus,
      verificationCount,
      verifiedUserIds,
      confirmationStatus,
      createdById: property.userId,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      createdBy,
    };

    if (requestingUserId && property.userId === requestingUserId) {
      dtoData.confirmationCode = property.confirmationCode;
    }

    return plainToInstance(PropertyDto, dtoData);
  }
}

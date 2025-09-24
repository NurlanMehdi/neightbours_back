import { Injectable, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PropertyRepository } from '../repositories/property.repository';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/interfaces/notification.interface';
import { PropertyConfirmationStatus } from '@prisma/client';

@Injectable()
export class PropertyConfirmationService {
  private readonly CODE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

  constructor(
    private readonly prisma: PrismaService,
    private readonly propertyRepository: PropertyRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async generateConfirmationCode(propertyId: number, userId: number): Promise<{ code: string; expiresAt: Date }> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property || !property.isActive) {
      throw new NotFoundException(`Объект с ID ${propertyId} не найден`);
    }
    if (property.userId !== userId) {
      throw new ForbiddenException('Вы не являетесь владельцем объекта');
    }
    if (property.confirmationStatus === PropertyConfirmationStatus.CONFIRMED) {
      throw new ConflictException('Объект уже подтвержден');
    }

    const expiresAt = new Date(Date.now() + this.CODE_TTL_MS);
    // Try a few times to avoid rare unique collisions
    for (let i = 0; i < 5; i++) {
      const code = this.generateCode();
      try {
        await this.prisma.property.update({
          where: { id: propertyId },
          data: {
            confirmationCode: code,
            confirmationCodeExpiresAt: expiresAt,
            confirmationStatus: PropertyConfirmationStatus.PENDING,
          },
        });
        return { code, expiresAt };
      } catch (e: any) {
        // Unique constraint violation code for Prisma
        if (e?.code === 'P2002') {
          continue; // retry
        }
        throw e;
      }
    }
    throw new ConflictException('Не удалось сгенерировать уникальный код подтверждения');
  }

  async confirmProperty(propertyId: number, code: string): Promise<void> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property || !property.isActive) {
      throw new NotFoundException(`Объект с ID ${propertyId} не найден`);
    }

    if (property.confirmationStatus === PropertyConfirmationStatus.CONFIRMED) {
      // idempotent: already confirmed
      return;
    }

    if (!property.confirmationCode || !property.confirmationCodeExpiresAt) {
      throw new BadRequestException('Код подтверждения не сгенерирован');
    }

    if (property.confirmationCode !== code) {
      throw new BadRequestException('Неверный код подтверждения');
    }

    if (new Date(property.confirmationCodeExpiresAt).getTime() < Date.now()) {
      throw new BadRequestException('Срок действия кода подтверждения истек');
    }

    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        confirmationStatus: PropertyConfirmationStatus.CONFIRMED,
        confirmationCode: null,
        confirmationCodeExpiresAt: null,
      },
    });

    // Notify owner
    try {
      await this.notificationService.createNotification({
        type: NotificationType.INFO,
        title: 'Объект подтвержден',
        message: 'Ваш объект успешно подтвержден по коду и готов к верификации.',
        userId: property.userId,
        payload: { propertyId },
      });
    } catch (e) {
      // Swallow notification errors
    }
  }

  async cleanupExpiredProperties(): Promise<number> {
    const threshold = new Date(Date.now() - this.CODE_TTL_MS);
    const res = await this.prisma.property.deleteMany({
      where: {
        isActive: true,
        confirmationStatus: { not: PropertyConfirmationStatus.CONFIRMED },
        createdAt: { lt: threshold },
      },
    });
    return res.count;
  }

  private generateCode(): string {
    // 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

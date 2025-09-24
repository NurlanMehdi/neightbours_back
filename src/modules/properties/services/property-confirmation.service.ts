import { Injectable, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PropertyRepository } from '../repositories/property.repository';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/interfaces/notification.interface';
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

  async confirmProperty(propertyId: number, code: string): Promise<void> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property || !property.isActive) {
      throw new NotFoundException(`Объект с ID ${propertyId} не найден`);
    }
    const currentStatus = ((property as any).verificationStatus || '') as string;
    if (currentStatus === 'VERIFIED') {
      // idempotent: already verified
      return;
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
}

import { Injectable, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PropertyRepository } from '../repositories/property.repository';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/interfaces/notification.interface';
// Note: Using string literals to avoid dependency on regenerated Prisma enums

@Injectable()
export class PropertyConfirmationService {
  private readonly CODE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
  // In-memory storage for codes; resets on process restart
  private readonly codes = new Map<number, { code: string; expiresAt: Date }>();

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
    const currentStatus = ((property as any).verificationStatus || '') as string;
    if (currentStatus === 'CONFIRMED' || currentStatus === 'VERIFIED') {
      throw new ConflictException('Объект уже подтвержден');
    }

    const expiresAt = new Date(Date.now() + this.CODE_TTL_MS);
    const code = this.generateCode();
    this.codes.set(propertyId, { code, expiresAt });
    await this.prisma.property.update({
      where: { id: propertyId },
      data: { verificationStatus: 'PENDING' as any },
    });
    return { code, expiresAt };
  }

  async confirmProperty(propertyId: number, code: string): Promise<void> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property || !property.isActive) {
      throw new NotFoundException(`Объект с ID ${propertyId} не найден`);
    }

    const currentStatus2 = ((property as any).verificationStatus || '') as string;
    if (currentStatus2 === 'CONFIRMED' || currentStatus2 === 'VERIFIED') {
      // idempotent: already confirmed
      return;
    }

    const entry = this.codes.get(propertyId);
    if (!entry) {
      throw new BadRequestException('Код подтверждения не сгенерирован');
    }

    if (entry.code !== code) {
      throw new BadRequestException('Неверный код подтверждения');
    }

    if (new Date(entry.expiresAt).getTime() < Date.now()) {
      await this.prisma.property.update({
        where: { id: propertyId },
        data: { verificationStatus: 'EXPIRED' as any },
      });
      this.codes.delete(propertyId);
      throw new BadRequestException('Срок действия кода подтверждения истек');
    }

    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        verificationStatus: 'CONFIRMED' as any,
      },
    });
    this.codes.delete(propertyId);

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
        verificationStatus: { notIn: ['CONFIRMED', 'VERIFIED'] as any },
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

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ProfileDeletionRepository } from '../repositories/profile-deletion.repository';
import { SmsService } from '../../auth/services/sms.service';
import { UserRepository } from '../repositories/user.repository';
import {
  ActiveDeletionRequestExistsException,
  DeletionCodeExpiredException,
  DeletionRequestNotFoundException,
  InvalidDeletionCodeException,
  ProfileNotScheduledForDeletionException,
  TooManyDeletionAttemptsException,
  DeletionCancellationExpiredException,
} from '../../../common/exceptions/profile-deletion.exception';
import { ProfileDeletionNotificationService } from './profile-deletion-notification.service';
import {
  RequestDeletionDto,
  ConfirmDeletionResponseDto,
  RestoreProfileDto,
} from '../dto/profile-deletion.dto';

@Injectable()
export class ProfileDeletionService {
  private readonly logger = new Logger(ProfileDeletionService.name);
  private readonly MAX_ATTEMPTS = 5;
  private readonly CODE_EXPIRY_MINUTES = 5;
  private readonly DELETION_DELAY_DAYS = 14;

  constructor(
    private readonly profileDeletionRepository: ProfileDeletionRepository,
    private readonly smsService: SmsService,
    private readonly userRepository: UserRepository,
    @Inject(forwardRef(() => ProfileDeletionNotificationService))
    private readonly notificationService: ProfileDeletionNotificationService,
  ) {}

  async requestDeletion(userId: number): Promise<RequestDeletionDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new DeletionRequestNotFoundException();
    }

    const existingRequest = await this.profileDeletionRepository.findActiveRequestByUserId(userId);
    if (existingRequest) {
      throw new ActiveDeletionRequestExistsException(existingRequest.code);
    }

    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

    await this.profileDeletionRepository.createDeletionRequest(userId, code, expiresAt);
    //await this.smsService.sendSms(user.phone, code);

    this.logger.log(`Запрос на удаление профиля создан для пользователя ${userId}`);

    return {
      message: 'Код подтверждения отправлен на ваш номер телефона',
      code,
      date: expiresAt,
    };
  }

  async confirmDeletion(userId: number, code: string): Promise<ConfirmDeletionResponseDto> {
    const request = await this.profileDeletionRepository.findRequestByUserIdAndCode(userId, code);
    if (!request) {
      throw new InvalidDeletionCodeException();
    }

    if (request.attempts >= this.MAX_ATTEMPTS) {
      throw new TooManyDeletionAttemptsException();
    }

    if (new Date() > request.expiresAt) {
      await this.profileDeletionRepository.incrementAttempts(request.id);
      throw new DeletionCodeExpiredException();
    }

    if (request.code !== code) {
      await this.profileDeletionRepository.incrementAttempts(request.id);
      throw new InvalidDeletionCodeException();
    }

    await this.profileDeletionRepository.confirmDeletionRequest(request.id);

    const deletionDate = new Date(Date.now() + this.DELETION_DELAY_DAYS * 24 * 60 * 60 * 1000);
    const updatedUser = await this.profileDeletionRepository.scheduleDeletion(userId, deletionDate);

    this.logger.log(`Удаление профиля запланировано для пользователя ${userId} на ${deletionDate}`);

    return {
      message: 'Профиль будет удален через 14 дней. Вы можете отменить удаление до этого времени.',
      deletionScheduledAt: deletionDate,
    };
  }

  async restoreProfile(userId: number): Promise<RestoreProfileDto> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.deletionScheduledAt) {
      throw new ProfileNotScheduledForDeletionException();
    }

    if (new Date() >= user.deletionScheduledAt) {
      throw new DeletionCancellationExpiredException();
    }

    await this.profileDeletionRepository.cancelDeletion(userId);
    await this.profileDeletionRepository.deleteDeletionRequest(userId);
    await this.notificationService.notifyDeletionCancelled(userId);

    this.logger.log(`Удаление профиля отменено для пользователя ${userId}`);

    return {
      message: 'Профиль успешно восстановлен. Удаление отменено.',
    };
  }

  async processScheduledDeletions(): Promise<void> {
    const usersToDelete = await this.profileDeletionRepository.findUsersScheduledForDeletion();

    for (const user of usersToDelete) {
      try {
        await this.notificationService.notifyDeletionCompleted(user.id);
        await this.profileDeletionRepository.deleteUser(user.id);
        this.logger.log(`Пользователь ${user.id} удален по расписанию`);
      } catch (error) {
        this.logger.error(`Ошибка при удалении пользователя ${user.id}: ${error.message}`);
      }
    }

    await this.profileDeletionRepository.cleanupExpiredRequests();
    this.logger.log(`Обработано ${usersToDelete.length} запланированных удалений`);
  }

  private generateVerificationCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}

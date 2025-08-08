import { Injectable } from '@nestjs/common';
import { QualificationsRepository } from '../repositories/qualifications.repository';
import { CreateQualificationDto } from '../dto/create-qualification.dto';
import { UpdateQualificationDto } from '../dto/update-qualification.dto';
import { GetQualificationsDto } from '../dto/get-qualifications.dto';
import { QualificationDto, QualificationsListDto } from '../dto/qualification.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class QualificationsService {
  constructor(private readonly qualificationsRepository: QualificationsRepository) {}

  /**
   * Создает новую квалификацию
   */
  async createQualification(dto: CreateQualificationDto): Promise<QualificationDto> {
    const qualification = await this.qualificationsRepository.create(dto);
    return this.transformQualificationToDto(qualification);
  }

  /**
   * Получает все квалификации с фильтрацией и пагинацией
   */
  async getQualifications(filters: GetQualificationsDto): Promise<QualificationsListDto> {
    const result = await this.qualificationsRepository.findMany(filters);
    return {
      data: result.qualifications.map(qualification => 
        this.transformQualificationToDto(qualification)
      ),
      total: result.total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(result.total / filters.limit),
    };
  }

  /**
   * Получает квалификацию по ID
   */
  async getQualificationById(id: number): Promise<QualificationDto> {
    const qualification = await this.qualificationsRepository.findById(id);
    return this.transformQualificationToDto(qualification);
  }

  /**
   * Обновляет квалификацию
   */
  async updateQualification(id: number, dto: UpdateQualificationDto): Promise<QualificationDto> {
    const qualification = await this.qualificationsRepository.update(id, dto);
    return this.transformQualificationToDto(qualification);
  }

  /**
   * Деактивирует квалификацию (мягкое удаление)
   */
  async deactivateQualification(id: number): Promise<QualificationDto> {
    const qualification = await this.qualificationsRepository.deactivate(id);
    return this.transformQualificationToDto(qualification);
  }

  /**
   * Получает квалификации пользователя
   */
  async getUserQualifications(userId: number): Promise<QualificationDto[]> {
    const userQualifications = await this.qualificationsRepository.getUserQualifications(userId);
    return userQualifications.map(item => this.transformQualificationToDto(item.qualification));
  }

  /**
   * Добавляет квалификацию пользователю
   */
  async addUserQualification(userId: number, qualificationId: number): Promise<void> {
    await this.qualificationsRepository.addUserQualification(userId, qualificationId);
  }

  /**
   * Удаляет квалификацию у пользователя
   */
  async removeUserQualification(userId: number, qualificationId: number): Promise<void> {
    await this.qualificationsRepository.removeUserQualification(userId, qualificationId);
  }

  /**
   * Преобразует данные квалификации в DTO
   */
  private transformQualificationToDto(qualification: any): QualificationDto {
    return plainToInstance(QualificationDto, qualification, {
      excludeExtraneousValues: true,
    });
  }
} 
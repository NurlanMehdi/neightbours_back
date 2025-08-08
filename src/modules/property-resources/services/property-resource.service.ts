import { Injectable, Logger } from '@nestjs/common';
import {
  PropertyResourceRepository,
  UpdatePropertyResourceData,
} from '../repositories/property-resource.repository';
import { PropertyRepository } from '../../properties/repositories/property.repository';
import { PropertyResourceDto } from '../dto/property-resource.dto';
import { CreatePropertyResourceDto } from '../dto/create-property-resource.dto';
import { UpdatePropertyResourceDto } from '../dto/update-property-resource.dto';
import { plainToInstance } from 'class-transformer';
import {
  PropertyResourceNotFoundException,
  PropertyResourceAccessDeniedException,
  PropertyNotFoundException,
  PropertyAccessDeniedException,
} from '../../../common/exceptions/property-resource.exception';

@Injectable()
export class PropertyResourceService {
  private readonly logger = new Logger(PropertyResourceService.name);

  constructor(
    private readonly propertyResourceRepository: PropertyResourceRepository,
    private readonly propertyRepository: PropertyRepository,
  ) {}

  /**
   * Проверяет существование объекта недвижимости и права доступа
   */
  private async validatePropertyAccess(
    propertyId: number,
    userId: number,
  ): Promise<void> {
    const property = await this.propertyRepository.findById(propertyId);

    if (!property) {
      throw new PropertyNotFoundException(propertyId);
    }

    if (property.userId !== userId) {
      throw new PropertyAccessDeniedException();
    }
  }

  /**
   * Создает новый ресурс объекта недвижимости
   */
  async createResource(
    createResourceDto: CreatePropertyResourceDto,
    userId: number,
    photo?: Express.Multer.File,
  ): Promise<PropertyResourceDto> {
    // Проверяем существование объекта недвижимости и права доступа
    await this.validatePropertyAccess(createResourceDto.propertyId, userId);

    const resourceData = {
      ...createResourceDto,
      photo: photo?.filename || null,
    };

    const resource = await this.propertyResourceRepository.create(resourceData);
    return this.transformToDto(resource);
  }

  /**
   * Получает ресурс по ID
   */
  async getResourceById(
    id: number,
    userId: number,
  ): Promise<PropertyResourceDto> {
    const resource = await this.propertyResourceRepository.findById(id);

    if (!resource) {
      throw new PropertyResourceNotFoundException(id);
    }

    // Проверяем, принадлежит ли ресурс пользователю
    if (resource.property.userId !== userId) {
      throw new PropertyResourceAccessDeniedException();
    }

    return this.transformToDto(resource);
  }

  /**
   * Получает все ресурсы объекта недвижимости
   */
  async getResourcesByPropertyId(
    propertyId: number,
    userId: number,
  ): Promise<PropertyResourceDto[]> {
    if (!propertyId) {
      throw new PropertyNotFoundException(propertyId);
    }

    const resources =
      await this.propertyResourceRepository.findByPropertyId(propertyId);
    return resources.map((resource) => this.transformToDto(resource));
  }

  /**
   * Получает все ресурсы пользователя
   */
  async getUserResources(userId: number): Promise<PropertyResourceDto[]> {
    const resources =
      await this.propertyResourceRepository.findByUserId(userId);
    return resources.map((resource) => this.transformToDto(resource));
  }

  /**
   * Обновляет ресурс
   */
  async updateResource(
    id: number,
    updateResourceDto: UpdatePropertyResourceDto,
    userId: number,
    photo?: Express.Multer.File,
  ): Promise<PropertyResourceDto> {
    const resource = await this.propertyResourceRepository.findById(id);

    if (!resource) {
      throw new PropertyResourceNotFoundException(id);
    }

    // Проверяем, принадлежит ли ресурс пользователю
    if (resource.property.userId !== userId) {
      throw new PropertyResourceAccessDeniedException();
    }

    // Создаем объект только с измененными полями
    const updateData: UpdatePropertyResourceData = {};

    // Добавляем только те поля, которые действительно изменились
    if (
      updateResourceDto.name !== undefined &&
      updateResourceDto.name !== resource.name
    ) {
      updateData.name = updateResourceDto.name;
      this.logger.log(
        `Обновление названия ресурса ${id}: "${resource.name}" -> "${updateResourceDto.name}"`,
      );
    }

    if (
      updateResourceDto.category !== undefined &&
      updateResourceDto.category !== resource.category
    ) {
      updateData.category = updateResourceDto.category;
      this.logger.log(
        `Обновление категории ресурса ${id}: "${resource.category}" -> "${updateResourceDto.category}"`,
      );
    }

    // Если передана новая фотография, обновляем её
    if (photo) {
      updateData.photo = photo.filename;
      this.logger.log(
        `Обновление фотографии ресурса ${id}: "${resource.photo}" -> "${photo.filename}"`,
      );
    }

    // Если нет изменений, возвращаем текущий ресурс
    if (Object.keys(updateData).length === 0) {
      this.logger.log(
        `Ресурс ${id} не требует обновления - изменений не обнаружено`,
      );
      return this.transformToDto(resource);
    }

    this.logger.log(`Обновление ресурса ${id} с данными:`, updateData);
    const updatedResource = await this.propertyResourceRepository.update(
      id,
      updateData,
    );
    return this.transformToDto(updatedResource);
  }

  /**
   * Удаляет ресурс
   */
  async deleteResource(id: number, userId: number): Promise<void> {
    const resource = await this.propertyResourceRepository.findById(id);

    if (!resource) {
      throw new PropertyResourceNotFoundException(id);
    }

    // Проверяем, принадлежит ли ресурс пользователю
    if (resource.property.userId !== userId) {
      throw new PropertyResourceAccessDeniedException();
    }

    await this.propertyResourceRepository.delete(id);
  }

  /**
   * Трансформирует данные ресурса в DTO
   */
  private transformToDto(resource: any): PropertyResourceDto {
    return plainToInstance(PropertyResourceDto, {
      id: resource.id,
      name: resource.name,
      photo: resource.photo,
      category: resource.category,
      propertyId: resource.propertyId,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventCategoriesRepository } from './repositories/event-categories.repository';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';
import { EventCategoryDto } from './dto/event-category.dto';
import { GetEventCategoriesAdminDto } from './dto/get-event-categories-admin.dto';
import { EventCategoriesPaginatedDto } from './dto/event-categories-paginated.dto';
import { plainToInstance } from 'class-transformer';
import { EventType } from '@prisma/client';

@Injectable()
export class EventCategoriesService {
  constructor(
    private readonly eventCategoriesRepository: EventCategoriesRepository,
  ) {}

  /**
   * Создает новую категорию события
   */
  async create(
    dto: CreateEventCategoryDto,
    icon?: Express.Multer.File,
  ): Promise<EventCategoryDto> {
    if (!icon) {
      throw new BadRequestException('Иконка категории обязательна');
    }

    if (!icon.filename) {
      throw new BadRequestException('Некорректный файл иконки');
    }

    // Проверяем формат файла для уведомлений (только SVG)
    if (dto.type === EventType.NOTIFICATION) {
      const fileExtension = icon.originalname?.toLowerCase().split('.').pop();
      if (fileExtension !== 'svg') {
        throw new BadRequestException(
          'Для категорий уведомлений разрешены только SVG файлы',
        );
      }
    }

    // Проверяем, что для оповещений указан цвет
    if (dto.type === EventType.NOTIFICATION && !dto.color) {
      throw new BadRequestException('Цвет обязателен для категорий оповещений');
    }

    // Проверяем, не существует ли уже категория с таким названием
    const existingCategory = await this.eventCategoriesRepository.findByName(
      dto.name,
    );
    if (existingCategory) {
      throw new BadRequestException(
        `Категория с названием "${dto.name}" уже существует`,
      );
    }

    // Создаем категорию с именем файла иконки
    const category = await this.eventCategoriesRepository.create({
      name: dto.name,
      icon: icon.filename,
      type: dto.type,
      color: dto.color,
    });

    return this.transformToDto(category);
  }

  /**
   * Получает все активные категории событий (для публичного API)
   */
  async findAll(): Promise<EventCategoryDto[]> {
    const categories = await this.eventCategoriesRepository.findAll();
    return categories.map((category) => this.transformToDto(category));
  }

  /**
   * Получает активные категории событий с фильтром по типу (для публичного API)
   */
  async findAllByType(type?: EventType): Promise<EventCategoryDto[]> {
    const categories = await this.eventCategoriesRepository.findAllByType(type);
    return categories.map((category) => this.transformToDto(category));
  }

  /**
   * Получает категории событий с пагинацией (только активные)
   */
  async findAllWithPagination(
    query: GetEventCategoriesAdminDto,
  ): Promise<EventCategoriesPaginatedDto> {
    const { page = 1, limit = 50 } = query;
    const { data, total } =
      await this.eventCategoriesRepository.findAllWithPagination(query);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((category) => this.transformToDto(category)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Получает категорию события по ID (только активные)
   */
  async findById(id: number): Promise<EventCategoryDto> {
    const category = await this.eventCategoriesRepository.findActiveById(id);
    if (!category) {
      throw new NotFoundException(
        `Активная категория события с ID ${id} не найдена`,
      );
    }
    return this.transformToDto(category);
  }

  /**
   * Получает активную категорию события по ID (для публичного API)
   */
  async findActiveById(id: number): Promise<EventCategoryDto> {
    const category = await this.eventCategoriesRepository.findActiveById(id);
    if (!category) {
      throw new NotFoundException(
        `Активная категория события с ID ${id} не найдена`,
      );
    }
    return this.transformToDto(category);
  }

  /**
   * Обновляет категорию события
   */
  async update(
    id: number,
    dto: UpdateEventCategoryDto,
    icon?: Express.Multer.File,
  ): Promise<EventCategoryDto> {
    const existingCategory = await this.eventCategoriesRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundException(`Категория события с ID ${id} не найдена`);
    }

    // Подготавливаем данные для обновления
    const updateData: any = {};

    if (dto.name) {
      // Проверяем, не существует ли уже категория с таким названием (кроме текущей)
      const categoryWithSameName =
        await this.eventCategoriesRepository.findByName(dto.name);
      if (categoryWithSameName && categoryWithSameName.id !== id) {
        throw new BadRequestException(
          `Категория с названием "${dto.name}" уже существует`,
        );
      }
      updateData.name = dto.name;
    }

    if (dto.type !== undefined) {
      updateData.type = dto.type;
    }

    if (dto.color !== undefined) {
      updateData.color = dto.color;
    }

    if (icon && icon.filename) {
      updateData.icon = icon.filename;
    }

    // Проверяем валидацию для оповещений
    const finalType = dto.type !== undefined ? dto.type : existingCategory.type;
    const finalColor =
      dto.color !== undefined ? dto.color : existingCategory.color;

    // Проверяем формат файла для уведомлений (только SVG)
    if (icon && finalType === EventType.NOTIFICATION) {
      const fileExtension = icon.originalname?.toLowerCase().split('.').pop();
      if (fileExtension !== 'svg') {
        throw new BadRequestException(
          'Для категорий уведомлений разрешены только SVG файлы',
        );
      }
    }

    if (finalType === EventType.NOTIFICATION && !finalColor) {
      throw new BadRequestException('Цвет обязателен для категорий оповещений');
    }

    const category = await this.eventCategoriesRepository.update(
      id,
      updateData,
    );
    return this.transformToDto(category);
  }

  /**
   * Мягко удаляет категорию события (устанавливает isActive = false)
   */
  async delete(id: number): Promise<void> {
    const existingCategory = await this.eventCategoriesRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundException(`Категория события с ID ${id} не найдена`);
    }

    // Проверяем, используется ли категория в активных событиях
    const eventsCount = await this.eventCategoriesRepository.getEventsCountByCategory(id);
    
    if (eventsCount.active > 0) {
      throw new BadRequestException(
        `Нельзя удалить категорию, которая используется в ${eventsCount.active} активных событиях. ` +
        `Используйте принудительное удаление, если необходимо удалить категорию.`,
      );
    }

    await this.eventCategoriesRepository.softDelete(id);
  }

  /**
   * Принудительно удаляет категорию события, обнуляя categoryId в связанных событиях
   */
  async forceDelete(id: number): Promise<void> {
    const existingCategory = await this.eventCategoriesRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundException(`Категория события с ID ${id} не найдена`);
    }

    await this.eventCategoriesRepository.forceDelete(id);
  }

  /**
   * Получает информацию об использовании категории в событиях
   */
  async getCategoryUsage(id: number): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const existingCategory = await this.eventCategoriesRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundException(`Категория события с ID ${id} не найдена`);
    }

    return this.eventCategoriesRepository.getEventsCountByCategory(id);
  }

  /**
   * Восстанавливает категорию события (устанавливает isActive = true)
   */
  async restore(id: number): Promise<EventCategoryDto> {
    const existingCategory = await this.eventCategoriesRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundException(`Категория события с ID ${id} не найдена`);
    }

    const category = await this.eventCategoriesRepository.update(id, {
      isActive: true,
    });
    return this.transformToDto(category);
  }

  /**
   * Преобразует данные в DTO
   */
  private transformToDto(category: any): EventCategoryDto {
    return plainToInstance(EventCategoryDto, category, {
      excludeExtraneousValues: true,
    });
  }
}

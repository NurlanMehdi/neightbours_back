import { Injectable, NotFoundException } from '@nestjs/common';
import { FamilyTypesRepository } from './repositories/family-types.repository';
import { CreateFamilyTypeDto } from './dto/create-family-type.dto';
import { UpdateFamilyTypeDto } from './dto/update-family-type.dto';
import { FamilyTypeDto } from './dto/family-type.dto';
import { FamilyTypesPaginatedDto } from './dto/family-types-paginated.dto';
import { GetFamilyTypesAdminDto } from './dto/get-family-types-admin.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class FamilyTypesService {
  constructor(private readonly familyTypesRepository: FamilyTypesRepository) {}

  async findAll(): Promise<FamilyTypeDto[]> {
    const familyTypes = await this.familyTypesRepository.findAllActive();
    return plainToInstance(FamilyTypeDto, familyTypes, {
      excludeExtraneousValues: true,
    });
  }

  async findById(id: number): Promise<FamilyTypeDto> {
    const familyType = await this.familyTypesRepository.findById(id);
    if (!familyType) {
      throw new NotFoundException('Тип семьи не найден');
    }
    return plainToInstance(FamilyTypeDto, familyType, {
      excludeExtraneousValues: true,
    });
  }

  async create(
    createFamilyTypeDto: CreateFamilyTypeDto,
  ): Promise<FamilyTypeDto> {
    const familyType =
      await this.familyTypesRepository.create(createFamilyTypeDto);
    return plainToInstance(FamilyTypeDto, familyType, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: number,
    updateFamilyTypeDto: UpdateFamilyTypeDto,
  ): Promise<FamilyTypeDto> {
    const existingFamilyType = await this.familyTypesRepository.findById(id);
    if (!existingFamilyType) {
      throw new NotFoundException('Тип семьи не найден');
    }

    const familyType = await this.familyTypesRepository.update(
      id,
      updateFamilyTypeDto,
    );
    return plainToInstance(FamilyTypeDto, familyType, {
      excludeExtraneousValues: true,
    });
  }

  async delete(id: number): Promise<FamilyTypeDto> {
    const existingFamilyType = await this.familyTypesRepository.findById(id);
    if (!existingFamilyType) {
      throw new NotFoundException('Тип семьи не найден');
    }

    const familyType = await this.familyTypesRepository.delete(id);
    return plainToInstance(FamilyTypeDto, familyType, {
      excludeExtraneousValues: true,
    });
  }

  async findAllAdmin(
    query: GetFamilyTypesAdminDto,
  ): Promise<FamilyTypesPaginatedDto> {
    const { page = 1, limit = 50, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    // Убираем фильтр по isActive, так как репозиторий всегда возвращает только активные

    const [familyTypes, total] = await Promise.all([
      this.familyTypesRepository.findAllAdmin(where, skip, limit),
      this.familyTypesRepository.count(where),
    ]);

    const totalPages = Math.ceil(total / limit);

    return plainToInstance(
      FamilyTypesPaginatedDto,
      {
        data: plainToInstance(FamilyTypeDto, familyTypes, {
          excludeExtraneousValues: true,
        }),
        total,
        page,
        limit,
        totalPages,
      },
      { excludeExtraneousValues: true },
    );
  }
}

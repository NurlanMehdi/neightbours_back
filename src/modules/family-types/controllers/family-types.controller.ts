import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FamilyTypesService } from '../family-types.service';
import { CreateFamilyTypeDto } from '../dto/create-family-type.dto';
import { UpdateFamilyTypeDto } from '../dto/update-family-type.dto';
import { FamilyTypeDto } from '../dto/family-type.dto';
import { FamilyTypesPaginatedDto } from '../dto/family-types-paginated.dto';
import { GetFamilyTypesAdminDto } from '../dto/get-family-types-admin.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiStandardResponses } from '../../../common/decorators/api-responses.decorator';

@ApiTags('Админ - Типы семьи')
@Controller('admin/family-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FamilyTypesController {
  constructor(private readonly familyTypesService: FamilyTypesService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить список типов семьи (админ)' })
  @ApiResponse({ status: 200, description: 'Список типов семьи', type: FamilyTypesPaginatedDto })
  @ApiStandardResponses()
  async findAll(@Query() query: GetFamilyTypesAdminDto): Promise<FamilyTypesPaginatedDto> {
    return this.familyTypesService.findAllAdmin(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить тип семьи по ID (админ)' })
  @ApiResponse({ status: 200, description: 'Тип семьи', type: FamilyTypeDto })
  @ApiStandardResponses()
  async findById(@Param('id') id: string): Promise<FamilyTypeDto> {
    return this.familyTypesService.findById(+id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Создать тип семьи (админ)' })
  @ApiResponse({ status: 201, description: 'Тип семьи создан', type: FamilyTypeDto })
  @ApiStandardResponses()
  async create(@Body() createFamilyTypeDto: CreateFamilyTypeDto): Promise<FamilyTypeDto> {
    return this.familyTypesService.create(createFamilyTypeDto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Обновить тип семьи (админ)' })
  @ApiResponse({ status: 200, description: 'Тип семьи обновлен', type: FamilyTypeDto })
  @ApiStandardResponses()
  async update(
    @Param('id') id: string,
    @Body() updateFamilyTypeDto: UpdateFamilyTypeDto,
  ): Promise<FamilyTypeDto> {
    return this.familyTypesService.update(+id, updateFamilyTypeDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить тип семьи (админ)' })
  @ApiResponse({ status: 200, description: 'Тип семьи удален', type: FamilyTypeDto })
  @ApiStandardResponses()
  async delete(@Param('id') id: string): Promise<FamilyTypeDto> {
    return this.familyTypesService.delete(+id);
  }
} 
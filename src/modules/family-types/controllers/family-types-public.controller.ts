import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FamilyTypesService } from '../family-types.service';
import { FamilyTypeDto } from '../dto/family-type.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiStandardResponses } from '../../../common/decorators/api-responses.decorator';

@ApiTags('Типы семьи')
@Controller('family-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FamilyTypesPublicController {
  constructor(private readonly familyTypesService: FamilyTypesService) {}

  @Get()
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Получить список типов семьи' })
  @ApiResponse({
    status: 200,
    description: 'Список типов семьи',
    type: [FamilyTypeDto],
  })
  @ApiStandardResponses()
  async findAll(): Promise<FamilyTypeDto[]> {
    return this.familyTypesService.findAll();
  }
}

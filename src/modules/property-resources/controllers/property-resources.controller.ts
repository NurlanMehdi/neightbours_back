import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserId } from '../../../common/decorators/user-id.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PropertyResourceService } from '../services/property-resource.service';
import { PropertyResourceDto } from '../dto/property-resource.dto';
import { CreatePropertyResourceDto } from '../dto/create-property-resource.dto';
import { UpdatePropertyResourceDto } from '../dto/update-property-resource.dto';

@ApiTags('Ресурсы объектов недвижимости')
@Controller('property-resources')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Roles(UserRole.USER)
export class PropertyResourcesController {
  constructor(
    private readonly propertyResourceService: PropertyResourceService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Создать новый ресурс объекта недвижимости',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Название ресурса',
        },
        category: {
          type: 'string',
          enum: ['WELL', 'GENERATOR', 'SEPTIC', 'OTHER'],
          description: 'Категория ресурса',
        },
        propertyId: {
          type: 'number',
          description: 'ID объекта недвижимости',
        },
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Фотография ресурса',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Ресурс успешно создан',
    type: PropertyResourceDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ к объекту недвижимости запрещен',
  })
  @ApiResponse({
    status: 404,
    description: 'Объект недвижимости не найден',
  })
  @UseInterceptors(FileInterceptor('photo'))
  async createResource(
    @Body() createResourceDto: CreatePropertyResourceDto,
    @UserId() userId: number,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<PropertyResourceDto> {
    return this.propertyResourceService.createResource(
      createResourceDto,
      userId,
      photo,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Получить все ресурсы текущего пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Список ресурсов пользователя',
    type: [PropertyResourceDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async getUserResources(
    @UserId() userId: number,
  ): Promise<PropertyResourceDto[]> {
    return this.propertyResourceService.getUserResources(userId);
  }

  @Get('property/:propertyId')
  @ApiOperation({
    summary: 'Получить все ресурсы конкретного объекта недвижимости',
  })
  @ApiResponse({
    status: 200,
    description: 'Список ресурсов объекта недвижимости',
    type: [PropertyResourceDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ к объекту недвижимости запрещен',
  })
  @ApiResponse({
    status: 404,
    description: 'Объект недвижимости не найден',
  })
  async getResourcesByPropertyId(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @UserId() userId: number,
  ): Promise<PropertyResourceDto[]> {
    return this.propertyResourceService.getResourcesByPropertyId(
      propertyId,
      userId,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить ресурс по ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Ресурс найден',
    type: PropertyResourceDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ к ресурсу запрещен',
  })
  @ApiResponse({
    status: 404,
    description: 'Ресурс не найден',
  })
  async getResourceById(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
  ): Promise<PropertyResourceDto> {
    return this.propertyResourceService.getResourceById(id, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Обновить ресурс',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Название ресурса',
        },
        category: {
          type: 'string',
          enum: ['WELL', 'GENERATOR', 'SEPTIC', 'OTHER'],
          description: 'Категория ресурса',
        },
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Фотография ресурса',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ресурс успешно обновлен',
    type: PropertyResourceDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ к ресурсу запрещен',
  })
  @ApiResponse({
    status: 404,
    description: 'Ресурс не найден',
  })
  @UseInterceptors(FileInterceptor('photo'))
  async updateResource(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResourceDto: UpdatePropertyResourceDto,
    @UserId() userId: number,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<PropertyResourceDto> {
    return this.propertyResourceService.updateResource(
      id,
      updateResourceDto,
      userId,
      photo,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Удалить ресурс',
  })
  @ApiResponse({
    status: 204,
    description: 'Ресурс успешно удален',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ к ресурсу запрещен',
  })
  @ApiResponse({
    status: 404,
    description: 'Ресурс не найден',
  })
  async deleteResource(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
  ): Promise<void> {
    return this.propertyResourceService.deleteResource(id, userId);
  }
}

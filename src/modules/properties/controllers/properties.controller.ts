import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserId } from '../../../common/decorators/user-id.decorator';
import { PropertyService } from '../services/property.service';
import { PropertyDto } from '../dto/property.dto';
import { UpdatePropertyDto } from '../dto/update-property.dto';
import { CreatePropertyDto } from '../dto/create-property.dto';
import { GetCommunityPropertiesDto } from '../dto/get-community-properties.dto';
import { VerifyPropertyDto } from '../dto/verify-property.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Объекты недвижимости')
@Controller('properties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Roles(UserRole.USER)
export class PropertiesController {
  constructor(private readonly propertyService: PropertyService) {}

  @Get('my')
  @ApiOperation({
    summary: 'Получить объекты недвижимости текущего пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Список объектов недвижимости пользователя',
    type: [PropertyDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async getMyProperties(@UserId() userId: number): Promise<PropertyDto[]> {
    return this.propertyService.getUserProperties(userId);
  }

  @Post('my')
  @ApiOperation({
    summary: 'Создать новый объект недвижимости',
    description:
      'Создает новый объект недвижимости для текущего пользователя. Поддерживает загрузку фотографии. Пользователь должен находиться не дальше 100 метров от добавляемого объекта.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Объект недвижимости создан',
    type: PropertyDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные или расстояние превышает 100 метров',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  @UseInterceptors(FileInterceptor('photo'))
  async createProperty(
    @UserId() userId: number,
    @Body() createPropertyDto: CreatePropertyDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<PropertyDto> {
    return this.propertyService.createUserProperty(
      userId,
      createPropertyDto,
      photo,
    );
  }

  @Patch('my/:id')
  @ApiOperation({
    summary: 'Обновить объект недвижимости текущего пользователя',
    description:
      'Обновляет объект недвижимости текущего пользователя. Поддерживает частичное обновление и загрузку фотографии.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID объекта недвижимости',
    type: 'number',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Объект недвижимости обновлен',
    type: PropertyDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  @ApiResponse({
    status: 404,
    description: 'Объект не найден или не принадлежит пользователю',
  })
  @UseInterceptors(FileInterceptor('photo'))
  async updateProperty(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<PropertyDto> {
    return this.propertyService.updateProperty(
      id,
      userId,
      updatePropertyDto,
      photo,
    );
  }

  @Delete('my/:id')
  @ApiOperation({
    summary: 'Удалить объект недвижимости текущего пользователя',
  })
  @ApiParam({
    name: 'id',
    description: 'ID объекта недвижимости',
    type: 'number',
  })
  @ApiResponse({
    status: 204,
    description: 'Объект недвижимости удален',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  @ApiResponse({
    status: 404,
    description: 'Объект не найден или не принадлежит пользователю',
  })
  async deleteProperty(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
  ): Promise<void> {
    return this.propertyService.deleteProperty(id, userId);
  }

  @Get('community')
  @ApiOperation({
    summary: 'Получить объекты недвижимости, принадлежащие сообществу',
  })
  @ApiQuery({
    name: 'communityId',
    description: 'ID сообщества',
    type: 'number',
  })
  @ApiQuery({
    name: 'category',
    description: 'Категория объекта недвижимости',
    enum: ['PRIVATE_HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND'],
    required: false,
  })
  @ApiQuery({
    name: 'latitude',
    description: 'Широта для фильтрации по радиусу',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'longitude',
    description: 'Долгота для фильтрации по радиусу',
    type: 'number',
    required: false,
  })
  @ApiQuery({
    name: 'radius',
    description: 'Радиус поиска в километрах',
    type: 'number',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Список объектов недвижимости сообщества',
    type: [PropertyDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  @ApiResponse({
    status: 404,
    description:
      'Сообщество не найдено или пользователь не является участником',
  })
  async getCommunityProperties(
    @Query() query: GetCommunityPropertiesDto,
    @UserId() userId: number,
  ): Promise<PropertyDto[]> {
    return this.propertyService.getCommunityProperties(query, userId);
  }

  @Post(':id/verify')
  @ApiOperation({
    summary: 'Подтвердить объект недвижимости',
    description:
      'Подтверждает объект недвижимости. Пользователь должен находиться не дальше 100 метров от объекта и не может подтверждать собственный объект. После 3 подтверждений объект становится подтвержденным.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID объекта недвижимости',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Объект недвижимости подтвержден',
    type: PropertyDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Некорректные данные, расстояние превышает 100 метров, пользователь уже подтверждал объект или пытается подтвердить собственный объект',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  @ApiResponse({
    status: 404,
    description: 'Объект не найден',
  })
  async verifyProperty(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() verifyPropertyDto: VerifyPropertyDto,
  ): Promise<PropertyDto> {
    return this.propertyService.verifyProperty(id, userId, verifyPropertyDto);
  }

  /**
   * Получить все чужие неподтвержденные объекты недвижимости с фильтрацией по радиусу
   * @param userId ID текущего пользователя
   * @param latitude Широта центра поиска
   * @param longitude Долгота центра поиска
   * @param radius Радиус поиска в километрах
   */
  @Get('unverified-others')
  @ApiOperation({
    summary: 'Получить все чужие неподтвержденные объекты недвижимости',
    description:
      'Возвращает список всех объектов недвижимости, которые не принадлежат текущему пользователю и имеют статус UNVERIFIED. Можно фильтровать по радиусу на карте.',
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    type: Number,
    description: 'Широта центра поиска',
    example: 55.7558,
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    type: Number,
    description: 'Долгота центра поиска',
    example: 37.6176,
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description: 'Радиус поиска в километрах',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Список чужих неподтвержденных объектов недвижимости',
    type: [PropertyDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async getUnverifiedOthers(
    @UserId() userId: number,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radius') radius?: number,
  ): Promise<PropertyDto[]> {
    return this.propertyService.getUnverifiedOthers({
      userId,
      latitude,
      longitude,
      radius,
    });
  }
}

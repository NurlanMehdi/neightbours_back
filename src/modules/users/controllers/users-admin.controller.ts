import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  Patch,
  UploadedFile,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { UserDto } from '../dto/user.dto';
import { BulkDeleteUsersDto } from '../dto/bulk-delete-users.dto';
import { DeleteResponseDto } from '../dto/delete-response.dto';
import { CreateAdminDto } from '../dto/create.admin.dto';
import { PaginationQueryDto } from '../../../common/models/paginated-query.dto';
import { BlockUserDto } from '../dto/block.user.dto';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateUserAdminDto } from '../dto/create-user-admin.dto';
import { GetUsersAdminDto } from '../dto/get-users-admin.dto';
import { ApiStandardResponses } from '../../../common/decorators/api-responses.decorator';
import { UpdateUserDto } from '../dto/update.user.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Управление пользователями')
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly userService: UserService) {}

  @Post('register/admin')
  @ApiOperation({ summary: 'Создать администратора' })
  @ApiResponse({ type: UserDto })
  @ApiBody({
    type: CreateAdminDto,
  })
  async createAdmin(@Body() dto: CreateAdminDto): Promise<UserDto> {
    return await this.userService.createAdmin(dto);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Создание нового пользователя администратором',
  })
  @ApiStandardResponses()
  async createUser(@Body() dto: CreateUserAdminDto): Promise<UserDto> {
    return this.userService.createUserByAdmin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'Получить список пользователей с фильтрацией',
    description:
      'Получение списка пользователей с поддержкой пагинации, сортировки и фильтрации',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы (по умолчанию: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество записей на странице (по умолчанию: 10)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['id', 'name', 'phone', 'createdAt'],
    description: 'Поле для сортировки',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Порядок сортировки',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Текстовый поиск по полям firstName, lastName, phone, email',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Начальная дата периода регистрации (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Конечная дата периода регистрации (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'communityId',
    required: false,
    type: String,
    description: 'ID сообщества или "none" для пользователей без сообщества',
  })
  @ApiQuery({
    name: 'isVerified',
    required: false,
    type: Boolean,
    description: 'Статус верификации (true/false)',
  })
  @ApiStandardResponses()
  async findAllForAdmin(@Query() filters: GetUsersAdminDto) {
    return this.userService.findAllForAdmin(filters);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('blockings')
  @ApiOperation({ summary: 'Получить список блокировок' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllBlockings(@Query() pagination: PaginationQueryDto) {
    return this.userService.findAllBlockings(pagination);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Put(':id/block')
  @ApiOperation({ summary: 'Блокировка пользователя' })
  @ApiBody({
    type: BlockUserDto,
  })
  async blockUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BlockUserDto,
  ): Promise<UserDto> {
    return await this.userService.blockUser(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Put(':id/blockings/:blockingId/unblock')
  @ApiOperation({ summary: 'Разблокировка пользователя' })
  async unblockUser(
    @Param('id', ParseIntPipe) userId: number,
    @Param('blockingId', ParseIntPipe) blockingId: number,
  ): Promise<UserDto> {
    return await this.userService.unblockUser(userId, blockingId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get(':id/full')
  @ApiOperation({ summary: 'Получить полную информацию о пользователе' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Информация о пользователе',
    type: UserDto,
  })
  async getUserFull(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    return this.userService.getUserForAdmin(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Обновить пользователя по ID (админ)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateUserDto })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно обновлён',
    type: UserDto,
  })
  @ApiStandardResponses()
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUserByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<UserDto> {
    return this.userService.updateUser(id, updateUserDto, avatar);
  }

  // Методы для работы с квалификациями пользователя
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get(':id/qualifications')
  @ApiOperation({ summary: 'Получить квалификации пользователя' })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя' })
  async getUserQualifications(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserQualifications(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post(':id/qualifications/:qualificationId')
  @ApiOperation({ summary: 'Добавить квалификацию пользователю' })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя' })
  @ApiParam({
    name: 'qualificationId',
    type: Number,
    description: 'ID квалификации',
  })
  async addUserQualification(
    @Param('id', ParseIntPipe) userId: number,
    @Param('qualificationId', ParseIntPipe) qualificationId: number,
  ): Promise<void> {
    return this.userService.addUserQualification(userId, qualificationId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(':id/qualifications/:qualificationId')
  @ApiOperation({ summary: 'Удалить квалификацию у пользователя' })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя' })
  @ApiParam({
    name: 'qualificationId',
    type: Number,
    description: 'ID квалификации',
  })
  async removeUserQualification(
    @Param('id', ParseIntPipe) userId: number,
    @Param('qualificationId', ParseIntPipe) qualificationId: number,
  ): Promise<void> {
    return this.userService.removeUserQualification(userId, qualificationId);
  }

  // Методы для работы с продуктами пользователя
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get(':id/products')
  @ApiOperation({ summary: 'Получить продукты пользователя' })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя' })
  async getUserProducts(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserProducts(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post(':id/products/:productId')
  @ApiOperation({ summary: 'Добавить продукт пользователю' })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя' })
  @ApiParam({ name: 'productId', type: Number, description: 'ID продукта' })
  async addUserProduct(
    @Param('id', ParseIntPipe) userId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<void> {
    return this.userService.addUserProduct(userId, productId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(':id/products/:productId')
  @ApiOperation({ summary: 'Удалить продукт у пользователя' })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя' })
  @ApiParam({ name: 'productId', type: Number, description: 'ID продукта' })
  async removeUserProduct(
    @Param('id', ParseIntPipe) userId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<void> {
    return this.userService.removeUserProduct(userId, productId);
  }

  // Удаление пользователей
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete('bulk')
  @ApiOperation({
    summary: 'Массовое удаление пользователей',
    description:
      'Выполняет полное удаление нескольких пользователей из базы данных',
  })
  @ApiBody({ type: BulkDeleteUsersDto })
  @ApiResponse({
    status: 200,
    description: 'Пользователи успешно удалены',
    type: DeleteResponseDto,
    example: {
      success: true,
      message: 'Пользователи успешно удалены',
      deletedCount: 5,
    },
  })
  @ApiStandardResponses()
  async bulkDeleteUsers(
    @Body() dto: BulkDeleteUsersDto,
  ): Promise<DeleteResponseDto> {
    return this.userService.bulkDeleteUsers(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({
    summary: 'Удаление пользователя',
    description: 'Выполняет полное удаление пользователя из базы данных по ID',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно удален',
    type: DeleteResponseDto,
    example: {
      success: true,
      message: 'Пользователь успешно удален',
    },
  })
  @ApiStandardResponses()
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteResponseDto> {
    return this.userService.deleteUser(id);
  }
}

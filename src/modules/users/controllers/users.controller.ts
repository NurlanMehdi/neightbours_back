import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';
import { UserId } from '../../../common/decorators/user-id.decorator';
import { UserService } from '../services/user.service';
import { UserDto } from '../dto/user.dto';
import { UpdateUserDto } from '../dto/update.user.dto';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiStandardResponses } from '../../../common/decorators/api-responses.decorator';
import { RegistrationStepDto } from '../dto/registration-step.dto';
import { RegistrationStep1Dto } from '../dto/registration-step1.dto';
import { RegistrationStep2Dto } from '../dto/registration-step2.dto';
import { RegistrationStep3Dto } from '../dto/registration-step3.dto';
import { PropertyCategory } from '../dto/property-category.dto';
import { RegistrationStep4Dto } from '../dto/registration-step4.dto';
import { RegistrationStep4ResponseDto } from '../dto/registration-step4-response.dto';
import { PropertyDto } from '../../properties/dto/property.dto';
import { JoinCommunityDto } from '../dto/join-community.dto';
import { CommunityUserDto } from '../../communities/dto/community-user.dto';
import { CommunityService } from '../../communities/services/community.service';
import { GetUserVerificationsDto } from '../dto/get-user-verifications.dto';
import { UserVerificationsPaginatedDto } from '../dto/user-verifications-paginated.dto';
import { GetUserEventsDto } from '../dto/get-user-events.dto';
import { UserEventsPaginatedDto } from '../dto/user-events-paginated.dto';
import {
  UpdateFcmTokenDto,
  PushNotificationSettingsDto,
  FcmTokenResponseDto,
} from '../dto/fcm-token.dto';

@ApiTags('Пользователи')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly communityService: CommunityService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Получить информацию о текущем пользователе' })
  @ApiResponse({
    status: 200,
    description: 'Информация о пользователе успешно получена',
  })
  async getMe(@UserId() userId: number): Promise<UserDto> {
    return this.userService.findById(userId);
  }

  @Patch('me')
  @Roles(UserRole.USER)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Обновление данных текущего пользователя' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Данные пользователя успешно обновлены',
  })
  @ApiStandardResponses()
  async updateUser(
    @UserId() userId: number,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.userService.updateUser(userId, updateUserDto, avatar);
  }

  @Get('registration/step')
  @ApiOperation({ summary: 'Получить текущий шаг регистрации' })
  @ApiResponse({
    status: 200,
    description: 'Шаг регистрации успешно получен',
    type: RegistrationStepDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @UseGuards(JwtAuthGuard)
  async getRegistrationStep(@Request() req): Promise<RegistrationStepDto> {
    const user = await this.userService.findById(req.user.id);
    return { step: user.registrationStep };
  }

  @Post('registration/step-one')
  @ApiOperation({
    summary: 'Первый шаг регистрации - сохранение координат и адреса',
  })
  @ApiResponse({
    status: 200,
    description: 'Данные успешно сохранены',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден',
  })
  @UseGuards(JwtAuthGuard)
  async handleRegistrationStep1(
    @Request() req,
    @Body() dto: RegistrationStep1Dto,
  ): Promise<UserDto> {
    return this.userService.handleRegistrationStep1(req.user.id, dto);
  }

  @Post('registration/step-two')
  @ApiOperation({
    summary: 'Второй шаг регистрации - сохранение личных данных и аватара',
  })
  @ApiStandardResponses()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Аватар пользователя (изображение)',
        },
        firstName: {
          type: 'string',
          description: 'Имя пользователя',
        },
        lastName: {
          type: 'string',
          description: 'Фамилия пользователя',
        },
        email: {
          type: 'string',
          description: 'Email пользователя (необязательное поле)',
          nullable: true,
        },
      },
      required: ['firstName', 'lastName'],
    },
  })
  @UseInterceptors(FileInterceptor('avatar'))
  async handleRegistrationStep2(
    @UserId() userId: number,
    @Body() dto: RegistrationStep2Dto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<UserDto> {
    return this.userService.handleRegistrationStep2(userId, dto, avatar);
  }

  @Post('registration/step-three')
  @ApiOperation({
    summary: 'Третий шаг регистрации - создание объекта недвижимости',
  })
  @ApiResponse({
    status: 200,
    description: 'Объект недвижимости успешно создан',
    type: PropertyDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные или шаг регистрации',
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Название объекта недвижимости',
          example: 'Дом на улице Ленина',
        },
        category: {
          type: 'string',
          enum: Object.values(PropertyCategory),
          example: PropertyCategory.PRIVATE_HOUSE,
        },
        latitude: {
          type: 'number',
          example: 55.7558,
        },
        longitude: {
          type: 'number',
          example: 37.6173,
        },
        photo: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['name', 'category', 'latitude', 'longitude'],
    },
  })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async handleRegistrationStep3(
    @UserId() userId: number,
    @Body() dto: RegistrationStep3Dto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<PropertyDto> {
    return this.userService.handleRegistrationStep3(userId, dto, photo);
  }

  @Post('registration/step-four')
  @ApiOperation({
    summary: 'Четвертый шаг регистрации - вступление в сообщество',
    description:
      'Вступление в существующее сообщество по коду или создание нового сообщества. Пользователь должен находиться не дальше 500 метров от границы сообщества. При создании нового сообщества можно указать координаты сообщества (communityLatitude, communityLongitude), иначе будут использованы координаты пользователя.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Пользователь успешно вступил в сообщество или создал новое с кодом для присоединения',
    type: RegistrationStep4ResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Неверные данные, шаг регистрации или расстояние превышает 500 метров',
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден',
  })
  @UseGuards(JwtAuthGuard)
  async handleRegistrationStep4(
    @UserId() userId: number,
    @Body() dto: RegistrationStep4Dto,
  ): Promise<RegistrationStep4ResponseDto> {
    return this.userService.handleRegistrationStep4(userId, dto);
  }

  @Post('registration/generate-community-code')
  @ApiOperation({ summary: 'Генерация кода для вступления в сообщество' })
  @ApiResponse({
    status: 200,
    description: 'Код успешно сгенерирован',
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          example: 'ABC123',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный шаг регистрации',
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден',
  })
  @UseGuards(JwtAuthGuard)
  async generateCommunityCode(
    @UserId() userId: number,
  ): Promise<{ code: string }> {
    const code = await this.userService.generateCommunityCode(userId);
    return { code };
  }

  @Post('join-community')
  @ApiOperation({
    summary: 'Вступление в сообщество по коду',
    description:
      'Вступление в существующее сообщество по коду. Пользователь должен находиться не дальше 500 метров от границы сообщества и не может вступить в сообщество, которое создал сам.',
  })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно вступил в сообщество',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Неверный код сообщества, пользователь уже в сообществе, расстояние превышает 500 метров или пользователь пытается вступить в созданное им сообщество',
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @UseGuards(JwtAuthGuard)
  async joinCommunity(
    @UserId() userId: number,
    @Body() dto: JoinCommunityDto,
  ): Promise<UserDto> {
    await this.userService.joinCommunity(
      userId,
      dto.communityCode,
      dto.userLatitude,
      dto.userLongitude,
    );
    return this.userService.findById(userId);
  }

  @Get('communities/:id/users')
  @ApiOperation({
    summary: 'Получить список пользователей сообщества',
    description:
      'Возвращает список пользователей указанного сообщества с их базовой информацией. Доступно только участникам и создателям сообщества.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID сообщества',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей успешно получен',
    type: [CommunityUserDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Сообщество не найдено',
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: 403,
    description:
      'Доступ запрещен - пользователь не является участником или создателем сообщества',
  })
  @ApiStandardResponses()
  @UseGuards(JwtAuthGuard)
  async getCommunityUsers(
    @UserId() userId: number,
    @Param('id', ParseIntPipe) communityId: number,
  ): Promise<CommunityUserDto[]> {
    return this.communityService.getCommunityUsers(communityId, userId);
  }

  @Get('verifications')
  @ApiOperation({
    summary: 'Получить подтверждения объектов пользователя',
    description:
      'Возвращает список объектов недвижимости, подтвержденных текущим пользователем, с пагинацией и фильтрацией.',
  })
  @ApiResponse({
    status: 200,
    description: 'Список подтверждений успешно получен',
    type: UserVerificationsPaginatedDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @UseGuards(JwtAuthGuard)
  async getUserVerifications(
    @UserId() userId: number,
    @Query() filters: GetUserVerificationsDto,
  ): Promise<UserVerificationsPaginatedDto> {
    return this.userService.getUserVerifications(userId, filters);
  }

  @Get('events')
  @ApiOperation({
    summary: 'Получить события пользователя',
    description:
      'Возвращает список событий и уведомлений, созданных текущим пользователем. При включении параметра includeParticipating=true также возвращает события, где пользователь является участником.',
  })
  @ApiResponse({
    status: 200,
    description: 'Список событий успешно получен',
    type: UserEventsPaginatedDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @UseGuards(JwtAuthGuard)
  async getUserEvents(
    @UserId() userId: number,
    @Query() filters: GetUserEventsDto,
  ): Promise<UserEventsPaginatedDto> {
    return this.userService.getUserEvents(userId, filters);
  }

  @Patch('fcm-token')
  @ApiOperation({
    summary: 'Обновить FCM токен',
    description:
      'Обновляет FCM токен пользователя для получения push-уведомлений',
  })
  @ApiResponse({
    status: 200,
    description: 'FCM токен успешно обновлен',
    type: FcmTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @ApiStandardResponses()
  @UseGuards(JwtAuthGuard)
  async updateFcmToken(
    @UserId() userId: number,
    @Body() updateFcmTokenDto: UpdateFcmTokenDto,
  ): Promise<FcmTokenResponseDto> {
    return this.userService.updateFcmToken(userId, updateFcmTokenDto);
  }

  @Get('admin/fcm-duplicates')
  @ApiOperation({
    summary: 'Получить дублирующиеся FCM токены (Админ)',
    description: 'Возвращает список FCM токенов, которые используются несколькими пользователями',
  })
  @ApiResponse({
    status: 200,
    description: 'Список дублирующихся FCM токенов',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getFcmDuplicates() {
    return this.userService.getFcmTokenDuplicates();
  }

  @Post('admin/cleanup-fcm-duplicates')
  @ApiOperation({
    summary: 'Очистить дублирующиеся FCM токены (Админ)',
    description: 'Удаляет дублирующиеся FCM токены, оставляя только у последнего активного пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Дублирующиеся FCM токены успешно очищены',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async cleanupFcmDuplicates() {
    return this.userService.cleanupAllFcmDuplicates();
  }

  @Patch('push-notifications')
  @ApiOperation({
    summary: 'Настройки push-уведомлений',
    description: 'Включает или отключает push-уведомления для пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Настройки push-уведомлений успешно обновлены',
    type: FcmTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @ApiStandardResponses()
  @UseGuards(JwtAuthGuard)
  async updatePushNotificationSettings(
    @UserId() userId: number,
    @Body() settings: PushNotificationSettingsDto,
  ): Promise<FcmTokenResponseDto> {
    return this.userService.updatePushNotificationSettings(userId, settings);
  }

  @Post('fcm-token/remove')
  @ApiOperation({
    summary: 'Удалить FCM токен',
    description: 'Удаляет FCM токен пользователя и отключает push-уведомления',
  })
  @ApiResponse({
    status: 200,
    description: 'FCM токен успешно удален',
    type: FcmTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  @ApiStandardResponses()
  @UseGuards(JwtAuthGuard)
  async removeFcmToken(@UserId() userId: number): Promise<FcmTokenResponseDto> {
    return this.userService.removeFcmToken(userId);
  }
}

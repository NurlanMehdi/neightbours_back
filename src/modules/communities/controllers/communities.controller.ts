import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CommunityService } from '../services/community.service';
import { CommunityInfoDto } from '../dto/community-info.dto';
import { ApiStandardResponses } from '../../../common/decorators/api-responses.decorator';
import { ConfirmationStatusDto } from '../dto/confirmation-status.dto';
import { JoinByCodeResponseDto } from '../dto/join-by-code-response.dto';
import { CreateCommunityDto } from '../dto/create-community.dto';
import { CreateCommunityResponseDto } from '../dto/create-community-response.dto';
import { UserId } from '../../../common/decorators/user-id.decorator';

class JoinByCodeDto {
  code: string;
}

@ApiTags('Сообщества')
@Controller('communities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunitiesController {
  constructor(private readonly communityService: CommunityService) {}

  @Post()
  @ApiOperation({
    summary: 'Создать новое сообщество',
    description: 'Создает новое сообщество со статусом INACTIVE и сроком подтверждения 24 часа',
  })
  @ApiBody({
    type: CreateCommunityDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Сообщество успешно создано',
    type: CreateCommunityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные данные',
  })
  @ApiStandardResponses()
  async createCommunity(
    @UserId() userId: number,
    @Body() dto: CreateCommunityDto,
  ): Promise<CreateCommunityResponseDto> {
    return this.communityService.createCommunity(
      userId,
      dto.name,
      dto.latitude,
      dto.longitude,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить информацию о сообществе',
    description: 'Получение информации о сообществе по его идентификатору',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID сообщества',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация о сообществе успешно получена',
    type: CommunityInfoDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Сообщество не найдено',
  })
  @ApiStandardResponses()
  async getCommunityInfo(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CommunityInfoDto> {
    return this.communityService.getCommunityInfo(id);
  }

  @Post('join-by-code')
  @ApiOperation({
    summary: 'Присоединиться к сообществу по коду',
    description:
      'Позволяет пользователю присоединиться к сообществу используя код присоединения. При достижении требуемого количества участников сообщество активируется автоматически.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          example: '123456',
          description: 'Код для присоединения к сообществу',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Успешно присоединились к сообществу',
    type: JoinByCodeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный код или пользователь уже является участником',
  })
  @ApiStandardResponses()
  async joinByCode(
    @UserId() userId: number,
    @Body() dto: JoinByCodeDto,
  ): Promise<any> {
    return this.communityService.joinCommunity(userId, dto.code);
  }

  @Get(':id/confirmation-status')
  @ApiOperation({
    summary: 'Получить статус подтверждения сообщества',
    description:
      'Возвращает информацию о текущем статусе подтверждения сообщества, количестве участников и дедлайне',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID сообщества',
  })
  @ApiResponse({
    status: 200,
    description: 'Статус подтверждения успешно получен',
    type: ConfirmationStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Сообщество не найдено',
  })
  @ApiStandardResponses()
  async getConfirmationStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ConfirmationStatusDto> {
    return this.communityService.getConfirmationStatus(id);
  }
}

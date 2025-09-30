import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { SearchMessagesQueryDto } from './dto/search-messages-query.dto';
import { SearchMessagesResponseDto } from './dto/search-messages-response.dto';
import { ApiStandardResponses } from '../../common/decorators/api-responses.decorator';

/**
 * Контроллер для работы с поиском сообщений
 */
@ApiTags('Поиск сообщений')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Поиск сообщений по всем источникам
   * @param query Параметры поиска
   * @param req HTTP запрос с информацией о пользователе
   * @returns Результаты поиска по всем источникам
   */
  @Get('search')
  @ApiOperation({
    summary: 'Поиск сообщений по всем источникам',
    description:
      'Поиск сообщений в событиях, сообществах и приватных чатах. ' +
      'Возвращаются только сообщения, к которым у пользователя есть доступ.',
  })
  @ApiResponse({
    status: 200,
    description: 'Результаты поиска успешно получены',
    type: SearchMessagesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректные параметры запроса',
  })
  @ApiStandardResponses()
  async searchMessages(
    @Query() query: SearchMessagesQueryDto,
    @Request() req: any,
  ): Promise<SearchMessagesResponseDto> {
    const userId = req.user.id;
    return this.messagesService.searchAllMessages(userId, query.q);
  }
}


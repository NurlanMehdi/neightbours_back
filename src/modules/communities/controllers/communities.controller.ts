import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CommunityService } from '../services/community.service';
import { CommunityInfoDto } from '../dto/community-info.dto';
import { ApiStandardResponses } from '../../../common/decorators/api-responses.decorator';

@ApiTags('Сообщества')
@Controller('communities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunitiesController {
  constructor(private readonly communityService: CommunityService) {}

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
}

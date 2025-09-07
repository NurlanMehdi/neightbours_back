import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { ProfileDeletionService } from '../services/profile-deletion.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserId } from '../../../common/decorators/user-id.decorator';
import { ApiStandardResponses } from '../../../common/decorators/api-responses.decorator';
import {
  RequestDeletionDto,
  ConfirmDeletionDto,
  ConfirmDeletionResponseDto,
  RestoreProfileDto,
} from '../dto/profile-deletion.dto';

@ApiTags('Удаление профиля')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileDeletionController {
  constructor(
    private readonly profileDeletionService: ProfileDeletionService,
  ) {}

  @Post('delete-request')
  @ApiOperation({ summary: 'Запросить удаление профиля' })
  @ApiResponse({ status: 200, type: RequestDeletionDto })
  @ApiStandardResponses()
  async requestDeletion(@UserId() userId: number): Promise<RequestDeletionDto> {
    return this.profileDeletionService.requestDeletion(userId);
  }

  @Post('confirm-delete')
  @ApiOperation({ summary: 'Подтвердить удаление профиля' })
  @ApiResponse({ status: 200, type: ConfirmDeletionResponseDto })
  @ApiStandardResponses()
  async confirmDeletion(
    @UserId() userId: number,
    @Body() dto: ConfirmDeletionDto,
  ): Promise<ConfirmDeletionResponseDto> {
    return this.profileDeletionService.confirmDeletion(userId, dto.code);
  }

  @Post('restore')
  @ApiOperation({ summary: 'Восстановить профиль' })
  @ApiResponse({ status: 200, type: RestoreProfileDto })
  @ApiStandardResponses()
  async restoreProfile(@UserId() userId: number): Promise<RestoreProfileDto> {
    return this.profileDeletionService.restoreProfile(userId);
  }
}

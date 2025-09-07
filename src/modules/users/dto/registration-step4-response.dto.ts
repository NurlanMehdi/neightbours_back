import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserDto } from './user.dto';

export class RegistrationStep4ResponseDto {
  @ApiProperty({
    description: 'Данные пользователя с информацией о сообществе',
    type: UserDto,
  })
  @Expose()
  user: UserDto;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class VoteDto {
  @ApiProperty({
    description: 'ID варианта ответа для голосования',
    example: 1,
  })
  @IsInt({ message: 'ID варианта ответа должен быть целым числом' })
  @IsPositive({
    message: 'ID варианта ответа должен быть положительным числом',
  })
  votingOptionId: number;
}

export class VoteResponseDto {
  @ApiProperty({
    description: 'ID голосования',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID мероприятия',
    example: 1,
  })
  eventId: number;

  @ApiProperty({
    description: 'ID варианта ответа',
    example: 1,
  })
  votingOptionId: number;

  @ApiProperty({
    description: 'ID пользователя',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: 'Дата создания голоса',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}

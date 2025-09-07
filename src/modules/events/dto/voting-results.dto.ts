import { ApiProperty } from '@nestjs/swagger';

export class VotingOptionResultDto {
  @ApiProperty({
    description: 'ID варианта ответа',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Текст варианта ответа',
    example: 'Да, я буду участвовать',
  })
  text: string;

  @ApiProperty({
    description: 'Количество голосов за этот вариант',
    example: 15,
  })
  votesCount: number;

  @ApiProperty({
    description: 'Процент голосов за этот вариант',
    example: 60.5,
  })
  percentage: number;

  @ApiProperty({
    description: 'Проголосовал ли текущий пользователь за этот вариант',
    example: true,
  })
  isVotedByCurrentUser: boolean;
}

export class VotingResultsDto {
  @ApiProperty({
    description: 'ID мероприятия',
    example: 1,
  })
  eventId: number;

  @ApiProperty({
    description: 'Вопрос для голосования',
    example: 'Будете ли вы участвовать в мероприятии?',
  })
  votingQuestion: string;

  @ApiProperty({
    description: 'Общее количество голосов',
    example: 25,
  })
  totalVotes: number;

  @ApiProperty({
    description: 'Варианты ответов с результатами',
    type: [VotingOptionResultDto],
  })
  options: VotingOptionResultDto[];

  @ApiProperty({
    description: 'Проголосовал ли текущий пользователь',
    example: true,
  })
  hasVoted: boolean;

  @ApiProperty({
    description:
      'ID варианта ответа, за который проголосовал текущий пользователь',
    example: 1,
    required: false,
  })
  userVoteOptionId?: number;
}

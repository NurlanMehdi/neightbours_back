import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Voting, VotingOption } from '@prisma/client';

@Injectable()
export class VotingRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Проверяет, существует ли мероприятие с голосованием
   */
  async isEventWithVoting(eventId: number): Promise<boolean> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { hasVoting: true },
    });
    return event?.hasVoting || false;
  }

  /**
   * Проверяет, существует ли вариант ответа для данного мероприятия
   */
  async isVotingOptionExists(
    eventId: number,
    votingOptionId: number,
  ): Promise<boolean> {
    const option = await this.prisma.votingOption.findFirst({
      where: {
        id: votingOptionId,
        eventId: eventId,
      },
    });
    return !!option;
  }

  /**
   * Проверяет, проголосовал ли пользователь в данном мероприятии
   */
  async hasUserVoted(eventId: number, userId: number): Promise<boolean> {
    const vote = await this.prisma.voting.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
    return !!vote;
  }

  /**
   * Получает голос пользователя в мероприятии
   */
  async getUserVote(eventId: number, userId: number): Promise<Voting | null> {
    return this.prisma.voting.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
  }

  /**
   * Создает голос пользователя
   */
  async createVote(
    eventId: number,
    votingOptionId: number,
    userId: number,
  ): Promise<Voting> {
    return this.prisma.voting.create({
      data: {
        eventId,
        votingOptionId,
        userId,
      },
    });
  }

  /**
   * Удаляет голос пользователя
   */
  async removeVote(eventId: number, userId: number): Promise<void> {
    await this.prisma.voting.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
  }

  /**
   * Получает результаты голосования для мероприятия
   */
  async getVotingResults(
    eventId: number,
    userId: number,
  ): Promise<{
    votingQuestion: string;
    totalVotes: number;
    options: Array<{
      id: number;
      text: string;
      votesCount: number;
      percentage: number;
      isVotedByCurrentUser: boolean;
    }>;
    hasVoted: boolean;
    userVoteOptionId?: number;
  }> {
    // Получаем мероприятие с вопросом для голосования
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { votingQuestion: true },
    });

    if (!event?.votingQuestion) {
      throw new BadRequestException('Мероприятие не содержит голосования');
    }

    // Получаем все варианты ответов с количеством голосов
    const optionsWithVotes = await this.prisma.votingOption.findMany({
      where: { eventId },
      include: {
        _count: {
          select: { votings: true },
        },
      },
    });

    // Получаем голос текущего пользователя
    const userVote = await this.getUserVote(eventId, userId);

    // Вычисляем общее количество голосов
    const totalVotes = optionsWithVotes.reduce(
      (sum, option) => sum + option._count.votings,
      0,
    );

    // Формируем результаты
    const options = optionsWithVotes.map((option) => ({
      id: option.id,
      text: option.text,
      votesCount: option._count.votings,
      percentage:
        totalVotes > 0 ? (option._count.votings / totalVotes) * 100 : 0,
      isVotedByCurrentUser: userVote?.votingOptionId === option.id,
    }));

    return {
      votingQuestion: event.votingQuestion,
      totalVotes,
      options,
      hasVoted: !!userVote,
      userVoteOptionId: userVote?.votingOptionId,
    };
  }

  /**
   * Получает все варианты ответов для мероприятия
   */
  async getVotingOptions(eventId: number): Promise<VotingOption[]> {
    return this.prisma.votingOption.findMany({
      where: { eventId },
      orderBy: { id: 'asc' },
    });
  }
}

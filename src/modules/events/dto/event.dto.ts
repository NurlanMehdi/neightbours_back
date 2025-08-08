import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { EventType } from '@prisma/client';
import { 
  IEventCreator, 
  IEventParticipant, 
  IEventCategory, 
  IEventCommunity,
  IVotingOption, 
  IEvent, 
  IEventsList 
} from '../interfaces/event.interface';

/**
 * DTO для варианта голосования в ответе
 */
export class VotingOptionDto implements IVotingOption {
  @ApiProperty({ description: 'ID варианта голосования' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Текст варианта ответа' })
  @Expose()
  text: string;
}

/**
 * DTO для создателя события
 */
export class EventCreatorDto implements IEventCreator {
  @ApiProperty({ description: 'ID создателя' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Имя создателя' })
  @Expose()
  firstName: string;

  @ApiProperty({ description: 'Фамилия создателя' })
  @Expose()
  lastName: string;

  @ApiProperty({ description: 'Аватар создателя', required: false })
  @Expose()
  avatar?: string;

  @ApiProperty({ description: 'Широта местоположения создателя', required: false })
  @Expose()
  latitude?: number;

  @ApiProperty({ description: 'Долгота местоположения создателя', required: false })
  @Expose()
  longitude?: number;

  @ApiProperty({ description: 'Адрес создателя', required: false })
  @Expose()
  address?: string;
}

/**
 * DTO для участника события
 */
export class EventParticipantDto implements IEventParticipant {
  @ApiProperty({ description: 'ID участника' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Имя участника' })
  @Expose()
  firstName: string;

  @ApiProperty({ description: 'Фамилия участника' })
  @Expose()
  lastName: string;

  @ApiProperty({ description: 'Аватар участника', required: false })
  @Expose()
  avatar?: string;

  @ApiProperty({ description: 'Широта местоположения участника', required: false })
  @Expose()
  latitude?: number;

  @ApiProperty({ description: 'Долгота местоположения участника', required: false })
  @Expose()
  longitude?: number;

  @ApiProperty({ description: 'Адрес участника', required: false })
  @Expose()
  address?: string;
}

/**
 * DTO для категории события
 */
export class EventCategoryDto implements IEventCategory {
  @ApiProperty({ description: 'ID категории' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Название категории' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Иконка категории' })
  @Expose()
  icon: string;

  @ApiProperty({ 
    description: 'Цвет категории',
    example: '#FF5733',
    required: false,
  })
  @Expose()
  color?: string;

  @ApiProperty({ 
    description: 'Тип категории',
    enum: EventType,
    example: EventType.EVENT,
  })
  @Expose()
  type: EventType;

  @ApiProperty({ description: 'Активна ли категория' })
  @Expose()
  isActive: boolean;
}

/**
 * DTO для сообщества события
 */
export class EventCommunityDto implements IEventCommunity {
  @ApiProperty({ description: 'ID сообщества' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Название сообщества' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Описание сообщества', required: false })
  @Expose()
  description?: string;
}

/**
 * DTO для события в ответе
 */
export class EventDto implements IEvent {
  @ApiProperty({ description: 'ID события' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Название события' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Описание события', required: false })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Картинка события', required: false })
  @Expose()
  image?: string;

  @ApiProperty({ description: 'Широта' })
  @Expose()
  @Transform(({ value }) => Number(value))
  latitude: number;

  @ApiProperty({ description: 'Долгота' })
  @Expose()
  @Transform(({ value }) => Number(value))
  longitude: number;

  @ApiProperty({ description: 'Тип события', enum: EventType })
  @Expose()
  type: EventType;

  @ApiProperty({ description: 'Нужно ли голосование' })
  @Expose()
  hasVoting: boolean;

  @ApiProperty({ description: 'Вопрос для голосования', required: false })
  @Expose()
  votingQuestion?: string;

  @ApiProperty({ description: 'Нужен ли сбор денег' })
  @Expose()
  hasMoneyCollection: boolean;

  @ApiProperty({ description: 'Сумма сбора', required: false })
  @Expose()
  moneyAmount?: number;

  @ApiProperty({ description: 'Дата создания' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: 'Создатель события', type: EventCreatorDto })
  @Expose()
  creator: EventCreatorDto;

  @ApiProperty({ description: 'Категория события', type: EventCategoryDto, required: false })
  @Expose()
  category?: EventCategoryDto;

  @ApiProperty({ description: 'Сообщество события', type: EventCommunityDto })
  @Expose()
  community: EventCommunityDto;

  @ApiProperty({ description: 'Участники события', type: [EventParticipantDto] })
  @Expose()
  participants: EventParticipantDto[];

  @ApiProperty({ description: 'Варианты голосования', type: [VotingOptionDto], required: false })
  @Expose()
  votingOptions?: VotingOptionDto[];

  @ApiProperty({ description: 'Дата и время проведения мероприятия', required: false, example: '2025-08-01T18:00:00.000Z' })
  @Expose()
  eventDateTime?: Date;
}

/**
 * DTO для списка событий с пагинацией
 */
export class EventsListDto implements IEventsList {
  @ApiProperty({ description: 'События', type: [EventDto] })
  @Expose()
  events: EventDto[];

  @ApiProperty({ description: 'Общее количество событий' })
  @Expose()
  total: number;
} 
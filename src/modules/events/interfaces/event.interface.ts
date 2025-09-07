import { EventType } from '@prisma/client';

/**
 * Интерфейс для создателя события
 */
export interface IEventCreator {
  id: number;
  firstName: string;
  lastName: string;
  avatar?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

/**
 * Интерфейс для участника события
 */
export interface IEventParticipant {
  id: number;
  firstName: string;
  lastName: string;
  avatar?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

/**
 * Интерфейс для категории события
 */
export interface IEventCategory {
  id: number;
  name: string;
  icon: string;
  color?: string;
  type: EventType;
  isActive: boolean;
}

/**
 * Интерфейс для сообщества события
 */
export interface IEventCommunity {
  id: number;
  name: string;
  description?: string;
}

/**
 * Интерфейс для варианта голосования
 */
export interface IVotingOption {
  id: number;
  text: string;
}

/**
 * Интерфейс для события
 */
export interface IEvent {
  id: number;
  title: string;
  description?: string;
  image?: string;
  latitude: number;
  longitude: number;
  type: EventType;
  hasVoting: boolean;
  votingQuestion?: string;
  hasMoneyCollection: boolean;
  moneyAmount?: number;
  eventDateTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  creator: IEventCreator;
  category?: IEventCategory;
  community: IEventCommunity;
  participants: IEventParticipant[];
  votingOptions?: IVotingOption[];
}

/**
 * Интерфейс для списка событий с пагинацией
 */
export interface IEventsList {
  events: IEvent[];
  total: number;
}

/**
 * Интерфейс для данных создания события
 */
export interface ICreateEventData {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  type: EventType;
  hasVoting?: boolean;
  votingQuestion?: string;
  hasMoneyCollection?: boolean;
  moneyAmount?: number;
  eventDateTime?: Date;
  image?: string;
  categoryId: number;
  communityId: number;
  createdBy: number;
}

/**
 * Интерфейс для данных обновления события
 */
export interface IUpdateEventData {
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  type?: EventType;
  categoryId?: number;
}

/**
 * Интерфейс для фильтров событий
 */
export interface IEventFilters {
  type?: EventType;
  categoryId?: number;
  page?: number;
  limit?: number;
}

export enum NotificationType {
  INFO = 'INFO',
  EVENT_CREATED = 'EVENT_CREATED',
  EVENT_UPDATED = 'EVENT_UPDATED',
  EVENT_CANCELLED = 'EVENT_CANCELLED',
  EVENT_DELETED = 'EVENT_DELETED',
  USER_JOINED_EVENT = 'USER_JOINED_EVENT',
  USER_LEFT_EVENT = 'USER_LEFT_EVENT',
  USER_MENTIONED = 'USER_MENTIONED',
  COMMUNITY_INVITE = 'COMMUNITY_INVITE',
  COMMUNITY_APPROVED = 'COMMUNITY_APPROVED',
  COMMUNITY_REJECTED = 'COMMUNITY_REJECTED',
  USER_JOINED_COMMUNITY = 'USER_JOINED_COMMUNITY',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
}

// Forward declaration to avoid circular dependency
interface UnreadCountDto {
  count: number;
}

/**
 * Базовая структура payload уведомления
 * Может содержать связь только с одним типом сущности
 */
export interface INotificationPayload extends Record<string, any> {
  // Связь с одной сущностью (взаимоисключающие поля)
  eventId?: number;
  communityId?: number;
  propertyId?: number;
  messageId?: number;

  // Дополнительные данные
  eventTitle?: string;
  communityName?: string;
  propertyName?: string;
  messageText?: string;
  votingQuestion?: string;
  userFullName?: string;
  verificationCount?: number;
  createdByName?: string;
  updatedByName?: string;
  deletedByName?: string;
  userName?: string;
  ownerName?: string;
  verifierName?: string;
  senderName?: string;
  starterName?: string;
  [key: string]: any;
}

/**
 * Интерфейс для создания уведомления
 */
export interface ICreateNotification {
  type: NotificationType;
  title: string;
  message: string;
  userId: number;
  payload?: INotificationPayload;
}

/**
 * Интерфейс для глобальной функции создания уведомлений
 */
export interface IGlobalNotificationData {
  type: string;
  title: string;
  message: string;
  userId: number | number[];
  payload?: Record<string, any>;
}

/**
 * Интерфейс для обновления уведомления
 */
export interface IUpdateNotification {
  isRead?: boolean;
}

/**
 * Интерфейс для фильтрации уведомлений
 */
export interface INotificationFilters {
  userId: number;
  isRead?: boolean;
  type?: NotificationType;
  dateFrom?: Date;
  dateTo?: Date;
  payload?: Record<string, any>;
  page?: number;
  limit?: number;
}

/**
 * Интерфейс для триггера уведомлений
 */
export interface INotificationTrigger {
  /**
   * Обрабатывает событие и создает соответствующие уведомления
   */
  handle(eventData: any): Promise<void>;
}

/**
 * Интерфейс для сервиса уведомлений
 */
export interface INotificationService {
  createNotification(data: ICreateNotification): Promise<any>;
  getUserNotifications(
    filters: INotificationFilters,
  ): Promise<{ data: any[]; total: number }>;
  markAsRead(notificationId: number, userId: number): Promise<void>;
  markAllAsRead(userId: number): Promise<void>;
  getUnreadCount(userId: number): Promise<UnreadCountDto>;
}

/**
 * Интерфейс для репозитория уведомлений
 */
export interface INotificationRepository {
  create(data: ICreateNotification): Promise<any>;
  createMany(notifications: ICreateNotification[]): Promise<any[]>;
  findByUserId(
    filters: INotificationFilters,
  ): Promise<{ data: any[]; total: number }>;
  findById(id: number): Promise<any>;
  update(id: number, data: IUpdateNotification): Promise<any>;
  markAsRead(id: number): Promise<void>;
  markAllAsReadForUser(userId: number): Promise<void>;
  getUnreadCountForUser(userId: number): Promise<number>;
  delete(id: number): Promise<void>;
}

/**
 * Типы событий системы для уведомлений
 */
export enum SystemEventType {
  INFO = 'info',
  EVENT_CREATED = 'event.created',
  EVENT_UPDATED = 'event.updated',
  EVENT_CANCELLED = 'event.cancelled',
  EVENT_DELETED = 'event.deleted',
  USER_JOINED_EVENT = 'user.joined.event',
  USER_LEFT_EVENT = 'user.left.event',
  USER_MENTIONED = 'user.mentioned',
  COMMUNITY_INVITE = 'community.invite',
  COMMUNITY_APPROVED = 'community.approved',
  COMMUNITY_REJECTED = 'community.rejected',
  USER_JOINED_COMMUNITY = 'user.joined.community',
  SYSTEM_MAINTENANCE = 'system.maintenance',
  SYSTEM_UPDATE = 'system.update',
}

/**
 * Данные события системы
 */
export interface ISystemEventData {
  eventType: SystemEventType;
  targetUserIds?: number[];
  relatedEntityId?: number;
  relatedEntityType?: 'event' | 'community' | 'property' | 'message';
  additionalData?: Record<string, any>;
}

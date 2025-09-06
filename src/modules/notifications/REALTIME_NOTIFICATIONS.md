# Система уведомлений в реальном времени

## Обзор

Система уведомлений теперь поддерживает доставку в реальном времени через WebSocket соединения. Когда создается новое уведомление, оно автоматически отправляется пользователю через WebSocket (если он подключен) в дополнение к сохранению в базе данных и отправке push-уведомления.

## Архитектура

### Компоненты

1. **NotificationsGateway** (`/notifications` namespace) - WebSocket gateway для real-time соединений
2. **NotificationService** - обновленный сервис с поддержкой WebSocket
3. **NotificationRepository** - репозиторий с поддержкой batch создания уведомлений

### Поток работы

1. Создается уведомление через `NotificationService.createNotification()`
2. Уведомление сохраняется в базу данных
3. Отправляется push-уведомление (если включено у пользователя)
4. **НОВОЕ**: Отправляется real-time уведомление через WebSocket (если пользователь подключен)
5. При изменении статуса "прочитано" отправляется обновление счетчика

## Подключение клиента

### JavaScript/TypeScript клиент

```javascript
import { io } from 'socket.io-client';

// Подключение к namespace уведомлений
const notificationSocket = io('ws://localhost:3000/notifications', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  },
  transports: ['websocket']
});

// Обработчики событий
notificationSocket.on('connect', () => {
  console.log('Подключен к системе уведомлений');
});

notificationSocket.on('connected', (data) => {
  console.log('Подтверждение подключения:', data.message);
});

// Получение новых уведомлений
notificationSocket.on('newNotification', (notification) => {
  console.log('Новое уведомление:', notification);
  // Показать уведомление в UI
  showNotification(notification);
});

// Обновление счетчика непрочитанных
notificationSocket.on('unreadCountUpdate', (data) => {
  console.log('Обновлен счетчик:', data.count);
  // Обновить счетчик в UI
  updateUnreadCount(data.count);
});

notificationSocket.on('disconnect', () => {
  console.log('Отключен от системы уведомлений');
});
```

### Аутентификация

Токен можно передать двумя способами:

1. **В auth объекте** (рекомендуется):
```javascript
const socket = io('/notifications', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

2. **В query параметрах**:
```javascript
const socket = io('/notifications', {
  query: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

## События WebSocket

### Исходящие события (от сервера к клиенту)

| Событие | Данные | Описание |
|---------|---------|----------|
| `connected` | `{ message: string }` | Подтверждение успешного подключения |
| `newNotification` | `NotificationDto` | Новое уведомление для пользователя |
| `unreadCountUpdate` | `{ count: number }` | Обновление счетчика непрочитанных |

### Входящие события (от клиента к серверу)

Пока не реализованы. Все операции (отметка как прочитанное, удаление) выполняются через REST API.

## Структура NotificationDto

```typescript
interface NotificationDto {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  payload?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Тестирование

### Тестовый эндпоинт

Добавлен эндпоинт для тестирования real-time функциональности:

```
POST /notifications/test-realtime
Authorization: Bearer YOUR_JWT_TOKEN
```

Этот эндпоинт:
1. Создает тестовое уведомление для текущего пользователя
2. Сохраняет его в БД
3. Отправляет через WebSocket (если подключен)
4. Отправляет push-уведомление (если включено)

### Проверка подключения

Для проверки работы WebSocket:

1. Подключитесь к `/notifications` namespace с валидным JWT токеном
2. Вызовите `POST /notifications/test-realtime`
3. Должно прийти событие `newNotification` с тестовыми данными

## Мониторинг

### Логи

Все операции WebSocket логируются с префиксом `NotificationsGateway`:

- Подключения/отключения пользователей
- Отправка уведомлений
- Ошибки аутентификации

### Метрики (через gateway методы)

```typescript
// Проверка подключения пользователя
notificationsGateway.isUserConnected(userId: number): boolean

// Количество активных подключений пользователя
notificationsGateway.getUserConnectionCount(userId: number): number

// Общее количество подключенных пользователей
notificationsGateway.getConnectedUsersCount(): number

// Общее количество активных сокетов
notificationsGateway.getTotalSocketsCount(): number
```

## Производительность

### Оптимизации

1. **Проверка подключения**: Перед отправкой WebSocket сообщения проверяется, подключен ли пользователь
2. **Graceful fallback**: Если пользователь не подключен, уведомление все равно сохраняется в БД и отправляется push
3. **Batch операции**: Множественные уведомления отправляются эффективно через `sendBulkRealtimeNotifications`

### Рекомендации

1. Используйте connection pooling на стороне клиента
2. Реализуйте reconnection logic
3. Обрабатывайте случаи временного отключения

## Безопасность

1. **JWT аутентификация**: Все подключения требуют валидный JWT токен
2. **Изоляция пользователей**: Каждый пользователь подключается к своей комнате `user:${userId}`
3. **Валидация токена**: Токены проверяются при подключении

## Совместимость

Система обратно совместима:
- Существующие REST API эндпоинты работают без изменений
- Push-уведомления продолжают работать
- База данных остается неизменной

Новая функциональность добавляется "поверх" существующей системы без breaking changes.

# Community Confirmation System

## Обзор

Реализована профессиональная система подтверждения сообществ с автоматической активацией и очисткой.

## Основные возможности

### 1. Модель статусов

- **CommunityStatus**: `ACTIVE` | `INACTIVE`
- По умолчанию новые сообщества создаются со статусом `INACTIVE`
- Администратор может переключить статус на `ACTIVE` в любое время
- Поле `isActive` синхронизировано со статусом

### 2. Правило подтверждения

При создании сообщества:
- `status = INACTIVE`
- `confirmationDeadline = now + 24h`
- `latitude` и `longitude` = null (устанавливаются при создании первого объекта)

Сообщество становится `ACTIVE` автоматически, если:
- В течение 24 часов к нему присоединятся минимум 2 разных пользователя (не создателя) через `joinCode`

Если условие не выполнено к `confirmationDeadline`:
- Сообщество удаляется вместе со всеми связанными данными (cascade delete)

**Настройка:**
- Требуемое количество участников: `CommunityConfirmationConfig.requiredMembersCount` (по умолчанию 2)
- Таймфрейм: `CommunityConfirmationConfig.confirmationTimeoutHours` (по умолчанию 24)

### 3. Уведомления

Создатель сообщества получает уведомления:
- `INACTIVE → ACTIVE` → отправляется `COMMUNITY_APPROVED`
- `INACTIVE → expired/deleted` → отправляется `COMMUNITY_REJECTED`

### 4. Администраторское переопределение

**Endpoint:** `PATCH /admin/communities/:id/confirm`
- Ограничен для роли `ADMIN`
- Немедленно устанавливает `status=ACTIVE`, `confirmedAt=now`, `confirmationDeadline=null`
- Отправляет уведомление `COMMUNITY_APPROVED`

### 5. Координаты сообщества

При создании первого объекта в сообществе:
- Устанавливаются `community.latitude` и `longitude` равными координатам объекта
- Не обновляются при создании последующих объектов

### 6. Endpoints

#### Пользовательские

**POST /communities**
- Создает сообщество со статусом `INACTIVE`
- Возвращает `joinCode`, `status`, `confirmationDeadline`

**POST /communities/join-by-code**
```json
{
  "code": "123456"
}
```
- Добавляет пользователя в сообщество
- Помечает `joinedViaCode=true`
- Возвращает `joinedCount` и `requiredCount`
- Автоматически активирует сообщество при достижении требуемого количества

**GET /communities/:id/confirmation-status**
- Возвращает:
  - `status`: текущий статус
  - `deadline`: дедлайн подтверждения
  - `joinedCount`: количество присоединившихся через код
  - `requiredCount`: требуемое количество
  - `confirmedAt`: дата подтверждения

#### Административные

**PATCH /admin/communities/:id/confirm**
- Ручное подтверждение сообщества администратором

### 7. Cron Job

**Расписание:** каждые 5 минут (`CommunityConfirmationConfig.cronIntervalMinutes`)

Для каждого `INACTIVE` сообщества с `deadline <= now`:
- Если `joinedCount >= 2` → активирует, уведомляет создателя
- Иначе → удаляет сообщество (cascade), уведомляет создателя

## Структура базы данных

### Миграция

**Файл:** `20251002185627_add_community_confirmation_system`

**Изменения в `Community`:**
```prisma
confirmationDeadline DateTime?
confirmedAt          DateTime?
status               CommunityStatus @default(INACTIVE)
latitude             Float?
longitude            Float?
isActive             Boolean         @default(false)
```

**Изменения в `UsersOnCommunities`:**
```prisma
joinedViaCode Boolean  @default(false)
joinedAt      DateTime @default(now())
```

## Архитектура

### Файлы

#### Конфигурация
- `src/modules/communities/config/community-confirmation.config.ts`

#### Сервисы
- `src/modules/communities/services/community-confirmation.service.ts`
- `src/modules/communities/services/community.service.ts` (обновлен)

#### Репозитории
- `src/modules/communities/repositories/community.repository.ts` (обновлен)

#### Контроллеры
- `src/modules/communities/controllers/communities.controller.ts` (обновлен)
- `src/modules/communities/controllers/communities.admin.controller.ts` (обновлен)

#### DTOs
- `src/modules/communities/dto/confirmation-status.dto.ts`
- `src/modules/communities/dto/join-by-code-response.dto.ts`

#### Cron
- `src/modules/communities/cron/community-confirmation.cron.ts`

#### Тесты
- `src/modules/communities/services/community-confirmation.service.spec.ts`
- `src/modules/communities/services/community.service.spec.ts`

### Интеграция с Property Service

При создании объекта недвижимости:
- Проверяются все сообщества пользователя
- Для каждого сообщества без координат устанавливаются координаты объекта
- Это происходит только один раз (при создании первого объекта)

## Тестирование

### Запуск тестов

```bash
npm test -- --testPathPattern=community-confirmation.service.spec.ts
npm test -- --testPathPattern=community.service.spec.ts
```

### Покрытие тестами

✅ Создание сообщества со статусом INACTIVE  
✅ Присоединение через код с joinedViaCode=true  
✅ Автоматическая активация при достижении лимита  
✅ Отсутствие активации при недостаточном количестве  
✅ Автоматическое удаление истекших сообществ  
✅ Ручное подтверждение администратором  
✅ Обновление координат из первого объекта  

## Примеры использования

### 1. Создание сообщества

```typescript
const community = await communityService.createCommunity(
  userId,
  'Мой ЖК',
);
// Результат:
// {
//   id: 1,
//   name: 'Мой ЖК',
//   status: 'INACTIVE',
//   joinCode: '123456',
//   confirmationDeadline: '2024-10-03T18:56:27.000Z',
//   isActive: false
// }
```

### 2. Присоединение по коду

```typescript
const result = await communityService.joinCommunity(
  userId,
  '123456',
);
// Результат:
// {
//   ...community,
//   joinedCount: 2,
//   requiredCount: 2
// }
// Если joinedCount >= requiredCount, сообщество автоматически активируется
```

### 3. Проверка статуса

```typescript
const status = await communityService.getConfirmationStatus(communityId);
// Результат:
// {
//   status: 'INACTIVE',
//   deadline: '2024-10-03T18:56:27.000Z',
//   joinedCount: 1,
//   requiredCount: 2,
//   confirmedAt: null
// }
```

### 4. Ручное подтверждение (администратор)

```typescript
await confirmationService.manuallyConfirmCommunity(communityId);
// Сообщество немедленно активируется
```

## Настройка

Конфигурация в `src/modules/communities/config/community-confirmation.config.ts`:

```typescript
export const CommunityConfirmationConfig = {
  requiredMembersCount: 2,        // Требуемое количество участников
  confirmationTimeoutHours: 24,   // Время на подтверждение (часы)
  cronIntervalMinutes: 5,         // Интервал проверки (минуты)
};
```

## Уведомления

Система использует существующие типы уведомлений:
- `NotificationType.COMMUNITY_APPROVED`
- `NotificationType.COMMUNITY_REJECTED`

## Безопасность

- Только администраторы могут вручную подтверждать сообщества
- Создатель сообщества не учитывается в `joinedCount`
- Каскадное удаление защищает от потерянных связей
- Гео-модерация применяется при присоединении

## Производительность

- Cron job выполняется каждые 5 минут
- Используется оптимизированный запрос для поиска истекших сообществ
- Подсчет участников с индексом на `joinedViaCode`
- Уведомления отправляются асинхронно

## Миграция существующих данных

При применении миграции:
- Существующие сообщества остаются `ACTIVE` (если были активны)
- Новые поля `confirmationDeadline` и `confirmedAt` = `null`
- Координаты остаются без изменений
- `joinedViaCode` для существующих участников = `false`


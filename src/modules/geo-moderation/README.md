# Модуль гео-модерации

Модуль для автоматической модерации действий пользователей на основе их географического местоположения.

## Функциональность

### Автоматическая модерация

Модуль проверяет расстояние между пользователем и целевым объектом для следующих действий:

1. **Вступление в сообщество** - пользователь должен находиться в пределах установленного радиуса от сообщества
2. **Подтверждение объекта недвижимости** - пользователь должен быть рядом с объектом для его подтверждения
3. **Добавление объекта недвижимости** - пользователь должен находиться рядом с местом создания объекта

### Настройки

Для каждого типа действия можно настроить:
- Включение/отключение проверки
- Максимальное расстояние (в метрах)

По умолчанию:
- Вступление в сообщество: 500 метров
- Подтверждение объекта: 100 метров
- Добавление объекта: 100 метров

### Логирование отказов

Все отказы в доступе логируются в базу данных с информацией:
- Пользователь
- Тип действия
- Фактическое расстояние
- Максимально допустимое расстояние
- Координаты пользователя и цели
- Время отказа

## API Endpoints

### Администрирование

#### GET /admin/geo-moderation/settings
Получение текущих настроек гео-модерации.

#### PUT /admin/geo-moderation/settings
Обновление настроек гео-модерации.

**Body:**
```json
{
  "communityJoinEnabled": true,
  "communityJoinMaxDistance": 500,
  "propertyVerificationEnabled": true,
  "propertyVerificationMaxDistance": 100,
  "propertyCreationEnabled": true,
  "propertyCreationMaxDistance": 100
}
```

#### GET /admin/geo-moderation/rejections
Получение списка отказов с фильтрацией и пагинацией.

**Query параметры:**
- `page` - номер страницы (по умолчанию 1)
- `limit` - количество записей на странице (по умолчанию 20)
- `search` - поиск по имени/телефону пользователя
- `action` - фильтр по типу действия (COMMUNITY_JOIN, PROPERTY_VERIFICATION, PROPERTY_CREATION)
- `dateFrom` - дата начала периода (YYYY-MM-DD)
- `dateTo` - дата окончания периода (YYYY-MM-DD)

#### GET /admin/geo-moderation/rejections/stats
Получение статистики отказов.

## Интеграция с другими модулями

### Модуль сообществ
- Проверка расстояния при вступлении в сообщество (`CommunityService.joinCommunity`)

### Модуль недвижимости
- Проверка расстояния при создании объекта (`PropertyService.createUserProperty`)
- Проверка расстояния при подтверждении объекта (`PropertyService.verifyProperty`)

## Структура базы данных

### Таблица geo_moderation_settings
Хранит настройки гео-модерации:
- `communityJoinEnabled` - включена ли проверка для вступления в сообщество
- `communityJoinMaxDistance` - максимальное расстояние для вступления (в метрах)
- `propertyVerificationEnabled` - включена ли проверка для подтверждения объекта
- `propertyVerificationMaxDistance` - максимальное расстояние для подтверждения (в метрах)
- `propertyCreationEnabled` - включена ли проверка для создания объекта
- `propertyCreationMaxDistance` - максимальное расстояние для создания (в метрах)

### Таблица geo_moderation_rejections
Хранит информацию об отказах:
- `userId` - ID пользователя
- `action` - тип действия (enum: COMMUNITY_JOIN, PROPERTY_VERIFICATION, PROPERTY_CREATION)
- `distance` - фактическое расстояние в метрах
- `maxDistance` - максимально допустимое расстояние в метрах
- `reason` - причина отказа
- `userLatitude`, `userLongitude` - координаты пользователя
- `targetLatitude`, `targetLongitude` - координаты цели
- `createdAt` - время отказа

## Использование

### В сервисах

```typescript
// Проверка при вступлении в сообщество
const geoCheck = await this.geoModerationService.checkCommunityJoin(
  userId,
  userLatitude,
  userLongitude,
  communityLatitude,
  communityLongitude,
);

if (!geoCheck.allowed) {
  this.geoModerationService.throwGeoModerationError(geoCheck);
}

// Проверка при создании объекта
const geoCheck = await this.geoModerationService.checkPropertyCreation(
  userId,
  userLatitude,
  userLongitude,
  propertyLatitude,
  propertyLongitude,
);

if (!geoCheck.allowed) {
  this.geoModerationService.throwGeoModerationError(geoCheck);
}

// Проверка при подтверждении объекта
const geoCheck = await this.geoModerationService.checkPropertyVerification(
  userId,
  userLatitude,
  userLongitude,
  propertyLatitude,
  propertyLongitude,
);

if (!geoCheck.allowed) {
  this.geoModerationService.throwGeoModerationError(geoCheck);
}
```

### Получение статистики

```typescript
const stats = await this.geoModerationService.getRejectionStats();
// Возвращает:
// {
//   totalRejections: 45,
//   communityJoinRejections: 20,
//   propertyVerificationRejections: 15,
//   propertyCreationRejections: 10,
//   recentRejections: 5
// }
```

## Администрирование

### Настройка расстояний

Администратор может настроить максимальные расстояния для каждого типа действия через админ-панель:

1. Открыть раздел "Гео-модерация"
2. Настроить параметры:
   - Включить/отключить проверки
   - Установить максимальные расстояния
3. Сохранить настройки

### Мониторинг отказов

Администратор может просматривать:
- Живой список всех отказов
- Фильтрацию по пользователю, типу действия, дате
- Статистику отказов
- Детальную информацию о каждом отказе

## Безопасность

- Все админские эндпоинты защищены JWT аутентификацией
- Требуется роль ADMIN или MODERATOR для доступа к настройкам
- Координаты пользователей логируются для анализа, но не передаются клиентам
- Настройки расстояний имеют валидацию (минимум 10м, максимум 10км для сообществ, 1км для объектов)

## Производительность

- Используется эффективная формула расчета расстояний (формула гаверсинусов)
- Индексы на таблице отказов для быстрого поиска
- Пагинация для больших объемов данных
- Кэширование настроек в памяти (можно добавить Redis) 
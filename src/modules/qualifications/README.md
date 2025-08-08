# Модуль квалификаций

Модуль для управления квалификациями пользователей в системе.

## Описание

Квалификации - это специальности или навыки, которые могут быть присвоены пользователям. Один пользователь может иметь несколько квалификаций.

## Структура данных

### Qualification
- `id` - уникальный идентификатор
- `name` - название квалификации
- `description` - описание квалификации
- `icon` - иконка квалификации
- `color` - цвет квалификации
- `isActive` - статус активности (для мягкого удаления)
- `createdAt` - дата создания
- `updatedAt` - дата обновления

### UsersOnQualifications
Связующая таблица многие-ко-многим между пользователями и квалификациями:
- `userId` - ID пользователя
- `qualificationId` - ID квалификации
- `assignedAt` - дата назначения

## API Endpoints

### Админские эндпоинты

#### Создание квалификации
```
POST /admin/qualifications
Content-Type: application/json

{
  "name": "Электрик",
  "description": "Специалист по электромонтажным работам",
  "icon": "⚡",
  "color": "#FF5733",
  "isActive": true
}
```

#### Получение списка квалификаций
```
GET /admin/qualifications?page=1&limit=10&search=электрик&isActive=true
```

**Параметры:**
- `page` - номер страницы (по умолчанию: 1)
- `limit` - количество элементов на странице (по умолчанию: 10)
- `search` - поиск по названию
- `isActive` - фильтр по статусу активности

#### Получение квалификации по ID
```
GET /admin/qualifications/:id
```

#### Обновление квалификации
```
PATCH /admin/qualifications/:id
Content-Type: application/json

{
  "name": "Электрик-монтажник",
  "description": "Обновленное описание"
}
```

#### Деактивация квалификации (мягкое удаление)
```
DELETE /admin/qualifications/:id
```

### Управление квалификациями пользователей

#### Получение квалификаций пользователя
```
GET /admin/users/:userId/qualifications
```

#### Добавление квалификации пользователю
```
POST /admin/users/:userId/qualifications/:qualificationId
```

#### Удаление квалификации у пользователя
```
DELETE /admin/users/:userId/qualifications/:qualificationId
```

## Особенности реализации

1. **Мягкое удаление**: При удалении квалификации она не удаляется физически, а помечается как неактивная (`isActive: false`)

2. **Фильтрация по умолчанию**: По умолчанию показываются только активные квалификации

3. **Пагинация**: Все списки поддерживают пагинацию

4. **Поиск**: Поддерживается поиск по названию квалификации

5. **Валидация**: Все входные данные валидируются с помощью class-validator

## Использование

```typescript
// В сервисе
@Injectable()
export class SomeService {
  constructor(private readonly qualificationsService: QualificationsService) {}

  async assignQualificationToUser(userId: number, qualificationId: number) {
    await this.qualificationsService.addUserQualification(userId, qualificationId);
  }
}
``` 
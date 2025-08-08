# Модуль продуктов

Модуль для управления продуктами пользователей в системе.

## Описание

Продукты - это товары или услуги, которые могут быть предложены пользователями. Один пользователь может иметь несколько продуктов.

## Структура данных

### Product
- `id` - уникальный идентификатор
- `name` - название продукта
- `description` - описание продукта
- `price` - цена продукта
- `image` - изображение продукта
- `isActive` - статус активности (для мягкого удаления)
- `createdAt` - дата создания
- `updatedAt` - дата обновления

### UsersOnProducts
Связующая таблица многие-ко-многим между пользователями и продуктами:
- `userId` - ID пользователя
- `productId` - ID продукта
- `assignedAt` - дата назначения

## API Endpoints

### Админские эндпоинты

#### Создание продукта
```
POST /admin/products
Content-Type: application/json

{
  "name": "Молоток",
  "description": "Качественный молоток для строительных работ",
  "price": 1500.50,
  "image": "hammer.jpg",
  "isActive": true
}
```

#### Получение списка продуктов
```
GET /admin/products?page=1&limit=10&search=молоток&isActive=true
```

**Параметры:**
- `page` - номер страницы (по умолчанию: 1)
- `limit` - количество элементов на странице (по умолчанию: 10)
- `search` - поиск по названию
- `isActive` - фильтр по статусу активности

#### Получение продукта по ID
```
GET /admin/products/:id
```

#### Обновление продукта
```
PATCH /admin/products/:id
Content-Type: application/json

{
  "name": "Молоток строительный",
  "price": 1800.00
}
```

#### Деактивация продукта (мягкое удаление)
```
DELETE /admin/products/:id
```

### Управление продуктами пользователей

#### Получение продуктов пользователя
```
GET /admin/users/:userId/products
```

#### Добавление продукта пользователю
```
POST /admin/users/:userId/products/:productId
```

#### Удаление продукта у пользователя
```
DELETE /admin/users/:userId/products/:productId
```

## Особенности реализации

1. **Мягкое удаление**: При удалении продукта он не удаляется физически, а помечается как неактивный (`isActive: false`)

2. **Фильтрация по умолчанию**: По умолчанию показываются только активные продукты

3. **Пагинация**: Все списки поддерживают пагинацию

4. **Поиск**: Поддерживается поиск по названию продукта

5. **Валидация**: Все входные данные валидируются с помощью class-validator

6. **Цена**: Поддерживается дробная цена с двумя знаками после запятой

## Использование

```typescript
// В сервисе
@Injectable()
export class SomeService {
  constructor(private readonly productsService: ProductsService) {}

  async assignProductToUser(userId: number, productId: number) {
    await this.productsService.addUserProduct(userId, productId);
  }
}
``` 
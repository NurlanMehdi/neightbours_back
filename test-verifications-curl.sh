#!/bin/bash

# Тестовый скрипт для проверки API /api/users/verifications с помощью curl
# 
# Использование:
# 1. Получите JWT токен через авторизацию
# 2. Замените YOUR_JWT_TOKEN на реальный токен
# 3. Запустите скрипт: bash test-verifications-curl.sh

# Конфигурация
API_BASE_URL="http://localhost:3000/api"
JWT_TOKEN="YOUR_JWT_TOKEN"  # Замените на реальный токен

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ТЕСТИРОВАНИЕ API /api/users/verifications${NC}"
echo "============================================================"

# Проверяем, что токен установлен
if [ "$JWT_TOKEN" = "YOUR_JWT_TOKEN" ]; then
    echo -e "${RED}❌ Ошибка: Необходимо установить реальный JWT токен${NC}"
    echo -e "${YELLOW}📝 Инструкции:${NC}"
    echo "1. Запустите сервер: npm run dev"
    echo "2. Получите JWT токен через POST /api/auth/login"
    echo "3. Замените YOUR_JWT_TOKEN в этом скрипте на реальный токен"
    echo ""
    echo -e "${YELLOW}📱 Тестовые пользователи для авторизации:${NC}"
    echo "1. Иван Петров (+79001234567) - ID: 4"
    echo "2. Мария Иванова (+79001234568) - ID: 5"
    echo "3. Алексей Сидоров (+79001234569) - ID: 6"
    echo "4. Елена Козлова (+79001234570) - ID: 7"
    exit 1
fi

# Функция для выполнения запроса
make_request() {
    local description="$1"
    local url="$2"
    local params="$3"
    
    echo ""
    echo -e "${YELLOW}📋 $description${NC}"
    echo "URL: $url$params"
    echo "Ответ:"
    
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        "$url$params")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ Успешно (HTTP $http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Ошибка (HTTP $http_code)${NC}"
        echo "$body"
    fi
}

# 1. Базовый запрос без фильтров
make_request "1. Получение всех подтверждений пользователя" \
    "$API_BASE_URL/users/verifications" \
    "?page=1&limit=10"

# 2. Фильтрация по статусу верификации (подтвержденные)
make_request "2. Фильтрация по подтвержденным объектам" \
    "$API_BASE_URL/users/verifications" \
    "?page=1&limit=10&isVerified=true"

# 3. Фильтрация по статусу верификации (неподтвержденные)
make_request "3. Фильтрация по неподтвержденным объектам" \
    "$API_BASE_URL/users/verifications" \
    "?page=1&limit=10&isVerified=false"

# 4. Фильтрация по категории (частные дома)
make_request "4. Фильтрация по частным домам" \
    "$API_BASE_URL/users/verifications" \
    "?page=1&limit=10&category=PRIVATE_HOUSE"

# 5. Фильтрация по категории (таунхаусы)
make_request "5. Фильтрация по таунхаусам" \
    "$API_BASE_URL/users/verifications" \
    "?page=1&limit=10&category=TOWNHOUSE"

# 6. Поиск по названию
make_request "6. Поиск по названию 'дом'" \
    "$API_BASE_URL/users/verifications" \
    "?page=1&limit=10&search=дом"

# 7. Фильтрация по дате (последние 30 дней)
DATE_FROM=$(date -d "30 days ago" +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d 2>/dev/null || echo "2024-01-01")
make_request "7. Подтверждения за последние 30 дней" \
    "$API_BASE_URL/users/verifications" \
    "?page=1&limit=10&dateFrom=$DATE_FROM"

# 8. Комбинированный запрос
make_request "8. Комбинированный запрос (таунхаусы + поиск)" \
    "$API_BASE_URL/users/verifications" \
    "?page=1&limit=5&category=TOWNHOUSE&search=таунхаус"

# 9. Пагинация (вторая страница)
make_request "9. Пагинация - вторая страница" \
    "$API_BASE_URL/users/verifications" \
    "?page=2&limit=5"

echo ""
echo -e "${BLUE}📚 ДОКУМЕНТАЦИЯ API${NC}"
echo "============================================================"
echo -e "${YELLOW}🔗 Endpoint:${NC} GET /api/users/verifications"
echo -e "${YELLOW}📝 Описание:${NC} Получить список объектов недвижимости, подтвержденных текущим пользователем"
echo ""
echo -e "${YELLOW}🔧 Параметры запроса:${NC}"
echo "• page (number) - Номер страницы (по умолчанию: 1)"
echo "• limit (number) - Элементов на странице (по умолчанию: 10)"
echo "• search (string) - Поиск по названию объекта"
echo "• category (enum) - Фильтр по категории объекта"
echo "• isVerified (boolean) - Фильтр по статусу подтверждения"
echo "• dateFrom (string) - Дата подтверждения от (YYYY-MM-DD)"
echo "• dateTo (string) - Дата подтверждения до (YYYY-MM-DD)"
echo ""
echo -e "${YELLOW}🏠 Категории объектов:${NC}"
echo "• PRIVATE_HOUSE - Частный дом"
echo "• TOWNHOUSE - Таунхаус"
echo "• COTTAGE - Коттедж"
echo "• LAND - Земельный участок"
echo ""
echo -e "${GREEN}✅ Тестирование завершено${NC}"
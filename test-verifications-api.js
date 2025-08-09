/**
 * Тестовый скрипт для проверки API /api/users/verifications
 * 
 * Этот скрипт демонстрирует, как использовать API для получения 
 * подтверждений объектов недвижимости пользователем.
 */

const axios = require('axios');

// Конфигурация
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_USERS = [
  { id: 4, name: 'Иван Петров', phone: '+79001234567' },
  { id: 5, name: 'Мария Иванова', phone: '+79001234568' },
  { id: 6, name: 'Алексей Сидоров', phone: '+79001234569' },
  { id: 7, name: 'Елена Козлова', phone: '+79001234570' }
];

/**
 * Функция для получения JWT токена (заглушка)
 * В реальном приложении здесь будет логика авторизации
 */
async function getAuthToken(phone) {
  // Здесь должна быть логика получения токена
  // Для демонстрации возвращаем пустую строку
  console.log(`🔐 Получение токена для ${phone}...`);
  return 'your-jwt-token-here';
}

/**
 * Тестирование API верификаций для конкретного пользователя
 */
async function testUserVerifications(user, token) {
  console.log(`\n👤 Тестируем API для пользователя: ${user.name} (ID: ${user.id})`);
  console.log('=' .repeat(60));

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Базовый запрос без фильтров
    console.log('\n📋 1. Получение всех подтверждений пользователя:');
    const basicResponse = await axios.get(`${API_BASE_URL}/users/verifications`, {
      headers,
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log(`✅ Найдено подтверждений: ${basicResponse.data.total}`);
    console.log(`📄 Страниц: ${basicResponse.data.totalPages}`);
    
    if (basicResponse.data.data.length > 0) {
      console.log('📝 Примеры подтвержденных объектов:');
      basicResponse.data.data.slice(0, 3).forEach((property, index) => {
        console.log(`   ${index + 1}. ${property.name} (${property.category})`);
        console.log(`      Статус: ${property.verificationStatus}`);
        console.log(`      Подтверждений: ${property.verificationCount}`);
        console.log(`      Дата подтверждения: ${property.verifiedAt ? new Date(property.verifiedAt).toLocaleDateString('ru-RU') : 'Н/Д'}`);
      });
    }

    // 2. Фильтрация по статусу верификации
    console.log('\n🔍 2. Фильтрация по подтвержденным объектам:');
    const verifiedResponse = await axios.get(`${API_BASE_URL}/users/verifications`, {
      headers,
      params: {
        page: 1,
        limit: 10,
        isVerified: true
      }
    });
    console.log(`✅ Подтвержденных объектов: ${verifiedResponse.data.total}`);

    // 3. Фильтрация по неподтвержденным объектам
    console.log('\n⏳ 3. Фильтрация по неподтвержденным объектам:');
    const unverifiedResponse = await axios.get(`${API_BASE_URL}/users/verifications`, {
      headers,
      params: {
        page: 1,
        limit: 10,
        isVerified: false
      }
    });
    console.log(`⏳ Неподтвержденных объектов: ${unverifiedResponse.data.total}`);

    // 4. Фильтрация по категории
    console.log('\n🏠 4. Фильтрация по частным домам:');
    const houseResponse = await axios.get(`${API_BASE_URL}/users/verifications`, {
      headers,
      params: {
        page: 1,
        limit: 10,
        category: 'PRIVATE_HOUSE'
      }
    });
    console.log(`🏠 Частных домов подтверждено: ${houseResponse.data.total}`);

    // 5. Поиск по названию
    console.log('\n🔍 5. Поиск по названию "дом":');
    const searchResponse = await axios.get(`${API_BASE_URL}/users/verifications`, {
      headers,
      params: {
        page: 1,
        limit: 10,
        search: 'дом'
      }
    });
    console.log(`🔍 Найдено по поиску: ${searchResponse.data.total}`);

    // 6. Фильтрация по дате (последние 7 дней)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    console.log('\n📅 6. Подтверждения за последние 7 дней:');
    const dateResponse = await axios.get(`${API_BASE_URL}/users/verifications`, {
      headers,
      params: {
        page: 1,
        limit: 10,
        dateFrom: sevenDaysAgo.toISOString().split('T')[0]
      }
    });
    console.log(`📅 За последние 7 дней: ${dateResponse.data.total}`);

  } catch (error) {
    if (error.response) {
      console.error(`❌ Ошибка API: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
    } else {
      console.error(`❌ Ошибка сети: ${error.message}`);
    }
  }
}

/**
 * Демонстрация различных параметров API
 */
function showAPIDocumentation() {
  console.log('\n📚 ДОКУМЕНТАЦИЯ API /api/users/verifications');
  console.log('=' .repeat(60));
  console.log('\n🔗 Endpoint: GET /api/users/verifications');
  console.log('\n📝 Описание: Получить список объектов недвижимости, подтвержденных текущим пользователем');
  
  console.log('\n🔧 Параметры запроса (query parameters):');
  console.log('┌─────────────┬──────────┬─────────────────────────────────────────┐');
  console.log('│ Параметр    │ Тип      │ Описание                                │');
  console.log('├─────────────┼──────────┼─────────────────────────────────────────┤');
  console.log('│ page        │ number   │ Номер страницы (по умолчанию: 1)        │');
  console.log('│ limit       │ number   │ Элементов на странице (по умолчанию: 10)│');
  console.log('│ search      │ string   │ Поиск по названию объекта               │');
  console.log('│ category    │ enum     │ Фильтр по категории объекта             │');
  console.log('│ isVerified  │ boolean  │ Фильтр по статусу подтверждения         │');
  console.log('│ dateFrom    │ string   │ Дата подтверждения от (YYYY-MM-DD)      │');
  console.log('│ dateTo      │ string   │ Дата подтверждения до (YYYY-MM-DD)      │');
  console.log('└─────────────┴──────────┴─────────────────────────────────────────┘');

  console.log('\n🏠 Категории объектов (PropertyCategory):');
  console.log('• PRIVATE_HOUSE - Частный дом');
  console.log('• TOWNHOUSE - Таунхаус');
  console.log('• COTTAGE - Коттедж');
  console.log('• LAND - Земельный участок');

  console.log('\n📊 Структура ответа:');
  console.log(`{
  "data": [
    {
      "id": number,
      "name": string,
      "category": PropertyCategory,
      "latitude": number,
      "longitude": number,
      "photo": string | null,
      "verificationStatus": "VERIFIED" | "UNVERIFIED",
      "verificationCount": number,
      "verifiedUserIds": number[],
      "createdById": number,
      "createdBy": string,
      "createdAt": string,
      "updatedAt": string,
      "verifiedAt": string | null
    }
  ],
  "total": number,
  "page": number,
  "limit": number,
  "totalPages": number
}`);
}

/**
 * Примеры использования API
 */
function showUsageExamples() {
  console.log('\n💡 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ');
  console.log('=' .repeat(60));
  
  console.log('\n1️⃣ Получить все подтверждения с пагинацией:');
  console.log('GET /api/users/verifications?page=1&limit=20');
  
  console.log('\n2️⃣ Найти подтвержденные частные дома:');
  console.log('GET /api/users/verifications?category=PRIVATE_HOUSE&isVerified=true');
  
  console.log('\n3️⃣ Поиск по названию:');
  console.log('GET /api/users/verifications?search=дом');
  
  console.log('\n4️⃣ Подтверждения за период:');
  console.log('GET /api/users/verifications?dateFrom=2024-01-01&dateTo=2024-12-31');
  
  console.log('\n5️⃣ Комбинированный запрос:');
  console.log('GET /api/users/verifications?category=TOWNHOUSE&isVerified=false&page=1&limit=5');
}

/**
 * Главная функция
 */
async function main() {
  console.log('🚀 ТЕСТИРОВАНИЕ API /api/users/verifications');
  console.log('=' .repeat(60));
  
  // Показываем документацию
  showAPIDocumentation();
  showUsageExamples();
  
  console.log('\n⚠️  ВНИМАНИЕ: Для тестирования API необходимо:');
  console.log('1. Запустить сервер: npm run dev');
  console.log('2. Получить JWT токен через авторизацию');
  console.log('3. Заменить "your-jwt-token-here" на реальный токен');
  
  console.log('\n📱 Тестовые пользователи для авторизации:');
  TEST_USERS.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.phone}) - ID: ${user.id}`);
  });
  
  console.log('\n🔧 Для автоматического тестирования раскомментируйте код ниже:');
  
  /*
  // Автоматическое тестирование (требует реальные токены)
  for (const user of TEST_USERS) {
    try {
      const token = await getAuthToken(user.phone);
      if (token && token !== 'your-jwt-token-here') {
        await testUserVerifications(user, token);
      }
    } catch (error) {
      console.error(`❌ Ошибка тестирования для ${user.name}:`, error.message);
    }
  }
  */
}

// Запускаем тестирование
main().catch(console.error);
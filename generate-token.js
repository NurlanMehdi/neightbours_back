const jwt = require('jsonwebtoken');

// JWT secret - you'll need to check your .env file for the actual secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here';

function generateToken(userId = 3) {
  const payload = {
    sub: userId,
    role: 'ADMIN',
    phone: '77777777777',
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60) // 12 hours
  };

  try {
    const token = jwt.sign(payload, JWT_SECRET);
    
    console.log('🎯 Новый JWT токен сгенерирован:');
    console.log('=' .repeat(60));
    console.log(`Пользователь ID: ${userId}`);
    console.log(`Роль: ${payload.role}`);
    console.log(`Телефон: ${payload.phone}`);
    console.log(`Истекает: ${new Date(payload.exp * 1000).toLocaleString('ru-RU')}`);
    console.log('');
    console.log('Токен:');
    console.log(token);
    console.log('');
    
    console.log('🧪 Тестирование API:');
    console.log('curl -X "GET" \\');
    console.log('  "http://localhost:3000/api/users/verifications?page=1&limit=20&isVerified=true" \\');
    console.log('  -H "accept: application/json" \\');
    console.log(`  -H "Authorization: Bearer ${token}"`);
    
    return token;
  } catch (error) {
    console.error('❌ Ошибка генерации токена:', error.message);
    console.log('💡 Проверьте JWT_SECRET в файле .env');
    return null;
  }
}

// Проверим JWT_SECRET из .env
console.log('🔍 Поиск JWT_SECRET...');
try {
  require('dotenv').config();
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    console.log('⚠️  JWT_SECRET не найден в .env файле');
    console.log('💡 Используется значение по умолчанию');
  } else {
    console.log('✅ JWT_SECRET найден в .env файле');
  }
} catch (error) {
  console.log('⚠️  Не удалось загрузить .env файл');
}

console.log('');

// Генерируем токен
generateToken(3);
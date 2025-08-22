const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Массивы для генерации реалистичных данных
const russianMaleNames = [
  'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артём', 'Илья', 
  'Кирилл', 'Михаил', 'Никита', 'Матвей', 'Роман', 'Егор', 'Арсений', 'Иван', 
  'Денис', 'Евгений', 'Данил', 'Тимур', 'Владислав', 'Игорь', 'Владимир', 'Павел'
];

const russianFemaleNames = [
  'София', 'Мария', 'Анна', 'Виктория', 'Анастасия', 'Полина', 'Алиса', 'Елизавета',
  'Екатерина', 'Дарья', 'Варвара', 'Александра', 'Арина', 'Вероника', 'Милана', 'Ульяна',
  'Яна', 'Кристина', 'Диана', 'Валерия', 'Алёна', 'Ирина', 'Светлана', 'Татьяна'
];

const russianLastNames = [
  'Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Соколов',
  'Михайлов', 'Новikov', 'Фёдоров', 'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семёнов',
  'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев', 'Орлов', 'Андреев', 'Макаров',
  'Никитин', 'Захаров', 'Зайцев', 'Соловьёв', 'Борисов', 'Яковлев', 'Григорьев', 'Романов'
];

const emailDomains = ['gmail.com', 'yandex.ru', 'mail.ru', 'outlook.com', 'yahoo.com'];

const moscowAddresses = [
  'ул. Арбат, д. 15', 'пр-т Мира, д. 45', 'ул. Тверская, д. 12', 'ул. Новый Арбат, д. 8',
  'ул. Ленинский проспект, д. 34', 'ул. Кутузовский проспект, д. 21', 'ул. Садовое кольцо, д. 67',
  'ул. Соколиная Гора, д. 28', 'ул. Красная Пресня, д. 19', 'ул. Сокольники, д. 42',
  'ул. Чистые Пруды, д. 11', 'пер. Камергерский, д. 3', 'ул. Остоженка, д. 25'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePhone() {
  // Генерируем российский номер телефона
  const codes = ['903', '905', '906', '909', '951', '952', '953', '960', '961', '962'];
  const code = getRandomElement(codes);
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `7${code}${number}`;
}

function generateEmail(firstName, lastName) {
  const domain = getRandomElement(emailDomains);
  const variants = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 100)}@${domain}`
  ];
  return getRandomElement(variants);
}

function generateBirthDate() {
  const minAge = 18;
  const maxAge = 70;
  const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1; // До 28 дня чтобы избежать проблем с февралем
  
  return new Date(birthYear, month, day);
}

function generateCoordinates() {
  // Координаты Москвы: 55.7558° N, 37.6176° E
  // Генерируем координаты в радиусе ~50 км от центра Москвы
  const moscowLat = 55.7558;
  const moscowLng = 37.6176;
  const radius = 0.5; // примерно 50 км в градусах
  
  const lat = moscowLat + (Math.random() - 0.5) * radius;
  const lng = moscowLng + (Math.random() - 0.5) * radius;
  
  return { latitude: lat, longitude: lng };
}

async function createFakeUsers(count = 20) {
  console.log(`🚀 Создание ${count} тестовых пользователей...`);
  
  const users = [];
  const existingPhones = new Set();
  const existingEmails = new Set();
  
  for (let i = 0; i < count; i++) {
    const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
    const firstName = gender === 'MALE' 
      ? getRandomElement(russianMaleNames) 
      : getRandomElement(russianFemaleNames);
    const lastName = getRandomElement(russianLastNames);
    
    // Генерируем уникальный телефон
    let phone;
    do {
      phone = generatePhone();
    } while (existingPhones.has(phone));
    existingPhones.add(phone);
    
    // Генерируем уникальный email
    let email;
    do {
      email = generateEmail(firstName, lastName);
    } while (existingEmails.has(email));
    existingEmails.add(email);
    
    const coordinates = generateCoordinates();
    const birthDate = generateBirthDate();
    const address = getRandomElement(moscowAddresses);
    
    // 90% обычных пользователей, 10% админов
    const role = Math.random() < 0.1 ? 'ADMIN' : 'USER';
    
    const userData = {
      phone,
      email,
      firstName,
      lastName,
      gender,
      birthDate,
      role,
      isVerified: true,
      status: 'ACTIVE',
      registrationStep: 5, // Полностью зарегистрированный
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      address,
    };
    
    // Для админов добавляем логин и пароль
    if (role === 'ADMIN') {
      userData.login = phone;
      userData.password = await bcrypt.hash('admin123', 10);
    }
    
    users.push(userData);
    
    console.log(`✅ Подготовлен пользователь ${i + 1}: ${firstName} ${lastName} (${role})`);
  }
  
  console.log('\n💾 Сохранение пользователей в базу данных...');
  
  try {
    const createdUsers = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const userData of users) {
        const user = await tx.users.create({
          data: userData
        });
        results.push(user);
      }
      return results;
    });
    
    console.log(`\n🎉 Успешно создано ${createdUsers.length} пользователей!`);
    
    // Показываем статистику
    const adminCount = createdUsers.filter(u => u.role === 'ADMIN').length;
    const userCount = createdUsers.filter(u => u.role === 'USER').length;
    const maleCount = createdUsers.filter(u => u.gender === 'MALE').length;
    const femaleCount = createdUsers.filter(u => u.gender === 'FEMALE').length;
    
    console.log('\n📊 Статистика созданных пользователей:');
    console.log(`   👥 Обычные пользователи: ${userCount}`);
    console.log(`   👑 Администраторы: ${adminCount}`);
    console.log(`   👨 Мужчины: ${maleCount}`);
    console.log(`   👩 Женщины: ${femaleCount}`);
    
    console.log('\n📋 Примеры созданных пользователей:');
    createdUsers.slice(0, 5).forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}, ${user.firstName} ${user.lastName} (${user.role})`);
      console.log(`      📞 ${user.phone}, 📧 ${user.email}`);
    });
    
    if (createdUsers.length > 5) {
      console.log(`   ... и ещё ${createdUsers.length - 5} пользователей`);
    }
    
    console.log('\n🧪 Теперь вы можете тестировать удаление пользователей!');
    console.log(`   • Попробуйте удалить одного: DELETE /admin/users/{id}`);
    console.log(`   • Попробуйте массовое удаление: DELETE /admin/users/bulk`);
    console.log(`   • Используйте ID от ${Math.min(...createdUsers.map(u => u.id))} до ${Math.max(...createdUsers.map(u => u.id))}`);
    
    return createdUsers;
    
  } catch (error) {
    console.error('❌ Ошибка при создании пользователей:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🎯 ГЕНЕРАТОР ТЕСТОВЫХ ПОЛЬЗОВАТЕЛЕЙ');
    console.log('=' .repeat(50));
    
    // Проверяем текущее количество пользователей
    const existingCount = await prisma.users.count();
    console.log(`📊 Текущее количество пользователей в БД: ${existingCount}`);
    
    if (existingCount > 50) {
      console.log('⚠️  В базе уже много пользователей. Продолжить? (Ctrl+C для отмены)');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Запрашиваем количество пользователей для создания
    const args = process.argv.slice(2);
    let count = 20; // по умолчанию
    
    if (args.length > 0 && !isNaN(args[0])) {
      count = parseInt(args[0]);
      if (count < 1 || count > 100) {
        console.log('❌ Количество должно быть от 1 до 100');
        process.exit(1);
      }
    }
    
    console.log(`🎯 Будет создано пользователей: ${count}`);
    console.log('');
    
    await createFakeUsers(count);
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем если файл выполняется напрямую
if (require.main === module) {
  main();
}

module.exports = { createFakeUsers };

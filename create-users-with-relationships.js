const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createUsersWithRelationships() {
  try {
    console.log('🏗️  СОЗДАНИЕ ПОЛЬЗОВАТЕЛЕЙ С СВЯЗЯМИ');
    console.log('=' .repeat(50));

    // Сначала найдем существующего админа
    const admin = await prisma.users.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.log('❌ Не найден админ. Создайте сначала админа.');
      return;
    }

    console.log(`✅ Найден админ: ${admin.firstName || 'Admin'} (ID: ${admin.id})`);

    // Создаем 3 новых пользователей с различными связями
    const usersData = [
      {
        phone: '79001234567',
        email: 'community.creator@test.com',
        firstName: 'Создатель',
        lastName: 'Сообществ',
        gender: 'MALE',
        role: 'USER',
        isVerified: true,
        status: 'ACTIVE',
        registrationStep: 5,
        latitude: 55.7558,
        longitude: 37.6176,
        address: 'Тестовая ул., д. 1',
      },
      {
        phone: '79001234568',
        email: 'event.creator@test.com',
        firstName: 'Создатель',
        lastName: 'Событий',
        gender: 'FEMALE',
        role: 'USER',
        isVerified: true,
        status: 'ACTIVE',
        registrationStep: 5,
        latitude: 55.7600,
        longitude: 37.6200,
        address: 'Тестовая ул., д. 2',
      },
      {
        phone: '79001234569',
        email: 'property.owner@test.com',
        firstName: 'Владелец',
        lastName: 'Недвижимости',
        gender: 'MALE',
        role: 'USER',
        isVerified: true,
        status: 'ACTIVE',
        registrationStep: 5,
        latitude: 55.7500,
        longitude: 37.6100,
        address: 'Тестовая ул., д. 3',
      }
    ];

    console.log('\n1️⃣  Создание пользователей...');
    const createdUsers = [];
    for (const userData of usersData) {
      const user = await prisma.users.create({ data: userData });
      createdUsers.push(user);
      console.log(`   ✅ ${user.firstName} ${user.lastName} (ID: ${user.id})`);
    }

    const [communityCreator, eventCreator, propertyOwner] = createdUsers;

    console.log('\n2️⃣  Создание сообщества...');
    const community = await prisma.community.create({
      data: {
        name: 'Тестовое сообщество',
        description: 'Сообщество для тестирования удаления',
        latitude: 55.7558,
        longitude: 37.6176,
        isPrivate: false,
        isActive: true,
        createdBy: communityCreator.id,
        joinCode: 'TEST123',
      }
    });
    console.log(`   ✅ Создано сообщество "${community.name}" (ID: ${community.id})`);

    console.log('\n3️⃣  Добавление пользователей в сообщество...');
    for (const user of createdUsers) {
      await prisma.usersOnCommunities.create({
        data: {
          userId: user.id,
          communityId: community.id,
        }
      });
      console.log(`   ✅ ${user.firstName} добавлен в сообщество`);
    }

    console.log('\n4️⃣  Создание событий...');
    const events = [];
    for (let i = 0; i < 2; i++) {
      const event = await prisma.event.create({
        data: {
          title: `Тестовое событие ${i + 1}`,
          description: `Описание события ${i + 1} для тестирования`,
          latitude: 55.7558 + (i * 0.001),
          longitude: 37.6176 + (i * 0.001),
          type: 'EVENT',
          hasVoting: i === 0,
          votingQuestion: i === 0 ? 'Тестовый вопрос для голосования?' : null,
          hasMoneyCollection: false,
          eventDateTime: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          isActive: true,
          createdBy: eventCreator.id,
          communityId: community.id,
        }
      });
      events.push(event);
      console.log(`   ✅ Создано событие "${event.title}" (ID: ${event.id})`);
    }

    console.log('\n5️⃣  Добавление участников в события...');
    for (const event of events) {
      for (const user of createdUsers) {
        await prisma.usersOnEvents.create({
          data: {
            userId: user.id,
            eventId: event.id,
          }
        });
      }
      console.log(`   ✅ Добавлены участники в "${event.title}"`);
    }

    console.log('\n6️⃣  Создание недвижимости...');
    const properties = [];
    for (let i = 0; i < 2; i++) {
      const property = await prisma.property.create({
        data: {
          name: `Тестовая недвижимость ${i + 1}`,
          category: 'PRIVATE_HOUSE',
          latitude: 55.7500 + (i * 0.001),
          longitude: 37.6100 + (i * 0.001),
          photo: null,
          isActive: true,
          userId: propertyOwner.id,
          verificationStatus: 'UNVERIFIED',
        }
      });
      properties.push(property);
      console.log(`   ✅ Создана недвижимость "${property.name}" (ID: ${property.id})`);
    }

    console.log('\n7️⃣  Создание верификаций недвижимости...');
    for (const property of properties) {
      for (const user of createdUsers.slice(0, 2)) { // Первые 2 пользователя верифицируют
        await prisma.propertyVerification.create({
          data: {
            propertyId: property.id,
            userId: user.id,
          }
        });
      }
      console.log(`   ✅ Добавлены верификации для "${property.name}"`);
    }

    console.log('\n8️⃣  Создание голосования...');
    if (events[0].hasVoting) {
      const votingOptions = await Promise.all([
        prisma.votingOption.create({
          data: { eventId: events[0].id, text: 'Вариант 1' }
        }),
        prisma.votingOption.create({
          data: { eventId: events[0].id, text: 'Вариант 2' }
        })
      ]);

      // Добавляем голоса
      for (let i = 0; i < createdUsers.length; i++) {
        await prisma.voting.create({
          data: {
            eventId: events[0].id,
            votingOptionId: votingOptions[i % 2].id,
            userId: createdUsers[i].id,
          }
        });
      }
      console.log(`   ✅ Добавлены варианты голосования и голоса`);
    }

    console.log('\n🎉 ПОЛЬЗОВАТЕЛИ С СВЯЗЯМИ СОЗДАНЫ!');
    console.log('=' .repeat(50));
    console.log('📊 Что было создано:');
    console.log(`   👥 Пользователи: ${createdUsers.length}`);
    console.log(`   🏘️  Сообщества: 1`);
    console.log(`   📅 События: ${events.length}`);
    console.log(`   🏠 Недвижимость: ${properties.length}`);
    console.log(`   ✅ Верификации: ${properties.length * 2}`);
    console.log(`   🗳️  Голосования: ${createdUsers.length}`);

    console.log('\n🧪 ТЕПЕРЬ МОЖНО ТЕСТИРОВАТЬ СЛОЖНОЕ УДАЛЕНИЕ:');
    console.log('-' .repeat(50));
    console.log('🎯 Пользователи для тестирования:');
    createdUsers.forEach(user => {
      console.log(`   ID: ${user.id} - ${user.firstName} ${user.lastName}`);
      if (user.id === communityCreator.id) console.log(`     👑 Создатель сообщества`);
      if (user.id === eventCreator.id) console.log(`     📅 Создатель событий`);
      if (user.id === propertyOwner.id) console.log(`     🏠 Владелец недвижимости`);
    });

    console.log('\n💡 При удалении этих пользователей система должна:');
    console.log('   • Переназначить созданные сообщества/события на админа');
    console.log('   • Удалить участие в событиях и сообществах');
    console.log('   • Удалить голоса и верификации');
    console.log('   • Удалить принадлежащую недвижимость');

    return createdUsers;

  } catch (error) {
    console.error('❌ Ошибка при создании пользователей с связями:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createUsersWithRelationships();

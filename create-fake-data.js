"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createFakeData() {
    try {
        console.log('🔍 Проверяем существующие данные...');
        const users = await prisma.users.findMany({
            select: { id: true, firstName: true, lastName: true, phone: true }
        });
        console.log('Пользователи:', users);
        const communities = await prisma.community.findMany({
            select: { id: true, name: true }
        });
        console.log('Сообщества:', communities);
        const categories = await prisma.eventCategory.findMany({
            select: { id: true, name: true, type: true }
        });
        console.log('Категории событий:', categories);
        let community;
        if (communities.length === 0) {
            community = await prisma.community.create({
                data: {
                    name: 'Тестовое сообщество',
                    description: 'Сообщество для тестирования',
                    latitude: 55.7558,
                    longitude: 37.6176,
                    createdBy: users[0].id,
                }
            });
            console.log('✅ Создано сообщество:', community);
        }
        else {
            community = communities[0];
            console.log('📍 Используем существующее сообщество:', community);
        }
        let category;
        if (categories.length === 0) {
            category = await prisma.eventCategory.create({
                data: {
                    name: 'Общее собрание',
                    icon: '🏠',
                    color: '#2563eb',
                    type: 'EVENT',
                }
            });
            console.log('✅ Создана категория:', category);
        }
        else {
            category = categories[0];
            console.log('📍 Используем существующую категорию:', category);
        }
        await prisma.usersOnCommunities.upsert({
            where: {
                userId_communityId: {
                    userId: users[0].id,
                    communityId: community.id,
                }
            },
            update: {},
            create: {
                userId: users[0].id,
                communityId: community.id,
            }
        });
        const additionalUsers = [];
        for (let i = 2; i <= 4; i++) {
            const user = await prisma.users.upsert({
                where: { phone: `7909784450${i}` },
                update: {},
                create: {
                    phone: `7909784450${i}`,
                    firstName: `Тестовый${i}`,
                    lastName: `Пользователь${i}`,
                    role: 'USER',
                    isVerified: true,
                    registrationStep: 4,
                }
            });
            additionalUsers.push(user);
            await prisma.usersOnCommunities.upsert({
                where: {
                    userId_communityId: {
                        userId: user.id,
                        communityId: community.id,
                    }
                },
                update: {},
                create: {
                    userId: user.id,
                    communityId: community.id,
                }
            });
        }
        console.log('✅ Создано дополнительных пользователей:', additionalUsers.length);
        const events = [];
        const eventData = [
            {
                title: 'Собрание жильцов',
                description: 'Обсуждение вопросов благоустройства территории',
                type: 'EVENT',
                hasVoting: true,
                votingQuestion: 'Согласны ли вы с установкой новых детских площадок?',
                eventDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Уборка территории',
                description: 'Субботник для благоустройства двора',
                type: 'EVENT',
                hasVoting: false,
                eventDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Отключение воды',
                description: 'Плановое отключение холодной воды с 9:00 до 18:00',
                type: 'NOTIFICATION',
                hasVoting: false,
                eventDateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            }
        ];
        for (const data of eventData) {
            const event = await prisma.event.create({
                data: {
                    ...data,
                    latitude: 55.7558 + Math.random() * 0.01,
                    longitude: 37.6176 + Math.random() * 0.01,
                    categoryId: category.id,
                    communityId: community.id,
                    createdBy: users[0].id,
                }
            });
            events.push(event);
            if (data.hasVoting) {
                await prisma.votingOption.createMany({
                    data: [
                        { eventId: event.id, text: 'Да, согласен' },
                        { eventId: event.id, text: 'Нет, не согласен' },
                        { eventId: event.id, text: 'Воздержусь' },
                    ]
                });
            }
            const allUsers = [users[0], ...additionalUsers];
            for (const user of allUsers) {
                await prisma.usersOnEvents.upsert({
                    where: {
                        userId_eventId: {
                            userId: user.id,
                            eventId: event.id,
                        }
                    },
                    update: {},
                    create: {
                        userId: user.id,
                        eventId: event.id,
                    }
                });
            }
        }
        console.log('✅ Создано событий:', events.length);
        const messages = [];
        const messageTexts = [
            'Добро пожаловать на мероприятие!',
            'Напоминаю всем о времени проведения',
            'Пожалуйста, приходите вовремя',
            'Если есть вопросы, задавайте здесь',
            'Увидимся на мероприятии!',
            'Не забудьте взять с собой документы',
            'Ждем всех участников',
            'Программа мероприятия уже готова',
            'Будет интересно!',
            'До встречи!',
        ];
        const allUsers = [users[0], ...additionalUsers];
        for (const event of events) {
            const messageCount = 5 + Math.floor(Math.random() * 4);
            for (let i = 0; i < messageCount; i++) {
                const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
                const randomText = messageTexts[Math.floor(Math.random() * messageTexts.length)];
                const message = await prisma.eventMessage.create({
                    data: {
                        text: `${randomText} #${i + 1}`,
                        userId: randomUser.id,
                        eventId: event.id,
                        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                    }
                });
                messages.push(message);
            }
        }
        console.log('✅ Создано сообщений:', messages.length);
        console.log('\n🎉 Фейковые данные успешно созданы!');
        console.log(`📊 Итого:`);
        console.log(`   - Пользователей: ${allUsers.length}`);
        console.log(`   - Сообществ: 1`);
        console.log(`   - Категорий: 1`);
        console.log(`   - Событий: ${events.length}`);
        console.log(`   - Сообщений: ${messages.length}`);
    }
    catch (error) {
        console.error('❌ Ошибка при создании фейковых данных:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createFakeData();
//# sourceMappingURL=create-fake-data.js.map
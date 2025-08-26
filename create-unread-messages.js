"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createUnreadMessages() {
    console.log('🔍 Создание непрочитанных сообщений для тестирования...');
    try {
        const users = await prisma.users.findMany({
            where: { status: 'ACTIVE' },
            take: 10,
        });
        if (users.length < 2) {
            console.log('❌ Недостаточно пользователей. Нужно минимум 2 пользователя.');
            return;
        }
        const communities = await prisma.community.findMany({
            where: { isActive: true },
            take: 3,
        });
        if (communities.length === 0) {
            console.log('❌ Не найдено активных сообществ.');
            return;
        }
        let eventCategory = await prisma.eventCategory.findFirst();
        if (!eventCategory) {
            eventCategory = await prisma.eventCategory.create({
                data: {
                    name: 'Общие мероприятия',
                    description: 'Общие мероприятия для тестирования',
                    type: 'EVENT',
                    isActive: true,
                },
            });
            console.log('✅ Создана категория событий');
        }
        console.log(`✅ Найдено ${users.length} пользователей и ${communities.length} сообществ`);
        const events = [];
        const eventTitles = [
            'Собрание жильцов дома',
            'Субботник во дворе',
            'Детский праздник',
            'Обсуждение ремонта',
            'Новогодняя вечеринка',
        ];
        for (let i = 0; i < eventTitles.length; i++) {
            const community = communities[i % communities.length];
            const creator = users[i % users.length];
            const event = await prisma.event.create({
                data: {
                    title: eventTitles[i],
                    description: `Описание для ${eventTitles[i]}`,
                    latitude: community.latitude + (Math.random() - 0.5) * 0.01,
                    longitude: community.longitude + (Math.random() - 0.5) * 0.01,
                    categoryId: eventCategory.id,
                    type: 'EVENT',
                    hasVoting: Math.random() > 0.7,
                    votingQuestion: Math.random() > 0.7 ? 'Участвуете ли вы в мероприятии?' : null,
                    hasMoneyCollection: Math.random() > 0.8,
                    moneyAmount: Math.random() > 0.8 ? 1000 + Math.random() * 5000 : null,
                    eventDateTime: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
                    isActive: true,
                    createdBy: creator.id,
                    communityId: community.id,
                },
            });
            events.push(event);
            console.log(`✅ Создано событие: ${event.title}`);
        }
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
            'Какие будут предложения?',
            'Я за это предложение!',
            'А что думают остальные?',
            'Кто будет участвовать?',
            'Отличная идея!',
        ];
        let totalMessages = 0;
        for (const event of events) {
            const messageCount = 3 + Math.floor(Math.random() * 6);
            for (let i = 0; i < messageCount; i++) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const randomText = messageTexts[Math.floor(Math.random() * messageTexts.length)];
                await prisma.eventMessage.create({
                    data: {
                        text: `${randomText} (сообщение ${i + 1})`,
                        userId: randomUser.id,
                        eventId: event.id,
                        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                    },
                });
                totalMessages++;
            }
            console.log(`✅ Создано ${messageCount} сообщений для события: ${event.title}`);
        }
        for (const user of users.slice(0, Math.floor(users.length / 2))) {
            const eventsToMarkAsRead = events.slice(0, Math.floor(Math.random() * events.length));
            for (const event of eventsToMarkAsRead) {
                await prisma.eventRead.create({
                    data: {
                        userId: user.id,
                        eventId: event.id,
                        readAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000),
                    },
                });
            }
            console.log(`✅ Пользователь ${user.firstName} ${user.lastName} прочитал ${eventsToMarkAsRead.length} событий`);
        }
        console.log('\n🎉 Данные для тестирования непрочитанных сообщений созданы!');
        console.log(`📊 Итого:`);
        console.log(`   - Событий: ${events.length}`);
        console.log(`   - Сообщений: ${totalMessages}`);
        console.log(`   - Часть пользователей прочитали часть событий`);
        console.log('\n📝 Теперь можно тестировать API /api/events/messages/unread');
    }
    catch (error) {
        console.error('❌ Ошибка при создании данных:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createUnreadMessages();
//# sourceMappingURL=create-unread-messages.js.map
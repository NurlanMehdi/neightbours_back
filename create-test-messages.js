"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createTestMessages() {
    console.log('🎭 Создание тестовых сообщений для API...');
    try {
        const users = await prisma.users.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, firstName: true, lastName: true }
        });
        if (users.length < 3) {
            console.log('❌ Нужно минимум 3 пользователя для создания разнообразных тестов');
            return;
        }
        console.log(`✅ Найдено ${users.length} пользователей`);
        const events = await prisma.event.findMany({
            where: { isActive: true },
            select: { id: true, title: true },
            take: 5
        });
        console.log(`✅ Найдено ${events.length} событий`);
        const messageTemplates = [
            'Привет всем! Кто идет на мероприятие?',
            'У меня есть вопрос по организации',
            'Отличная идея! Я поддерживаю',
            'Может стоит перенести время?',
            'Я приглашу соседей',
            'Нужна помощь с подготовкой?',
            'Где будем встречаться?',
            'Принести что-то с собой?',
            'Сколько людей уже записалось?',
            'Это будет интересно!',
            'Я немного опоздаю',
            'Спасибо за организацию!',
            'Есть ли парковка рядом?',
            'Можно привести детей?',
            'Во сколько закончится?'
        ];
        let totalMessages = 0;
        for (const event of events) {
            console.log(`\n📝 Добавляем сообщения в "${event.title}" (ID: ${event.id})`);
            await prisma.eventMessage.deleteMany({
                where: { eventId: event.id }
            });
            const messageCount = 5 + Math.floor(Math.random() * 6);
            for (let i = 0; i < messageCount; i++) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const randomMessage = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
                await prisma.eventMessage.create({
                    data: {
                        text: `${randomMessage} #${i + 1}`,
                        userId: randomUser.id,
                        eventId: event.id,
                        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                    }
                });
                totalMessages++;
            }
            console.log(`   ✅ Создано ${messageCount} сообщений`);
        }
        await prisma.eventRead.deleteMany({});
        console.log('\n🧹 Очищены все статусы прочтения');
        const testScenarios = [
            { userId: 1, readEvents: [1, 2] },
            { userId: 2, readEvents: [1] },
        ];
        for (const scenario of testScenarios) {
            if (users.find(u => u.id === scenario.userId)) {
                for (const eventId of scenario.readEvents) {
                    if (events.find(e => e.id === eventId)) {
                        await prisma.eventRead.create({
                            data: {
                                userId: scenario.userId,
                                eventId: eventId,
                                readAt: new Date(),
                            }
                        });
                    }
                }
                console.log(`✅ Пользователь ${scenario.userId} прочитал события: ${scenario.readEvents.join(', ')}`);
            }
        }
        console.log('\n📊 Статистика для тестирования:');
        for (const event of events) {
            const messageCount = await prisma.eventMessage.count({
                where: { eventId: event.id }
            });
            const messagesFromOthersForUser1 = await prisma.eventMessage.count({
                where: {
                    eventId: event.id,
                    userId: { not: 1 }
                }
            });
            const isReadByUser1 = await prisma.eventRead.findFirst({
                where: { userId: 1, eventId: event.id }
            });
            console.log(`Событие ${event.id} (${event.title}):`);
            console.log(`  - Всего сообщений: ${messageCount}`);
            console.log(`  - От других пользователей (не от ID 1): ${messagesFromOthersForUser1}`);
            console.log(`  - Прочитано пользователем 1: ${isReadByUser1 ? 'Да' : 'Нет'}`);
            console.log(`  - Ожидаемый результат для API (user 1): ${!isReadByUser1 && messagesFromOthersForUser1 > 0 ? `{"${event.id}":{"notifications":${messagesFromOthersForUser1}}}` : 'не включается'}`);
        }
        console.log(`\n🎉 Создано ${totalMessages} тестовых сообщений!`);
        console.log('\n🔗 Тестовые команды:');
        console.log('# Все непрочитанные (должно показать события 3-5):');
        console.log('curl -X GET "http://localhost:3000/api/events/messages/unread" -H "Authorization: Bearer [token]"');
        console.log('\n# Конкретное непрочитанное событие (например, 3):');
        console.log('curl -X GET "http://localhost:3000/api/events/messages/unread?eventId=3" -H "Authorization: Bearer [token]"');
        console.log('\n# Прочитанное событие (должно вернуть {}):');
        console.log('curl -X GET "http://localhost:3000/api/events/messages/unread?eventId=1" -H "Authorization: Bearer [token]"');
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createTestMessages();
//# sourceMappingURL=create-test-messages.js.map
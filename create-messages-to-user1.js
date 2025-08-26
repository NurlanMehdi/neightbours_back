"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createMessagesToUser1() {
    console.log('📬 Создание сообщений ДЛЯ пользователя 1 (как получателя)...');
    try {
        const otherUsers = await prisma.users.findMany({
            where: {
                status: 'ACTIVE',
                id: { not: 1 }
            },
            select: { id: true, firstName: true, lastName: true }
        });
        if (otherUsers.length < 2) {
            console.log('❌ Нужно минимум 2 других пользователя');
            return;
        }
        console.log(`✅ Найдено ${otherUsers.length} отправителей`);
        const events = await prisma.event.findMany({
            where: { isActive: true },
            select: { id: true, title: true },
            take: 3
        });
        await prisma.eventMessage.deleteMany({});
        console.log('🧹 Очищены все существующие сообщения');
        const messagesForUser1 = [
            'Привет! Ты идешь на мероприятие?',
            'Нужна твоя помощь с организацией',
            'Можешь принести воду?',
            'Увидимся на встрече!',
            'Спасибо за участие!',
            'Не забудь взять документы',
            'Время изменилось на 15:00',
            'Отличная работа!',
            'Ждем тебя завтра',
            'Можешь помочь с подготовкой?'
        ];
        let totalMessages = 0;
        for (const event of events) {
            console.log(`\n📝 Добавляем сообщения в "${event.title}" (ID: ${event.id})`);
            const messageCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < messageCount; i++) {
                const randomSender = otherUsers[Math.floor(Math.random() * otherUsers.length)];
                const randomMessage = messagesForUser1[Math.floor(Math.random() * messagesForUser1.length)];
                await prisma.eventMessage.create({
                    data: {
                        text: `${randomMessage} #${i + 1}`,
                        userId: randomSender.id,
                        eventId: event.id,
                        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                    }
                });
                totalMessages++;
            }
            const ownMessages = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < ownMessages; i++) {
                await prisma.eventMessage.create({
                    data: {
                        text: `Мое сообщение в событии ${event.title} #${i + 1}`,
                        userId: 1,
                        eventId: event.id,
                        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                    }
                });
                totalMessages++;
            }
            console.log(`   ✅ Создано ${messageCount} сообщений ДЛЯ пользователя 1 и ${ownMessages} от пользователя 1`);
        }
        await prisma.eventRead.deleteMany({});
        if (events.length > 0) {
            await prisma.eventRead.create({
                data: {
                    userId: 1,
                    eventId: events[0].id,
                    readAt: new Date(),
                }
            });
            console.log(`✅ Событие ${events[0].id} помечено как прочитанное пользователем 1`);
        }
        console.log('\n📊 Статистика для нового API (сообщения ДЛЯ пользователя 1):');
        for (const event of events) {
            const messagesForUser1Count = await prisma.eventMessage.count({
                where: {
                    eventId: event.id,
                    userId: { not: 1 }
                }
            });
            const isRead = await prisma.eventRead.findFirst({
                where: { userId: 1, eventId: event.id }
            });
            console.log(`Событие ${event.id} (${event.title}):`);
            console.log(`  - Сообщений ДЛЯ пользователя 1: ${messagesForUser1Count}`);
            console.log(`  - Прочитано: ${isRead ? 'Да' : 'Нет'}`);
            console.log(`  - Ожидаемый результат: ${!isRead && messagesForUser1Count > 0 ? `{"${event.id}":{"notifications":${messagesForUser1Count}}}` : 'не включается'}`);
        }
        console.log(`\n🎉 Создано ${totalMessages} сообщений!`);
        console.log('\n💡 Теперь API показывает сообщения ДЛЯ пользователя 1 (как получателя)');
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createMessagesToUser1();
//# sourceMappingURL=create-messages-to-user1.js.map
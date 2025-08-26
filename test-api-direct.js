"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function testApiDirect() {
    console.log('🧪 Тестирование логики API напрямую...');
    try {
        const userId = 1;
        console.log(`\n🔍 Тестируем для пользователя с ID: ${userId}`);
        const readEventIds = await prisma.eventRead.findMany({
            where: { userId },
            select: { eventId: true },
        });
        const readEventIdList = readEventIds.map(read => read.eventId);
        console.log(`📖 Прочитанные события: ${readEventIdList.join(', ') || 'нет'}`);
        const allEvents = await prisma.event.findMany({
            select: { id: true, title: true }
        });
        console.log(`📝 Всего событий: ${allEvents.length}`);
        const unreadEventIds = allEvents
            .filter(event => !readEventIdList.includes(event.id))
            .map(event => event.id);
        console.log(`❌ Непрочитанные события: ${unreadEventIds.join(', ')}`);
        if (unreadEventIds.length === 0) {
            console.log('ℹ️  Все события прочитаны - API должен вернуть пустой объект {}');
            return;
        }
        const whereClause = {
            userId: { not: userId },
            eventId: { in: unreadEventIds }
        };
        console.log('\n🔍 Условие поиска:', JSON.stringify(whereClause, null, 2));
        const groupedMessages = await prisma.eventMessage.groupBy({
            by: ['eventId'],
            where: whereClause,
            _count: { id: true },
        });
        console.log(`💬 Групп сообщений найдено: ${groupedMessages.length}`);
        const result = {};
        groupedMessages.forEach(group => {
            result[group.eventId.toString()] = {
                notifications: group._count.id,
            };
        });
        console.log('\n✅ Результат API:');
        console.log(JSON.stringify(result, null, 2));
        console.log('\n🔍 Детальная проверка сообщений:');
        for (const eventId of unreadEventIds) {
            const messages = await prisma.eventMessage.findMany({
                where: {
                    eventId,
                    userId: { not: userId }
                },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true } }
                }
            });
            console.log(`Событие ${eventId}: ${messages.length} сообщений от других пользователей`);
            messages.forEach(msg => {
                console.log(`  - От пользователя ${msg.user.firstName} ${msg.user.lastName} (ID: ${msg.userId}): "${msg.text}"`);
            });
        }
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testApiDirect();
//# sourceMappingURL=test-api-direct.js.map
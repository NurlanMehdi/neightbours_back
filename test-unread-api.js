"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function testUnreadMessagesAPI() {
    console.log('🧪 Тестирование API непрочитанных сообщений...');
    try {
        const user = await prisma.users.findFirst({
            where: { status: 'ACTIVE' },
        });
        if (!user) {
            console.log('❌ Нет активных пользователей для тестирования');
            return;
        }
        console.log(`✅ Используем пользователя: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
        const readEvents = await prisma.eventRead.findMany({
            where: { userId: user.id },
            include: {
                event: {
                    select: { id: true, title: true }
                }
            }
        });
        console.log(`📖 Пользователь прочитал ${readEvents.length} событий:`);
        readEvents.forEach(read => {
            console.log(`   - ${read.event.title} (ID: ${read.eventId})`);
        });
        const allEvents = await prisma.event.findMany({
            select: { id: true, title: true }
        });
        console.log(`📝 Всего событий: ${allEvents.length}`);
        allEvents.forEach(event => {
            const isRead = readEvents.some(read => read.eventId === event.id);
            console.log(`   - ${event.title} (ID: ${event.id}) ${isRead ? '✅ прочитано' : '❌ не прочитано'}`);
        });
        const readEventIds = readEvents.map(read => read.eventId);
        const unreadEventIds = allEvents
            .filter(event => !readEventIds.includes(event.id))
            .map(event => event.id);
        console.log(`\n📋 Непрочитанные события: ${unreadEventIds.join(', ')}`);
        if (unreadEventIds.length > 0) {
            const messagesInUnreadEvents = await prisma.eventMessage.findMany({
                where: {
                    eventId: { in: unreadEventIds },
                    userId: { not: user.id }
                },
                include: {
                    event: {
                        select: { id: true, title: true }
                    }
                }
            });
            console.log(`💬 Сообщений в непрочитанных событиях: ${messagesInUnreadEvents.length}`);
            const grouped = messagesInUnreadEvents.reduce((acc, message) => {
                const eventId = message.eventId.toString();
                if (!acc[eventId]) {
                    acc[eventId] = [];
                }
                acc[eventId].push(message);
                return acc;
            }, {});
            console.log('\n📊 Ожидаемый результат API:');
            Object.entries(grouped).forEach(([eventId, messages]) => {
                const event = allEvents.find(e => e.id.toString() === eventId);
                console.log(`   "${eventId}": { "notifications": ${messages.length} } // ${event?.title}`);
            });
            console.log('\n🔗 Теперь вы можете протестировать API:');
            console.log(`GET http://localhost:3000/api/events/messages/unread`);
            console.log(`Authorization: Bearer <YOUR_JWT_TOKEN>`);
            console.log(`User-Id: ${user.id}`);
        }
        else {
            console.log('ℹ️  Все события прочитаны этим пользователем. Попробуйте другого пользователя.');
        }
    }
    catch (error) {
        console.error('❌ Ошибка при тестировании:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testUnreadMessagesAPI();
//# sourceMappingURL=test-unread-api.js.map
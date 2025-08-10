"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function verifySeedData() {
    console.log('🔍 Проверяем созданные данные...\n');
    try {
        const eventCategories = await prisma.eventCategory.findMany({
            orderBy: { type: 'asc' },
        });
        console.log('📋 Категории событий:');
        eventCategories.forEach((category, index) => {
            console.log(`${index + 1}. ${category.name} (${category.type}) - ${category.color || 'без цвета'}`);
        });
        const events = await prisma.event.findMany({
            include: {
                category: true,
                community: {
                    select: {
                        name: true,
                    },
                },
                creator: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                votingOptions: true,
                participants: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        console.log(`\n🎉 События (всего: ${events.length}):`);
        events.forEach((event, index) => {
            const creatorName = `${event.creator.firstName || ''} ${event.creator.lastName || ''}`.trim() || 'Неизвестный';
            const participantsCount = event.participants.length;
            const hasVoting = event.votingOptions.length > 0;
            console.log(`\n${index + 1}. "${event.title}" (${event.type})`);
            console.log(`   📍 Сообщество: ${event.community.name}`);
            console.log(`   👤 Создатель: ${creatorName}`);
            console.log(`   🏷️  Категория: ${event.category?.name || 'Без категории'}`);
            console.log(`   👥 Участники: ${participantsCount}`);
            if (hasVoting) {
                console.log(`   🗳️  Голосование: "${event.votingQuestion}"`);
                console.log(`   📝 Варианты: ${event.votingOptions.map(o => `"${o.text}"`).join(', ')}`);
            }
            if (event.hasMoneyCollection && event.moneyAmount) {
                console.log(`   💰 Сбор средств: ${event.moneyAmount} руб.`);
            }
            if (event.eventDateTime) {
                console.log(`   📅 Дата: ${event.eventDateTime.toLocaleDateString('ru-RU')}`);
            }
        });
        const participantsCount = await prisma.usersOnEvents.count();
        console.log(`\n👥 Всего участников событий: ${participantsCount}`);
        const votingOptionsCount = await prisma.votingOption.count();
        console.log(`🗳️  Всего вариантов голосования: ${votingOptionsCount}`);
        console.log('\n✅ Проверка завершена!');
    }
    catch (error) {
        console.error('❌ Ошибка при проверке данных:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
verifySeedData()
    .catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
});
//# sourceMappingURL=verify-seed.js.map
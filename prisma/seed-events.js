"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedEventsAndCategories() {
    console.log('🌱 Начинаем заполнение базы данных событиями и категориями...');
    try {
        const users = await prisma.users.findMany({
            where: { status: 'ACTIVE' },
            take: 10,
        });
        const communities = await prisma.community.findMany({
            where: { isActive: true },
            take: 5,
        });
        if (users.length === 0) {
            console.log('❌ Не найдено активных пользователей. Создайте пользователей перед запуском этого скрипта.');
            return;
        }
        if (communities.length === 0) {
            console.log('❌ Не найдено активных сообществ. Создайте сообщества перед запуском этого скрипта.');
            return;
        }
        console.log(`✅ Найдено ${users.length} пользователей и ${communities.length} сообществ`);
        const eventCategories = [
            {
                name: 'Спорт',
                icon: 'sport.svg',
                type: client_1.EventType.EVENT,
                color: null,
            },
            {
                name: 'Культура',
                icon: 'culture.svg',
                type: client_1.EventType.EVENT,
                color: null,
            },
            {
                name: 'Образование',
                icon: 'education.svg',
                type: client_1.EventType.EVENT,
                color: null,
            },
            {
                name: 'Благотворительность',
                icon: 'charity.svg',
                type: client_1.EventType.EVENT,
                color: null,
            },
            {
                name: 'Развлечения',
                icon: 'entertainment.svg',
                type: client_1.EventType.EVENT,
                color: null,
            },
            {
                name: 'Экстренные ситуации',
                icon: 'emergency.svg',
                type: client_1.EventType.NOTIFICATION,
                color: '#FF4444',
            },
            {
                name: 'Коммунальные услуги',
                icon: 'utilities.svg',
                type: client_1.EventType.NOTIFICATION,
                color: '#FFA500',
            },
            {
                name: 'Безопасность',
                icon: 'security.svg',
                type: client_1.EventType.NOTIFICATION,
                color: '#FFD700',
            },
            {
                name: 'Объявления',
                icon: 'announcements.svg',
                type: client_1.EventType.NOTIFICATION,
                color: '#4CAF50',
            },
        ];
        console.log('📝 Создаем категории событий...');
        const createdCategories = [];
        for (const categoryData of eventCategories) {
            try {
                const category = await prisma.eventCategory.create({
                    data: categoryData,
                });
                createdCategories.push(category);
                console.log(`✅ Создана категория: ${category.name} (${category.type})`);
            }
            catch (error) {
                if (error.code === 'P2002') {
                    console.log(`⚠️  Категория "${categoryData.name}" уже существует, пропускаем`);
                    const existingCategory = await prisma.eventCategory.findUnique({
                        where: { name: categoryData.name },
                    });
                    if (existingCategory) {
                        createdCategories.push(existingCategory);
                    }
                }
                else {
                    console.error(`❌ Ошибка создания категории "${categoryData.name}":`, error);
                }
            }
        }
        const eventTemplates = [
            {
                title: 'Футбольный турнир',
                description: 'Дружеский турнир по футболу между командами жителей района',
                type: client_1.EventType.EVENT,
                categoryName: 'Спорт',
                hasVoting: false,
                hasMoneyCollection: false,
                eventDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Утренняя пробежка',
                description: 'Еженедельная утренняя пробежка в парке',
                type: client_1.EventType.EVENT,
                categoryName: 'Спорт',
                hasVoting: false,
                hasMoneyCollection: false,
                eventDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Концерт в парке',
                description: 'Вечерний концерт классической музыки под открытым небом',
                type: client_1.EventType.EVENT,
                categoryName: 'Культура',
                hasVoting: true,
                votingQuestion: 'Какую музыку вы хотели бы услышать?',
                votingOptions: [
                    { text: 'Классическая музыка' },
                    { text: 'Джаз' },
                    { text: 'Народная музыка' },
                    { text: 'Современная музыка' },
                ],
                hasMoneyCollection: true,
                moneyAmount: 5000.0,
                eventDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Выставка картин',
                description: 'Выставка работ местных художников в культурном центре',
                type: client_1.EventType.EVENT,
                categoryName: 'Культура',
                hasVoting: false,
                hasMoneyCollection: false,
                eventDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Лекция по садоводству',
                description: 'Мастер-класс по выращиванию овощей на приусадебном участке',
                type: client_1.EventType.EVENT,
                categoryName: 'Образование',
                hasVoting: false,
                hasMoneyCollection: false,
                eventDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Курсы компьютерной грамотности',
                description: 'Бесплатные курсы для пожилых людей по основам работы с компьютером',
                type: client_1.EventType.EVENT,
                categoryName: 'Образование',
                hasVoting: true,
                votingQuestion: 'В какое время вам удобнее заниматься?',
                votingOptions: [
                    { text: 'Утром (9:00-11:00)' },
                    { text: 'Днем (14:00-16:00)' },
                    { text: 'Вечером (18:00-20:00)' },
                ],
                hasMoneyCollection: false,
                eventDateTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Сбор средств на детскую площадку',
                description: 'Собираем средства на обновление детской площадки во дворе',
                type: client_1.EventType.EVENT,
                categoryName: 'Благотворительность',
                hasVoting: true,
                votingQuestion: 'Какое оборудование установить в первую очередь?',
                votingOptions: [
                    { text: 'Качели' },
                    { text: 'Горка' },
                    { text: 'Песочница' },
                    { text: 'Спортивный комплекс' },
                ],
                hasMoneyCollection: true,
                moneyAmount: 50000.0,
                eventDateTime: null,
            },
            {
                title: 'Помощь пожилым соседям',
                description: 'Волонтерская помощь пожилым жителям района',
                type: client_1.EventType.EVENT,
                categoryName: 'Благотворительность',
                hasVoting: false,
                hasMoneyCollection: false,
                eventDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Барбекю-вечеринка',
                description: 'Совместный ужин на свежем воздухе с грилем и играми',
                type: client_1.EventType.EVENT,
                categoryName: 'Развлечения',
                hasVoting: true,
                votingQuestion: 'Что приготовим на гриле?',
                votingOptions: [
                    { text: 'Мясо' },
                    { text: 'Рыба' },
                    { text: 'Овощи' },
                    { text: 'Все вместе' },
                ],
                hasMoneyCollection: true,
                moneyAmount: 3000.0,
                eventDateTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Отключение воды',
                description: 'Плановое отключение холодной воды с 9:00 до 18:00',
                type: client_1.EventType.NOTIFICATION,
                categoryName: 'Коммунальные услуги',
                hasVoting: false,
                hasMoneyCollection: false,
                eventDateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Подозрительная активность',
                description: 'Замечена подозрительная активность возле дома 15. Будьте внимательны.',
                type: client_1.EventType.NOTIFICATION,
                categoryName: 'Безопасность',
                hasVoting: false,
                hasMoneyCollection: false,
                eventDateTime: null,
            },
            {
                title: 'Собрание жильцов',
                description: 'Общее собрание жильцов дома по вопросу капитального ремонта',
                type: client_1.EventType.NOTIFICATION,
                categoryName: 'Объявления',
                hasVoting: false,
                hasMoneyCollection: false,
                eventDateTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
            },
        ];
        console.log('🎉 Создаем события...');
        let createdEventsCount = 0;
        for (const eventTemplate of eventTemplates) {
            try {
                const category = createdCategories.find(c => c.name === eventTemplate.categoryName);
                if (!category) {
                    console.log(`⚠️  Категория "${eventTemplate.categoryName}" не найдена, пропускаем событие "${eventTemplate.title}"`);
                    continue;
                }
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const randomCommunity = communities[Math.floor(Math.random() * communities.length)];
                const eventData = {
                    title: eventTemplate.title,
                    description: eventTemplate.description,
                    latitude: randomCommunity.latitude + (Math.random() - 0.5) * 0.01,
                    longitude: randomCommunity.longitude + (Math.random() - 0.5) * 0.01,
                    type: eventTemplate.type,
                    hasVoting: eventTemplate.hasVoting,
                    votingQuestion: eventTemplate.votingQuestion || null,
                    hasMoneyCollection: eventTemplate.hasMoneyCollection,
                    moneyAmount: eventTemplate.moneyAmount || null,
                    eventDateTime: eventTemplate.eventDateTime,
                    isActive: true,
                    createdBy: randomUser.id,
                    communityId: randomCommunity.id,
                    categoryId: category.id,
                };
                let event;
                if (eventTemplate.hasVoting && eventTemplate.votingOptions) {
                    event = await prisma.event.create({
                        data: {
                            ...eventData,
                            votingOptions: {
                                create: eventTemplate.votingOptions,
                            },
                        },
                        include: {
                            votingOptions: true,
                            category: true,
                            creator: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                            community: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    });
                }
                else {
                    event = await prisma.event.create({
                        data: eventData,
                        include: {
                            category: true,
                            creator: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                            community: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    });
                }
                createdEventsCount++;
                console.log(`✅ Создано событие: "${event.title}" (${event.type}) в сообществе "${event.community.name}"`);
                if (event.type === client_1.EventType.EVENT) {
                    const participantsCount = Math.floor(Math.random() * Math.min(5, users.length)) + 1;
                    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
                    for (let i = 0; i < participantsCount; i++) {
                        try {
                            await prisma.usersOnEvents.create({
                                data: {
                                    userId: shuffledUsers[i].id,
                                    eventId: event.id,
                                },
                            });
                        }
                        catch (error) {
                            if (error.code !== 'P2002') {
                                console.log(`⚠️  Не удалось добавить участника ${shuffledUsers[i].id} к событию ${event.id}`);
                            }
                        }
                    }
                }
            }
            catch (error) {
                console.error(`❌ Ошибка создания события "${eventTemplate.title}":`, error);
            }
        }
        console.log(`\n🎊 Заполнение завершено!`);
        console.log(`📊 Статистика:`);
        console.log(`   • Категорий создано: ${createdCategories.length}`);
        console.log(`   • События создано: ${createdEventsCount}`);
        console.log(`   • Пользователей использовано: ${users.length}`);
        console.log(`   • Сообществ использовано: ${communities.length}`);
    }
    catch (error) {
        console.error('❌ Ошибка при заполнении базы данных:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
seedEventsAndCategories()
    .catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
});
//# sourceMappingURL=seed-events.js.map
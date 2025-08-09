"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedVerificationsData() {
    console.log('🌱 Начинаем создание тестовых данных для API верификации...');
    try {
        const users = await Promise.all([
            prisma.users.upsert({
                where: { phone: '+79001234567' },
                update: {},
                create: {
                    phone: '+79001234567',
                    firstName: 'Иван',
                    lastName: 'Петров',
                    role: client_1.UserRole.USER,
                    status: client_1.UserStatus.ACTIVE,
                    isVerified: true,
                    registrationStep: 4,
                    latitude: 55.7558,
                    longitude: 37.6176,
                    address: 'Москва, ул. Тверская, д. 1',
                },
            }),
            prisma.users.upsert({
                where: { phone: '+79001234568' },
                update: {},
                create: {
                    phone: '+79001234568',
                    firstName: 'Мария',
                    lastName: 'Иванова',
                    role: client_1.UserRole.USER,
                    status: client_1.UserStatus.ACTIVE,
                    isVerified: true,
                    registrationStep: 4,
                    latitude: 55.7558,
                    longitude: 37.6176,
                    address: 'Москва, ул. Арбат, д. 5',
                },
            }),
            prisma.users.upsert({
                where: { phone: '+79001234569' },
                update: {},
                create: {
                    phone: '+79001234569',
                    firstName: 'Алексей',
                    lastName: 'Сидоров',
                    role: client_1.UserRole.USER,
                    status: client_1.UserStatus.ACTIVE,
                    isVerified: true,
                    registrationStep: 4,
                    latitude: 55.7558,
                    longitude: 37.6176,
                    address: 'Москва, ул. Красная Площадь, д. 1',
                },
            }),
            prisma.users.upsert({
                where: { phone: '+79001234570' },
                update: {},
                create: {
                    phone: '+79001234570',
                    firstName: 'Елена',
                    lastName: 'Козлова',
                    role: client_1.UserRole.USER,
                    status: client_1.UserStatus.ACTIVE,
                    isVerified: true,
                    registrationStep: 4,
                    latitude: 55.7558,
                    longitude: 37.6176,
                    address: 'Москва, ул. Ленинский проспект, д. 10',
                },
            }),
        ]);
        console.log(`✅ Создано ${users.length} пользователей`);
        const properties = await Promise.all([
            prisma.property.create({
                data: {
                    name: 'Частный дом на Рублевке',
                    category: client_1.PropertyCategory.PRIVATE_HOUSE,
                    latitude: 55.7558,
                    longitude: 37.6176,
                    photo: '/uploads/house1.jpg',
                    userId: users[0].id,
                    verificationStatus: client_1.PropertyVerificationStatus.VERIFIED,
                },
            }),
            prisma.property.create({
                data: {
                    name: 'Таунхаус в Жуковке',
                    category: client_1.PropertyCategory.TOWNHOUSE,
                    latitude: 55.7658,
                    longitude: 37.6276,
                    photo: '/uploads/townhouse1.jpg',
                    userId: users[1].id,
                    verificationStatus: client_1.PropertyVerificationStatus.VERIFIED,
                },
            }),
            prisma.property.create({
                data: {
                    name: 'Коттедж у озера',
                    category: client_1.PropertyCategory.COTTAGE,
                    latitude: 55.7458,
                    longitude: 37.6076,
                    photo: '/uploads/cottage1.jpg',
                    userId: users[0].id,
                    verificationStatus: client_1.PropertyVerificationStatus.UNVERIFIED,
                },
            }),
            prisma.property.create({
                data: {
                    name: 'Земельный участок 15 соток',
                    category: client_1.PropertyCategory.LAND,
                    latitude: 55.7358,
                    longitude: 37.5976,
                    userId: users[2].id,
                    verificationStatus: client_1.PropertyVerificationStatus.VERIFIED,
                },
            }),
            prisma.property.create({
                data: {
                    name: 'Дом в центре города',
                    category: client_1.PropertyCategory.PRIVATE_HOUSE,
                    latitude: 55.7758,
                    longitude: 37.6376,
                    photo: '/uploads/house2.jpg',
                    userId: users[2].id,
                    verificationStatus: client_1.PropertyVerificationStatus.UNVERIFIED,
                },
            }),
            prisma.property.create({
                data: {
                    name: 'Современный таунхаус',
                    category: client_1.PropertyCategory.TOWNHOUSE,
                    latitude: 55.7858,
                    longitude: 37.6476,
                    photo: '/uploads/townhouse2.jpg',
                    userId: users[3].id,
                    verificationStatus: client_1.PropertyVerificationStatus.VERIFIED,
                },
            }),
        ]);
        console.log(`✅ Создано ${properties.length} объектов недвижимости`);
        const verifications = [
            { propertyId: properties[1].id, userId: users[0].id },
            { propertyId: properties[3].id, userId: users[0].id },
            { propertyId: properties[5].id, userId: users[0].id },
            { propertyId: properties[0].id, userId: users[1].id },
            { propertyId: properties[3].id, userId: users[1].id },
            { propertyId: properties[4].id, userId: users[1].id },
            { propertyId: properties[0].id, userId: users[2].id },
            { propertyId: properties[1].id, userId: users[2].id },
            { propertyId: properties[5].id, userId: users[2].id },
            { propertyId: properties[0].id, userId: users[3].id },
            { propertyId: properties[1].id, userId: users[3].id },
            { propertyId: properties[3].id, userId: users[3].id },
        ];
        for (let i = 0; i < verifications.length; i++) {
            const verification = verifications[i];
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
            await prisma.propertyVerification.upsert({
                where: {
                    propertyId_userId: {
                        propertyId: verification.propertyId,
                        userId: verification.userId,
                    },
                },
                update: {},
                create: {
                    propertyId: verification.propertyId,
                    userId: verification.userId,
                    createdAt,
                },
            });
        }
        console.log(`✅ Создано ${verifications.length} верификаций`);
        for (const property of properties) {
            const verificationsCount = await prisma.propertyVerification.count({
                where: { propertyId: property.id },
            });
            if (verificationsCount >= 2) {
                await prisma.property.update({
                    where: { id: property.id },
                    data: { verificationStatus: client_1.PropertyVerificationStatus.VERIFIED },
                });
            }
        }
        console.log('🎉 Тестовые данные для API верификации успешно созданы!');
        console.log('\n📊 Создано:');
        console.log(`👥 Пользователи: ${users.length}`);
        console.log(`🏠 Объекты недвижимости: ${properties.length}`);
        console.log(`✅ Верификации: ${verifications.length}`);
        console.log('\n🔍 Теперь вы можете протестировать API:');
        console.log('GET /api/users/verifications - получить подтверждения пользователя');
        console.log('\n📱 Тестовые пользователи:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.phone}) - ID: ${user.id}`);
        });
    }
    catch (error) {
        console.error('❌ Ошибка при создании тестовых данных:', error);
        throw error;
    }
}
seedVerificationsData()
    .catch((e) => {
    console.error('❌ Критическая ошибка:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-verifications.js.map
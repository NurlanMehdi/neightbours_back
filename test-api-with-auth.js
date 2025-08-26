"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = require("jsonwebtoken");
const prisma = new client_1.PrismaClient();
async function testApiWithAuth() {
    console.log('🧪 Тестирование API с JWT токеном...');
    try {
        const user = await prisma.users.findFirst({
            where: { status: 'ACTIVE' },
        });
        if (!user) {
            console.log('❌ Нет активных пользователей');
            return;
        }
        console.log(`✅ Используем пользователя: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
        const jwtSecret = process.env.JWT_SECRET || 'test-secret';
        const token = jsonwebtoken_1.default.sign({
            sub: user.id.toString(),
            type: 'access',
            role: user.role,
            phone: user.phone?.toString() || null,
        }, jwtSecret, { expiresIn: '1h' });
        console.log('🔑 Создан JWT токен');
        console.log('Token (первые 50 символов):', token.substring(0, 50) + '...');
        const response = await fetch('http://localhost:3000/api/events/messages/unread', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        console.log(`\n📡 HTTP статус: ${response.status}`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Ответ API:');
            console.log(JSON.stringify(data, null, 2));
        }
        else {
            const errorText = await response.text();
            console.log('❌ Ошибка API:');
            console.log(errorText);
        }
        console.log('\n🔍 Тестируем с eventId=6...');
        const responseWithEventId = await fetch('http://localhost:3000/api/events/messages/unread?eventId=6', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        console.log(`📡 HTTP статус: ${responseWithEventId.status}`);
        if (responseWithEventId.ok) {
            const data = await responseWithEventId.json();
            console.log('✅ Ответ API с eventId=6:');
            console.log(JSON.stringify(data, null, 2));
        }
        else {
            const errorText = await responseWithEventId.text();
            console.log('❌ Ошибка API:');
            console.log(errorText);
        }
        console.log('\n📋 Для тестирования в Swagger используйте:');
        console.log('Authorization: Bearer ' + token);
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testApiWithAuth();
//# sourceMappingURL=test-api-with-auth.js.map
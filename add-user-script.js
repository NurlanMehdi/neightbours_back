"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function addUser() {
    try {
        const phone = '79097844501';
        const password = 'password';
        const existingUser = await prisma.users.findUnique({
            where: { phone }
        });
        if (existingUser) {
            console.log('Пользователь с таким телефоном уже существует:', existingUser);
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.users.create({
            data: {
                phone,
                password: hashedPassword,
                role: 'USER',
                isVerified: true,
                registrationStep: 1,
            }
        });
        console.log('Пользователь успешно создан:');
        console.log({
            id: newUser.id,
            phone: newUser.phone,
            role: newUser.role,
            isVerified: newUser.isVerified,
            createdAt: newUser.createdAt
        });
    }
    catch (error) {
        console.error('Ошибка при создании пользователя:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
addUser();
//# sourceMappingURL=add-user-script.js.map
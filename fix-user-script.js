"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function fixUser() {
    try {
        const phone = '79097844501';
        const password = 'password';
        const hashedPassword = await bcrypt.hash(password, 10);
        const updatedUser = await prisma.users.update({
            where: { phone },
            data: {
                login: phone,
                password: hashedPassword,
                role: 'ADMIN',
            }
        });
        console.log('Пользователь успешно обновлен:');
        console.log({
            id: updatedUser.id,
            phone: updatedUser.phone,
            login: updatedUser.login,
            role: updatedUser.role,
            isVerified: updatedUser.isVerified,
        });
    }
    catch (error) {
        console.error('Ошибка при обновлении пользователя:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
fixUser();
//# sourceMappingURL=fix-user-script.js.map
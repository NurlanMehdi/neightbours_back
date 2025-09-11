import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Скрипт для очистки дублирующихся FCM токенов в базе данных
 * Оставляет токен только у пользователя с самым поздним lastAccess
 */
async function cleanupDuplicateFcmTokens() {
  console.log('🔍 Начинаем поиск дублирующихся FCM токенов...');

  try {
    // Находим всех пользователей с FCM токенами
    const usersWithTokens = await prisma.users.findMany({
      where: {
        fcmToken: {
          not: null,
        },
      },
      select: {
        id: true,
        fcmToken: true,
        lastAccess: true,
        firstName: true,
        lastName: true,
      },
      orderBy: {
        lastAccess: 'desc',
      },
    });

    console.log(`📱 Найдено пользователей с FCM токенами: ${usersWithTokens.length}`);

    // Группируем пользователей по FCM токену
    const tokenGroups = new Map<string, typeof usersWithTokens>();
    
    usersWithTokens.forEach((user) => {
      if (!user.fcmToken) return;
      
      if (!tokenGroups.has(user.fcmToken)) {
        tokenGroups.set(user.fcmToken, []);
      }
      tokenGroups.get(user.fcmToken)!.push(user);
    });

    console.log(`🔑 Уникальных FCM токенов: ${tokenGroups.size}`);

    // Находим дублирующиеся токены
    const duplicateTokens = Array.from(tokenGroups.entries()).filter(
      ([_, users]) => users.length > 1,
    );

    console.log(`⚠️  Найдено дублирующихся токенов: ${duplicateTokens.length}`);

    if (duplicateTokens.length === 0) {
      console.log('✅ Дублирующихся FCM токенов не найдено!');
      return;
    }

    let totalCleaned = 0;

    // Обрабатываем каждый дублирующийся токен
    for (const [token, users] of duplicateTokens) {
      console.log(`\n🔄 Обрабатываем токен: ${token.substring(0, 20)}...`);
      console.log(`👥 Количество пользователей с этим токеном: ${users.length}`);

      // Сортируем пользователей по lastAccess (самый поздний первый)
      const sortedUsers = users.sort((a, b) => {
        const aTime = a.lastAccess?.getTime() || 0;
        const bTime = b.lastAccess?.getTime() || 0;
        return bTime - aTime;
      });

      // Оставляем токен у пользователя с самым поздним lastAccess
      const keepUser = sortedUsers[0];
      const removeUsers = sortedUsers.slice(1);

      console.log(`✅ Токен остается у пользователя: ${keepUser.firstName} ${keepUser.lastName} (ID: ${keepUser.id})`);
      console.log(`🗑️  Очищаем токен у ${removeUsers.length} пользователей:`);

      // Очищаем токен у остальных пользователей
      for (const user of removeUsers) {
        await prisma.users.update({
          where: { id: user.id },
          data: {
            fcmToken: null,
            pushNotificationsEnabled: false,
          },
        });

        console.log(`   - ${user.firstName} ${user.lastName} (ID: ${user.id})`);
        totalCleaned++;
      }
    }

    console.log(`\n🎉 Очистка завершена! Очищено токенов у ${totalCleaned} пользователей`);
    
  } catch (error) {
    console.error('❌ Ошибка при очистке дублирующихся FCM токенов:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт, если он вызван напрямую
if (require.main === module) {
  cleanupDuplicateFcmTokens()
    .then(() => {
      console.log('✨ Скрипт завершен успешно');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Скрипт завершился с ошибкой:', error);
      process.exit(1);
    });
}

export { cleanupDuplicateFcmTokens };

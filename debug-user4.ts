import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugUser4Access() {
  console.log('🔍 Debugging user ID 4 access to event ID 3...');

  try {
    // Check user ID 4
    const user = await prisma.users.findUnique({
      where: { id: 4 },
      select: {
        id: true,
        phone: true,
        login: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    if (!user) {
      console.log('❌ User with ID 4 not found');
      return;
    }

    console.log('👤 User ID 4 details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Login: ${user.login}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);

    // Check event ID 3
    const event = await prisma.event.findFirst({
      where: { id: 3 },
      include: {
        creator: {
          select: {
            id: true,
            phone: true,
            login: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    if (!event) {
      console.log('❌ Event with ID 3 not found');
      return;
    }

    console.log('\n📅 Event ID 3 details:');
    console.log(`   ID: ${event.id}`);
    console.log(`   Title: ${event.title}`);
    console.log(`   Status: ${event.status}`);
    console.log(`   Created By: ${event.createdBy}`);
    console.log(`   Creator: ${event.creator.firstName} ${event.creator.lastName} (ID: ${event.creator.id})`);
    console.log(`   Creator Role: ${event.creator.role}`);

    // Check access logic
    console.log('\n🔐 Access check:');
    console.log(`   Is user 4 the creator? ${event.createdBy === user.id ? 'YES' : 'NO'}`);
    console.log(`   Is user 4 admin? ${user.role === 'ADMIN' ? 'YES' : 'NO'}`);
    console.log(`   Should have access? ${(event.createdBy === user.id || user.role === 'ADMIN') ? 'YES' : 'NO'}`);

    // Check if event is active
    console.log(`   Is event active? ${event.isActive ? 'YES' : 'NO'}`);

    // Let's also check what events user 4 created
    const user4Events = await prisma.event.findMany({
      where: { createdBy: 4 },
      select: { id: true, title: true, status: true }
    });

    console.log(`\n📅 Events created by user ID 4: ${user4Events.length}`);
    user4Events.forEach(event => {
      console.log(`   Event ID: ${event.id}, Title: ${event.title}, Status: ${event.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUser4Access();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAdminQuery() {
  // Simulate the admin query
  const communities = await prisma.community.findMany({
    where: {
      isActive: true,
    },
    include: {
      creator: true,
      users: {
        include: {
          user: true,
        },
      },
    },
  });

  const community41 = communities.find(c => c.id === 41);
  
  if (community41) {
    console.log('Community 41 found in admin query');
    console.log('createdBy:', community41.createdBy);
    console.log('users count:', community41.users.length);
    console.log('users data:');
    community41.users.forEach(u => {
      console.log(`  - userId: ${u.userId}, joinedViaCode: ${u.joinedViaCode}`);
    });

    const joinedViaCodeCount = community41.users?.filter((user) => 
      user.joinedViaCode === true && user.userId !== community41.createdBy
    ).length ?? 0;

    console.log('\nCalculated joined count:', joinedViaCodeCount);
  } else {
    console.log('Community 41 NOT found in admin query');
  }

  await prisma.$disconnect();
}

testAdminQuery().catch(console.error);

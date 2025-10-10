const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQuery() {
  const community = await prisma.community.findUnique({
    where: { id: 41 },
    include: {
      creator: true,
      users: {
        include: {
          user: true,
        },
      },
    },
  });

  console.log('Community:', {
    id: community.id,
    name: community.name,
    createdBy: community.createdBy,
  });

  console.log('\nUsers relation:');
  console.log(JSON.stringify(community.users, null, 2));

  console.log('\nFiltering logic:');
  const filtered = community.users?.filter((user) => 
    user.joinedViaCode === true && user.userId !== community.createdBy
  );
  console.log('Filtered count:', filtered.length);

  await prisma.$disconnect();
}

testQuery().catch(console.error);

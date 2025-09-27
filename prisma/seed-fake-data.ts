import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed fake data...');

  // Create users
  const users = await Promise.all([
    prisma.users.create({
      data: {
        email: 'admin@neighbours.com',
        password: await hash('password123', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        phone: '+1234567890',
        address: '123 Admin Street, City',
        latitude: 40.7128,
        longitude: -74.0060,
        status: 'ACTIVE',
        isVerified: true,
      },
    }),
    prisma.users.create({
      data: {
        email: 'john.doe@example.com',
        password: await hash('password123', 10),
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        phone: '+1234567891',
        address: '456 Main Street, City',
        latitude: 40.7589,
        longitude: -73.9851,
        status: 'ACTIVE',
        isVerified: true,
      },
    }),
    prisma.users.create({
      data: {
        email: 'jane.smith@example.com',
        password: await hash('password123', 10),
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'USER',
        phone: '+1234567892',
        address: '789 Oak Avenue, City',
        latitude: 40.7505,
        longitude: -73.9934,
        status: 'ACTIVE',
        isVerified: true,
      },
    }),
    prisma.users.create({
      data: {
        email: 'mike.wilson@example.com',
        password: await hash('password123', 10),
        firstName: 'Mike',
        lastName: 'Wilson',
        role: 'USER',
        phone: '+1234567893',
        address: '321 Pine Street, City',
        latitude: 40.7614,
        longitude: -73.9776,
        status: 'ACTIVE',
        isVerified: true,
      },
    }),
    prisma.users.create({
      data: {
        email: 'sarah.johnson@example.com',
        password: await hash('password123', 10),
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'USER',
        phone: '+1234567894',
        address: '654 Elm Street, City',
        latitude: 40.7282,
        longitude: -73.7949,
        status: 'ACTIVE',
        isVerified: true,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create event categories
  const categories = await Promise.all([
    prisma.eventCategory.create({
      data: {
        name: 'Community Meeting',
        icon: 'users',
        color: '#3B82F6',
        type: 'EVENT',
        isActive: true,
      },
    }),
    prisma.eventCategory.create({
      data: {
        name: 'Social Gathering',
        icon: 'party',
        color: '#10B981',
        type: 'EVENT',
        isActive: true,
      },
    }),
    prisma.eventCategory.create({
      data: {
        name: 'Maintenance',
        icon: 'tools',
        color: '#F59E0B',
        type: 'NOTIFICATION',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} event categories`);

  // Create communities
  const communities = await Promise.all([
    prisma.community.create({
      data: {
        name: 'Downtown Residents',
        description: 'A community for downtown residents to connect and share information.',
        latitude: 40.7128,
        longitude: -74.0060,
        createdBy: users[0].id,
        isActive: true,
      },
    }),
    prisma.community.create({
      data: {
        name: 'Green Valley Neighborhood',
        description: 'Eco-friendly neighborhood community focused on sustainability.',
        latitude: 40.7589,
        longitude: -73.9851,
        createdBy: users[1].id,
        isActive: true,
      },
    }),
    prisma.community.create({
      data: {
        name: 'Riverside Community',
        description: 'Community by the river with beautiful views and outdoor activities.',
        latitude: 40.7505,
        longitude: -73.9934,
        createdBy: users[2].id,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${communities.length} communities`);

  // Add users to communities
  for (const community of communities) {
    for (const user of users) {
      await prisma.usersOnCommunities.create({
        data: {
          userId: user.id,
          communityId: community.id,
        },
      });
    }
  }

  console.log('✅ Added users to communities');

  // Create properties
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        name: 'Downtown Apartment 1A',
        category: 'PRIVATE_HOUSE',
        latitude: 40.7128,
        longitude: -74.0060,
        userId: users[1].id,
        isActive: true,
        verificationStatus: 'VERIFIED',
        confirmationCode: 'ABC123',
        confirmationCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.property.create({
      data: {
        name: 'Oak Avenue House 2B',
        category: 'PRIVATE_HOUSE',
        latitude: 40.7589,
        longitude: -73.9851,
        userId: users[2].id,
        isActive: true,
        verificationStatus: 'VERIFIED',
        confirmationCode: 'DEF456',
        confirmationCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.property.create({
      data: {
        name: 'Pine Street Condo 3C',
        category: 'TOWNHOUSE',
        latitude: 40.7614,
        longitude: -73.9776,
        userId: users[3].id,
        isActive: true,
        verificationStatus: 'VERIFIED',
        confirmationCode: 'GHI789',
        confirmationCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log(`✅ Created ${properties.length} properties`);

  // Create events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Monthly Community Meeting',
        description: 'Join us for our monthly community meeting to discuss neighborhood updates and upcoming events.',
        latitude: 40.7128,
        longitude: -74.0060,
        categoryId: categories[0].id,
        type: 'EVENT',
        communityId: communities[0].id,
        createdBy: users[0].id,
        eventDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        isActive: true,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Summer BBQ Party',
        description: 'Annual summer BBQ party in the community park. Bring your favorite dish!',
        latitude: 40.7589,
        longitude: -73.9851,
        categoryId: categories[1].id,
        type: 'EVENT',
        communityId: communities[1].id,
        createdBy: users[1].id,
        eventDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        isActive: true,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Building Maintenance Notice',
        description: 'Scheduled maintenance for the building elevator. Please use stairs during this time.',
        latitude: 40.7505,
        longitude: -73.9934,
        categoryId: categories[2].id,
        type: 'NOTIFICATION',
        communityId: communities[2].id,
        createdBy: users[2].id,
        eventDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);

  // Add users to events
  for (const event of events) {
    for (const user of users) {
      await prisma.usersOnEvents.create({
        data: {
          userId: user.id,
          eventId: event.id,
        },
      });
    }
  }

  console.log('✅ Added users to events');

  // Create community chats
  const communityChats = await Promise.all([
    prisma.communityChat.create({
      data: {
        communityId: communities[0].id,
        isActive: true,
      },
    }),
    prisma.communityChat.create({
      data: {
        communityId: communities[1].id,
        isActive: true,
      },
    }),
    prisma.communityChat.create({
      data: {
        communityId: communities[2].id,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${communityChats.length} community chats`);

  // Create community messages
  const communityMessages = await Promise.all([
    prisma.communityMessage.create({
      data: {
        communityId: communities[0].id,
        userId: users[1].id,
        text: 'Hello everyone! Welcome to our community chat. Feel free to introduce yourselves.',
        isModerated: true,
        isDeleted: false,
      },
    }),
    prisma.communityMessage.create({
      data: {
        communityId: communities[0].id,
        userId: users[2].id,
        text: 'Hi! I\'m Jane, I live on Oak Avenue. Nice to meet you all!',
        isModerated: true,
        isDeleted: false,
      },
    }),
    prisma.communityMessage.create({
      data: {
        communityId: communities[0].id,
        userId: users[3].id,
        text: 'Hey Jane! I\'m Mike from Pine Street. How long have you been living here?',
        isModerated: true,
        isDeleted: false,
      },
    }),
    prisma.communityMessage.create({
      data: {
        communityId: communities[1].id,
        userId: users[2].id,
        text: 'Don\'t forget about our summer BBQ next week! Who\'s bringing what?',
        isModerated: true,
        isDeleted: false,
      },
    }),
    prisma.communityMessage.create({
      data: {
        communityId: communities[1].id,
        userId: users[4].id,
        text: 'I can bring burgers and hot dogs! Anyone else want to contribute?',
        isModerated: true,
        isDeleted: false,
      },
    }),
    prisma.communityMessage.create({
      data: {
        communityId: communities[2].id,
        userId: users[0].id,
        text: 'Important: Building maintenance scheduled for next week. Please plan accordingly.',
        isModerated: true,
        isDeleted: false,
      },
    }),
  ]);

  console.log(`✅ Created ${communityMessages.length} community messages`);

  // Create event messages
  const eventMessages = await Promise.all([
    prisma.eventMessage.create({
      data: {
        eventId: events[0].id,
        userId: users[1].id,
        text: 'Looking forward to the community meeting! What topics will be discussed?',
        isModerated: true,
        isDeleted: false,
      },
    }),
    prisma.eventMessage.create({
      data: {
        eventId: events[0].id,
        userId: users[2].id,
        text: 'I hope we can discuss the new playground equipment proposal.',
        isModerated: true,
        isDeleted: false,
      },
    }),
    prisma.eventMessage.create({
      data: {
        eventId: events[1].id,
        userId: users[3].id,
        text: 'The BBQ sounds amazing! What time does it start?',
        isModerated: true,
        isDeleted: false,
      },
    }),
    prisma.eventMessage.create({
      data: {
        eventId: events[1].id,
        userId: users[4].id,
        text: 'It starts at 2 PM! Don\'t forget to bring your own drinks.',
        isModerated: true,
        isDeleted: false,
      },
    }),
    prisma.eventMessage.create({
      data: {
        eventId: events[2].id,
        userId: users[0].id,
        text: 'The maintenance will take approximately 4 hours. Sorry for the inconvenience.',
        isModerated: true,
        isDeleted: false,
      },
    }),
  ]);

  console.log(`✅ Created ${eventMessages.length} event messages`);

  // Create private conversations
  const conversations = await Promise.all([
    prisma.conversation.create({
      data: {
        pairKey: `${Math.min(users[1].id, users[2].id)}_${Math.max(users[1].id, users[2].id)}`,
        participants: {
          create: [
            { userId: users[1].id },
            { userId: users[2].id },
          ],
        },
      },
    }),
    prisma.conversation.create({
      data: {
        pairKey: `${Math.min(users[3].id, users[4].id)}_${Math.max(users[3].id, users[4].id)}`,
        participants: {
          create: [
            { userId: users[3].id },
            { userId: users[4].id },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${conversations.length} private conversations`);

  // Create private messages
  const privateMessages = await Promise.all([
    prisma.privateMessage.create({
      data: {
        conversationId: conversations[0].id,
        senderId: users[1].id,
        text: 'Hi Jane! I saw your message about the playground equipment. I think it\'s a great idea!',
      },
    }),
    prisma.privateMessage.create({
      data: {
        conversationId: conversations[0].id,
        senderId: users[2].id,
        text: 'Thanks John! I\'m hoping we can get enough support at the meeting.',
      },
    }),
    prisma.privateMessage.create({
      data: {
        conversationId: conversations[0].id,
        senderId: users[1].id,
        text: 'I\'ll definitely vote for it. The kids really need better equipment.',
      },
    }),
    prisma.privateMessage.create({
      data: {
        conversationId: conversations[1].id,
        senderId: users[3].id,
        text: 'Hey Sarah! Are you going to the BBQ next week?',
      },
    }),
    prisma.privateMessage.create({
      data: {
        conversationId: conversations[1].id,
        senderId: users[4].id,
        text: 'Yes! I\'m really looking forward to it. Are you bringing anything?',
      },
    }),
  ]);

  console.log(`✅ Created ${privateMessages.length} private messages`);

  // Create global chat settings
  await prisma.globalChatSettings.create({
    data: {
      allowCommunityChat: true,
      allowEventChat: true,
      allowPrivateChat: true,
      messageRetentionDays: 365,
      maxMessageLength: 1000,
      moderationEnabled: true,
    },
  });

  console.log('✅ Created global chat settings');

  console.log('🎉 Fake data seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- ${users.length} users created`);
  console.log(`- ${categories.length} event categories created`);
  console.log(`- ${communities.length} communities created`);
  console.log(`- ${properties.length} properties created`);
  console.log(`- ${events.length} events created`);
  console.log(`- ${communityChats.length} community chats created`);
  console.log(`- ${communityMessages.length} community messages created`);
  console.log(`- ${eventMessages.length} event messages created`);
  console.log(`- ${conversations.length} private conversations created`);
  console.log(`- ${privateMessages.length} private messages created`);
  console.log('\n🔑 Test credentials:');
  console.log('Admin: admin@neighbours.com / password123');
  console.log('User: john.doe@example.com / password123');
  console.log('User: jane.smith@example.com / password123');
  console.log('User: mike.wilson@example.com / password123');
  console.log('User: sarah.johnson@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding fake data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

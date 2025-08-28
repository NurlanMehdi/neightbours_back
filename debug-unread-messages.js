const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugUnreadMessages(userId, eventId) {
  console.log(`🔍 Debugging unread messages for User ${userId}, Event ${eventId}`);
  console.log('=' * 60);

  try {
    // 1. Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true }
    });
    console.log('1. User exists:', user ? '✅' : '❌', user);

    // 2. Check if event exists and is active
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, isActive: true, type: true, communityId: true }
    });
    console.log('2. Event exists and active:', event ? '✅' : '❌', event);

    if (!event) return;

    // 3. Check if user is participant in the event
    const participation = await prisma.usersOnEvents.findUnique({
      where: {
        userId_eventId: { userId, eventId }
      }
    });
    console.log('3. User is participant:', participation ? '✅' : '❌', participation);

    // 4. Check all messages in the event
    const allMessages = await prisma.eventMessage.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('4. All messages in event:', allMessages.length);
    allMessages.forEach((msg, i) => {
      console.log(`   ${i+1}. ${msg.user.firstName} (ID:${msg.userId}): "${msg.text.substring(0, 50)}..."`);
    });

    // 5. Check messages NOT from the user
    const messagesNotFromUser = allMessages.filter(msg => msg.userId !== userId);
    console.log('5. Messages NOT from user:', messagesNotFromUser.length);

    // 6. Check if user has read the event
    const eventRead = await prisma.eventRead.findUnique({
      where: {
        userId_eventId: { userId, eventId }
      }
    });
    console.log('6. User has read event:', eventRead ? '✅' : '❌', eventRead);

    // 7. Expected unread count
    if (participation && !eventRead && messagesNotFromUser.length > 0) {
      console.log('7. Expected unread count:', messagesNotFromUser.length);
    } else {
      console.log('7. Expected unread count: 0 because:');
      if (!participation) console.log('   - User is not a participant');
      if (eventRead) console.log('   - User has already read the event');
      if (messagesNotFromUser.length === 0) console.log('   - No messages from other users');
    }

    // 8. Get all user participations
    const userParticipations = await prisma.usersOnEvents.findMany({
      where: { userId },
      include: {
        event: { select: { id: true, title: true, isActive: true, type: true } }
      }
    });
    console.log('8. All user participations:', userParticipations.length);
    userParticipations.forEach((p, i) => {
      console.log(`   ${i+1}. Event ${p.eventId}: ${p.event.title} (${p.event.type}, active: ${p.event.isActive})`);
    });

    // 9. Simulate the actual query
    console.log('\n🔄 Simulating actual unread query...');
    
    // Get read events
    const readEventIds = await prisma.eventRead.findMany({
      where: { userId },
      select: { eventId: true }
    });
    const readEventIdList = readEventIds.map(read => read.eventId);
    console.log('Read events:', readEventIdList);

    // Get participating event IDs
    const userEventIds = userParticipations.map(up => up.eventId);
    console.log('Participating events:', userEventIds);

    if (userEventIds.length === 0) {
      console.log('❌ No participating events found');
      return;
    }

    // Build where clause
    const whereClause = {
      userId: { not: userId },
      event: {
        id: { in: userEventIds },
        isActive: true
      }
    };

    // Add eventId filter if specified
    if (eventId) {
      if (readEventIdList.includes(eventId)) {
        console.log('❌ Specified event is already read');
        return;
      } else {
        whereClause.eventId = eventId;
      }
    } else {
      whereClause.eventId = { notIn: readEventIdList };
    }

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    // Execute query
    const messages = await prisma.eventMessage.findMany({
      where: whereClause,
      include: {
        event: { select: { id: true, type: true } }
      }
    });

    console.log('10. Final result - Unread messages found:', messages.length);
    messages.forEach((msg, i) => {
      console.log(`   ${i+1}. Event ${msg.eventId} (${msg.event.type}): "${msg.text.substring(0, 30)}..."`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage: node debug-unread-messages.js
const userId = 18;  // User ID from your test
const eventId = 90; // Event ID from your test

debugUnreadMessages(userId, eventId).catch(console.error);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function debugReadStatus() {
    try {
        console.log('🔍 Checking read status...');
        const readRecords = await prisma.eventRead.findMany({
            include: {
                user: {
                    select: { id: true, phone: true }
                },
                event: {
                    select: { id: true, title: true }
                }
            }
        });
        console.log('📖 Read records:');
        readRecords.forEach(record => {
            console.log(`   User ${record.user.phone} read Event "${record.event.title}" (ID: ${record.eventId}) at ${record.readAt}`);
        });
        const messagesEvent1 = await prisma.eventMessage.findMany({
            where: { eventId: 1 },
            include: {
                user: {
                    select: { id: true, phone: true }
                }
            }
        });
        console.log('\n💬 Messages in Event 1:');
        messagesEvent1.forEach(msg => {
            console.log(`   ${msg.user.phone}: "${msg.text}" (${msg.createdAt})`);
        });
        const adminUserId = 1;
        const readEventIds = await prisma.eventRead.findMany({
            where: { userId: adminUserId },
            select: { eventId: true }
        });
        console.log(`\n📋 Admin (userId=${adminUserId}) has read events:`, readEventIds.map(r => r.eventId));
        const isEvent1Read = readEventIds.some(r => r.eventId === 1);
        console.log(`❓ Is Event 1 read by admin? ${isEvent1Read}`);
        if (!isEvent1Read) {
            const unreadFromEvent1 = await prisma.eventMessage.findMany({
                where: {
                    eventId: 1,
                    userId: { not: adminUserId }
                },
                include: {
                    user: { select: { phone: true } }
                }
            });
            console.log(`🔴 Unread messages from Event 1 for admin: ${unreadFromEvent1.length}`);
        }
        else {
            console.log(`✅ Event 1 is marked as read, should return 0 messages`);
        }
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
debugReadStatus();
//# sourceMappingURL=debug-read-status.js.map
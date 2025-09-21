-- DropForeignKey
ALTER TABLE "public"."community_messages" DROP CONSTRAINT "community_messages_chatId_fkey";

-- AddForeignKey
ALTER TABLE "public"."community_messages" ADD CONSTRAINT "community_messages_chatId_fkey" FOREIGN KEY ("communityId") REFERENCES "public"."community_chats"("communityId") ON DELETE RESTRICT ON UPDATE CASCADE;

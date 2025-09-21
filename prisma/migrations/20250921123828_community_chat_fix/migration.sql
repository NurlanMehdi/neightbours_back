-- AddForeignKey
ALTER TABLE "public"."community_messages" ADD CONSTRAINT "community_messages_chatId_fkey" FOREIGN KEY ("communityId") REFERENCES "public"."community_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

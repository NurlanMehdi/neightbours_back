/*
  Warnings:

  - A unique constraint covering the columns `[messageId,userId]` on the table `message_seen` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "message_seen_messageId_userId_key" ON "public"."message_seen"("messageId", "userId");

/*
  Warnings:

  - You are about to drop the `event_message_reads` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."event_message_reads" DROP CONSTRAINT "event_message_reads_messageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."event_message_reads" DROP CONSTRAINT "event_message_reads_userId_fkey";

-- DropTable
DROP TABLE "public"."event_message_reads";

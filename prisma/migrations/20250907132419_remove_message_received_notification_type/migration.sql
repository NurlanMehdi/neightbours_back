/*
  Warnings:

  - The values [MESSAGE_RECEIVED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."NotificationType_new" AS ENUM ('INFO', 'EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_CANCELLED', 'EVENT_DELETED', 'USER_JOINED_EVENT', 'USER_LEFT_EVENT', 'USER_MENTIONED', 'COMMUNITY_INVITE', 'COMMUNITY_APPROVED', 'COMMUNITY_REJECTED', 'USER_JOINED_COMMUNITY', 'SYSTEM_MAINTENANCE', 'SYSTEM_UPDATE');
ALTER TABLE "public"."notifications" ALTER COLUMN "type" TYPE "public"."NotificationType_new" USING ("type"::text::"public"."NotificationType_new");
ALTER TYPE "public"."NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "public"."NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

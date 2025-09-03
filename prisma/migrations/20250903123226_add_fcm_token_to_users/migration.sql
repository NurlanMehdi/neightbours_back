-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "fcmToken" TEXT,
ADD COLUMN     "pushNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

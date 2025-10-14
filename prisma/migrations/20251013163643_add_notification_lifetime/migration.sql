/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `lifetimeHours` on the `notifications` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."notifications_expiresAt_idx";

-- AlterTable
ALTER TABLE "public"."events" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "lifetimeHours" INTEGER DEFAULT 24;

-- AlterTable
ALTER TABLE "public"."notifications" DROP COLUMN "expiresAt",
DROP COLUMN "lifetimeHours";

-- CreateIndex
CREATE INDEX "idx_event_type_expires" ON "public"."events"("type", "expiresAt");

-- CreateIndex
CREATE INDEX "idx_event_expires" ON "public"."events"("expiresAt");

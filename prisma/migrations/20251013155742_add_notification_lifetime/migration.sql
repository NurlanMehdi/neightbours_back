-- AlterTable
ALTER TABLE "public"."notifications" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "lifetimeHours" INTEGER NOT NULL DEFAULT 24;

-- CreateIndex
CREATE INDEX "notifications_expiresAt_idx" ON "public"."notifications"("expiresAt");

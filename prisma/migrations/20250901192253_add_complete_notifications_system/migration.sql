-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM (
    'INFO',
    'EVENT_CREATED',
    'EVENT_UPDATED',
    'EVENT_CANCELLED',
    'EVENT_DELETED',
    'USER_JOINED_EVENT',
    'USER_LEFT_EVENT',
    'USER_MENTIONED',
    'MESSAGE_RECEIVED',
    'COMMUNITY_INVITE',
    'COMMUNITY_APPROVED',
    'COMMUNITY_REJECTED',
    'USER_JOINED_COMMUNITY',
    'SYSTEM_MAINTENANCE',
    'SYSTEM_UPDATE'
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" SERIAL NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "public"."notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "public"."notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

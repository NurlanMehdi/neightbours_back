-- AlterTable
ALTER TABLE "public"."community_messages" ADD COLUMN     "isModerated" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."event_messages" ADD COLUMN     "isModerated" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "public"."global_chat_settings" (
    "id" SERIAL NOT NULL,
    "allowCommunityChat" BOOLEAN NOT NULL DEFAULT true,
    "allowEventChat" BOOLEAN NOT NULL DEFAULT true,
    "allowPrivateChat" BOOLEAN NOT NULL DEFAULT true,
    "messageRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "maxMessageLength" INTEGER NOT NULL DEFAULT 1000,
    "moderationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_chat_settings_pkey" PRIMARY KEY ("id")
);

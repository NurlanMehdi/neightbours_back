-- Add isDeleted column to community and event messages for soft delete moderation
ALTER TABLE "public"."community_messages"
  ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "public"."event_messages"
  ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;


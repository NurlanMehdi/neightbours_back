ALTER TABLE "event_messages"
ADD COLUMN "replyToMessageId" INTEGER;

ALTER TABLE "event_messages"
ADD CONSTRAINT "event_messages_replyToMessageId_fkey"
FOREIGN KEY ("replyToMessageId") REFERENCES "event_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "community_chats" (
  "id" SERIAL PRIMARY KEY,
  "communityId" INTEGER NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "settings" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "community_chats_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "community_messages" (
  "id" SERIAL PRIMARY KEY,
  "communityId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "replyToMessageId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "community_messages_communityId_createdAt_idx"
ON "community_messages" ("communityId", "createdAt");

CREATE INDEX "community_messages_userId_idx"
ON "community_messages" ("userId");

ALTER TABLE "community_messages"
ADD CONSTRAINT "community_messages_communityId_fkey"
FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_messages"
ADD CONSTRAINT "community_messages_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_messages"
ADD CONSTRAINT "community_messages_replyToMessageId_fkey"
FOREIGN KEY ("replyToMessageId") REFERENCES "community_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "community_reads" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "communityId" INTEGER NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "community_reads_userId_communityId_key"
ON "community_reads" ("userId", "communityId");

ALTER TABLE "community_reads"
ADD CONSTRAINT "community_reads_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_reads"
ADD CONSTRAINT "community_reads_communityId_fkey"
FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

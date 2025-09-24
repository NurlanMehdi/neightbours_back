-- Idempotent migration to add property confirmation fields and enum

-- Create enum type if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'PropertyConfirmationStatus'
    ) THEN
        CREATE TYPE "public"."PropertyConfirmationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED');
    END IF;
END$$;

-- Add columns if not exists
ALTER TABLE "public"."properties"
    ADD COLUMN IF NOT EXISTS "confirmationCode" TEXT,
    ADD COLUMN IF NOT EXISTS "confirmationCodeExpiresAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "confirmationStatus" "public"."PropertyConfirmationStatus";

-- Set default for confirmationStatus
ALTER TABLE "public"."properties"
    ALTER COLUMN "confirmationStatus" SET DEFAULT 'PENDING';

-- Backfill NULLs to PENDING
UPDATE "public"."properties"
SET "confirmationStatus" = 'PENDING'
WHERE "confirmationStatus" IS NULL;

-- Create unique index for confirmationCode, if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'properties_confirmationCode_key'
    ) THEN
        CREATE UNIQUE INDEX "properties_confirmationCode_key" ON "public"."properties"("confirmationCode");
    END IF;
END$$;


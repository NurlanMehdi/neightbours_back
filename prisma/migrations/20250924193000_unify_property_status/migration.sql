-- Extend PropertyVerificationStatus enum to include code-confirmation states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'PropertyVerificationStatus' AND n.nspname = 'public'
  ) THEN
    -- Enum should already exist from previous migrations; this is a safety net.
    CREATE TYPE "public"."PropertyVerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED');
  END IF;
END $$;

ALTER TYPE "public"."PropertyVerificationStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "public"."PropertyVerificationStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "public"."PropertyVerificationStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- Drop unique index on confirmationCode if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'properties_confirmationCode_key' AND n.nspname = 'public'
  ) THEN
    DROP INDEX "public"."properties_confirmationCode_key";
  END IF;
END $$;

-- Drop confirmation-related columns (if present)
ALTER TABLE "public"."properties"
  DROP COLUMN IF EXISTS "confirmationCode",
  DROP COLUMN IF EXISTS "confirmationCodeExpiresAt",
  DROP COLUMN IF EXISTS "confirmationStatus";

-- Drop PropertyConfirmationStatus enum type if it exists and is unused
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'PropertyConfirmationStatus' AND n.nspname = 'public'
  ) THEN
    -- Ensure no remaining dependencies on the type
    PERFORM 1
    FROM pg_depend d
    JOIN pg_type t ON t.oid = d.refobjid
    WHERE t.typname = 'PropertyConfirmationStatus'
      AND d.deptype = 'n';

    -- If we reached here without exception, it's safe to drop
    BEGIN
      DROP TYPE "public"."PropertyConfirmationStatus";
    EXCEPTION WHEN dependent_objects_still_exist THEN
      -- Ignore if still used somewhere unexpected
      NULL;
    END;
  END IF;
END $$;


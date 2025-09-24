-- Add confirmation columns to properties table with temporary defaults
-- This migration adds the missing confirmationCode and confirmationCodeExpiresAt columns
-- that were removed by a previous migration but are still expected by the schema

-- AlterEnum: Remove unused enum values from PropertyVerificationStatus
BEGIN;
CREATE TYPE "public"."PropertyVerificationStatus_new" AS ENUM ('UNVERIFIED', 'VERIFIED');
ALTER TABLE "public"."properties" ALTER COLUMN "verificationStatus" DROP DEFAULT;
ALTER TABLE "public"."properties" ALTER COLUMN "verificationStatus" TYPE "public"."PropertyVerificationStatus_new" USING ("verificationStatus"::text::"public"."PropertyVerificationStatus_new");
ALTER TYPE "public"."PropertyVerificationStatus" RENAME TO "PropertyVerificationStatus_old";
ALTER TYPE "public"."PropertyVerificationStatus_new" RENAME TO "PropertyVerificationStatus";
DROP TYPE "public"."PropertyVerificationStatus_old";
ALTER TABLE "public"."properties" ALTER COLUMN "verificationStatus" SET DEFAULT 'UNVERIFIED';
COMMIT;

-- Add confirmation columns with temporary defaults for existing rows
ALTER TABLE "public"."properties"
ADD COLUMN IF NOT EXISTS "confirmationCode" TEXT NOT NULL DEFAULT '000000',
ADD COLUMN IF NOT EXISTS "confirmationCodeExpiresAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Remove the temporary defaults so new rows must explicitly set values
ALTER TABLE "public"."properties"
ALTER COLUMN "confirmationCode" DROP DEFAULT,
ALTER COLUMN "confirmationCodeExpiresAt" DROP DEFAULT;

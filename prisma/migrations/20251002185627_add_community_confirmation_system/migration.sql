-- DropForeignKey
ALTER TABLE "public"."users_on_communities" DROP CONSTRAINT "users_on_communities_communityId_fkey";

-- AlterTable
ALTER TABLE "public"."communities" ADD COLUMN     "confirmationDeadline" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'INACTIVE',
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL,
ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "public"."users_on_communities" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "joinedViaCode" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "public"."users_on_communities" ADD CONSTRAINT "users_on_communities_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

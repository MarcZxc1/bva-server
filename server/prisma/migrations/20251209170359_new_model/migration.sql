/*
  Warnings:

  - A unique constraint covering the columns `[googleId,platform]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[facebookId,platform]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Campaign" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateEnum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "UserPlatform" AS ENUM ('SHOPEE_CLONE', 'TIKTOK_CLONE', 'BVA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add platform column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'platform'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "platform" "UserPlatform" NOT NULL DEFAULT 'BVA';
    END IF;
END $$;

-- Drop old unique constraints if they exist
DROP INDEX IF EXISTS "User_email_key";
DROP INDEX IF EXISTS "User_googleId_key";
DROP INDEX IF EXISTS "User_facebookId_key";

-- Drop existing indexes if they exist (they might have been created without WHERE clause)
DROP INDEX IF EXISTS "User_googleId_platform_key";
DROP INDEX IF EXISTS "User_facebookId_platform_key";

-- CreateIndex (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'User_email_platform_key'
    ) THEN
        CREATE UNIQUE INDEX "User_email_platform_key" ON "User"("email", "platform");
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'User_googleId_platform_key'
    ) THEN
        CREATE UNIQUE INDEX "User_googleId_platform_key" ON "User"("googleId", "platform") WHERE "googleId" IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'User_facebookId_platform_key'
    ) THEN
        CREATE UNIQUE INDEX "User_facebookId_platform_key" ON "User"("facebookId", "platform") WHERE "facebookId" IS NOT NULL;
    END IF;
END $$;

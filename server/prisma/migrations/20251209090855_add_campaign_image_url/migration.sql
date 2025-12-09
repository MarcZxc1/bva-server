-- AlterTable: Add imageUrl (nullable) and updatedAt (with default for existing rows)
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Add updatedAt with default value for existing rows
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- Set updatedAt to createdAt for existing rows
UPDATE "Campaign" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- Now make updatedAt NOT NULL with default
ALTER TABLE "Campaign" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Campaign" ALTER COLUMN "updatedAt" SET NOT NULL;

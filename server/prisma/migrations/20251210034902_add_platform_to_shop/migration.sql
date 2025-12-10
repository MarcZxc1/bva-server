-- Step 1: Add platform column (nullable first to avoid constraint issues)
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "platform" "Platform";

-- Step 2: Set default value for existing shops
UPDATE "Shop" SET "platform" = 'SHOPEE' WHERE "platform" IS NULL;

-- Step 3: Make platform NOT NULL with default
ALTER TABLE "Shop" ALTER COLUMN "platform" SET NOT NULL;
ALTER TABLE "Shop" ALTER COLUMN "platform" SET DEFAULT 'SHOPEE';

-- Step 4: Handle duplicate shops per user by keeping only the first one per ownerId
-- Delete duplicate shops, keeping the oldest one for each ownerId
DELETE FROM "Shop" s1
WHERE s1.id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY "ownerId" ORDER BY "createdAt" ASC) as rn
    FROM "Shop"
  ) t
  WHERE t.rn > 1
);

-- Step 5: Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Shop_ownerId_platform_key" ON "Shop"("ownerId", "platform");

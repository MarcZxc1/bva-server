-- Fix existing Lazada users who were incorrectly created with SHOPEE platform
-- This script updates users and shops to use the correct LAZADA platform

-- Update users from SHOPEE_CLONE to LAZADA_CLONE
-- (Only if they don't have any SHOPEE-specific data)
UPDATE "User"
SET platform = 'LAZADA_CLONE'
WHERE platform = 'SHOPEE_CLONE'
  AND id NOT IN (
    SELECT DISTINCT "ownerId" 
    FROM "Shop" 
    WHERE platform = 'SHOPEE'
  );

-- Update shops from SHOPEE to LAZADA
-- (Only for users who should be on Lazada platform)
UPDATE "Shop"
SET platform = 'LAZADA'
WHERE platform = 'SHOPEE'
  AND "ownerId" IN (
    SELECT id 
    FROM "User" 
    WHERE platform = 'LAZADA_CLONE'
  );

-- Display results
SELECT 
  u.id as user_id,
  u.email,
  u.platform as user_platform,
  s.id as shop_id,
  s.name as shop_name,
  s.platform as shop_platform
FROM "User" u
LEFT JOIN "Shop" s ON s."ownerId" = u.id
WHERE u.platform = 'LAZADA_CLONE'
ORDER BY u."createdAt" DESC;

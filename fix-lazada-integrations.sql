-- Fix Lazada Integrations that are pointing to wrong shops
-- This script deletes integrations where the platform doesn't match the shop's platform

-- First, let's see the problematic integrations
SELECT 
  i.id AS integration_id,
  i.platform AS integration_platform,
  s.id AS shop_id,
  s.name AS shop_name,
  s.platform AS shop_platform
FROM "Integration" i
JOIN "Shop" s ON i."shopId" = s.id
WHERE i.platform != s.platform;

-- Delete the incorrect integrations
-- Uncomment the line below to actually delete them
-- DELETE FROM "Integration" WHERE id IN (
--   SELECT i.id
--   FROM "Integration" i
--   JOIN "Shop" s ON i."shopId" = s.id
--   WHERE i.platform != s.platform
-- );

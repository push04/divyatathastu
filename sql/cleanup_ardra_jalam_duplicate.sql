-- =============================================================
-- CLEANUP: Fix duplicate Ardra Jalam products
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================

-- Step 1: Deactivate the OLD duplicate (June 7, is_bookable=false)
UPDATE service_items
SET
  is_active   = false,
  is_bookable = false,
  updated_at  = now()
WHERE
  id = '1b2d0181-11f0-42c3-b995-b2aae0d286f6';   -- old, non-bookable entry

-- Step 2: Make sure the NEW product is fully correct
UPDATE service_items
SET
  is_active      = true,
  is_bookable    = true,
  original_price = 699.00,   -- correct discount price (not 999)
  price          = 499.00,
  updated_at     = now()
WHERE
  id = '52367f1e-bb25-40c1-9d36-d4c44258d343';   -- new, bookable entry

-- Step 3: Verify — should return only 1 active+bookable product
SELECT
  id,
  category,
  title,
  price,
  original_price,
  is_active,
  is_bookable,
  created_at
FROM service_items
WHERE category = 'ardra_jalam'
ORDER BY created_at;

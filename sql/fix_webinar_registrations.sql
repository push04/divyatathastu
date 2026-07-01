-- ============================================================
-- FIX WEBINAR REGISTRATIONS SCHEMA
-- Run in Supabase SQL Editor — safe to run multiple times
-- Adds payment columns required by the webinar payment route
-- ============================================================

-- ── 1. Add Razorpay + amount columns ────────────────────────
ALTER TABLE webinar_registrations
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS amount              DECIMAL(10,2) DEFAULT 0;

-- ── 2. Add index on (webinar_id, user_id) for fast lookups ──
CREATE UNIQUE INDEX IF NOT EXISTS webinar_registrations_webinar_user_idx
  ON webinar_registrations(webinar_id, user_id);

-- ── 3. Ensure payment_status column exists with correct check
ALTER TABLE webinar_registrations
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded'));

-- ── Done ────────────────────────────────────────────────────
SELECT 'webinar_registrations schema fix complete.' AS status;

-- =============================================
-- MIGRATION 020 — Consultation Price & Enhancements
-- =============================================

-- Add price to consultation_slots
ALTER TABLE consultation_slots
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 45,
  ADD COLUMN IF NOT EXISTS specialization TEXT;

-- Add price_paid tracking to consultation_bookings
ALTER TABLE consultation_bookings
  ADD COLUMN IF NOT EXISTS price_paid DECIMAL(10,2) DEFAULT 0;

-- Allow INSERT on consultation_slots via API (service role bypasses RLS, but add a policy for direct client too)
-- Expert/admin policy already exists; no new policy needed since API uses service role.

-- Update status check to include 'confirmed' if not already valid
ALTER TABLE consultation_bookings
  DROP CONSTRAINT IF EXISTS consultation_bookings_status_check;
ALTER TABLE consultation_bookings
  ADD CONSTRAINT consultation_bookings_status_check
  CHECK (status IN ('booked','confirmed','completed','cancelled'));

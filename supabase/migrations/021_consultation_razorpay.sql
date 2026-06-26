-- =============================================
-- MIGRATION 021 — Consultation Razorpay Integration
-- =============================================

ALTER TABLE consultation_bookings
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

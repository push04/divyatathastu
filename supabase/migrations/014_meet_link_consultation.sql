-- ══════════════════════════════════════════════════════════════════
-- MIGRATION 014 — Google Meet fallback + call mode for consultations
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE consultation_bookings
  ADD COLUMN IF NOT EXISTS meet_link TEXT,
  ADD COLUMN IF NOT EXISTS call_mode TEXT DEFAULT 'livekit'
    CHECK (call_mode IN ('livekit', 'google_meet'));

-- Allow admin to update meet_link and call_mode
CREATE POLICY IF NOT EXISTS "consultation_bookings_admin_update" ON consultation_bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON COLUMN consultation_bookings.meet_link IS
  'Optional Google Meet / Zoom link set by admin as fallback for LiveKit';
COMMENT ON COLUMN consultation_bookings.call_mode IS
  'livekit = use built-in video room; google_meet = redirect user to meet_link';

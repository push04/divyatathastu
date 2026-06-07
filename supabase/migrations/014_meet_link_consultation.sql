-- ══════════════════════════════════════════════════════════════════
-- MIGRATION 014 — call_mode for consultations (meeting_link already exists)
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE consultation_bookings
  ADD COLUMN IF NOT EXISTS call_mode TEXT DEFAULT 'livekit'
    CHECK (call_mode IN ('livekit', 'google_meet'));

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'consultation_bookings'
    AND policyname = 'consultation_bookings_admin_update'
  ) THEN
    CREATE POLICY "consultation_bookings_admin_update" ON consultation_bookings
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

COMMENT ON COLUMN consultation_bookings.meeting_link IS
  'Optional Google Meet / Zoom link set by admin as fallback for LiveKit';
COMMENT ON COLUMN consultation_bookings.call_mode IS
  'livekit = use built-in video room; google_meet = redirect user to meeting_link';

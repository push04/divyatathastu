-- ══════════════════════════════════════════════════════════════════
-- MIGRATION 015 — Platform settings (admin-controlled key-value store)
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS platform_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'platform_settings' AND policyname = 'platform_settings_select'
  ) THEN
    CREATE POLICY "platform_settings_select" ON platform_settings
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'platform_settings' AND policyname = 'platform_settings_admin_write'
  ) THEN
    CREATE POLICY "platform_settings_admin_write" ON platform_settings
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

INSERT INTO platform_settings (key, value)
VALUES
  ('livekit_mode', 'production'),
  ('site_name', 'MahaTathastu'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE platform_settings IS 'Admin-controlled platform configuration';

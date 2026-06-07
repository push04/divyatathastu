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

-- Anyone authenticated can read (used by token route, client settings)
CREATE POLICY "platform_settings_select" ON platform_settings
  FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "platform_settings_admin_write" ON platform_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed defaults
INSERT INTO platform_settings (key, value)
VALUES
  ('livekit_mode', 'production'),
  ('site_name', 'MahaTathastu'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE platform_settings IS 'Admin-controlled platform configuration';
COMMENT ON COLUMN platform_settings.key IS 'Setting key (e.g. livekit_mode, maintenance_mode)';
COMMENT ON COLUMN platform_settings.value IS 'Text value — cast as needed by consumer';

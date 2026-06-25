-- ============================================================
--  DivyaTathastu – Schema Update SQL
--  Run this in your Supabase SQL editor (safe to re-run)
-- ============================================================

-- ── 1. profiles (ensure columns exist) ──────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name  TEXT,
  ADD COLUMN IF NOT EXISTS email      TEXT,
  ADD COLUMN IF NOT EXISTS phone      TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS role       TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS gotra      TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── 2. service_items ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_items (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category          TEXT        NOT NULL,
  title             TEXT        NOT NULL,
  subtitle          TEXT,
  description       TEXT,
  long_description  TEXT,
  price             NUMERIC(10,2),
  original_price    NUMERIC(10,2),
  duration          TEXT,
  level             TEXT,
  instructor_name   TEXT,
  instructor_bio    TEXT,
  image_url         TEXT,
  video_url         TEXT,
  is_featured       BOOLEAN     DEFAULT FALSE,
  is_active         BOOLEAN     DEFAULT TRUE,
  is_bookable       BOOLEAN     DEFAULT TRUE,
  is_live           BOOLEAN     DEFAULT FALSE,
  max_participants  INT,
  badge_text        TEXT,
  badge_color       TEXT        DEFAULT '#D4A017',
  display_order     INT         DEFAULT 0,
  tags              TEXT[]      DEFAULT '{}',
  metadata          JSONB       DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_items_category ON service_items(category);
CREATE INDEX IF NOT EXISTS idx_service_items_active   ON service_items(is_active);

-- ── 3. service_bookings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_bookings (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_item_id      UUID        REFERENCES service_items(id) ON DELETE SET NULL,
  user_id              UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  status               TEXT        NOT NULL DEFAULT 'pending',
  payment_status       TEXT        NOT NULL DEFAULT 'pending',
  amount               NUMERIC(10,2) DEFAULT 0,
  notes                TEXT,
  preferred_date       DATE,
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Add new payment columns if table already exists
ALTER TABLE service_bookings
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS preferred_date      DATE,
  ADD COLUMN IF NOT EXISTS notes               TEXT;

CREATE INDEX IF NOT EXISTS idx_service_bookings_user     ON service_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_item     ON service_bookings(service_item_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status   ON service_bookings(payment_status);

-- ── 4. Row Level Security ─────────────────────────────────────

ALTER TABLE service_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

-- service_items: everyone can read active items; only admin can write
DROP POLICY IF EXISTS "service_items_read"  ON service_items;
DROP POLICY IF EXISTS "service_items_admin" ON service_items;

CREATE POLICY "service_items_read" ON service_items
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "service_items_admin" ON service_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- service_bookings: users see their own; admin sees all; insert requires auth
DROP POLICY IF EXISTS "bookings_user_read"   ON service_bookings;
DROP POLICY IF EXISTS "bookings_user_insert" ON service_bookings;
DROP POLICY IF EXISTS "bookings_admin"       ON service_bookings;

CREATE POLICY "bookings_user_read" ON service_bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "bookings_user_insert" ON service_bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "bookings_admin" ON service_bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ── 5. Seed sample service_items (idempotent) ──────────────
-- These insert only if no items exist for the category.

INSERT INTO service_items (category, title, subtitle, description, price, duration, is_active, is_bookable, display_order)
SELECT 'sadhana', 'Mantra Deeksha Program', '21-Day Personalized Sadhana', 'Receive your personalized beej mantra and a structured 21-day japa sadhana tailored to your birth chart and current dasha.', 2100, '21 Days', TRUE, TRUE, 1
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'sadhana' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, is_active, is_bookable, display_order)
SELECT 'sadhana', 'Nakshatric Sadhana Kit', '41-Day Advanced Practice', 'Advanced 41-day sadhana with energized mala, mantra chanting schedule, and personal acharya support for accelerated spiritual progress.', 4100, '41 Days', TRUE, TRUE, 2
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'sadhana' AND display_order = 2 LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, is_active, is_bookable, display_order)
SELECT 'mahaganpati', 'Mahaganpati Puja', 'Remove Obstacles & New Beginnings', 'Complete Mahaganpati puja performed by trained Vedic priests on a muhurta determined by your birth chart. Includes Ganesh Yantra prasad.', 3100, '2-3 Hours', TRUE, TRUE, 1
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'mahaganpati' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, is_active, is_bookable, display_order)
SELECT 'mahaganpati', 'Mahaganpati Abhishek', '108 Names Puja', 'Sacred abhishek with Ganesh Ashtottara Shatanama and 5 sacred substances (panchamrit). Includes energized tilak and prasad.', 1100, '90 Minutes', TRUE, TRUE, 2
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'mahaganpati' AND display_order = 2 LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, is_active, is_bookable, display_order)
SELECT 'ardra_jalam', 'Ardra Jalam – Sacred Healing Water', '250ml Consecrated Bottle', 'Charged under Ardra Nakshatra frequencies during exact transit. Each batch contains water from a sacred source, consecrated through Vedic Rudrabhishek rituals.', 499, TRUE, TRUE, 1
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'ardra_jalam' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, is_active, is_bookable, display_order)
SELECT 'ayurveda', 'Prakriti Analysis & Consultation', 'Know Your Body Type', 'One-on-one consultation with our Ayurvedic practitioner to determine your Prakriti (body-mind constitution) and create a personalized wellness plan.', 1500, '60 Minutes', TRUE, TRUE, 1
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'ayurveda' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, is_active, is_bookable, display_order)
SELECT 'gyanampeetham', 'Jyotish Astrology Foundation Course', 'Learn Classical Indian Astrology', 'Comprehensive foundation course in Parashari Jyotish — 12 modules covering planets, rashis, houses, yogas, dasha systems, and predictions.', 9999, '12 Weeks', TRUE, TRUE, 1
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'gyanampeetham' LIMIT 1);

-- ── 6. settings table (for report pricing, etc.) ────────────
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. consultation_slots — add specialization column ────────
ALTER TABLE consultation_slots
  ADD COLUMN IF NOT EXISTS specialization TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 45;

-- Optional: seed some slots for 5 PM–11 PM range
-- INSERT INTO consultation_slots (expert_id, date, start_time, end_time, specialization, duration_minutes, is_booked, is_blocked)
-- SELECT gen_random_uuid(), CURRENT_DATE + i, h || ':00', (h+1) || ':00', 'Astrology', 45, false, false
-- FROM generate_series(0, 6) AS i, unnest(ARRAY[17, 18, 19, 20, 21, 22]) AS h
-- WHERE NOT EXISTS (SELECT 1 FROM consultation_slots LIMIT 1);

-- ── 8. events table — add live streaming columns ─────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS youtube_live_url TEXT,
  ADD COLUMN IF NOT EXISTS is_live          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS host             TEXT,
  ADD COLUMN IF NOT EXISTS requirements     TEXT,
  ADD COLUMN IF NOT EXISTS includes         TEXT[];

-- ── 9. event_registrations table ─────────────────────────────
CREATE TABLE IF NOT EXISTS event_registrations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      TEXT        NOT NULL,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  phone         TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_reg_insert" ON event_registrations;
DROP POLICY IF EXISTS "event_reg_admin"  ON event_registrations;

CREATE POLICY "event_reg_insert" ON event_registrations
  FOR INSERT WITH CHECK (true);  -- anyone can register

CREATE POLICY "event_reg_admin" ON event_registrations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ── Done ─────────────────────────────────────────────────────
-- After running this SQL:
-- 1. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local
-- 2. NEXT_PUBLIC_RAZORPAY_KEY_ID is not needed — key is returned by the API
-- 3. Run: npm run build  (to check for TypeScript errors)
-- 4. Consultation slots are now filtered to 5 PM–11 PM (add slots in that range)
-- 5. Events with is_live=true and youtube_live_url will show the live banner

-- ============================================================
-- FIX PAYMENT SCHEMA — Run this in Supabase SQL Editor
-- Ensures all payment columns exist for consultation + service bookings
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks)
-- ============================================================

-- ── 1. consultation_slots: add pricing & specialization columns ──────
ALTER TABLE consultation_slots
  ADD COLUMN IF NOT EXISTS price             DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_minutes  INTEGER       DEFAULT 45,
  ADD COLUMN IF NOT EXISTS specialization    TEXT          DEFAULT 'Astrology';

-- ── 2. consultation_bookings: add Razorpay payment columns ──────────
ALTER TABLE consultation_bookings
  ADD COLUMN IF NOT EXISTS payment_status      TEXT DEFAULT 'paid'
    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS price_paid          DECIMAL(10,2);

-- ── 3. consultation_bookings: ensure status CHECK includes all values ─
-- Postgres can't modify a CHECK constraint inline, so we drop & re-add.
DO $$
BEGIN
  -- Drop old status constraint if it exists (name may vary)
  ALTER TABLE consultation_bookings DROP CONSTRAINT IF EXISTS consultation_bookings_status_check;
  -- Re-add with all needed values
  ALTER TABLE consultation_bookings
    ADD CONSTRAINT consultation_bookings_status_check
    CHECK (status IN ('booked','confirmed','completed','cancelled','pending'));
EXCEPTION WHEN OTHERS THEN
  NULL; -- ignore if constraint management fails (already correct)
END $$;

-- ── 4. service_items table (migration 013) ──────────────────────────
CREATE TABLE IF NOT EXISTS service_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category        TEXT NOT NULL CHECK (category IN (
                    'gyanampeetham','vastu_painting','sadhana',
                    'mahaganpati','puja_ritual','ardra_jalam','ayurveda','course'
                  )),
  title           TEXT NOT NULL,
  subtitle        TEXT,
  description     TEXT,
  long_description TEXT,
  price           DECIMAL(10,2),
  original_price  DECIMAL(10,2),
  currency        TEXT DEFAULT 'INR',
  duration        TEXT,
  level           TEXT,
  image_url       TEXT,
  video_url       TEXT,
  instructor_name TEXT,
  instructor_bio  TEXT,
  is_featured     BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  is_bookable     BOOLEAN DEFAULT false,
  is_live         BOOLEAN DEFAULT false,
  max_participants INTEGER DEFAULT 1,
  tags            TEXT[]  DEFAULT '{}',
  badge_text      TEXT,
  badge_color     TEXT,
  metadata        JSONB   DEFAULT '{}',
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. service_bookings table (migration 013) ────────────────────────
CREATE TABLE IF NOT EXISTS service_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_item_id UUID REFERENCES service_items(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN (
                    'pending','confirmed','in_progress','completed','cancelled','refunded'
                  )),
  preferred_date  DATE,
  preferred_time  TIME,
  notes           TEXT,
  amount          DECIMAL(10,2),
  payment_status  TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  razorpay_order_id  TEXT,
  razorpay_payment_id TEXT,
  livekit_room_name TEXT,
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. RLS on service_items ──────────────────────────────────────────
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "service_items_public_read" ON service_items
    FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_items_admin_all" ON service_items
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 7. RLS on service_bookings ───────────────────────────────────────
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "service_bookings_own" ON service_bookings
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_bookings_insert_own" ON service_bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_bookings_update_own" ON service_bookings
    FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_bookings_admin_all" ON service_bookings
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 8. Indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS service_items_category_idx   ON service_items(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS service_items_featured_idx   ON service_items(is_featured) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS service_bookings_user_idx    ON service_bookings(user_id);
CREATE INDEX IF NOT EXISTS service_bookings_item_idx    ON service_bookings(service_item_id);
CREATE INDEX IF NOT EXISTS service_bookings_status_idx  ON service_bookings(status);

-- ── 9. Seed service items (skip if already present) ──────────────────
INSERT INTO service_items (category, title, subtitle, description, price, original_price, is_bookable, is_featured, badge_text, badge_color, display_order)
SELECT 'ardra_jalam', 'Ardra Jalam — Sacred Healing Water', 'Charged under Ardra Nakshatra · 500ml Bottle',
  'Ardra Jalam is a uniquely prepared sacred water energized during the Ardra Nakshatra — the star of transformation, healing, and purification ruled by Rudra (Shiva).',
  499.00, 999.00, false, true, 'Limited', '#cc2200', 1
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'ardra_jalam' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, level, is_bookable, is_live, display_order)
SELECT 'course', 'Vedic Jyotish Foundations', 'Learn the 12 rashis, 9 grahas & 27 nakshatras',
  'Complete beginner-friendly introduction to Vedic astrology from first principles.',
  2999.00, '8 Weeks', 'Beginner', true, false, 1
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'course' AND title = 'Vedic Jyotish Foundations' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, level, is_bookable, is_live, display_order)
SELECT 'course', 'Vastu Shastra Mastery', 'Directional energies & space healing',
  'Comprehensive Vastu course covering Panchabhutas, Vastu Purusha Mandal, and directional remedies.',
  4999.00, '6 Weeks', 'Intermediate', true, false, 2
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'course' AND title = 'Vastu Shastra Mastery' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, level, is_bookable, is_live, display_order)
SELECT 'gyanampeetham', 'Live Guru-Shishya Satsang', 'Monthly live Q&A with senior Jyotish Acharya',
  'Monthly live video session with our senior faculty. Submit your chart queries in advance.',
  999.00, '2 Hours', 'All Levels', true, true, 1
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'gyanampeetham' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, level, is_bookable, display_order)
SELECT 'sadhana', 'Personal Mantra Deeksha', 'Personalized beej mantra initiation',
  'Receive your personal beej mantra from your birth chart and nakshatra. Includes 21-day Japa guidance.',
  3001.00, '21 Days', 'All Levels', true, 1
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'sadhana' AND title = 'Personal Mantra Deeksha' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, level, is_bookable, display_order)
SELECT 'sadhana', 'Navgraha Shanti Sadhana', '9-day planetary propitiation practice',
  'Guided 9-day intensive sadhana for all 9 planets with daily mantras, specific rituals, and expert supervision.',
  5100.00, '9 Days', 'All Levels', true, 2
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'sadhana' AND title = 'Navgraha Shanti Sadhana' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, is_bookable, display_order)
SELECT 'mahaganpati', 'Mahaganpati Abhishek Puja', 'Remove obstacles & begin new ventures',
  'Sacred Abhishek puja to Mahaganpati performed by trained priests with 108-name recitation.',
  2100.00, '1.5 Hours', true, 1
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'mahaganpati' AND title = 'Mahaganpati Abhishek Puja' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, is_bookable, is_live, display_order)
SELECT 'mahaganpati', 'Ganesh Chaturthi Mahasadhana', 'Special puja on auspicious Chaturthi',
  'Extended Ganesh puja on every Chaturthi tithi. Includes Ganesh Atharvasheersha recitation.',
  1100.00, '2 Hours', true, true, 2
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'mahaganpati' AND title = 'Ganesh Chaturthi Mahasadhana' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, is_bookable, display_order)
SELECT 'puja_ritual', 'Navgraha Homa', 'Propitiate all 9 planets simultaneously',
  'Full Navgraha Homa with proper Vedic procedures, 9 types of samidha, and personalized dasha-based intentions.',
  11000.00, '4 Hours', true, 1
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'puja_ritual' AND title = 'Navgraha Homa' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, is_bookable, display_order)
SELECT 'puja_ritual', 'Rudrabhishek Puja', 'Shiva puja for health, peace & liberation',
  'Traditional Rudrabhishek with Panchamrit abhishek, Laghu Rudra recitation, and Bhasma application.',
  5100.00, '2 Hours', true, 2
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'puja_ritual' AND title = 'Rudrabhishek Puja' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, level, is_bookable, display_order)
SELECT 'ayurveda', 'Prakriti Assessment & Diet Plan', 'Know your dosha, heal your body',
  'Comprehensive Prakriti analysis with personalized Ayurvedic diet plan and daily routine guide.',
  2999.00, '1 Session', 'All Levels', true, 1
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'ayurveda' AND title = 'Prakriti Assessment & Diet Plan' LIMIT 1);

INSERT INTO service_items (category, title, subtitle, description, price, duration, level, is_bookable, display_order)
SELECT 'ayurveda', 'Medical Astrology Consultation', 'Planetary factors in health & disease',
  'Analyze the health houses and malefic influences on health. Receive planetary remedies combined with Ayurvedic protocols.',
  3999.00, '1.5 Hours', 'All Levels', true, 2
WHERE NOT EXISTS (SELECT 1 FROM service_items WHERE category = 'ayurveda' AND title = 'Medical Astrology Consultation' LIMIT 1);

-- ── 10. newsletter table (if not exists) ─────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  name       TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active  BOOLEAN DEFAULT true
);

-- ── Done ─────────────────────────────────────────────────────────────
SELECT 'Schema fix complete. All payment tables and columns are ready.' AS status;

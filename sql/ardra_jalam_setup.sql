-- =============================================================
-- DIVYA TATHASTU — Ardra Jalam Product Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. ENSURE service_items TABLE EXISTS (safe, won't overwrite)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_items (
  id                uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  category          text          NOT NULL,
  title             text          NOT NULL,
  subtitle          text,
  description       text,
  long_description  text,
  price             numeric(10,2),
  original_price    numeric(10,2),
  currency          text          DEFAULT 'INR',
  duration          text,
  level             text,
  image_url         text,
  video_url         text,
  instructor_name   text,
  instructor_bio    text,
  is_featured       boolean       DEFAULT false,
  is_active         boolean       DEFAULT true,
  is_bookable       boolean       DEFAULT true,
  is_live           boolean       DEFAULT false,
  max_participants  integer       DEFAULT 1,
  tags              text[]        DEFAULT '{}',
  badge_text        text,
  badge_color       text,
  metadata          jsonb         DEFAULT '{}',
  display_order     integer       DEFAULT 0,
  created_at        timestamptz   DEFAULT now(),
  updated_at        timestamptz   DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 2. ENSURE service_bookings TABLE EXISTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_bookings (
  id                    uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  service_item_id       uuid          REFERENCES service_items(id) ON DELETE SET NULL,
  user_id               uuid          NOT NULL,
  status                text          DEFAULT 'pending'
                                      CHECK (status IN ('pending','confirmed','cancelled','refunded')),
  amount                numeric(10,2) NOT NULL,
  payment_status        text          DEFAULT 'pending'
                                      CHECK (payment_status IN ('pending','paid','failed','refunded')),
  notes                 text,
  preferred_date        date,
  razorpay_order_id     text,
  razorpay_payment_id   text,
  created_at            timestamptz   DEFAULT now(),
  updated_at            timestamptz   DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS service_items_category_idx     ON service_items(category);
CREATE INDEX IF NOT EXISTS service_items_is_active_idx    ON service_items(is_active);
CREATE INDEX IF NOT EXISTS service_bookings_user_idx      ON service_bookings(user_id);
CREATE INDEX IF NOT EXISTS service_bookings_item_idx      ON service_bookings(service_item_id);
CREATE INDEX IF NOT EXISTS service_bookings_status_idx    ON service_bookings(status);

-- ─────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
ALTER TABLE service_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

-- service_items: anyone can READ active items (public catalogue)
DROP POLICY IF EXISTS "public_read_active_items" ON service_items;
CREATE POLICY "public_read_active_items"
  ON service_items FOR SELECT
  USING (is_active = true);

-- service_items: only service role can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "service_role_write_items" ON service_items;
CREATE POLICY "service_role_write_items"
  ON service_items FOR ALL
  USING (auth.role() = 'service_role');

-- service_bookings: users can read their own bookings
DROP POLICY IF EXISTS "user_read_own_bookings" ON service_bookings;
CREATE POLICY "user_read_own_bookings"
  ON service_bookings FOR SELECT
  USING (auth.uid() = user_id);

-- service_bookings: service role manages all bookings
DROP POLICY IF EXISTS "service_role_all_bookings" ON service_bookings;
CREATE POLICY "service_role_all_bookings"
  ON service_bookings FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────
-- 5. AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS service_items_updated_at    ON service_items;
CREATE TRIGGER service_items_updated_at
  BEFORE UPDATE ON service_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS service_bookings_updated_at ON service_bookings;
CREATE TRIGGER service_bookings_updated_at
  BEFORE UPDATE ON service_bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 6. INSERT ARDRA JALAM PRODUCT (safe to re-run)
-- ─────────────────────────────────────────────────────────────
INSERT INTO service_items (
  category, title, subtitle, description, long_description,
  price, original_price, currency,
  is_featured, is_active, is_bookable, is_live,
  max_participants, tags, badge_text, badge_color, metadata, display_order
) VALUES (
  'ardra_jalam',
  'Ardra Jalam — Sacred Healing Water',
  'Charged under Ardra Nakshatra | 500ml per bottle',
  'Sacred water charged under the divine frequencies of Ardra Nakshatra — the star of transformation ruled by Lord Rudra. Each batch is prepared through specific Vedic rituals, mantras, and cosmic alignment. Available only once every 27 days.',
  E'Ardra Jalam is prepared exclusively during the Ardra Nakshatra — the 6th of 27 lunar mansions, governed by Lord Rudra, the fierce and compassionate aspect of Shiva. The word "Ardra" means moist or fresh, and this nakshatra carries the energy of emotional release, transformation, and renewal.\n\nEach batch of Ardra Jalam is prepared by our spiritual practitioners through a rigorous Vedic process:\n• The water source is drawn from a sanctified copper vessel energised over 7 days\n• Specific Rudra mantras are chanted continuously during the nakshatra period\n• The water is exposed to moonlight and specific geometric arrangements (yantra)\n• After preparation, each bottle is sealed with kumkum and blessed\n\nWHO SHOULD USE:\n— Sadhakas engaged in mantra or meditation practice\n— Anyone seeking emotional healing or release of grief\n— Households wanting to clear stagnant energy\n— Devotees of Lord Shiva or performing Rudrabhishek\n\nSHELF LIFE: 1 year from preparation date.\nSTORAGE: Keep in a cool, dark place. Do not refrigerate.',
  499.00,
  699.00,
  'INR',
  true, true, true, false,
  1,
  ARRAY['healing','water','rudra','nakshatra','sacred','shiva','ritual'],
  'Limited Batch',
  'emerald',
  '{"volume_ml": 500, "preparation": "Ardra Nakshatra", "deity": "Lord Rudra", "shelf_life_months": 12}'::jsonb,
  1
)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 7. VERIFY — should show the inserted product
-- ─────────────────────────────────────────────────────────────
SELECT id, category, title, price, original_price, is_active, is_bookable, created_at
FROM service_items
WHERE category = 'ardra_jalam';

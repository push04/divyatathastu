-- =============================================
-- MIGRATION 013 — Divine Services + LiveKit
-- =============================================

-- ── SERVICE ITEMS (all 8 divine service categories) ──
CREATE TABLE IF NOT EXISTS service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN (
    'gyanampeetham', 'vastu_painting', 'sadhana',
    'mahaganpati', 'puja_ritual', 'ardra_jalam',
    'ayurveda', 'course'
  )),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  long_description TEXT,
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  duration TEXT,
  level TEXT CHECK (level IN ('Beginner','Intermediate','Advanced','All Levels', NULL)),
  image_url TEXT,
  video_url TEXT,
  instructor_name TEXT,
  instructor_bio TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_bookable BOOLEAN DEFAULT false,
  is_live BOOLEAN DEFAULT false,
  max_participants INTEGER DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  badge_text TEXT,
  badge_color TEXT,
  metadata JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SERVICE BOOKINGS ──
CREATE TABLE IF NOT EXISTS service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_item_id UUID REFERENCES service_items(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'
  )),
  preferred_date DATE,
  preferred_time TIME,
  notes TEXT,
  amount DECIMAL(10,2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  livekit_room_name TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SERVICE REVIEWS ──
CREATE TABLE IF NOT EXISTS service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_item_id UUID REFERENCES service_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── LIVEKIT ROOM SUPPORT: add room_name to consultation_bookings ──
ALTER TABLE consultation_bookings
  ADD COLUMN IF NOT EXISTS livekit_room_name TEXT,
  ADD COLUMN IF NOT EXISTS livekit_joined_at TIMESTAMPTZ;

-- ── RLS POLICIES ──
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;

-- service_items: public read active items, admin full control
CREATE POLICY "service_items_public_read" ON service_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "service_items_admin_all" ON service_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- service_bookings: users see own bookings, admins see all
CREATE POLICY "service_bookings_own" ON service_bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "service_bookings_insert_own" ON service_bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "service_bookings_update_own" ON service_bookings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "service_bookings_admin_all" ON service_bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- service_reviews: read approved, insert own, admin all
CREATE POLICY "service_reviews_read_approved" ON service_reviews
  FOR SELECT USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "service_reviews_insert_own" ON service_reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "service_reviews_admin_all" ON service_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── INDEXES ──
CREATE INDEX IF NOT EXISTS service_items_category_idx ON service_items(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS service_items_featured_idx ON service_items(is_featured) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS service_bookings_user_idx ON service_bookings(user_id);
CREATE INDEX IF NOT EXISTS service_bookings_item_idx ON service_bookings(service_item_id);
CREATE INDEX IF NOT EXISTS service_bookings_status_idx ON service_bookings(status);

-- ── UPDATED_AT TRIGGER ──
CREATE OR REPLACE FUNCTION update_service_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_items_updated_at
  BEFORE UPDATE ON service_items
  FOR EACH ROW EXECUTE FUNCTION update_service_items_updated_at();

-- ── SEED: Ardra Jalam product ──
INSERT INTO service_items (category, title, subtitle, description, long_description, price, original_price, is_bookable, is_featured, badge_text, badge_color, display_order)
VALUES (
  'ardra_jalam',
  'Ardra Jalam — Sacred Healing Water',
  'Charged under Ardra Nakshatra · 500ml Bottle',
  'Ardra Jalam is a uniquely prepared sacred water energized during the Ardra Nakshatra — the star of transformation, healing, and purification ruled by Rudra (Shiva). Each bottle is charged through specific Vedic rituals, mantras, and cosmic alignment.',
  'Ardra Nakshatra, presided over by Rudra, is associated with deep transformation, dissolution of negativity, and the power of renewal. Water charged during this auspicious nakshatra absorbs the potent healing frequencies of the cosmos.

**How to Use:**
• Drink 2–3 sips every morning on an empty stomach with prayer
• Sprinkle around your home for space purification
• Use for abhishek (ritual bath) of your deity idol
• Apply to forehead during meditation

**Benefits (as per Vedic tradition):**
• Dissolves accumulated negative karma
• Clears energetic blockages in the home and body
• Enhances the power of mantras and sadhana
• Promotes mental clarity and emotional healing
• Aids in recovery from illness (complement to medical treatment)

**Each batch is limited** — prepared only during Ardra Nakshatra (approx once every 27 days). Comes in a sealed glass bottle with a printed Vedic sankalpa slip.',
  499.00,
  999.00,
  false,
  true,
  'Limited',
  '#cc2200',
  1
);

-- ── SEED: Sample courses ──
INSERT INTO service_items (category, title, subtitle, description, price, duration, level, is_bookable, is_live, display_order)
VALUES
  ('course', 'Vedic Jyotish Foundations', 'Learn the 12 rashis, 9 grahas & 27 nakshatras', 'Complete beginner-friendly introduction to Vedic astrology from first principles. Covers Lagna chart reading, planetary dignities, house significances, and basic prediction techniques.', 2999.00, '8 Weeks', 'Beginner', true, false, 1),
  ('course', 'Bhrigu Nandi Nadi Masterclass', 'Advanced predictive Nadi techniques', 'Deep dive into the secret techniques of Bhrigu Nandi Nadi system — planet-to-planet relationships, future event prediction, and remedial measures from ancient palm leaf tradition.', 7999.00, '12 Weeks', 'Advanced', true, true, 2),
  ('course', 'Vastu Shastra Mastery', 'Directional energies & space healing', 'Comprehensive Vastu course covering Panchabhutas, Vastu Purusha Mandal, directional remedies, and practical home/office corrections without demolition.', 4999.00, '6 Weeks', 'Intermediate', true, false, 3),
  ('course', 'Numerology & Sacred Yantra', 'Pythagorean, Chaldean & Lo Shu systems', 'Master numerology through multiple systems. Learn yantra construction, number magic squares, and personalized remedy yantras for different life goals.', 1999.00, '4 Weeks', 'Beginner', true, false, 4),
  ('gyanampeetham', 'Live Guru-Shishya Satsang', 'Monthly live Q&A with senior Jyotish Acharya', 'Monthly live video session with our senior faculty. Submit your chart queries in advance. Limited seats per session.', 999.00, '2 Hours', 'All Levels', true, true, 1),
  ('sadhana', 'Personal Mantra Deeksha', 'Personalized beej mantra initiation', 'Receive your personal beej mantra determined from your birth chart and nakshatra. Includes 21-day Japa guidance and follow-up consultation.', 3001.00, '21 Days', 'All Levels', true, false, 1),
  ('sadhana', 'Navgraha Shanti Sadhana', '9-day planetary propitiation practice', 'Guided 9-day intensive sadhana for all 9 planets. Includes daily mantras, specific rituals, dietary guidelines, and expert supervision.', 5100.00, '9 Days', 'All Levels', true, false, 2),
  ('mahaganpati', 'Mahaganpati Abhishek Puja', 'Remove obstacles & begin new ventures', 'Sacred Abhishek puja to Mahaganpati performed by trained priests with 108-name recitation, panchamrit bath, and personalized sankalpa.', 2100.00, '1.5 Hours', NULL, true, false, 1),
  ('mahaganpati', 'Ganesh Chaturthi Mahasadhana', 'Special puja on auspicious Chaturthi', 'Extended Ganesh puja performed on every Chaturthi tithi. Includes Ganesh Atharvasheersha recitation and special modak offering.', 1100.00, '2 Hours', NULL, true, true, 2),
  ('puja_ritual', 'Navgraha Homa', 'Propitiate all 9 planets simultaneously', 'Full Navgraha Homa with proper Vedic procedures, 9 types of samidha, and personalized dasha-based intentions.', 11000.00, '4 Hours', NULL, true, false, 1),
  ('puja_ritual', 'Rudrabhishek Puja', 'Shiva puja for health, peace & liberation', 'Traditional Rudrabhishek with Panchamrit abhishek, Laghu Rudra recitation, and Bhasma application.', 5100.00, '2 Hours', NULL, true, false, 2),
  ('ayurveda', 'Prakriti Assessment & Diet Plan', 'Know your dosha, heal your body', 'Comprehensive Prakriti (body constitution) analysis with personalized Ayurvedic diet plan, herbal recommendations, and daily routine (dinacharya) guide.', 2999.00, '1 Session', 'All Levels', true, false, 1),
  ('ayurveda', 'Medical Astrology Consultation', 'Planetary factors in health & disease', 'Analyze the health houses (1st, 6th, 8th, 12th) and malefic influences on health. Receive planetary remedies combined with Ayurvedic protocols.', 3999.00, '1.5 Hours', 'All Levels', true, false, 2);

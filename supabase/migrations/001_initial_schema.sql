-- =============================================
-- MAHATATHASTU — Full Database Schema
-- =============================================

-- ── PROFILES ──
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  whatsapp_number TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'expert')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── FAMILIES ──
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  family_name TEXT,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'tathastu', 'divine')),
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── FAMILY MEMBERS ──
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  relation TEXT NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  time_of_birth TIME,
  place_of_birth TEXT NOT NULL,
  birth_latitude DECIMAL(9,6),
  birth_longitude DECIMAL(9,6),
  birth_timezone TEXT DEFAULT 'Asia/Kolkata',
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  mobile_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── KUNDLI CACHE ──
CREATE TABLE IF NOT EXISTS kundli_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  kundli_data JSONB NOT NULL,
  panchang_data JSONB,
  navamsha_data JSONB,
  dasha_data JSONB,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- ── REPORTS ──
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id),
  report_type TEXT NOT NULL CHECK (report_type IN (
    'astrology','astro_vastu','shakti_chakra','numerology',
    'mobile_number','psychology','prakriti','yantra_colour',
    'dmit','colour_therapy','child_development',
    'mantra_chanting','mantra_writing','full_tathastu'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','generated','reviewed','delivered')),
  raw_data JSONB,
  ai_analysis JSONB,
  report_content JSONB,
  pdf_url TEXT,
  generated_by TEXT DEFAULT 'auto' CHECK (generated_by IN ('auto','expert','hybrid')),
  reviewed_by UUID REFERENCES profiles(id),
  expert_notes TEXT,
  order_id UUID,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── REPORT DISCUSSIONS ──
CREATE TABLE IF NOT EXISTS report_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id),
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 30,
  expert_id UUID REFERENCES profiles(id),
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','rescheduled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PRODUCTS ──
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  product_type TEXT CHECK (product_type IN ('report','ebook','consultation','yantra','gemstone','course','bundle')),
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  images JSONB DEFAULT '[]',
  report_types JSONB DEFAULT '[]',
  ebook_id UUID,
  is_active BOOLEAN DEFAULT true,
  stock_count INTEGER DEFAULT -1,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CARTS ──
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  items JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ORDERS ──
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  family_id UUID REFERENCES families(id),
  order_number TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2),
  discount DECIMAL(10,2) DEFAULT 0,
  coupon_code TEXT,
  total DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','processing','completed','refunded','cancelled')),
  payment_method TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  billing_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── EBOOKS ──
CREATE TABLE IF NOT EXISTS ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  author TEXT,
  description TEXT,
  cover_image_url TEXT,
  preview_pages INTEGER DEFAULT 5,
  file_url TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  language TEXT DEFAULT 'Hindi',
  tags JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── EBOOK PURCHASES ──
CREATE TABLE IF NOT EXISTS ebook_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  ebook_id UUID REFERENCES ebooks(id),
  order_id UUID REFERENCES orders(id),
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 5,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── EVENTS ──
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('webinar','puja','workshop','yatra','satsang','consultation_camp')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location TEXT,
  meeting_link TEXT,
  cover_image_url TEXT,
  max_attendees INTEGER,
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── EVENT REGISTRATIONS ──
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered','attended','cancelled')),
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── MAIL THREADS ──
CREATE TABLE IF NOT EXISTS mail_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  expert_id UUID REFERENCES profiles(id),
  thread_type TEXT DEFAULT 'general' CHECK (thread_type IN ('general','report_query','consultation','support')),
  report_id UUID REFERENCES reports(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','replied','closed')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── MAIL MESSAGES ──
CREATE TABLE IF NOT EXISTS mail_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES mail_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SAVED MANDIRS ──
CREATE TABLE IF NOT EXISTS saved_mandirs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  google_place_id TEXT NOT NULL,
  mandir_name TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ITINERARIES ──
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  start_city TEXT,
  duration_days INTEGER,
  mandirs JSONB NOT NULL,
  schedule JSONB,
  estimated_cost DECIMAL(10,2),
  travel_mode TEXT DEFAULT 'mixed',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── BLOG POSTS ──
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  cover_image_url TEXT,
  author_id UUID REFERENCES profiles(id),
  category TEXT,
  tags JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  schema_markup JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONSULTATION SLOTS ──
CREATE TABLE IF NOT EXISTS consultation_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONSULTATION BOOKINGS ──
CREATE TABLE IF NOT EXISTS consultation_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID REFERENCES consultation_slots(id),
  user_id UUID REFERENCES profiles(id),
  family_member_id UUID REFERENCES family_members(id),
  report_id UUID REFERENCES reports(id),
  meeting_link TEXT,
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked','confirmed','completed','cancelled')),
  notes TEXT,
  order_id UUID REFERENCES orders(id),
  booked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── COUPONS ──
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage','flat')),
  discount_value DECIMAL(10,2),
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTIFICATIONS ──
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create profile + family on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.phone
  );
  INSERT INTO families (owner_id, family_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Family') || '''s Family');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kundli_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebook_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_mandirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "users_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "admin_all_profiles" ON profiles FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Families
CREATE POLICY "owner_family" ON families FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "admin_all_families" ON families FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Family Members
CREATE POLICY "family_members_own" ON family_members FOR ALL USING (
  family_id IN (SELECT id FROM families WHERE owner_id = auth.uid())
);
CREATE POLICY "admin_all_family_members" ON family_members FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Kundli Cache
CREATE POLICY "kundli_cache_own" ON kundli_cache FOR ALL USING (
  family_member_id IN (
    SELECT fm.id FROM family_members fm
    JOIN families f ON fm.family_id = f.id
    WHERE f.owner_id = auth.uid()
  )
);

-- Reports
CREATE POLICY "reports_own" ON reports FOR ALL USING (
  family_id IN (SELECT id FROM families WHERE owner_id = auth.uid())
);
CREATE POLICY "reports_admin" ON reports FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'expert')
);
CREATE POLICY "reports_public" ON reports FOR SELECT USING (is_public = true);

-- Products (public read)
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "products_admin" ON products FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Carts
CREATE POLICY "cart_own" ON carts FOR ALL USING (user_id = auth.uid());

-- Orders
CREATE POLICY "orders_own" ON orders FOR ALL USING (user_id = auth.uid());
CREATE POLICY "orders_admin" ON orders FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Ebooks (public read active)
CREATE POLICY "ebooks_public_read" ON ebooks FOR SELECT USING (is_active = true);
CREATE POLICY "ebooks_admin" ON ebooks FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Ebook Purchases
CREATE POLICY "ebook_purchases_own" ON ebook_purchases FOR ALL USING (user_id = auth.uid());

-- Events (public read)
CREATE POLICY "events_public_read" ON events FOR SELECT USING (is_active = true);
CREATE POLICY "events_admin" ON events FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Event Registrations
CREATE POLICY "event_reg_own" ON event_registrations FOR ALL USING (user_id = auth.uid());

-- Mail Threads
CREATE POLICY "mail_threads_own" ON mail_threads FOR ALL USING (
  user_id = auth.uid() OR expert_id = auth.uid()
);
CREATE POLICY "mail_threads_admin" ON mail_threads FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'expert')
);

-- Mail Messages
CREATE POLICY "mail_messages_own" ON mail_messages FOR ALL USING (
  thread_id IN (
    SELECT id FROM mail_threads WHERE user_id = auth.uid() OR expert_id = auth.uid()
  )
);

-- Saved Mandirs
CREATE POLICY "saved_mandirs_own" ON saved_mandirs FOR ALL USING (user_id = auth.uid());

-- Itineraries
CREATE POLICY "itineraries_own" ON itineraries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "itineraries_public" ON itineraries FOR SELECT USING (is_public = true);

-- Blog Posts (public published)
CREATE POLICY "blog_published_public" ON blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "blog_admin" ON blog_posts FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Consultation Slots (public read)
CREATE POLICY "slots_public_read" ON consultation_slots FOR SELECT USING (NOT is_blocked);
CREATE POLICY "slots_admin" ON consultation_slots FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'expert')
);

-- Consultation Bookings
CREATE POLICY "bookings_own" ON consultation_bookings FOR ALL USING (user_id = auth.uid());
CREATE POLICY "bookings_expert" ON consultation_bookings FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'expert')
);

-- Notifications
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());

-- =============================================
-- SEED DATA — Products
-- =============================================

INSERT INTO products (name, slug, description, product_type, price, sale_price, images, report_types) VALUES
('Astrology Report', 'astrology-report', 'Complete Vedic birth chart analysis with planetary positions, dasha periods, and life predictions.', 'report', 999, 799, '[]', '["astrology"]'),
('Numerology Report', 'numerology-report', 'Life path, destiny, soul number analysis with career and relationship guidance.', 'report', 499, 399, '[]', '["numerology"]'),
('Shakti Chakra Report', 'shakti-chakra-report', '7 chakra activation analysis with healing mantras, colors, and remedies.', 'report', 599, 499, '[]', '["shakti_chakra"]'),
('Astro-Vastu Report', 'astro-vastu-report', 'Planetary direction analysis for home and office with Vastu remedies.', 'report', 799, 649, '[]', '["astro_vastu"]'),
('Prakriti Report', 'prakriti-report', 'Ayurvedic body constitution analysis with diet, yoga, and lifestyle guidance.', 'report', 499, 399, '[]', '["prakriti"]'),
('Psychology Report', 'psychology-report', 'Vedic personality profile with emotional intelligence and relationship patterns.', 'report', 599, 499, '[]', '["psychology"]'),
('DMIT Report', 'dmit-report', 'Multiple intelligence analysis mapped to career paths and learning styles.', 'report', 799, 649, '[]', '["dmit"]'),
('Child Development Report', 'child-development-report', 'Complete talent map and guidance for children under 18.', 'report', 899, 749, '[]', '["child_development"]'),
('Full Tathastu Bundle', 'full-tathastu-bundle', 'All 14 personalized reports — complete 360° holistic life guidance for your entire family.', 'bundle', 4999, 2999, '[]', '["astrology","astro_vastu","shakti_chakra","numerology","mobile_number","psychology","prakriti","yantra_colour","dmit","colour_therapy","child_development","mantra_chanting","mantra_writing","full_tathastu"]'),
('1-on-1 Consultation (30 min)', 'consultation-30min', 'Personal session with our expert astrologer to discuss your reports.', 'consultation', 1499, 999, '[]', '[]'),
('1-on-1 Consultation (60 min)', 'consultation-60min', 'Extended personal session with deep dive into all your life areas.', 'consultation', 2499, 1799, '[]', '[]');

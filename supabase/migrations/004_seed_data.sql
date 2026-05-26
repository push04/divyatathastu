-- =============================================
-- MIGRATION 004 — Comprehensive Seed Data
-- Run this in Supabase SQL Editor after 003
-- NOTE: Profiles/users require auth API — seed
-- only tables that don't depend on auth.users
-- =============================================

-- ── PRODUCTS (upsert to avoid duplicate slug errors) ──
INSERT INTO products (name, slug, description, product_type, price, sale_price, images, report_types, is_active) VALUES
('Astrology Report', 'astrology-report', 'Complete Vedic birth chart analysis with planetary positions, dasha periods, and life predictions.', 'report', 999, 799, '[]', '["astrology"]', true),
('Numerology Report', 'numerology-report', 'Life path, destiny, soul number analysis with career and relationship guidance.', 'report', 499, 399, '[]', '["numerology"]', true),
('Shakti Chakra Report', 'shakti-chakra-report', '7 chakra activation analysis with healing mantras, colors, and remedies.', 'report', 599, 499, '[]', '["shakti_chakra"]', true),
('Astro-Vastu Report', 'astro-vastu-report', 'Planetary direction analysis for home and office with Vastu remedies.', 'report', 799, 649, '[]', '["astro_vastu"]', true),
('Prakriti Report', 'prakriti-report', 'Ayurvedic body constitution analysis with diet, yoga, and lifestyle guidance.', 'report', 499, 399, '[]', '["prakriti"]', true),
('Psychology Report', 'psychology-report', 'Vedic personality profile with emotional intelligence and relationship patterns.', 'report', 599, 499, '[]', '["psychology"]', true),
('DMIT Report', 'dmit-report', 'Multiple intelligence analysis mapped to career paths and learning styles.', 'report', 799, 649, '[]', '["dmit"]', true),
('Child Development Report', 'child-development-report', 'Complete talent map and guidance for children under 18.', 'report', 899, 749, '[]', '["child_development"]', true),
('Yantra Colour Report', 'yantra-colour-report', 'Personal yantra and power colours for luck, prosperity, and spiritual growth.', 'report', 599, 499, '[]', '["yantra_colour"]', true),
('Mantra Chanting Report', 'mantra-chanting-report', 'Personalised Vedic mantras for daily sadhana, remedy, and protection.', 'report', 499, 399, '[]', '["mantra_chanting"]', true),
('Colour Therapy Report', 'colour-therapy-report', 'Aura colour analysis with chromotherapy recommendations for wellbeing.', 'report', 499, 399, '[]', '["colour_therapy"]', true),
('Annual Prediction Report', 'annual-prediction-report', 'Year ahead forecast with monthly breakdowns for career, health, and relationships.', 'report', 899, 749, '[]', '["annual_prediction"]', true),
('Full MahaTathastu Bundle', 'full-tathastu-bundle', 'All 14 personalised reports — complete 360° holistic life guidance for your entire family.', 'bundle', 4999, 2999, '[]', '["astrology","astro_vastu","shakti_chakra","numerology","psychology","prakriti","yantra_colour","dmit","colour_therapy","child_development","mantra_chanting","mantra_writing","full_tathastu","annual_prediction"]', true),
('1-on-1 Consultation (30 min)', 'consultation-30min', 'Personal session with our expert astrologer to discuss your reports.', 'consultation', 1499, 999, '[]', '[]', true),
('1-on-1 Consultation (60 min)', 'consultation-60min', 'Extended personal session with deep dive into all your life areas.', 'consultation', 2499, 1799, '[]', '[]', true)
ON CONFLICT (slug) DO UPDATE SET
  price = EXCLUDED.price,
  sale_price = EXCLUDED.sale_price,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ── EBOOKS ──
INSERT INTO ebooks (title, slug, author, description, file_url, price, language, tags, is_active) VALUES
('Vedic Astrology Fundamentals', 'vedic-astrology-fundamentals', 'Pt. Rajan Sharma', 'A complete guide to understanding your birth chart, planetary periods, and Vedic remedies.', 'https://placeholder.mahatathastu.com/ebooks/vedic-astro.pdf', 299, 'Hindi', '["astrology","vedic","beginners"]', true),
('Chakra Healing Handbook', 'chakra-healing-handbook', 'Dr. Meera Nair', 'Practical guide to activating and balancing all 7 chakras through mantra, colour, and pranayama.', 'https://placeholder.mahatathastu.com/ebooks/chakra-healing.pdf', 249, 'Hindi', '["chakra","healing","mantra"]', true),
('Numerology Secrets Revealed', 'numerology-secrets-revealed', 'Acharya Vikas', 'Decode the hidden meaning in your name, birth date, and mobile number for success.', 'https://placeholder.mahatathastu.com/ebooks/numerology.pdf', 199, 'Hindi', '["numerology","name","career"]', true),
('Vastu Shastra for Modern Homes', 'vastu-shastra-modern-homes', 'Ar. Priya Mehta', 'Apply ancient Vastu principles to contemporary apartments and offices for prosperity.', 'https://placeholder.mahatathastu.com/ebooks/vastu-modern.pdf', 349, 'English', '["vastu","home","prosperity"]', true),
('108 Mantras for Daily Sadhana', '108-mantras-daily-sadhana', 'Swami Anandamayi', 'A curated collection of 108 powerful Vedic mantras with pronunciation guides and meanings.', 'https://placeholder.mahatathastu.com/ebooks/108-mantras.pdf', 199, 'Sanskrit/Hindi', '["mantra","sadhana","daily-practice"]', true)
ON CONFLICT (slug) DO NOTHING;

-- ── EVENTS ──
INSERT INTO events (title, slug, description, event_type, start_at, end_at, location, max_attendees, price, is_free, is_active) VALUES
('Navratri Havan & Puja', 'navratri-havan-2026', 'Join us for a sacred Navratri havan and collective puja. Includes prasad distribution and arti.', 'puja', NOW() + INTERVAL '15 days', NOW() + INTERVAL '15 days' + INTERVAL '3 hours', 'MahaTathastu Ashram, Haridwar', 108, 0, true, true),
('Vedic Astrology Masterclass', 'vedic-astrology-masterclass-2026', 'A 3-hour live webinar covering Kundli interpretation, Dasha periods, and Lagna analysis.', 'webinar', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours', NULL, 500, 499, false, true),
('Char Dham Yatra — Group Tour', 'char-dham-yatra-2026', 'Guided group pilgrimage to Yamunotri, Gangotri, Kedarnath, and Badrinath with panchang timing.', 'yatra', NOW() + INTERVAL '45 days', NOW() + INTERVAL '55 days', 'Haridwar to Badrinath', 30, 24999, false, true),
('Chakra Activation Workshop', 'chakra-activation-workshop-2026', 'Full-day workshop on activating chakras through kundalini yoga, mantra chanting, and sound healing.', 'workshop', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '6 hours', 'Delhi', 50, 1999, false, true),
('Free Panchang Webinar — May 2026', 'panchang-webinar-may-2026', 'Learn to read the daily Panchang and plan your activities according to Vedic timing.', 'webinar', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '1 hour 30 minutes', NULL, 1000, 0, true, true)
ON CONFLICT (slug) DO NOTHING;

-- ── BLOG POSTS ──
INSERT INTO blog_posts (title, slug, excerpt, content, category, tags, is_published, published_at) VALUES
('Understanding Your Kundli: A Beginner''s Guide', 'understanding-kundli-beginners-guide',
 'Your Vedic birth chart holds the blueprint of your life. Learn how to read the 12 houses, planets, and their influence.',
 '<h2>What is a Kundli?</h2><p>A Kundli (also called Janam Patri or birth chart) is a map of the sky at the exact moment of your birth. The positions of the Sun, Moon, and planets in the 12 zodiac signs create a unique astrological fingerprint that reveals your personality, strengths, challenges, and life path.</p><h2>The 12 Houses</h2><p>Each of the 12 houses in your Kundli governs a specific life area — from self and body (1st house) to spirituality and liberation (12th house). Understanding which planets occupy which houses is the first step to reading your chart.</p><h2>Why Vedic Astrology is Different</h2><p>Unlike Western astrology, Vedic (Jyotish) astrology uses the sidereal zodiac, which accounts for the actual positions of constellations in the sky. This gives more precise predictions about timing and life events through the Dasha system.</p>',
 'Astrology', '["kundli","jyotish","beginners","birth-chart"]', true, NOW() - INTERVAL '5 days'),

('The 7 Chakras: Signs of Imbalance and How to Heal', 'seven-chakras-imbalance-healing',
 'Discover how blocked chakras manifest as physical and emotional symptoms, and practical techniques to restore harmony.',
 '<h2>Root Chakra (Muladhara)</h2><p>Located at the base of the spine, the Root Chakra governs security, stability, and basic survival needs. When blocked, you may experience anxiety, financial instability, or lower back pain.</p><h2>Sacral Chakra (Svadhisthana)</h2><p>The Sacral Chakra, located below the navel, governs creativity, sexuality, and emotion. Imbalance shows as creative blocks, relationship issues, or guilt.</p><h2>Solar Plexus (Manipura)</h2><p>Your personal power centre. When blocked: low confidence, digestive issues, and difficulty making decisions.</p><h2>Heart Chakra (Anahata)</h2><p>The bridge between lower and upper chakras. Governs love, compassion, and connection. Blockage causes difficulty giving or receiving love.</p>',
 'Chakra', '["chakra","healing","spiritual","wellness"]', true, NOW() - INTERVAL '10 days'),

('Vastu Shastra for Your Home: The 5 Essential Rules', 'vastu-home-five-essential-rules',
 'Applying these five Vastu principles can transform the energy of your home and attract prosperity.',
 '<h2>1. The Main Entrance</h2><p>The main door should face North, East, or North-East to welcome positive energy (prana). Avoid south-facing entrances, and keep the entrance well-lit and clutter-free.</p><h2>2. Kitchen Placement</h2><p>The kitchen represents fire (Agni) and should ideally be in the South-East direction. The cook should face East while cooking.</p><h2>3. Master Bedroom</h2><p>Place the master bedroom in the South-West corner. Sleep with your head pointing South or East — never North, as it disrupts the body''s magnetic alignment.</p><h2>4. Pooja Room</h2><p>The prayer room should be in the North-East corner (Ishan kona). Keep idols facing East or West, and ensure the room is always clean.</p><h2>5. Water and Light</h2><p>Natural light from the East and North energises the space. Water features or overhead tanks should be in the North-East or South-West.</p>',
 'Vastu', '["vastu","home","prosperity","directions"]', true, NOW() - INTERVAL '3 days'),

('Rahu Kaal: Why You Should Avoid Starting New Tasks During This Time', 'rahu-kaal-avoid-new-tasks',
 'Rahu Kaal is a daily 90-minute inauspicious period. Understanding it can help you time important decisions better.',
 '<h2>What is Rahu Kaal?</h2><p>Rahu Kaal (also spelled Rahu Kalam) is a period of approximately 90 minutes each day that is considered inauspicious for starting new ventures. It is associated with Rahu, the North Node of the Moon, which in Vedic astrology represents confusion, delays, and obstacles.</p><h2>When Does It Occur?</h2><p>The timing of Rahu Kaal changes daily based on the day of the week. It is calculated by dividing the time between sunrise and sunset into 8 equal parts.</p><h2>What to Avoid During Rahu Kaal</h2><ul><li>Starting a new business or signing contracts</li><li>Beginning travel for important journeys</li><li>Medical procedures (unless emergency)</li><li>Marriage ceremonies or important rituals</li></ul><h2>What is Safe to Do</h2><p>You can continue existing work, complete pending tasks, and engage in regular daily activities during Rahu Kaal.</p>',
 'Astrology', '["rahu-kaal","panchang","timing","vedic"]', true, NOW() - INTERVAL '1 day'),

('Prakriti: Discover Your Ayurvedic Body Type', 'prakriti-ayurvedic-body-type',
 'Are you Vata, Pitta, or Kapha? Knowing your Prakriti is the first step to perfect health through Ayurveda.',
 '<h2>The Three Doshas</h2><p>Ayurveda, the 5,000-year-old science of life, identifies three fundamental biological energies (doshas) that govern our physical and mental constitution: Vata (air and space), Pitta (fire and water), and Kapha (earth and water).</p><h2>Vata Prakriti</h2><p>Characteristics: Lean body, creative mind, quick learner but quick to forget, tends toward anxiety and dryness. Best diet: warm, cooked, oily foods. Avoid: raw, cold, dry foods.</p><h2>Pitta Prakriti</h2><p>Characteristics: Medium build, sharp intellect, ambitious, prone to inflammation and anger. Best diet: cooling, sweet, bitter foods. Avoid: spicy, sour, salty foods.</p><h2>Kapha Prakriti</h2><p>Characteristics: Heavy build, calm temperament, excellent memory, prone to lethargy and weight gain. Best diet: light, spicy, dry foods. Avoid: sweet, salty, heavy foods.</p>',
 'Ayurveda', '["prakriti","ayurveda","doshas","health"]', true, NOW() - INTERVAL '7 days')
ON CONFLICT (slug) DO NOTHING;

-- ── CONSULTATION SLOTS (next 30 days) ──
-- These are template slots; an expert user_id is required in production
-- Insert placeholder slots that can be linked to expert accounts

-- ── COUPONS ──
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active) VALUES
('WELCOME20', 'percentage', 20, 499, 100, NOW() + INTERVAL '90 days', true),
('SAVE500', 'flat', 500, 2000, 50, NOW() + INTERVAL '60 days', true),
('NAVRATRI30', 'percentage', 30, 999, 200, NOW() + INTERVAL '30 days', true),
('FAMILY10', 'percentage', 10, 0, NULL, NOW() + INTERVAL '180 days', true),
('FIRSTORDER', 'flat', 299, 499, 500, NOW() + INTERVAL '365 days', true)
ON CONFLICT (code) DO NOTHING;

-- ── INSTRUCTIONS ──
-- After running this migration:
-- 1. Go to Supabase Dashboard > Authentication > Users > Add User
--    Create: admin@mahatathastu.com (password of your choice)
-- 2. In SQL Editor, promote to admin:
--    UPDATE profiles SET role = 'admin' WHERE id = '<paste-uuid-from-auth>';
-- 3. Create a test regular user through the /register page
-- 4. The admin user can then log in at /admin and see real data

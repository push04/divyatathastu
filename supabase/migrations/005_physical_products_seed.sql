-- =============================================
-- MIGRATION 005 — Physical Products + Storage
-- Run in Supabase SQL Editor after 004
-- =============================================

-- ── STEP 1: Extend product_type constraint to include 'physical' and 'herbal' ──
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_product_type_check'
      AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_product_type_check;
  END IF;
END $$;

ALTER TABLE products ADD CONSTRAINT products_product_type_check
  CHECK (product_type IN (
    'report','ebook','consultation','yantra','gemstone',
    'course','bundle','physical','herbal'
  ));

-- ── STEP 2: Create product-images storage bucket ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- ── STEP 3: Storage RLS policies ──
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "product_images_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ── STEP 4: Seed 57 physical/yantra/gemstone/herbal products ──
INSERT INTO products (name, slug, description, product_type, price, sale_price, images, stock_count, is_active) VALUES

-- ════ HAVAN / YAJNA ITEMS (8) ════
('Copper Havan Kund — Small (6 inch)',
 'copper-havan-kund-small',
 'Authentic pure copper havan kund for daily puja and small havans. 6-inch diameter, engraved with Vedic patterns. Includes iron stand. Made by traditional copper craftsmen in Haridwar.',
 'physical', 899, 699, '[]', 50, true),

('Copper Havan Kund — Medium (9 inch)',
 'copper-havan-kund-medium',
 'Pure copper medium-sized havan kund ideal for family havans and Navgrah Havan. 9-inch diameter with Om and Swastik engraving. Handcrafted in Vrindavan. Weight: 1.2 kg.',
 'physical', 1499, 1199, '[]', 30, true),

('Brass Havan Kund — Large (12 inch)',
 'brass-havan-kund-large',
 'Heavy-duty brass havan kund for large ceremonies and yagyas. 12-inch diameter, 3mm thick walls, detachable folding stand. Temple quality. Weight: 2.5 kg.',
 'physical', 2499, 1999, '[]', 20, true),

('Havan Samagri Mix — 1 kg (21 Sacred Herbs)',
 'havan-samagri-1kg-21herbs',
 'Premium havan samagri made from 21 sacred herbs including guggul, loban, ashwagandha, camphor, dried flowers, cow ghee soaked rice, and more. Purifies air and creates positive vibrations. Prepared in our Haridwar ashram.',
 'physical', 299, 249, '[]', 200, true),

('Copper Havan Chammach Set — Sruk, Sruva & Jhara (3 pcs)',
 'copper-havan-chammach-set-3pcs',
 'Traditional copper havan spoon set of 3 pieces — Sruk (large offering ladle), Sruva (small ladle), and Jhara (perforated strainer spoon). Essential for authentic Vedic havans. Handcrafted pure copper.',
 'physical', 599, 449, '[]', 75, true),

('Copper Puja Chammach — Single Ladle',
 'copper-puja-chammach-single',
 'Single pure copper puja ladle for daily ritual use. Used for offering ghee, water, and pancha-gavya during puja. 10-inch length, thick gauge food-safe copper.',
 'physical', 199, null, '[]', 150, true),

('Havan Kund Iron Stand — Adjustable Height',
 'havan-kund-iron-stand-adjustable',
 'Heavy-duty adjustable iron stand for havan kund. Height adjustable from 6 to 14 inches. Holds up to 15 kg. Rust-resistant black coating. Folds flat for storage.',
 'physical', 699, null, '[]', 40, true),

('Agni Patra — Sacred Copper Fire Container',
 'agni-patra-copper-fire-container',
 'Sacred copper agni patra used for holding consecrated fire during yagyas and rituals. Engraved with the Gayatri mantra on all four sides. 4-inch diameter, thick base.',
 'physical', 349, null, '[]', 60, true),

-- ════ YANTRAS (8) ════
('Shri Yantra — Copper Plate, 6 inch (Energised)',
 'shri-yantra-copper-plate-6inch',
 'Authentic Shri Yantra precisely etched on pure copper plate. 6-inch square, energised with Lalita Sahasranama puja in our Haridwar ashram on an auspicious Purnima. Comes with placement guidance card and mantra booklet.',
 'yantra', 699, 549, '[]', 100, true),

('Shri Yantra — 3D Sphatik Crystal Meru',
 'shri-yantra-3d-sphatik-meru',
 'Rare 3D Shri Yantra in Meru form carved from natural Sphatik (crystal quartz). 2.5 inches tall, no inclusions, naturally self-energised. Brings Lakshmi''s blessings of wealth and abundance.',
 'yantra', 2499, 1999, '[]', 25, true),

('Kuber Yantra — Pure Copper, 4 inch',
 'kuber-yantra-copper-4inch',
 'Kuber Yantra finely engraved on pure copper plate. Lord Kuber is the celestial treasurer. Place in the North direction of home or inside office locker for financial growth and abundance.',
 'yantra', 549, null, '[]', 80, true),

('Vastu Dosh Nivaran Yantra',
 'vastu-dosh-nivaran-yantra',
 'Powerful yantra for correcting Vastu defects without any structural changes. Engraved on pure copper with 9-planetary grid and 81-square Vastu mandala. Effective for south-facing entrances, cut corners, and geopathic stress.',
 'yantra', 799, 649, '[]', 60, true),

('Vyapaar Vridhi Yantra — Business Prosperity',
 'vyapaar-vridhi-yantra-business',
 'Sacred yantra for attracting new business, customers, and removing obstacles in commerce. Copper-etched with Goddess Mahalakshmi and Mercury yantra. Energised on a Wednesday. Place facing cash counter.',
 'yantra', 899, 699, '[]', 50, true),

('Surya Yantra — Pure Copper, 4 inch',
 'surya-yantra-copper-4inch',
 'Sun Yantra for improving vitality, career success, confidence, and father relationships. Energised on Ratha Saptami (solar holiday). Place facing East in your puja room or worship daily at sunrise.',
 'yantra', 549, null, '[]', 70, true),

('Navgraha Yantra Set — 9 Planetary Yantras',
 'navgraha-yantra-set-9pcs',
 'Complete set of 9 copper yantras — one for each Vedic planet (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu). Each individually energised with the corresponding planet''s beej mantra. Comes in a decorative wooden tray.',
 'yantra', 1999, 1499, '[]', 30, true),

('Maha Mrityunjaya Yantra — Shiva Protection',
 'maha-mrityunjaya-yantra',
 'Powerful Shiva yantra for health protection, longevity, and overcoming fear of disease and untimely death. Engraved with the full Maha Mrityunjaya mantra on pure copper. Energised with 1,08,000 mantra japa in Kashi.',
 'yantra', 799, null, '[]', 50, true),

-- ════ RUDRAKSHA (6) ════
('5-Mukhi Rudraksha Mala — Java, 108 Beads',
 'panchmukhi-rudraksha-mala-java-108',
 'Authentic 5-mukhi (5-faced) rudraksha mala from Java, Indonesia. 108+1 beads, 8mm size. Panchmukhi represents Lord Shiva and bestows peace, wisdom, and freedom from sin. Lab-tested authenticity certificate included.',
 'gemstone', 499, 399, '[]', 100, true),

('5-Mukhi Rudraksha Mala — Nepal, 108 Beads (Large)',
 'panchmukhi-rudraksha-mala-nepal-108',
 'Premium large-bead 5-mukhi rudraksha mala from Nepal. 108+1 beads, 12-14mm size — far more potent than Java variety. Energised at Pashupatinath temple. Includes certificate of authenticity and care guide.',
 'gemstone', 1299, 999, '[]', 50, true),

('7-Mukhi Rudraksha — Single Bead, Nepal',
 'saptamukhi-rudraksha-single-nepal',
 'Rare 7-mukhi rudraksha from Nepal representing the seven Matrashakti goddesses and planet Saturn. Removes chronic illness, poverty, and obstacles. X-ray tested and lab certified. Includes silver capping for pendant use.',
 'gemstone', 899, null, '[]', 30, true),

('Gauri Shankar Rudraksha — Naturally Joined Pair, Nepal',
 'gauri-shankar-rudraksha-pair-nepal',
 'Extremely sacred Gauri Shankar rudraksha — two naturally joined beads representing the divine union of Shiva (Shankar) and Parvati (Gauri). Blesses marriage, conjugal harmony, and family. Lab certified Nepal origin.',
 'gemstone', 1499, 1199, '[]', 15, true),

('1-Mukhi Rudraksha — Single Face, Java',
 'ekamukhi-rudraksha-java',
 '1-mukhi Java rudraksha representing the formless Supreme (Nirguna Brahman). Bestows liberation, deep meditation, and removal of all karmic debts. Extremely powerful. Includes energisation certificate.',
 'gemstone', 1999, 1499, '[]', 20, true),

('12-Mukhi Rudraksha Bracelet — Sun Energy',
 'dwadash-mukhi-rudraksha-bracelet',
 '12-faced rudraksha bracelet representing Surya (Sun god) and Lord Vishnu. Brings leadership, confidence, career success, and cures skin disorders. 12 beads on elastic gold-plated wire. Wear on right wrist.',
 'gemstone', 1299, null, '[]', 35, true),

-- ════ GEMSTONES (6) ════
('Neelam — Blue Sapphire, Ceylon, 5+ ct',
 'neelam-blue-sapphire-ceylon-5ct',
 'Certified natural Blue Sapphire (Neelam) from Ceylon (Sri Lanka). 5+ carats, heated, vivid medium blue. Gemstone for planet Saturn — worn for discipline, career, and longevity. IGI lab report included. Set in 92.5 sterling silver adjustable ring.',
 'gemstone', 8999, 6999, '[]', 10, true),

('Panna — Emerald, Zambian, 5+ ct',
 'panna-emerald-zambian-5ct',
 'Natural Zambian Emerald (Panna) for Mercury. 5+ carats, minor inclusions, lush grass green. Worn for intelligence, communication skills, and business success. IGI certified. Delivered in sterling silver ring.',
 'gemstone', 7999, 5999, '[]', 10, true),

('Pukhraj — Yellow Sapphire, Ceylon, 5+ ct',
 'pukhraj-yellow-sapphire-ceylon-5ct',
 'Premium Ceylon Yellow Sapphire (Pukhraj) for planet Jupiter. 5+ carats, canary yellow, eye clean. Blesses wisdom, higher education, wealth, marriage prospects, and children. IGI lab certified. Set in sterling silver.',
 'gemstone', 9999, 7499, '[]', 10, true),

('Moonga — Red Coral, Italian, 8+ ct',
 'moonga-red-coral-italian-8ct',
 'Natural deep red Coral (Moonga) for planet Mars. 8+ carats, oxblood grade Italian coral. Improves courage, physical strength, and career in competitive fields. Lab certified. Delivered in copper ring.',
 'gemstone', 3999, 2999, '[]', 15, true),

('Gomed — Hessonite Garnet, Ceylon, 7+ ct',
 'gomed-hessonite-garnet-ceylon-7ct',
 'Natural Hessonite Garnet (Gomed) for Rahu. 7+ carats, honey-cinnamon colour, excellent clarity. Removes Rahu doshas, phobias, confusion, and karmic blockages. IGI lab report included. Set in sterling silver.',
 'gemstone', 2499, null, '[]', 20, true),

('Manik — Ruby, Mozambique, 4+ ct',
 'manik-ruby-mozambique-4ct',
 'Natural Mozambique Ruby (Manik) for the Sun. 4+ carats, pigeon-blood red, minor inclusions. Blesses leadership, self-confidence, government favor, and royal treatment. IGI certified. Delivered in gold-plated silver ring.',
 'gemstone', 12999, null, '[]', 8, true),

-- ════ COPPER / BRASS VESSELS (8) ════
('Copper Lota — Pure Copper, 500 ml',
 'copper-lota-pure-500ml',
 'Traditional pure copper lota for morning water ritual (Tamba Jal). 500 ml, food-grade copper, hand-hammered matte finish. Storing water overnight in copper naturally purifies it per Ayurveda and inhibits bacteria.',
 'physical', 349, 279, '[]', 200, true),

('Copper Water Jug — 2 Litre with Lid',
 'copper-water-jug-2litre-lid',
 'Large pure copper water jug with matching lid for storing drinking water. 2-litre capacity, thick-gauge food-safe copper, leak-proof lid. Infuses water with copper ions for Ayurvedic immune benefits.',
 'physical', 899, 699, '[]', 100, true),

('Panchadhatu Puja Thali Set — 7 Items',
 'panchadhatu-puja-thali-set-7items',
 'Complete puja thali set crafted in Panchadhatu (5-metal alloy of gold, silver, copper, zinc, iron). Includes: decorated thali, katori (bowl), ghee diya, kalash, hand bell, agarbatti holder, and aarti lamp. Temple quality craftsmanship.',
 'physical', 1299, 999, '[]', 60, true),

('Brass Diya Set — 12 Oil Lamps',
 'brass-diya-set-12pcs',
 'Set of 12 traditional brass diyas for puja, Diwali, and festivals. Long-lasting thick brass, 2.5-inch diameter. Perfect for ghee or sesame oil. Brings warmth and divine light to your sacred space.',
 'physical', 399, 299, '[]', 150, true),

('Brass Temple Bell — 6 inch, Engraved',
 'brass-temple-bell-6inch-engraved',
 'Heavy brass temple bell with Om and Swastik engravings on dome. 6-inch height, melodious sustained tone. Ringing during puja clears negative energy, alerts deities, and marks sacred time. Includes hanging rope.',
 'physical', 599, 449, '[]', 80, true),

('Copper Mangal Kalash — with Lid, 1 Litre',
 'copper-mangal-kalash-with-lid-1l',
 'Auspicious copper mangal kalash (pot) with matching lid, used in all sacred rituals — housewarmings, weddings, yagyas. 1-litre capacity, pure copper with engraved mango leaf design. Essential in Vastu Shanti ceremonies.',
 'physical', 599, null, '[]', 100, true),

('Panchamrit Pot Set — 5 Copper Bowls',
 'panchamrit-pot-set-copper-5pcs',
 'Set of 5 small pure copper bowls for offering Panchamrit (milk, curd, honey, ghee, and sugar water) during abhishek. Each bowl 50 ml. Complete set for daily Shivling or idol abhishek puja.',
 'physical', 799, null, '[]', 70, true),

('Brass Agarbatti Stand — Lotus Engraved',
 'brass-agarbatti-stand-lotus',
 'Elegant brass incense stick (agarbatti) holder with large ash-catcher tray. Holds up to 10 sticks simultaneously. Intricate lotus flower engraving. Easy to clean. 8-inch length tray.',
 'physical', 249, null, '[]', 200, true),

-- ════ IDOLS (4) ════
('Panchadhatu Ganesh Idol — Sitting, 4 inch',
 'panchadhatu-ganesh-idol-sitting-4inch',
 'Beautifully crafted Lord Ganesh idol in Panchadhatu (5-metal alloy). 4-inch sitting Lalitasana posture, intricate trunk and jewellery detailing. Energised with Ganesh Atharvashirsha puja. Place at home entrance or puja room.',
 'physical', 799, 649, '[]', 80, true),

('Brass Lakshmi Idol — Standing on Lotus, 6 inch',
 'brass-lakshmi-idol-standing-lotus-6inch',
 'Pure brass Goddess Mahalakshmi idol in traditional standing-on-pink-lotus posture with Abhaya and Varada mudras. 6-inch height, antique gold-tone finish. Place in North-East corner or puja room for wealth and abundance.',
 'physical', 1199, 999, '[]', 60, true),

('Brass Shiva Lingam with Yoni Tray',
 'brass-shiva-lingam-with-yoni-tray',
 'Traditional brass Shiva Lingam on Yoni peetha base. 3-inch lingam, 5-inch tray. Used for daily Panchamrit and Gangajal Abhishek, Bel patra offering. Represents cosmic consciousness and liberation (Moksha).',
 'physical', 899, 699, '[]', 70, true),

('Sphatik (Crystal Quartz) Shivling',
 'sphatik-crystal-quartz-shivling',
 'Natural crystal quartz Shivling from Brazil — no inclusions, exceptional clarity. 2-inch diameter. Self-energised by nature. The coolness of Sphatik represents Shiva''s transcendental nature. Highly auspicious.',
 'physical', 1499, null, '[]', 25, true),

-- ════ PUJA ESSENTIALS (5) ════
('Gangajal — Original Ganga Water, 1 Litre (Sealed)',
 'gangajal-original-ganga-1litre',
 'Certified original Gangajal sourced directly from Har Ki Pauri, Haridwar by our priests. 1-litre in food-grade PET bottle, sealed and dated. Used for puja, abhishek, Vastu Shanti, and spiritual water. Does not expire.',
 'physical', 299, null, '[]', 300, true),

('A2 Gir Cow Ghee — Bilona Method, 500 g',
 'a2-gir-cow-ghee-bilona-500g',
 'Pure A2 Gir cow ghee prepared using the traditional Vedic bilona (hand-churning) method from curd. FSSAI certified. Used in havan, puja offerings, and Ayurvedic diet. Rich in CLA, butyric acid, and fat-soluble vitamins.',
 'herbal', 699, 599, '[]', 150, true),

('Puja Kit — Kumkum, Sindoor, Haldi & Chandan',
 'puja-kit-kumkum-sindoor-haldi-chandan',
 'Complete all-natural puja essentials kit: pure kumkum (50 g), natural sindoor (25 g), turmeric powder (100 g), and Mysore sandalwood paste (25 g). No synthetic dyes or chemicals. Ready for daily use.',
 'physical', 449, null, '[]', 200, true),

('Pure Camphor Tablets — Kapur, 250 g',
 'pure-camphor-tablets-kapur-250g',
 'Food-grade pure camphor (Kapur) tablets for puja aarti and havan offerings. 250 g pack with resealable zipper. Clears negative energy, purifies indoor air, and has proven anti-bacterial properties.',
 'physical', 149, null, '[]', 500, true),

('Organic Black Sesame — Kala Til, 500 g',
 'organic-black-sesame-kala-til-500g',
 'Certified organic black sesame (Kala Til) seeds for Saturn (Shani) puja, Shani Amavasya rituals, and tarpan offerings to ancestors. 500 g. Also used in Ayurvedic therapy for hair and skin.',
 'herbal', 179, null, '[]', 300, true),

-- ════ INCENSE & DHOOP (4) ════
('Natural Sandalwood Agarbatti — 100 Sticks',
 'natural-sandalwood-agarbatti-100sticks',
 'Hand-rolled natural sandalwood incense sticks with no charcoal base or synthetic fragrances. Pure sandalwood powder and binding agent only. 100 sticks per pack. Burns ~45 minutes each. Ideal for meditation, puja, and yoga.',
 'physical', 179, null, '[]', 400, true),

('Loban Dhoop — Pure Frankincense Resin, 100 g',
 'loban-dhoop-pure-frankincense-100g',
 'Pure Loban (Frankincense/Benzoin) resin chunks for dhoop. Powerfully purifies spaces, dispels negative energies, and creates a deeply sacred atmosphere. 100 g. Burn on charcoal disc or electric dhoop burner.',
 'physical', 149, null, '[]', 300, true),

('Guggul Dhoop — Pure Resin, 100 g',
 'guggul-dhoop-pure-resin-100g',
 'Authentic Guggul (Commiphora wightii) resin — the king of dhoop. Used in Navgraha havan and healing rituals. 100 g. Scientifically proven to reduce airborne bacteria. Mentioned in Charaka Samhita for its medicinal properties.',
 'herbal', 179, null, '[]', 250, true),

('Cow Dung Dhoop Batti — 108 Sacred Sticks',
 'cow-dung-dhoop-batti-108sticks',
 'Pure sacred Gir cow dung dhoop batti (incense sticks) with no synthetic additives. 108 sticks per pack. Research shows cow dung smoke reduces airborne bacteria by 94%. Used for Vastu Shanti and space purification.',
 'physical', 249, null, '[]', 300, true),

-- ════ MALAS & PRAYER BEADS (3) ════
('Tulsi Mala — 108 Beads, Vrindavan',
 'tulsi-mala-108-beads-vrindavan',
 'Authentic Vrindavan Tulsi (Holy Basil) japa mala. 108+1 beads, 8mm size, brown-black colour. Sacred to Lord Vishnu and Krishna. Worn for devotion, protection from negativity, and spiritual progress. Energised in Vrindavan.',
 'physical', 199, null, '[]', 200, true),

('Sphatik (Crystal Quartz) Japa Mala — 108 Beads',
 'sphatik-crystal-japa-mala-108-beads',
 'Natural crystal quartz japa mala for meditation. 108+1 clear quartz beads, 8mm, transparent clarity. Used for Saraswati, Shiva, Devi, and healing mantras. Amplifies intention and keeps the mind clear during japa.',
 'gemstone', 699, 549, '[]', 100, true),

('Chandan (Sandalwood) Mala — 108 Beads, Old Mysore',
 'chandan-sandalwood-mala-108-beads',
 'Authentic Old Mysore sandalwood japa mala. 108+1 beads, 8mm, naturally fragrant. Used for Vishnu, Shiva, and healing mantras. Rare genuine Mysore sandalwood. CITES certified. Keeps cool and fragrant for years.',
 'physical', 399, null, '[]', 50, true),

-- ════ VASTU REMEDIES (2) ════
('Copper Vastu Pyramid Set — 9 Pieces',
 'copper-vastu-pyramid-set-9pcs',
 'Set of 9 pure copper pyramids for correcting Vastu doshas in all 8 directions plus centre. Each pyramid individually energised with Vastu mantras. Place at corners, cardinal points, and centre of home or office floor.',
 'yantra', 999, 799, '[]', 80, true),

('Vastu Dosh Nivaran Complete Kit',
 'vastu-dosh-nivaran-complete-kit',
 'All-in-one Vastu correction kit: 9 copper pyramids + Vastu yantra copper plate + Tortoise figurine (Panchadhatu) + Himalayan sea salt (500g) + camphor pack + complete Vastu remedy booklet. Corrects all major doshas.',
 'physical', 1499, null, '[]', 40, true),

-- ════ AYURVEDIC HERBS (3) ════
('Ashwagandha Churna — Certified Organic, 100 g',
 'ashwagandha-churna-organic-100g',
 'Certified organic Ashwagandha (Withania somnifera) root powder. USDA Organic + FSSAI certified. Adaptogen for stress reduction, improved strength, better sleep, and hormonal balance. Take 1 tsp with warm milk at bedtime.',
 'herbal', 299, null, '[]', 200, true),

('Brahmi Churna — Memory & Brain Health, 100 g',
 'brahmi-churna-memory-brain-100g',
 'Pure Brahmi (Bacopa monnieri) leaf powder for brain health, memory, and anxiety reduction. Classical Ayurvedic nervine tonic. FSSAI certified. Mix with warm milk or honey. Excellent for students and professionals.',
 'herbal', 249, null, '[]', 150, true),

('Shatavari Churna — Women''s Wellness, 100 g',
 'shatavari-churna-womens-wellness-100g',
 'Premium Shatavari (Asparagus racemosus) root powder for women''s hormonal balance, fertility support, and immune strength. Mentioned in Charaka Samhita as a Rasayana herb. FSSAI certified Ayurvedic supplement.',
 'herbal', 279, null, '[]', 150, true)

ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  price       = EXCLUDED.price,
  sale_price  = EXCLUDED.sale_price,
  stock_count = EXCLUDED.stock_count,
  is_active   = EXCLUDED.is_active;

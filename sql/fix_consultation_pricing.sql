-- ═══════════════════════════════════════════════════════════════════════════
-- Consultation pricing — data migration
--
-- MUST be run together with the consultation pricing code change, and BEFORE
-- the new booking page goes live.
--
-- Why this exists
-- ---------------
-- The old admin panel wrote `parseFloat(priceField) || 0`, so leaving the
-- price box empty stored **0**, not "unset". The old booking API then read
-- `slot.price || 11000`, so a stored 0 fell through to ₹11,000 — the seeker
-- saw "Complimentary" and was charged ₹11,000.
--
-- The new code fixes that by honouring 0 as genuinely free and using NULL to
-- mean "inherit the specialization default". Without this migration, every
-- historical slot that has price = 0 (because the admin left the box blank)
-- would suddenly become an actually-free consultation.
--
-- So: convert the legacy 0 rows to NULL, which restores the admin's real
-- intent (charge the standard price) rather than the accidental 0.
--
-- Slots that are already booked are left untouched — their price is a record
-- of what was charged and must not be rewritten.
--
-- Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- How many rows this will touch (shows in the Supabase SQL editor output).
SELECT count(*) AS legacy_zero_price_slots
FROM consultation_slots
WHERE price = 0 AND is_booked = false;

UPDATE consultation_slots
SET price = NULL
WHERE price = 0
  AND is_booked = false;

COMMIT;

-- ── Seed the default price map ─────────────────────────────────────────────
-- The booking API falls back to these same numbers in code, so this row is
-- optional. Inserting it makes the values visible and editable in the admin
-- panel's Pricing tab straight away.
INSERT INTO settings (key, value, updated_at)
VALUES (
  'consultation_pricing',
  '{
     "Astrology": 11000,
     "Numerology": 11000,
     "Vastu": 21000,
     "Astro Vastu": 35000,
     "Ayurveda": 11000,
     "Tarot": 11000,
     "Meditation": 11000
   }'::jsonb,
  now()
)
ON CONFLICT (key) DO NOTHING;   -- never clobber prices an admin already set

-- ── Verify ─────────────────────────────────────────────────────────────────
-- NULL price  = inherits the specialization default (normal paid slot)
-- 0           = deliberately free
-- > 0         = per-slot override
SELECT
  COALESCE(specialization, 'Astrology') AS specialization,
  count(*) FILTER (WHERE price IS NULL) AS inherits_default,
  count(*) FILTER (WHERE price = 0)     AS free_slots,
  count(*) FILTER (WHERE price > 0)     AS overridden
FROM consultation_slots
GROUP BY 1
ORDER BY 1;

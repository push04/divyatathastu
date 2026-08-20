-- ═══════════════════════════════════════════════════════════════════════════
-- RLS gap fixes — found by probing the live database with the PUBLIC anon key
--
-- The anon key ships inside the client bundle, so anything it can reach is
-- reachable by anyone on the internet. Three gaps were confirmed by actually
-- performing the operations (and reverting them):
--
--   1. `settings`  — RLS was never enabled. Anonymous INSERT, UPDATE and DELETE
--                    all returned 2xx. This table holds `report_pricing` and
--                    `consultation_pricing`, so an attacker could set every
--                    price to zero, or delete pricing outright.  ← CRITICAL
--   2. `coupons`   — every coupon was readable anonymously, including a
--                    personal single-use review-reward coupon belonging to a
--                    specific user, which a stranger could then redeem.
--   3. `event_registrations` — INSERT is `WITH CHECK (true)`, unbounded.
--
-- Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. settings: pricing must be world-readable but admin-only writable ────
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings public read" ON public.settings;
CREATE POLICY "settings public read" ON public.settings
  FOR SELECT USING (true);

-- Deliberately split per-command rather than FOR ALL: a single FOR ALL policy
-- would also govern SELECT and silently drop the public read above.
DROP POLICY IF EXISTS "settings admin insert" ON public.settings;
CREATE POLICY "settings admin insert" ON public.settings
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "settings admin update" ON public.settings;
CREATE POLICY "settings admin update" ON public.settings
  FOR UPDATE USING (public.get_my_role() = 'admin')
          WITH CHECK (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "settings admin delete" ON public.settings;
CREATE POLICY "settings admin delete" ON public.settings
  FOR DELETE USING (public.get_my_role() = 'admin');


-- ── 2. coupons: one correct policy, not two that OR into a leak ────────────
-- `coupons_public_read` was `USING (is_active = true)`, which exposed active
-- PERSONAL coupons. The "coupons read" policy added alongside it exposed every
-- inactive marketing code, because RLS policies are OR'd - a permissive policy
-- can never be narrowed by adding a stricter one next to it. Both are replaced
-- by a single policy that requires the coupon to be genuinely public.
DROP POLICY IF EXISTS "coupons_public_read" ON public.coupons;
DROP POLICY IF EXISTS "coupons read" ON public.coupons;
CREATE POLICY "coupons read" ON public.coupons
  FOR SELECT USING (
    (user_id IS NULL AND is_active = true)   -- public promo, currently live
    OR auth.uid() = user_id                  -- the owner's own personal coupon
  );


-- ── 3. event_registrations: keep public signup, stop unbounded junk ────────
-- Registration must work for logged-out visitors, so this stays open - but a
-- row with no event and no contact details is never a real registration.
DROP POLICY IF EXISTS "event_reg_public_insert" ON public.event_registrations;
CREATE POLICY "event_reg_public_insert" ON public.event_registrations
  FOR INSERT WITH CHECK (
    event_id IS NOT NULL
    AND (user_id IS NOT NULL OR (email IS NOT NULL AND length(trim(email)) > 3))
  );

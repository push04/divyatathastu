-- ═══════════════════════════════════════════════════════════════════════════
-- Reviews, referrals and reward credits
--
-- Adds three things:
--   1. reviews            - logged-in users review a service they used.
--                           Each approved review earns a personal 10% coupon.
--   2. referrals          - every profile gets a referral code. 10 completed
--                           referrals earn one free Full Tathastu report.
--   3. report_credits     - the redeemable "one free report" entitlement.
--
-- Also extends `coupons` so a coupon can belong to a single user, which the
-- existing platform-wide coupon table could not express.
--
-- Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Per-user coupons ────────────────────────────────────────────────────
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS source      text;      -- 'review' | 'referral' | 'manual'
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS description text;

CREATE INDEX IF NOT EXISTS coupons_user_id_idx ON public.coupons(user_id);

COMMENT ON COLUMN public.coupons.user_id IS
  'NULL = public coupon anyone may use. Set = personal coupon, redeemable only by this user.';


-- ── 2. Reviews ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- References profiles, NOT auth.users. PostgREST can only embed
  -- `profiles:user_id(full_name)` when the foreign key points at profiles,
  -- and every other table in this schema follows the same convention.
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- What is being reviewed. `subject_type` keeps this table usable for
  -- reports, services, courses, consultations and products alike.
  subject_type   text NOT NULL CHECK (subject_type IN ('report','service','course','consultation','product','ebook','platform')),
  subject_id     text,                       -- slug or uuid of the thing reviewed
  subject_label  text NOT NULL,              -- human-readable name, denormalised for display

  rating         smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title          text,
  body           text NOT NULL CHECK (char_length(btrim(body)) >= 30),

  -- Moderated before it appears publicly.
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note     text,

  -- The 10% coupon issued for this review, if any. One reward per review.
  reward_coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
  rewarded_at    timestamptz,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- One review per user per subject: stops someone farming coupons by
-- reviewing the same thing repeatedly.
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_subject_uniq
  ON public.reviews(user_id, subject_type, COALESCE(subject_id, ''));

CREATE INDEX IF NOT EXISTS reviews_status_created_idx ON public.reviews(status, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_user_idx           ON public.reviews(user_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews public read approved" ON public.reviews;
CREATE POLICY "reviews public read approved" ON public.reviews
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "reviews owner read own" ON public.reviews;
CREATE POLICY "reviews owner read own" ON public.reviews
  FOR SELECT USING (auth.uid() = user_id);

-- Only logged-in users may write, and only as themselves.
DROP POLICY IF EXISTS "reviews owner insert" ON public.reviews;
CREATE POLICY "reviews owner insert" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews owner update own pending" ON public.reviews;
CREATE POLICY "reviews owner update own pending" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "reviews admin all" ON public.reviews;
CREATE POLICY "reviews admin all" ON public.reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );


-- ── 3. Referrals ───────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_uniq
  ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.referrals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL,

  -- 'pending'  - signed up, not yet counted (e.g. email unverified)
  -- 'complete' - counts toward the 10
  status        text NOT NULL DEFAULT 'complete' CHECK (status IN ('pending','complete','void')),

  created_at    timestamptz NOT NULL DEFAULT now(),

  -- A person can only ever be referred once, by one person.
  CONSTRAINT referrals_referred_uniq UNIQUE (referred_id),
  -- And nobody refers themselves.
  CONSTRAINT referrals_no_self CHECK (referrer_id <> referred_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals(referrer_id, status);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals read own" ON public.referrals;
CREATE POLICY "referrals read own" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "referrals admin all" ON public.referrals;
CREATE POLICY "referrals admin all" ON public.referrals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );


-- ── 4. Report credits (the free-report reward) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.report_credits (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- What the credit buys. 'full_tathastu' = the complete report set for ONE
  -- family member, which is the referral reward.
  credit_type      text NOT NULL DEFAULT 'full_tathastu',
  source           text NOT NULL DEFAULT 'referral',   -- 'referral' | 'manual' | 'promo'

  -- Redemption
  is_redeemed      boolean NOT NULL DEFAULT false,
  redeemed_at      timestamptz,
  redeemed_for_member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  redeemed_report_id     uuid,

  note             text,
  expires_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_credits_user_idx ON public.report_credits(user_id, is_redeemed);

ALTER TABLE public.report_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credits read own" ON public.report_credits;
CREATE POLICY "credits read own" ON public.report_credits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "credits admin all" ON public.report_credits;
CREATE POLICY "credits admin all" ON public.report_credits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );


-- ── 5. Referral code generation ────────────────────────────────────────────
-- Short, unambiguous alphabet (no 0/O/1/I) so codes survive being read aloud
-- or copied off a screenshot.
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet CONSTANT text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..8 LOOP
      candidate := candidate || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

-- Backfill existing profiles.
UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;

-- And give every new profile one automatically.
CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_referral_code ON public.profiles;
CREATE TRIGGER profiles_set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_referral_code();


-- ── 6. Award a free report at every 10th completed referral ────────────────
-- Runs inside the referral insert, so the reward cannot be missed or double
-- granted: the count of credits already issued is compared against the count
-- of milestones earned.
CREATE OR REPLACE FUNCTION public.award_referral_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  completed_count int;
  earned          int;
  already         int;
BEGIN
  SELECT count(*) INTO completed_count
  FROM public.referrals
  WHERE referrer_id = NEW.referrer_id AND status = 'complete';

  earned := completed_count / 10;             -- one free report per 10 friends

  SELECT count(*) INTO already
  FROM public.report_credits
  WHERE user_id = NEW.referrer_id AND source = 'referral';

  WHILE already < earned LOOP
    INSERT INTO public.report_credits (user_id, credit_type, source, note)
    VALUES (
      NEW.referrer_id,
      'full_tathastu',
      'referral',
      format('Earned for referring %s friends', (already + 1) * 10)
    );
    already := already + 1;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referrals_award_milestone ON public.referrals;
CREATE TRIGGER referrals_award_milestone
  AFTER INSERT OR UPDATE OF status ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.award_referral_milestone();


-- ── 7. Coupon read policy for personal coupons ─────────────────────────────
-- Public coupons stay readable by everyone; personal ones only by their owner.
DROP POLICY IF EXISTS "coupons read" ON public.coupons;
CREATE POLICY "coupons read" ON public.coupons
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

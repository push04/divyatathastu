-- ═══════════════════════════════════════════════════════════════════════════
-- Harden referral-code generation
--
-- As shipped in reviews_and_referrals.sql, generate_referral_code() and
-- set_referral_code() were plain (INVOKER) functions with no fixed search_path.
-- Two consequences:
--
--   1. The uniqueness check `SELECT 1 FROM public.profiles WHERE
--      referral_code = candidate` executes under the caller's RLS. Any caller
--      that cannot see all profile rows gets an empty result, concludes the
--      candidate is free, and inserts it. If that code is already taken the
--      insert then fails against profiles_referral_code_uniq, and because this
--      runs inside the auth signup transaction the user sees the opaque
--      "Database error saving new user".
--
--   2. The retry loop was unbounded, so a persistently failing check would spin
--      rather than surface an error.
--
-- Both functions are now SECURITY DEFINER with a pinned search_path, so the
-- check sees every row regardless of who is signing up, and the loop is bounded
-- with a widening fallback.
--
-- Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- No I, O, 0 or 1: these codes get read aloud and typed by hand.
  alphabet CONSTANT text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i         int;
  attempt   int := 0;
  code_len  int := 8;
BEGIN
  LOOP
    attempt := attempt + 1;

    -- After 20 collisions at a given length, widen rather than keep retrying.
    IF attempt % 20 = 0 THEN
      code_len := LEAST(code_len + 2, 16);
    END IF;

    candidate := '';
    FOR i IN 1..code_len LOOP
      candidate := candidate || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
    END LOOP;

    -- SECURITY DEFINER means this sees every profile, so the check is real.
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = candidate
    );

    IF attempt >= 100 THEN
      RAISE EXCEPTION 'generate_referral_code: no free code after % attempts', attempt;
    END IF;
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Signup must not fail because the referral extra could not be computed. The
-- code is a convenience, not a prerequisite for having an account: if anything
-- here raises, leave it NULL and let the profile be created.
CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    BEGIN
      NEW.referral_code := public.generate_referral_code();
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'set_referral_code: leaving referral_code NULL (%)', SQLERRM;
      NEW.referral_code := NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_referral_code ON public.profiles;
CREATE TRIGGER profiles_set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_referral_code();

-- Backfill anything the old path left empty.
UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;

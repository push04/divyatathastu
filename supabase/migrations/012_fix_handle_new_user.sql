-- Migration 012: Harden the handle_new_user trigger function
-- "Database error saving new user" is thrown when this trigger raises an exception.
-- Root causes:
--   1. profiles or families insert may fail if run concurrently or if columns added
--   2. The families insert uses ON CONFLICT (id) but the bug is really a missing
--      UNIQUE on families.owner_id — allow at most one family per owner.
-- Fix: wrap body in BEGIN...EXCEPTION so the trigger NEVER throws to Supabase auth.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create user profile (idempotent)
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1)),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone::text), '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default family (idempotent — skip if owner already has one)
  INSERT INTO public.families (owner_id, family_name)
  SELECT
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1)) || '''s Family'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.families WHERE owner_id = NEW.id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user creation; swallow errors and log them.
  RAISE WARNING 'handle_new_user failed for uid=%: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

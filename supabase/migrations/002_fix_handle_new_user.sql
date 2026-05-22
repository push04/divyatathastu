-- Fix handle_new_user trigger
-- Problem: NEW.phone is NULL for email signups (phone lives in raw_user_meta_data)
-- Problem: no ON CONFLICT guard causes PK violation if trigger fires twice
-- Problem: SECURITY DEFINER without SET search_path fails to resolve public tables in Supabase
-- Run this in: https://supabase.com/dashboard/project/yknbedtbtsgnwiffpfnz/sql

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone::text), '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.families (owner_id, family_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Family'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Fix handle_new_user trigger
-- Problem: NEW.phone is NULL for email signups (phone lives in raw_user_meta_data)
-- Problem: no ON CONFLICT guard causes PK violation if trigger fires twice
-- Run this in: https://supabase.com/dashboard/project/yknbedtbtsgnwiffpfnz/sql

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone::text), '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO families (owner_id, family_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Family'
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- MIGRATION 014 — Fix event_registrations for public event booking
-- =============================================
-- The original event_registrations table only had (event_id UUID FK, user_id, status, registered_at).
-- Event registration is public (no login needed), so we need name/email/phone columns
-- and event_id must be TEXT to support both static IDs and real UUID events.
-- =============================================

-- 1. Drop the UUID FK constraint on event_id so we can change its type
ALTER TABLE public.event_registrations
  DROP CONSTRAINT IF EXISTS event_registrations_event_id_fkey;

-- 2. Change event_id column from UUID to TEXT
ALTER TABLE public.event_registrations
  ALTER COLUMN event_id TYPE TEXT USING event_id::TEXT;

-- 3. Make user_id nullable (public registrations won't have a user_id)
ALTER TABLE public.event_registrations
  ALTER COLUMN user_id DROP NOT NULL;

-- 4. Add missing columns for public registration
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS order_id TEXT;

-- 5. Update RLS policies
DROP POLICY IF EXISTS "event_reg_own" ON public.event_registrations;
DROP POLICY IF EXISTS "event_reg_public_insert" ON public.event_registrations;
DROP POLICY IF EXISTS "event_reg_admin" ON public.event_registrations;

-- Allow anyone to insert (public event registration)
CREATE POLICY "event_reg_public_insert" ON public.event_registrations
  FOR INSERT WITH CHECK (true);

-- Users can see their own registrations (by email or user_id)
CREATE POLICY "event_reg_own_read" ON public.event_registrations
  FOR SELECT USING (
    user_id = auth.uid()
    OR email = (SELECT email FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Admins can do everything
CREATE POLICY "event_reg_admin_all" ON public.event_registrations
  FOR ALL USING (public.get_my_role() = 'admin');

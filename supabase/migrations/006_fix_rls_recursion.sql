-- =============================================
-- MIGRATION 006 — Fix RLS infinite recursion
-- =============================================
-- Root cause: admin_all_profiles policy on the profiles table uses
--   (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
-- This subquery reads from profiles while evaluating profiles policies
-- → infinite recursion → error 42P17 on EVERY table that checks admin role.
--
-- Fix: security definer function bypasses RLS entirely when reading profiles.
-- All existing admin policies on OTHER tables continue to work unchanged.
-- =============================================

-- Step 1: Create a SECURITY DEFINER function to read the calling user's role
-- Runs as the function owner (postgres), bypasses RLS — no recursion possible.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Step 2: Fix the recursive policy on profiles
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (public.get_my_role() = 'admin');

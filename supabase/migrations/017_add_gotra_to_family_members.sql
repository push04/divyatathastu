-- Migration 017: Add gotra column to family_members
-- Gotra is displayed in Mantra Lekhnan (Likhit Japa) reports

ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS gotra TEXT;

-- Migration 011: Add 'failed' to reports status CHECK constraint
-- Reports that fail generation (e.g., kundli calculation error) are now marked
-- 'failed' rather than being silently left as 'pending'.

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_status_check
  CHECK (status IN ('pending','processing','generated','failed','reviewed','delivered'));

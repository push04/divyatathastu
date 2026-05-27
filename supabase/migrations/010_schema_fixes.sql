-- Migration 010: Schema fixes
-- Fixes column name mismatches, adds missing columns from migrations 008/009,
-- creates handwritten_report_requests table + storage bucket.
-- Every statement is idempotent — safe to re-run.

-- ── BLOG POSTS ────────────────────────────────────────────────────────────────
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS read_time INTEGER DEFAULT 5;

-- ── PRODUCTS ─────────────────────────────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured          BOOLEAN  DEFAULT false,
  ADD COLUMN IF NOT EXISTS ebook_file_url       TEXT,
  ADD COLUMN IF NOT EXISTS ebook_download_limit INTEGER  DEFAULT 3,
  ADD COLUMN IF NOT EXISTS physical             BOOLEAN  DEFAULT false;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE public.products ADD CONSTRAINT products_product_type_check
  CHECK (product_type IN (
    'report','ebook','consultation','yantra','gemstone',
    'physical','course','bundle','herbal'
  ));

-- ── ORDERS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS notes           TEXT;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending','paid','processing','shipped','delivered',
    'completed','refunded','cancelled'
  ));

-- ── REPORTS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ── EVENTS: rename columns to match page code ────────────────────────────────
-- Each rename is conditional so this is safe to re-run after columns are renamed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'event_type'
  ) THEN
    ALTER TABLE public.events RENAME COLUMN event_type TO type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'start_at'
  ) THEN
    ALTER TABLE public.events RENAME COLUMN start_at TO start_datetime;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'end_at'
  ) THEN
    ALTER TABLE public.events RENAME COLUMN end_at TO end_datetime;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.events RENAME COLUMN is_active TO is_published;
  END IF;
END $$;

-- Rebuild type CHECK with all values used across admin + public pages
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_event_type_check;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_type_check
  CHECK (type IN (
    'satsang','workshop','webinar','pilgrimage','puja','other',
    'yatra','consultation_camp','online','offline'
  ));

-- Make slug nullable if it exists (some installs created events without slug)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.events ALTER COLUMN slug DROP NOT NULL;
  END IF;
END $$;

-- Add columns used by public events page and admin save payload
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS start_date           DATE,
  ADD COLUMN IF NOT EXISTS start_time           TEXT          DEFAULT '10:00',
  ADD COLUMN IF NOT EXISTS duration_minutes     INTEGER       DEFAULT 60,
  ADD COLUMN IF NOT EXISTS max_participants     INTEGER       DEFAULT 100,
  ADD COLUMN IF NOT EXISTS current_participants INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category             TEXT          DEFAULT 'Spiritual',
  ADD COLUMN IF NOT EXISTS host                 TEXT,
  ADD COLUMN IF NOT EXISTS requirements         TEXT,
  ADD COLUMN IF NOT EXISTS includes             JSONB,
  ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ   DEFAULT NOW();

-- Backfill start_date from start_datetime for any existing rows
UPDATE public.events
  SET start_date = start_datetime::DATE
  WHERE start_date IS NULL AND start_datetime IS NOT NULL;

-- ── HANDWRITTEN REPORT REQUESTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.handwritten_report_requests (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        REFERENCES public.profiles(id)        ON DELETE CASCADE,
  family_member_id UUID        REFERENCES public.family_members(id)  ON DELETE SET NULL,
  report_type      TEXT        NOT NULL DEFAULT 'custom',
  description      TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','in_progress','completed','rejected')),
  file_url         TEXT,
  file_name        TEXT,
  admin_notes      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.handwritten_report_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'handwritten_report_requests' AND policyname = 'hrr_user_select'
  ) THEN
    CREATE POLICY "hrr_user_select" ON public.handwritten_report_requests
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'handwritten_report_requests' AND policyname = 'hrr_user_insert'
  ) THEN
    CREATE POLICY "hrr_user_insert" ON public.handwritten_report_requests
      FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'handwritten_report_requests' AND policyname = 'hrr_admin_all'
  ) THEN
    CREATE POLICY "hrr_admin_all" ON public.handwritten_report_requests
      FOR ALL TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      );
  END IF;
END $$;

-- ── STORAGE: handwritten-reports bucket ──────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'handwritten-reports', 'handwritten-reports', false, 52428800,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'handwritten_reports_admin_all'
  ) THEN
    CREATE POLICY "handwritten_reports_admin_all" ON storage.objects
      FOR ALL TO authenticated
      USING (
        bucket_id = 'handwritten-reports' AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      )
      WITH CHECK (
        bucket_id = 'handwritten-reports' AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'handwritten_reports_user_read'
  ) THEN
    CREATE POLICY "handwritten_reports_user_read" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'handwritten-reports');
  END IF;
END $$;

-- ── EBOOKS BUCKET (safe re-run from migration 008) ────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ebooks', 'ebooks', false, 52428800,
  ARRAY['application/pdf','application/epub+zip']
)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- Media & Gallery
--
-- Backs the public /gallery page and the homepage carousel. Two independent
-- toggles per item:
--   is_published  - show on the /gallery page at all
--   in_carousel   - additionally include in the homepage carousel
-- Nothing appears anywhere unless an admin explicitly turns it on, so a fresh
-- install renders no gallery section and no carousel.
--
-- Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Table ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text,
  caption       text,
  category      text NOT NULL DEFAULT 'general',
  image_url     text NOT NULL,
  storage_path  text,                       -- path inside the `gallery` bucket, for deletes
  alt_text      text,
  credit        text,                       -- photographer / source attribution
  taken_at      date,
  is_published  boolean NOT NULL DEFAULT false,
  in_carousel   boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  width         integer,
  height        integer,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS title         text,
  ADD COLUMN IF NOT EXISTS caption       text,
  ADD COLUMN IF NOT EXISTS category      text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS storage_path  text,
  ADD COLUMN IF NOT EXISTS alt_text      text,
  ADD COLUMN IF NOT EXISTS credit        text,
  ADD COLUMN IF NOT EXISTS taken_at      date,
  ADD COLUMN IF NOT EXISTS is_published  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS in_carousel   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS width         integer,
  ADD COLUMN IF NOT EXISTS height        integer,
  ADD COLUMN IF NOT EXISTS created_by    uuid;

-- Categories drive the filter chips on /gallery. Kept as a CHECK rather than an
-- enum so adding one later is a one-line change, not a type migration.
ALTER TABLE public.gallery_items DROP CONSTRAINT IF EXISTS gallery_items_category_check;
ALTER TABLE public.gallery_items ADD CONSTRAINT gallery_items_category_check
  CHECK (category IN ('general','events','temples','pujas','team','media','products','pilgrimage'));

-- ── Indexes ─────────────────────────────────────────────────────────────────
-- The two read paths are "published, ordered" and "carousel, ordered".
CREATE INDEX IF NOT EXISTS gallery_items_published_idx
  ON public.gallery_items (is_published, display_order, created_at DESC);
CREATE INDEX IF NOT EXISTS gallery_items_carousel_idx
  ON public.gallery_items (in_carousel, display_order)
  WHERE in_carousel;
CREATE INDEX IF NOT EXISTS gallery_items_category_idx
  ON public.gallery_items (category) WHERE is_published;

-- ── updated_at ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.gallery_items_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS gallery_items_set_updated_at ON public.gallery_items;
CREATE TRIGGER gallery_items_set_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.gallery_items_touch();

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Anyone (including logged-out visitors) may read ONLY published rows. An
-- unpublished upload is invisible to the public API, not merely hidden by the UI.
DROP POLICY IF EXISTS "gallery public read published" ON public.gallery_items;
CREATE POLICY "gallery public read published" ON public.gallery_items
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "gallery admin all" ON public.gallery_items;
CREATE POLICY "gallery admin all" ON public.gallery_items
  FOR ALL USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ── Storage bucket ──────────────────────────────────────────────────────────
-- Public bucket: the images are meant to be served straight from a CDN URL.
-- Visibility is controlled by is_published on the row, not by bucket privacy,
-- so an admin can stage uploads before turning them on.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery', 'gallery', true, 10485760,   -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','image/avif','image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "gallery_public_read" ON storage.objects;
CREATE POLICY "gallery_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "gallery_admin_write" ON storage.objects;
CREATE POLICY "gallery_admin_write" ON storage.objects
  FOR ALL USING (bucket_id = 'gallery' AND public.get_my_role() = 'admin')
  WITH CHECK (bucket_id = 'gallery' AND public.get_my_role() = 'admin');


-- ═══════════════════════════════════════════════════════════════════════════
-- Press coverage ("In the Media")
--
-- Replaces the hardcoded PRESS_FEATURES array that shipped in
-- src/app/(public)/in-media/page.tsx. That array contained invented outlets,
-- headlines and figures rendered as though they were real coverage; the page
-- now shows only rows an admin has entered and published.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.media_features (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet        text NOT NULL,
  logo_text     text,                       -- short mark shown when no logo image
  logo_url      text,
  logo_color    text NOT NULL DEFAULT 'bg-[var(--indigo-deep)]',
  headline      text NOT NULL,
  excerpt       text,
  category      text NOT NULL DEFAULT 'Feature',
  article_url   text,
  published_on  date,
  is_published  boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_features
  ADD COLUMN IF NOT EXISTS logo_text     text,
  ADD COLUMN IF NOT EXISTS logo_url      text,
  ADD COLUMN IF NOT EXISTS logo_color    text NOT NULL DEFAULT 'bg-[var(--indigo-deep)]',
  ADD COLUMN IF NOT EXISTS excerpt       text,
  ADD COLUMN IF NOT EXISTS category      text NOT NULL DEFAULT 'Feature',
  ADD COLUMN IF NOT EXISTS article_url   text,
  ADD COLUMN IF NOT EXISTS published_on  date,
  ADD COLUMN IF NOT EXISTS is_published  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS media_features_published_idx
  ON public.media_features (is_published, display_order, published_on DESC);

DROP TRIGGER IF EXISTS media_features_set_updated_at ON public.media_features;
CREATE TRIGGER media_features_set_updated_at
  BEFORE UPDATE ON public.media_features
  FOR EACH ROW EXECUTE FUNCTION public.gallery_items_touch();

ALTER TABLE public.media_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media features public read" ON public.media_features;
CREATE POLICY "media features public read" ON public.media_features
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "media features admin all" ON public.media_features;
CREATE POLICY "media features admin all" ON public.media_features
  FOR ALL USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ═══════════════════════════════════════════════════════════════════════════
-- Awards & recognition - replaces the hardcoded (empty) AWARDS array.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.media_awards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  organisation  text,
  year          text,
  icon          text NOT NULL DEFAULT 'trophy',
  is_published  boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_awards
  ADD COLUMN IF NOT EXISTS organisation  text,
  ADD COLUMN IF NOT EXISTS year          text,
  ADD COLUMN IF NOT EXISTS icon          text NOT NULL DEFAULT 'trophy',
  ADD COLUMN IF NOT EXISTS is_published  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS media_awards_published_idx
  ON public.media_awards (is_published, display_order);

DROP TRIGGER IF EXISTS media_awards_set_updated_at ON public.media_awards;
CREATE TRIGGER media_awards_set_updated_at
  BEFORE UPDATE ON public.media_awards
  FOR EACH ROW EXECUTE FUNCTION public.gallery_items_touch();

ALTER TABLE public.media_awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media awards public read" ON public.media_awards;
CREATE POLICY "media awards public read" ON public.media_awards
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "media awards admin all" ON public.media_awards;
CREATE POLICY "media awards admin all" ON public.media_awards
  FOR ALL USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

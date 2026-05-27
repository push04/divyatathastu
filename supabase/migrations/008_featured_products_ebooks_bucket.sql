-- =============================================
-- MIGRATION 008 — Featured products + ebooks bucket
-- =============================================

-- Add is_featured column to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Index for fast homepage query
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (is_featured, is_active);

-- Ebooks storage bucket (private, signed URLs for purchasers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ebooks', 'ebooks', false, 52428800, ARRAY['application/pdf','application/epub+zip'])
ON CONFLICT (id) DO NOTHING;

-- Ebooks: admins manage files; authenticated users can read (checked via order ownership in app)
CREATE POLICY "ebooks_admin_all" ON storage.objects
  FOR ALL USING (bucket_id = 'ebooks' AND public.get_my_role() = 'admin');

CREATE POLICY "ebooks_auth_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'ebooks' AND auth.role() = 'authenticated');

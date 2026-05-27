-- Migration 009: CRUD enhancements for admin panel
-- Adds: order tracking/notes, order status expansion, ebook columns in products, reports admin_notes

-- ── ORDERS: Add tracking_number, notes, expand status CHECK ──
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Expand orders.status to include 'shipped' and 'delivered'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','paid','processing','shipped','delivered','completed','refunded','cancelled'));

-- ── PRODUCTS: Add ebook-specific columns ──
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ebook_file_url TEXT,
  ADD COLUMN IF NOT EXISTS ebook_download_limit INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS physical BOOLEAN DEFAULT false;

-- Expand product_type to include 'herbal' (for completeness)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE public.products ADD CONSTRAINT products_product_type_check
  CHECK (product_type IN ('report','ebook','consultation','yantra','gemstone','physical','course','bundle','herbal'));

-- ── REPORTS: Add admin_notes column ──
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ── RLS: Orders columns don't need extra policies (inherit existing) ──

-- Ensure ebooks bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ebooks', 'ebooks', false, 52428800,
  ARRAY['application/pdf','application/epub+zip']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for ebooks bucket (admin upload)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'ebooks_admin_all'
  ) THEN
    CREATE POLICY "ebooks_admin_all" ON storage.objects
      FOR ALL TO authenticated
      USING (
        bucket_id = 'ebooks' AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      )
      WITH CHECK (
        bucket_id = 'ebooks' AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      );
  END IF;
END $$;

-- Authenticated users can download ebooks they've purchased
-- (simplified: allow authenticated read for now — tighten with order check in app layer)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'ebooks_authenticated_read'
  ) THEN
    CREATE POLICY "ebooks_authenticated_read" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'ebooks');
  END IF;
END $$;

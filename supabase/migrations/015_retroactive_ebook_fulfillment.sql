-- =============================================
-- MIGRATION 015 — Fix ebook fulfillment
-- =============================================
-- 1. Delete fake placeholder ebooks seeded in migration 004
-- 2. Sync real ebooks from products table into ebooks table
-- 3. Add order_id column to ebook_purchases
-- 4. Retroactively create ebook_purchases for all missed paid orders
-- =============================================

-- 1. Delete fake seeded ebooks (placeholder URLs from migration 004)
DELETE FROM public.ebooks
WHERE file_url LIKE '%placeholder.mahatathastu.com%';

-- 2. Add order_id to ebook_purchases if not present
ALTER TABLE public.ebook_purchases
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id);

-- 3. Sync ebooks table from products (products with ebook_file_url set are real ebooks)
INSERT INTO public.ebooks (id, title, slug, file_url, price, description, author, language, tags)
SELECT
  p.id,
  p.name,
  p.slug,
  p.ebook_file_url,
  p.price,
  p.description,
  'MahaTathastu',
  'Hindi',
  '[]'::jsonb
FROM public.products p
WHERE p.product_type = 'ebook'
  AND p.ebook_file_url IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  title    = EXCLUDED.title,
  slug     = EXCLUDED.slug,
  file_url = EXCLUDED.file_url,
  price    = EXCLUDED.price;

-- 4. Create ebook_purchases for all missed paid orders
-- (works because ebooks.id = products.id for admin-uploaded ebooks)
INSERT INTO public.ebook_purchases (user_id, ebook_id, order_id, download_count, max_downloads, purchased_at)
SELECT DISTINCT ON (o.user_id, items.product_id)
  o.user_id,
  items.product_id::uuid  AS ebook_id,
  o.id                    AS order_id,
  0                       AS download_count,
  COALESCE(p.ebook_download_limit, 3) AS max_downloads,
  o.created_at            AS purchased_at
FROM public.orders o
CROSS JOIN LATERAL (
  SELECT
    elem ->> 'id'           AS product_id,
    elem ->> 'product_type' AS product_type
  FROM jsonb_array_elements(o.items::jsonb) AS elem
) items
JOIN public.products p
  ON p.id::text = items.product_id
  AND p.ebook_file_url IS NOT NULL
JOIN public.ebooks e
  ON e.id = p.id
WHERE
  o.status = 'paid'
  AND items.product_type = 'ebook'
  AND NOT EXISTS (
    SELECT 1
    FROM public.ebook_purchases ep
    WHERE ep.user_id = o.user_id
      AND ep.ebook_id = items.product_id::uuid
  );

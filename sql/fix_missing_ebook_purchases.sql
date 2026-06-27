-- =============================================
-- RETROACTIVE FIX: Missing ebook_purchases
-- Root cause: payment/verify used user-scoped client; RLS blocked ebooks upsert
-- so ebook_purchases were never created for paid orders.
-- Safe to re-run — uses NOT EXISTS to skip already-fixed records.
-- Run this in Supabase SQL Editor (service role / dashboard).
-- =============================================

-- Step 1: Sync any products that have ebook_file_url but no ebooks table entry
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

-- Step 2: Create missing ebook_purchases for all paid orders
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

-- Preview how many rows were fixed (run separately to verify)
-- SELECT COUNT(*) FROM public.ebook_purchases;

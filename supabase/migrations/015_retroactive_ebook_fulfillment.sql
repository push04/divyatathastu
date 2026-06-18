-- =============================================
-- MIGRATION 015 — Retroactive ebook fulfillment
-- =============================================
-- Run this AFTER linking products to ebooks via Admin > Products.
-- It creates ebook_purchases records for all paid orders whose ebook
-- product now has an ebook_id, but whose purchase was never fulfilled
-- (because the old payment route checked ebook_file_url which was never set).
-- =============================================

-- Add order_id column to ebook_purchases if not already present
ALTER TABLE public.ebook_purchases
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id);

-- Retroactively create ebook_purchases for all missed paid orders
INSERT INTO public.ebook_purchases (user_id, ebook_id, order_id, download_count, max_downloads, purchased_at)
SELECT DISTINCT ON (o.user_id, p.ebook_id)
  o.user_id,
  p.ebook_id,
  o.id AS order_id,
  0   AS download_count,
  COALESCE(p.ebook_download_limit, 3) AS max_downloads,
  o.created_at AS purchased_at
FROM public.orders o
CROSS JOIN LATERAL (
  SELECT
    elem ->> 'id'           AS product_id,
    elem ->> 'product_type' AS product_type
  FROM jsonb_array_elements(o.items::jsonb) AS elem
) items
JOIN public.products p
  ON p.id::text = items.product_id
  AND p.ebook_id IS NOT NULL
WHERE
  o.status = 'paid'
  AND items.product_type = 'ebook'
  AND NOT EXISTS (
    SELECT 1
    FROM public.ebook_purchases ep
    WHERE ep.user_id = o.user_id
      AND ep.ebook_id = p.ebook_id
  );

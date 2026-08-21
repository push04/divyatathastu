import { createClient } from '@/lib/supabase/server'
import ShopClient, { type Product } from './ShopClient'

/**
 * /shop was a single `'use client'` component that fetched its products in a
 * useEffect. The server therefore sent a skeleton with no product data in it -
 * verified against production: 76 KB of HTML containing `animate-pulse` and
 * zero product rows. Every visitor had to download ~1.1 MB of JavaScript,
 * hydrate, then make a Supabase round-trip before seeing a single item. On a
 * fast connection that resolves in a second or two; on mobile data it is a
 * long stare at grey boxes, and if hydration never completes the skeleton is
 * all you ever get.
 *
 * The products query now runs on the server, so the HTML ships with the
 * catalogue already in it and the page is readable before any JS executes.
 * ShopClient still owns everything genuinely interactive - cart, filters,
 * sorting, the product modal - and falls back to fetching for itself if this
 * query returns nothing.
 */

// The catalogue changes rarely; re-render at most once a minute rather than
// querying Supabase on every request.
export const revalidate = 60

export default async function ShopPage() {
  let products: Product[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('id,name,description,price,sale_price,product_type,images,stock_count,is_active,slug,is_featured')
      .eq('is_active', true)
    if (data) products = data as unknown as Product[]
  } catch {
    // A failed prerender must not take the route down - ShopClient will fetch
    // client-side instead, which is exactly the old behaviour.
  }

  return <ShopClient initialProducts={products} />
}

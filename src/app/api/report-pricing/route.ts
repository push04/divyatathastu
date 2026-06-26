import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SETTINGS_KEY = 'report_pricing'

const NO_CACHE = { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await (supabase as any).from('settings').select('value').eq('key', SETTINGS_KEY).single()
  if (error) {
    // Log but return empty object so payment route falls through to its own error handling
    console.error('[report-pricing] Failed to load pricing:', error.message)
    return NextResponse.json({}, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
  if (!data?.value) return NextResponse.json({}, NO_CACHE)
  return NextResponse.json(data.value, NO_CACHE)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const prices = await req.json()
    const { error } = await (supabase as any).from('settings').upsert({ key: SETTINGS_KEY, value: prices, updated_at: new Date().toISOString() } as any)
    if (error) throw new Error(error.message || 'DB upsert failed — ensure the settings table exists')

    // Sync prices to products table. Map report-type keys to their product slugs.
    const PRODUCT_SLUG_MAP: Record<string, string> = {
      full_tathastu: 'full-tathastu-bundle',
    }
    for (const [key, price] of Object.entries(prices) as [string, number][]) {
      const productSlug = PRODUCT_SLUG_MAP[key] ?? key.replace(/_/g, '-')
      await supabase.from('products')
        .update({ price, updated_at: new Date().toISOString() } as any)
        .eq('slug', productSlug)
        .eq('product_type', 'report')
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to save' }, { status: 500 })
  }
}

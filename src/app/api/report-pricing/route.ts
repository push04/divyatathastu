import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SETTINGS_KEY = 'report_pricing'

const NO_CACHE = { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase as any).from('settings').select('value').eq('key', SETTINGS_KEY).single()
    if (!error && data?.value) return NextResponse.json(data.value, NO_CACHE)
  } catch {}
  return NextResponse.json({}, NO_CACHE)
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

    // Sync prices to products table for any report-type product whose slug matches a pricing key
    for (const [slug, price] of Object.entries(prices) as [string, number][]) {
      await supabase.from('products')
        .update({ price, updated_at: new Date().toISOString() } as any)
        .eq('slug', slug)
        .eq('product_type', 'report')
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to save' }, { status: 500 })
  }
}

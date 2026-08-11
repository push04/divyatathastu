import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  CONSULTATION_PRICING_KEY,
  DEFAULT_CONSULTATION_PRICING,
  SPECIALIZATIONS,
  normalizePricing,
  toPrice,
} from '@/lib/constants/consultation'

export const dynamic = 'force-dynamic'

const NO_CACHE = { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }

/**
 * GET  - the effective per-specialization price map. Always returns a complete
 *        map (falls back to the seed defaults) so no caller ever has to guess
 *        a price, which is what produced the ₹0-shown / ₹11,000-charged bug.
 * POST - admin-only save.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data } = await (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', CONSULTATION_PRICING_KEY)
      .maybeSingle()

    return NextResponse.json({ pricing: normalizePricing(data?.value) }, NO_CACHE)
  } catch (e) {
    // Never fail closed here - a broken settings table must not make the
    // booking page show free consultations.
    console.error('[consultation-pricing] load failed:', (e as Error)?.message)
    return NextResponse.json({ pricing: { ...DEFAULT_CONSULTATION_PRICING } }, NO_CACHE)
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const incoming = body?.pricing ?? body

    // Validate before persisting - a NaN or a blank written here silently
    // becomes a free consultation for everyone.
    const clean: Record<string, number> = {}
    for (const spec of SPECIALIZATIONS) {
      const raw = incoming?.[spec]
      // Absent or blank means "leave this at the default", NOT "make it free".
      // Checked on the RAW value: `Number('')` is 0, so converting first would
      // turn an empty field into a ₹0 consultation.
      if (raw === undefined || raw === null) continue
      if (typeof raw === 'string' && raw.trim() === '') continue

      const n = toPrice(raw)
      if (n === null) {
        return NextResponse.json({ error: `Invalid price for ${spec}` }, { status: 400 })
      }
      clean[spec] = Math.round(n)
    }

    const admin = await createAdminClient()
    const { error } = await (admin as any).from('settings').upsert({
      key: CONSULTATION_PRICING_KEY,
      value: clean,
      updated_at: new Date().toISOString(),
    })
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, pricing: normalizePricing(clean) })
  } catch (e) {
    return NextResponse.json({ error: (e as Error)?.message || 'Failed to save' }, { status: 500 })
  }
}

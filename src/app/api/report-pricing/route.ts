import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SETTINGS_KEY = 'report_pricing'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data } = await (supabase as any).from('settings').select('value').eq('key', SETTINGS_KEY).single()
    if (data?.value) return NextResponse.json(data.value)
  } catch {}
  return NextResponse.json({})
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const prices = await req.json()
    await (supabase as any).from('settings').upsert({ key: SETTINGS_KEY, value: prices, updated_at: new Date().toISOString() } as any)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to save' }, { status: 500 })
  }
}

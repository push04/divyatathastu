import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { eventId, name, email, phone } = await req.json()
  if (!eventId || !name || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const supabase = await createClient()
  const { error } = await (supabase as any).from('event_registrations').insert({
    event_id: eventId,
    name,
    email,
    phone: phone || null,
    paid: false,
  } as any)
  if (error) return NextResponse.json({ error: 'Registration failed: ' + error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

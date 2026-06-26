import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEventRegistrationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { eventId, name, email, phone, eventTitle, eventDate } = await req.json()
  if (!eventId || !name || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Guard against duplicate free registrations
  const { data: existing } = await (supabase as any)
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', email)
    .maybeSingle()
  if (existing) return NextResponse.json({ success: true, already_registered: true })

  const { error } = await (supabase as any).from('event_registrations').insert({
    event_id: eventId,
    name,
    email,
    phone: phone || null,
    paid: false,
  } as any)
  if (error) return NextResponse.json({ error: 'Registration failed: ' + error.message }, { status: 500 })

  try {
    await sendEventRegistrationEmail(email, name, eventTitle || 'MahaTathastu Event', eventDate || '', false)
  } catch (e: any) {
    console.warn('[events/register] Email failed:', e.message)
  }

  return NextResponse.json({ success: true })
}

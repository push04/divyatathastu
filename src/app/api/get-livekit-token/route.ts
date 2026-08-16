import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { roomName, userName } = await req.json()

  // Any room name that matched neither prefix previously fell straight through
  // the checks below and was issued a publish-capable token. Constrain the
  // shape first, then require one of the two known prefixes.
  const VALID_ROOM = /^(consult-|mt-)[A-Za-z0-9_-]{1,64}$/
  if (typeof roomName === 'string' && !VALID_ROOM.test(roomName)) {
    return NextResponse.json({ error: 'Invalid room name' }, { status: 400 })
  }

  if (!roomName || !userName) {
    return NextResponse.json({ error: 'roomName and userName are required' }, { status: 400 })
  }

  // Host status is derived from the caller's role on the server. The client
  // sends `isHost` only so it knows what UI to render - it is never trusted
  // as the basis for granting room-admin rights.
  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isStaffUser = callerProfile?.role === 'admin' || callerProfile?.role === 'expert'

  // Verify the requesting user is authorized to join this room.
  // Consultation rooms are named `consult-{bookingId}`.
  if (roomName.startsWith('consult-')) {
    const bookingId = roomName.slice('consult-'.length)
    if (!isStaffUser) {
      const { data: booking } = await (supabase as any)
        .from('consultation_bookings')
        .select('id')
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .maybeSingle()
      if (!booking) {
        return NextResponse.json({ error: 'Not authorized for this room' }, { status: 403 })
      }
    }
  }

  // HIGH-1: Webinar rooms are named `mt-{slug}-{rand}` — verify the user has a paid registration
  if (roomName.startsWith('mt-')) {
    if (!isStaffUser) {
      const { data: webinar } = await (supabase as any)
        .from('webinars')
        .select('id')
        .eq('livekit_room_name', roomName)
        .maybeSingle()
      if (webinar) {
        const { data: reg } = await (supabase as any)
          .from('webinar_registrations')
          .select('payment_status')
          .eq('webinar_id', webinar.id)
          .eq('user_id', user.id)
          .maybeSingle()
        if (!reg || reg.payment_status !== 'paid') {
          return NextResponse.json({ error: 'Not registered for this webinar' }, { status: 403 })
        }
      }
    }
  }

  // Read livekit_mode from platform_settings
  const { data: setting } = await (supabase as any)
    .from('platform_settings')
    .select('value')
    .eq('key', 'livekit_mode')
    .single()

  const mode = (setting?.value as string) || 'production'

  // ── Sandbox mode ─────────────────────────────────────────────────
  if (mode === 'sandbox') {
    const sandboxUrl = process.env.NEXT_PUBLIC_LIVEKIT_SANDBOX_URL
    if (!sandboxUrl) {
      return NextResponse.json({ error: 'Sandbox URL not configured (NEXT_PUBLIC_LIVEKIT_SANDBOX_URL)' }, { status: 500 })
    }

    const sandboxRes = await fetch(`${sandboxUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName, participantName: userName }),
    })

    if (!sandboxRes.ok) {
      const errText = await sandboxRes.text().catch(() => 'unknown')
      return NextResponse.json({ error: `Sandbox token server error: ${sandboxRes.status} ${errText}` }, { status: 502 })
    }

    const data = await sandboxRes.json()
    // LiveKit sandbox returns accessToken + url (or token + serverUrl)
    const token = data.accessToken ?? data.token
    const wsUrl = data.url ?? data.serverUrl ?? sandboxUrl.replace(/^https/, 'wss')

    return NextResponse.json({ token, wsUrl, mode: 'sandbox' })
  }

  // ── Production mode ───────────────────────────────────────────────
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: 'LiveKit production credentials not configured' }, { status: 500 })
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: userName,
    ttl: '2h',
    // Surfaced to every participant, so clients can tell who is running the
    // session rather than assuming the other party is the expert.
    metadata: JSON.stringify({ role: isStaffUser ? 'host' : 'participant' }),
  })

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    // Hosts need to be able to create the room before anyone else arrives,
    // and to moderate it (mute/remove) once the session is running.
    roomAdmin: isStaffUser,
    roomCreate: isStaffUser,
  })

  const token = await at.toJwt()
  return NextResponse.json({ token, wsUrl, mode: 'production', isHost: isStaffUser })
}

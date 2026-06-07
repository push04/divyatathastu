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

  if (!roomName || !userName) {
    return NextResponse.json({ error: 'roomName and userName are required' }, { status: 400 })
  }

  // Read livekit_mode from platform_settings
  const { data: setting } = await supabase
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
  })

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  })

  const token = await at.toJwt()
  return NextResponse.json({ token, wsUrl, mode: 'production' })
}

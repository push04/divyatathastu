'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import ConsultationRoom from '@/components/consultation/ConsultationRoom'
import SudarshanLoader from '@/components/SudarshanLoader'

interface Webinar {
  id: string
  title: string
  description: string | null
  host_name: string
  scheduled_at: string | null
  duration_minutes: number
  max_participants: number
  price: number
  livekit_room_name: string
  status: 'upcoming' | 'live' | 'ended'
}

export default function WebinarJoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()

  const [webinar, setWebinar] = useState<Webinar | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [liveToken, setLiveToken] = useState<string | null>(null)
  const [wsUrl, setWsUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState('Seeker')
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    async function load() {
      // Resolve display name
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const name = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Seeker'
        setUserName(name)
      }

      // Load webinar
      const { data, error: err } = await supabase
        .from('webinars')
        .select('*')
        .eq('id', id)
        .single()

      if (err || !data) {
        setError('Webinar not found.')
      } else {
        setWebinar(data as Webinar)
        // Auto-join if already live
        if (data.status === 'live') {
          joinNow(data as Webinar, name)
        }
      }
      setLoading(false)
    }
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function joinNow(w: Webinar, name: string) {
    setJoining(true)
    try {
      const res = await fetch('/api/get-livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: w.livekit_room_name, userName: name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to get token')
      setLiveToken(json.token)
      setWsUrl(json.wsUrl)
    } catch (e: any) {
      setError(e.message)
    }
    setJoining(false)
  }

  function countdown(target: string): string {
    const diff = new Date(target).getTime() - now
    if (diff <= 0) return 'Starting now…'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <SudarshanLoader size="md" />
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md">
        <span className="material-symbols-outlined text-5xl text-red-300 block mb-3">error</span>
        <p className="text-[var(--warm-charcoal)]/60">{error}</p>
      </div>
    </div>
  )

  if (!webinar) return null

  // Active session
  if (liveToken && wsUrl) {
    return (
      <ConsultationRoom
        token={liveToken}
        wsUrl={wsUrl}
        userName={userName}
        expertName={webinar.host_name}
        onEnd={() => { setLiveToken(null); setWsUrl(null) }}
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--kutch-white)] to-[var(--warm-sand)]/30 p-4">
      <div className="max-w-md w-full">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="text-3xl text-[var(--saffron)] mb-1">ॐ</div>
          <div className="text-xs text-[var(--warm-charcoal)]/40 tracking-widest uppercase">MahaTathastu · Live Session</div>
        </div>

        <div className="card-divine p-6 text-center">
          {/* Status badge */}
          {webinar.status === 'live' && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Now
            </div>
          )}
          {webinar.status === 'upcoming' && (
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200 mb-4">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              Upcoming
            </div>
          )}
          {webinar.status === 'ended' && (
            <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full border border-gray-200 mb-4">
              <span className="material-symbols-outlined text-[13px]">event_busy</span>
              Session Ended
            </div>
          )}

          <h1 className="text-xl font-bold text-[var(--indigo-deep)] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {webinar.title}
          </h1>
          <p className="text-sm text-[var(--warm-charcoal)]/60 mb-1">Hosted by {webinar.host_name}</p>
          {webinar.description && (
            <p className="text-sm text-[var(--warm-charcoal)]/70 mt-3 mb-4 leading-relaxed">{webinar.description}</p>
          )}

          {/* Session details */}
          <div className="bg-[var(--warm-sand)]/40 rounded-xl p-3 mb-5 text-sm">
            <div className="flex justify-between mb-1.5">
              <span className="text-[var(--warm-charcoal)]/50">Duration</span>
              <span className="font-medium">{webinar.duration_minutes} min</span>
            </div>
            <div className="flex justify-between mb-1.5">
              <span className="text-[var(--warm-charcoal)]/50">Max participants</span>
              <span className="font-medium">{webinar.max_participants}</span>
            </div>
            {webinar.scheduled_at && (
              <div className="flex justify-between">
                <span className="text-[var(--warm-charcoal)]/50">Schedule</span>
                <span className="font-medium text-right">
                  {new Date(webinar.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
                </span>
              </div>
            )}
          </div>

          {/* Countdown */}
          {webinar.status === 'upcoming' && webinar.scheduled_at && (
            <div className="bg-amber-50 rounded-xl p-4 mb-5 border border-amber-100">
              <div className="text-xs text-amber-600 uppercase tracking-wider mb-1">Session starts in</div>
              <div className="text-3xl font-bold text-amber-700 font-mono">{countdown(webinar.scheduled_at)}</div>
              <div className="text-xs text-amber-500/70 mt-1">Refresh this page at session time to join</div>
            </div>
          )}

          {/* Action */}
          {webinar.status === 'live' && (
            <button
              onClick={() => joinNow(webinar, userName)}
              disabled={joining}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              {joining
                ? <><SudarshanLoader px={20} /><span>Joining…</span></>
                : <><span className="material-symbols-outlined text-[18px]">videocam</span><span>Join Live Session</span></>
              }
            </button>
          )}

          {webinar.status === 'upcoming' && (
            <div className="text-sm text-[var(--warm-charcoal)]/50 py-2">
              The &ldquo;Join&rdquo; button will appear when the host starts the session.
            </div>
          )}

          {webinar.status === 'ended' && (
            <div className="text-sm text-[var(--warm-charcoal)]/50 py-2">
              This session has ended. Thank you for joining MahaTathastu.
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[var(--warm-charcoal)]/30 mt-4">
          Need help? <a href="https://wa.me/919858784784" className="text-[var(--terracotta)]">WhatsApp us</a>
        </p>
      </div>
    </div>
  )
}

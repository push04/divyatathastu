'use client'

import '@livekit/components-styles'
import { useState, useEffect, use } from 'react'
import { LiveKitRoom } from '@livekit/components-react'
import { createClient } from '@/lib/supabase/client'
import { TathastuConsultRoom } from '@/components/consultation/ConsultationRoom'
import SudarshanLoader from '@/components/SudarshanLoader'
import { usePaymentNotice } from '@/lib/hooks/usePaymentNotice'

declare global {
  interface Window { Razorpay: any }
}

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

interface Registration {
  payment_status: 'pending' | 'paid'
}

export default function WebinarJoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()

  const [webinar, setWebinar] = useState<Webinar | null>(null)
  const [reg, setReg] = useState<Registration | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [paying, setPaying] = useState(false)
  const [liveToken, setLiveToken] = useState<string | null>(null)
  const [wsUrl, setWsUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState('Seeker')
  const [userEmail, setUserEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  const { confirmPayment, NoticeModal } = usePaymentNotice()

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('Please log in to join webinars.'); setLoading(false); return }

        const name = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Seeker'
        setUserName(name)
        setUserEmail(user.email || '')

        // Role, webinar, and registration are independent of each other — fetch in parallel
        const [{ data: profile }, { data: w, error: wErr }, { data: r }] = await Promise.all([
          supabase.from('profiles').select('role').eq('id', user.id).single(),
          (supabase as any).from('webinars').select('*').eq('id', id).single(),
          (supabase as any).from('webinar_registrations').select('payment_status').eq('webinar_id', id).eq('user_id', user.id).maybeSingle(),
        ])

        const admin = profile?.role === 'admin'
        setIsAdmin(admin)

        if (wErr || !w) { setError('Webinar not found.'); setLoading(false); return }
        setWebinar(w as Webinar)

        if (!admin) setReg(r || null)
      } catch (e: any) {
        setError(e?.message || 'Failed to load webinar. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasAccess = isAdmin || webinar?.price === 0 || reg?.payment_status === 'paid'

  async function joinLive() {
    if (!webinar) return
    setJoining(true)
    try {
      const res = await fetch('/api/get-livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: webinar.livekit_room_name, userName }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to get token')
      setLiveToken(json.token)
      setWsUrl(json.wsUrl)
    } catch (e: any) { setError(e.message) }
    setJoining(false)
  }

  async function handleFreeRegister() {
    setPaying(true)
    const res = await fetch('/api/webinars/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'free', webinarId: id }),
    })
    if (res.ok) {
      setReg({ payment_status: 'paid' })
    } else {
      const json = await res.json()
      setError(json.error)
    }
    setPaying(false)
  }

  async function handlePaidRegister() {
    if (!webinar) return
    setPaying(true)

    try {
      // 1. Create Razorpay order
      const res = await fetch('/api/webinars/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', webinarId: id }),
      })
      const orderData = await res.json()
      if (!res.ok) { setError(orderData.error); setPaying(false); return }

      // 2. Load Razorpay SDK if needed
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load payment gateway'))
          document.head.appendChild(s)
        })
      }

      // 3. Open payment dialog
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MahaTathastu',
        description: webinar.title,
        order_id: orderData.orderId,
        prefill: { name: userName, email: userEmail },
        theme: { color: '#1a3a8c' },
        handler: async (response: any) => {
          // 4. Verify on server
          const vRes = await fetch('/api/webinars/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'verify',
              webinarId: id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          })
          if (vRes.ok) {
            setReg({ payment_status: 'paid' })
          } else {
            const json = await vRes.json()
            setError('Payment verification failed: ' + json.error)
          }
          setPaying(false)
        },
      })
      rzp.on('payment.failed', () => { setError('Payment failed. Please try again.'); setPaying(false) })
      rzp.on('modal.dismissed', () => setPaying(false))
      rzp.open()
    } catch (e: any) {
      setError(e?.message || 'Could not start payment. Please try again.')
      setPaying(false)
    }
  }

  function countdown(target: string): string {
    const diff = new Date(target).getTime() - now
    if (diff <= 0) return 'Starting now…'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`
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

  // Active LiveKit session
  if (liveToken && wsUrl) {
    return (
      <div className="h-screen">
        <LiveKitRoom token={liveToken} serverUrl={wsUrl} connect audio video>
          <TathastuConsultRoom
            userName={userName}
            onLeave={() => { setLiveToken(null); setWsUrl(null) }}
          />
        </LiveKitRoom>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--kutch-white)] to-[var(--warm-sand)]/30 p-4">
      {NoticeModal}
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-3xl text-[var(--saffron)] mb-1">ॐ</div>
          <div className="text-xs text-[var(--warm-charcoal)]/40 tracking-widest uppercase">MahaTathastu · Live Session</div>
        </div>

        <div className="card-divine p-6 text-center">
          {/* Status badge */}
          {{
            live: (
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Now
              </div>
            ),
            upcoming: (
              <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200 mb-4">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                Upcoming
              </div>
            ),
            ended: (
              <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full border border-gray-200 mb-4">
                Session Ended
              </div>
            ),
          }[webinar.status]}

          <h1 className="text-xl font-bold text-[var(--indigo-deep)] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {webinar.title}
          </h1>
          <p className="text-sm text-[var(--warm-charcoal)]/60 mb-1">Hosted by {webinar.host_name}</p>

          {/* Price */}
          <div className="my-3">
            {webinar.price > 0
              ? <span className="text-2xl font-bold text-[var(--indigo-deep)]">₹{webinar.price}</span>
              : <span className="text-lg font-bold text-emerald-600">Free Entry</span>}
          </div>

          {webinar.description && (
            <p className="text-sm text-[var(--warm-charcoal)]/70 mb-4 leading-relaxed">{webinar.description}</p>
          )}

          {/* Details */}
          <div className="bg-[var(--warm-sand)]/40 rounded-xl p-3 mb-4 text-sm">
            <div className="flex justify-between mb-1.5">
              <span className="text-[var(--warm-charcoal)]/50">Duration</span>
              <span className="font-medium">{webinar.duration_minutes} min</span>
            </div>
            <div className="flex justify-between mb-1.5">
              <span className="text-[var(--warm-charcoal)]/50">Capacity</span>
              <span className="font-medium">{webinar.max_participants} participants</span>
            </div>
            {webinar.scheduled_at && (
              <div className="flex justify-between">
                <span className="text-[var(--warm-charcoal)]/50">Schedule</span>
                <span className="font-medium text-right text-xs">
                  {new Date(webinar.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
                </span>
              </div>
            )}
          </div>

          {/* Countdown */}
          {webinar.status === 'upcoming' && webinar.scheduled_at && (
            <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-100">
              <div className="text-xs text-amber-600 uppercase tracking-wider mb-1">Starts in</div>
              <div className="text-3xl font-bold text-amber-700 font-mono">{countdown(webinar.scheduled_at)}</div>
            </div>
          )}

          {/* ── ENDED ── */}
          {webinar.status === 'ended' && (
            <div className="text-sm text-[var(--warm-charcoal)]/50 py-3">
              This session has ended. Thank you for joining MahaTathastu.
            </div>
          )}

          {/* ── NOT ENDED: show payment/join flow ── */}
          {webinar.status !== 'ended' && (
            <>
              {/* Has access — show join (only active when live) */}
              {hasAccess && (
                <div className="space-y-2">
                  {reg?.payment_status === 'paid' && webinar.price > 0 && (
                    <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-sm font-medium mb-2">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Registered — ₹{webinar.price} paid
                    </div>
                  )}
                  {webinar.price === 0 && reg?.payment_status === 'paid' && (
                    <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-sm font-medium mb-2">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Registered
                    </div>
                  )}
                  <button
                    onClick={joinLive}
                    disabled={joining || webinar.status !== 'live'}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      webinar.status === 'live'
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/40 cursor-not-allowed'
                    }`}
                  >
                    {joining
                      ? <><SudarshanLoader px={18} /><span>Joining…</span></>
                      : webinar.status === 'live'
                        ? <><span className="material-symbols-outlined text-[18px]">videocam</span><span>Join Live Now</span></>
                        : <span>Waiting for host to start…</span>
                    }
                  </button>
                  {webinar.status !== 'live' && (
                    <p className="text-xs text-[var(--warm-charcoal)]/40">
                      You&apos;re registered! The join button activates when the host starts the session.
                    </p>
                  )}
                </div>
              )}

              {/* No access — show register/pay button */}
              {!hasAccess && (
                <div>
                  {webinar.price === 0 ? (
                    <button
                      onClick={handleFreeRegister}
                      disabled={paying}
                      className="w-full py-3 rounded-xl bg-[var(--indigo-deep)] text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      {paying ? <SudarshanLoader px={18} /> : <span className="material-symbols-outlined text-[18px]">how_to_reg</span>}
                      Register Free
                    </button>
                  ) : (
                    <button
                      onClick={() => confirmPayment(webinar.title, webinar.price, handlePaidRegister)}
                      disabled={paying}
                      className="w-full py-3 rounded-xl bg-[var(--indigo-deep)] text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      {paying ? <SudarshanLoader px={18} /> : <span className="material-symbols-outlined text-[18px]">payments</span>}
                      {paying ? 'Processing…' : `Pay ₹${webinar.price} & Register`}
                    </button>
                  )}
                  <p className="text-xs text-[var(--warm-charcoal)]/40 mt-2">
                    {webinar.price > 0
                      ? 'Secure payment via Razorpay. You\'ll be able to join once the host starts the session.'
                      : 'Free registration. Join once the host starts the session.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-[var(--warm-charcoal)]/30 mt-4">
          Need help?{' '}
          <a href="https://wa.me/919858784784" className="text-[var(--terracotta)] hover:underline">
            WhatsApp +91 98587 84784
          </a>
        </p>
      </div>
    </div>
  )
}

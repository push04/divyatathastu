'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
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
  status: 'upcoming' | 'live' | 'ended'
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  upcoming: { label: 'Upcoming',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  live:     { label: '● Live Now', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ended:    { label: 'Ended',     cls: 'bg-gray-100 text-gray-400 border-gray-200' },
}

export default function WebinarsPage() {
  const supabase = createClient()
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await (supabase as any)
        .from('webinars')
        .select('id,title,description,host_name,scheduled_at,duration_minutes,max_participants,price,status')
        .neq('status', 'ended')
        .order('scheduled_at', { ascending: true })
      setWebinars((data || []) as Webinar[])
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>
          Live Webinars
        </h1>
        <p className="text-sm text-[var(--warm-charcoal)]/50 mt-1">
          Join expert-led live sessions on Vedic Astrology, Healing, and Dharmic Living.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><SudarshanLoader size="md" /></div>
      ) : webinars.length === 0 ? (
        <div className="card-divine p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-[var(--warm-sand)] block mb-3">live_tv</span>
          <p className="text-[var(--warm-charcoal)]/50">No upcoming webinars at the moment.</p>
          <p className="text-xs text-[var(--warm-charcoal)]/30 mt-1">Check back soon — new sessions are added regularly.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {webinars.map(w => {
            const badge = STATUS_BADGE[w.status]
            return (
              <div key={w.id} className="card-divine p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.cls} mb-2 inline-block`}>
                      {badge.label}
                    </span>
                    <h2 className="font-bold text-[var(--indigo-deep)] text-base leading-tight">{w.title}</h2>
                    <p className="text-xs text-[var(--warm-charcoal)]/50 mt-0.5">by {w.host_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {w.price > 0
                      ? <span className="text-lg font-bold text-[var(--indigo-deep)]">₹{w.price}</span>
                      : <span className="text-sm font-bold text-emerald-600">FREE</span>}
                  </div>
                </div>

                {w.description && (
                  <p className="text-sm text-[var(--warm-charcoal)]/60 leading-relaxed line-clamp-3">{w.description}</p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-[var(--warm-charcoal)]/50">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                    {w.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">group</span>
                    Up to {w.max_participants} participants
                  </span>
                  {w.scheduled_at && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">event</span>
                      {new Date(w.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' · '}
                      {new Date(w.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <Link
                  href={`/webinar/${w.id}`}
                  className={`w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    w.status === 'live'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-[var(--indigo-deep)] text-white hover:opacity-90'
                  }`}
                >
                  {w.status === 'live' ? '● Join Now' : w.price > 0 ? `Register — ₹${w.price}` : 'Register Free'}
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserLocation } from '@/lib/utils/getLocation'
import { useBundlePrice } from '@/lib/hooks/useBundlePrice'

interface Profile { id: string; full_name: string; email: string }
interface FamilyMember { id: string; full_name: string; relation: string; date_of_birth?: string }
interface Report { id: string; report_type: string; status: string; created_at: string; family_members: { full_name: string } | null }
interface Notification { id: string; title: string; body: string; type: string; is_read: boolean; created_at: string }
interface PanchangSnap { tithi: string; nakshatra: string; yoga: string; rahuKaal: string }

const REPORT_ICONS: Record<string, string> = {
  full_tathastu: 'auto_awesome', kundli: 'brightness_7', numerology: 'tag', chakra: 'spa', prakriti: 'eco',
  vastu: 'home', dmit: 'fingerprint', psychology: 'psychology', child_development: 'child_care',
  yantra_colour: 'palette', mantra: 'mic', colour_therapy: 'colorize', remedies: 'healing', annual_prediction: 'event',
}

const QUICK = [
  { href: '/reports/generate', label: 'Generate Report', icon: 'auto_awesome', color: 'bg-[var(--terracotta)]' },
  { href: '/family/add', label: 'Add Member', icon: 'person_add', color: 'bg-[var(--indigo-deep)]' },
  { href: '/panchang', label: 'Panchang', icon: 'calendar_today', color: 'bg-emerald-600' },
  { href: '/ai-guide', label: 'AI Guide', icon: 'psychology', color: 'bg-violet-600' },
  { href: '/mandir-finder', label: 'Find Mandir', icon: 'temple_hindu', color: 'bg-amber-600' },
  { href: '/consultations', label: 'Book Consult', icon: 'event', color: 'bg-rose-600' },
]

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [planType, setPlanType] = useState<string>('free')
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [panchang, setPanchang] = useState<PanchangSnap | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { price: bundlePrice } = useBundlePrice()

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    getUserLocation().then(loc => {
      fetch(`/api/panchang?lat=${loc.lat}&lng=${loc.lng}&date=${today}`)
        .then(r => r.json())
        .then(j => { if (j.success) setPanchang({ tithi: j.data.tithi, nakshatra: j.data.nakshatra, yoga: j.data.yoga, rahuKaal: j.data.rahuKaal }) })
        .catch(() => {})
    })
  }, [])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [profileRes, familyRes, membersRes, notifRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('families').select('id,plan_type').eq('owner_id', user.id).single(),
        supabase.from('family_members').select('id,full_name,relation,date_of_birth').limit(4),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])
      if (profileRes.data) setProfile(profileRes.data as any)
      if (familyRes.data) {
        setPlanType(familyRes.data.plan_type || 'free')
        const { data: reportsData } = await supabase
          .from('reports')
          .select('id,report_type,status,created_at,family_members(full_name)')
          .eq('family_id', familyRes.data.id)
          .order('created_at', { ascending: false })
          .limit(4)
        if (reportsData) setReports(reportsData as Report[])
      }
      if (membersRes.data) setMembers(membersRes.data as any)
      if (notifRes.data) setNotifications(notifRes.data as any)
      setLoading(false)
    }
    load()
  }, [])

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const firstName = profile?.full_name?.split(' ')[0] || 'Devotee'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[var(--kutch-white)]">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-divine-pulse" style={{ fontFamily: "'Playfair Display', serif" }}>ॐ</div>
          <p className="text-[var(--indigo-deep)]/50 text-sm" style={{ fontFamily: "'Sora', sans-serif" }}>Loading your sanctuary...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--kutch-white)] min-h-screen">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1
            className="text-3xl text-[var(--indigo-deep)] leading-tight mb-1"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}
          >
            Family Sanctuary
          </h1>
          <p className="text-[var(--indigo-deep)]/50 text-sm">
            Namaste, <span className="font-medium text-[var(--terracotta)]">{firstName}</span> · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="bg-[var(--terracotta)] text-white text-xs font-bold px-3 py-1 rounded-full" style={{ fontFamily: "'Sora', sans-serif" }}>
              {unreadCount} new
            </span>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--warm-sand)] border border-[var(--outline-variant)]/40">
            <span className="material-symbols-outlined text-[14px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--saffron)]" style={{ fontFamily: "'Sora', sans-serif" }}>Secure Session</span>
          </div>
          <Link href="/settings" className="w-9 h-9 rounded-full bg-[var(--indigo-deep)] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {firstName.charAt(0)}
          </Link>
        </div>
      </header>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* Primary Profile Card — 8 cols */}
        <div className="bento-card md:col-span-8 flex flex-col md:flex-row gap-6 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-[var(--terracotta)]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="w-full md:w-1/3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[var(--outline-variant)]/20 pb-5 md:pb-0 md:pr-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--saffron)] to-[var(--terracotta)] flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
              {firstName.charAt(0)}
            </div>
            <h2 className="font-semibold text-[var(--indigo-deep)] text-base text-center" style={{ fontFamily: "'Sora', sans-serif" }}>
              {profile?.full_name || 'Your Profile'}
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-[var(--terracotta)] mt-1 font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>Primary Anchor</span>
          </div>
          <div className="w-full md:w-2/3 flex flex-col justify-center relative z-10">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[var(--indigo-deep)]/40 block mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>Current Plan</span>
                <span className="text-sm font-bold text-[var(--terracotta)] capitalize" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {planType}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[var(--indigo-deep)]/40 block mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>Reports Generated</span>
                <span className="text-sm font-bold text-[var(--tertiary, #469da3)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{reports.length} total</span>
              </div>
            </div>
            <p className="text-sm text-[var(--indigo-deep)]/55 mb-4 leading-relaxed">
              Your spiritual sanctuary is active. Generate reports for any family member using the Noxatra AI engine.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link href="/reports/generate" className="btn-divine text-[10px] px-4 py-2">
                Generate Report
              </Link>
              <Link href="/settings" className="btn-outline-divine text-[10px] px-4 py-2">
                View Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Panchang Card — 4 cols */}
        <div className="bento-card md:col-span-4 p-5">
          <h3
            className="text-[var(--indigo-deep)] mb-4 flex items-center gap-2 text-sm font-semibold"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            <span className="material-symbols-outlined text-[var(--saffron)] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>wb_sunny</span>
            Daily Panchang
          </h3>
          {panchang ? (
            <div className="space-y-3">
              {[
                { label: 'Today', value: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                { label: 'Tithi', value: panchang.tithi },
                { label: 'Nakshatra', value: panchang.nakshatra },
                { label: 'Yoga', value: panchang.yoga },
                { label: 'Rahu Kaal', value: panchang.rahuKaal, alert: true },
              ].map(({ label, value, alert }) => (
                <div key={label} className="flex justify-between items-center border-b border-[var(--outline-variant)]/20 pb-2 last:border-0 last:pb-0">
                  <span className="text-xs text-[var(--indigo-deep)]/50">{label}</span>
                  <span className={`text-xs font-medium ${alert ? 'text-red-500' : 'text-[var(--indigo-deep)]'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-[var(--warm-sand)] rounded animate-pulse" />
              ))}
            </div>
          )}
          <Link href="/panchang" className="block mt-4 text-center text-xs text-[var(--terracotta)] hover:underline font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
            Full Panchang <span className="material-symbols-outlined text-[12px]" style={{ verticalAlign: 'middle' }}>arrow_forward</span>
          </Link>
        </div>

        {/* Quick Actions — 12 cols */}
        <div className="md:col-span-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--indigo-deep)]/50 mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {QUICK.map(a => (
              <Link
                key={a.href}
                href={a.href}
                className="bento-card p-4 text-center hover:shadow-md group"
              >
                <div className={`w-10 h-10 ${a.color} rounded-xl flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform shadow-sm`}>
                  <span className="material-symbols-outlined text-white text-[18px]">{a.icon}</span>
                </div>
                <p className="text-[11px] font-semibold text-[var(--indigo-deep)]" style={{ fontFamily: "'Sora', sans-serif" }}>{a.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Family Members — 6 cols */}
        <div className="md:col-span-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--indigo-deep)]/50" style={{ fontFamily: "'Sora', sans-serif" }}>Connected Energy Vectors</h2>
            <Link href="/family" className="text-xs text-[var(--terracotta)] hover:underline font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>Manage <span className="material-symbols-outlined text-[12px]" style={{ verticalAlign: 'middle' }}>arrow_forward</span></Link>
          </div>
          <div className="space-y-2.5">
            {members.length > 0 ? members.map(m => (
              <Link key={m.id} href={`/family/${m.id}`} className="bento-card p-4 flex items-center gap-4 hover:border-[var(--terracotta)] block">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, var(--indigo-deep), var(--plum-light))' }}>
                  {m.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--indigo-deep)] truncate">{m.full_name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--tertiary, #469da3)] font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>{m.relation} · Synchronized</p>
                </div>
                <span className="material-symbols-outlined text-[var(--outline-variant)] text-[16px]">chevron_right</span>
              </Link>
            )) : (
              <div className="bento-card p-6 text-center">
                <span className="material-symbols-outlined text-[var(--outline-variant)] text-[40px] mb-2 block">family_restroom</span>
                <p className="text-sm text-[var(--indigo-deep)]/50 mb-3">No family members yet</p>
                <Link href="/family/add" className="btn-divine text-xs">Add First Member</Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Reports — 6 cols */}
        <div className="md:col-span-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--indigo-deep)]/50" style={{ fontFamily: "'Sora', sans-serif" }}>Recent Illuminations</h2>
            <Link href="/reports" className="text-xs text-[var(--terracotta)] hover:underline font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>All Reports <span className="material-symbols-outlined text-[12px]" style={{ verticalAlign: 'middle' }}>arrow_forward</span></Link>
          </div>
          <div className="space-y-2.5">
            {reports.length > 0 ? reports.map(r => (
              <Link key={r.id} href={`/reports/${r.id}`} className="bento-card p-4 flex items-center gap-4 hover:border-[var(--terracotta)] block">
                <div className="icon-divine w-10 h-10 rounded-xl shrink-0">
                  <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {REPORT_ICONS[r.report_type] || 'description'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--indigo-deep)] truncate capitalize">{r.report_type.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-[var(--indigo-deep)]/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(r.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  r.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                  r.status === 'processing' ? 'bg-violet-50 text-violet-600' :
                  'bg-amber-50 text-amber-600'
                }`} style={{ fontFamily: "'Sora', sans-serif" }}>{r.status}</span>
              </Link>
            )) : (
              <div className="bento-card p-6 text-center">
                <span className="material-symbols-outlined text-[var(--outline-variant)] text-[40px] mb-2 block">description</span>
                <p className="text-sm text-[var(--indigo-deep)]/50 mb-3">No reports generated yet</p>
                <Link href="/reports/generate" className="btn-divine text-xs">Generate First Report</Link>
              </div>
            )}
          </div>
        </div>

        {/* Notifications — 6 cols */}
        <div className="md:col-span-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--indigo-deep)]/50" style={{ fontFamily: "'Sora', sans-serif" }}>
              Notifications {unreadCount > 0 && <span className="ml-1.5 bg-[var(--terracotta)] text-white text-[9px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </h2>
          </div>
          <div className="space-y-2.5">
            {notifications.length > 0 ? notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`bento-card p-4 cursor-pointer transition-all ${!n.is_read ? 'border-l-2 border-l-[var(--terracotta)] bg-[var(--warm-sand)]/30' : ''}`}
              >
                <p className="text-sm font-semibold text-[var(--indigo-deep)]">{n.title}</p>
                <p className="text-xs text-[var(--indigo-deep)]/50 mt-0.5 line-clamp-2">{n.body}</p>
              </div>
            )) : (
              <div className="bento-card p-6 text-center">
                <span className="material-symbols-outlined text-[var(--outline-variant)] text-[40px] mb-2 block">notifications_none</span>
                <p className="text-sm text-[var(--indigo-deep)]/50">All caught up — no new notifications</p>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade banner — 6 cols */}
        {planType === 'free' && (
          <div className="md:col-span-6">
            <div className="rounded-xl p-6 bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--plum)] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10 pointer-events-none" />
              <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2 font-semibold relative z-10" style={{ fontFamily: "'Sora', sans-serif" }}>Unlock Full Access</p>
              <h3 className="text-xl text-white mb-1 relative z-10" style={{ fontFamily: "'Playfair Display', serif" }}>Full Tathastu Bundle</h3>
              <p className="text-white/60 text-sm mb-5 relative z-10">All 14 reports + lifetime access for your entire family</p>
              <Link href="/shop" className="relative z-10 inline-flex items-center gap-2 bg-[var(--terracotta)] text-white text-xs px-5 py-2.5 rounded-full font-semibold hover:bg-[var(--terracotta-vivid)] transition-colors shadow-lg" style={{ fontFamily: "'Sora', sans-serif" }}>
                Upgrade — ₹{(bundlePrice ?? 2999).toLocaleString('en-IN')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useServiceItems, ServiceItem } from '@/lib/hooks/useServiceItems'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import SudarshanLoader from '@/components/SudarshanLoader'

const LEVEL_CONFIG: Record<string, { bg: string; text: string }> = {
  'Beginner':     { bg: '#dcfce7', text: '#166534' },
  'Intermediate': { bg: '#dbeafe', text: '#1e40af' },
  'Advanced':     { bg: '#fce7f3', text: '#9d174d' },
  'All Levels':   { bg: '#fef9c3', text: '#713f12' },
}

const SUBJECTS = [
  { icon: 'stars',            title: 'Vedic Astrology (Jyotish)',  desc: 'The 12 rashis, 9 grahas, 27 nakshatras, dashas & transits. From lagna reading to advanced prediction techniques.' },
  { icon: 'home',             title: 'Vastu Shastra',              desc: 'Ancient science of space energetics — directional balance, Vastu Purusha Mandal, remedies without demolition.' },
  { icon: 'tag',              title: 'Numerology & Yantra',        desc: 'Pythagorean, Chaldean & Lo Shu grid systems. Yantra construction and number magic squares.' },
  { icon: 'spa',              title: 'Ayurveda Basics',            desc: 'Prakriti assessment, dinacharya (daily routine), seasonal eating, and herbal wisdom for modern life.' },
  { icon: 'self_improvement', title: 'Mantra & Tantra Shastra',    desc: 'The science of sound — beej mantras, mantra siddhi, kavach creation, and protective practices.' },
  { icon: 'visibility',       title: 'Palmistry & Face Reading',   desc: 'Samudrika Shastra — reading destiny, character, and health through physical features.' },
]

const FORMAT_FEATURES = [
  { icon: 'videocam',      title: 'Live Video Classes',       desc: 'Weekly live sessions via video conference with real-time Q&A with the faculty' },
  { icon: 'movie',         title: 'Recorded Library',         desc: 'Lifetime access to all recorded sessions, additional lectures, and bonus content' },
  { icon: 'description',   title: 'Study Materials',          desc: 'Comprehensive PDF notes, worksheets, chart examples, and reference tables' },
  { icon: 'group',         title: 'Student Community',        desc: 'Access to private student group for peer learning, chart discussions, and practice' },
  { icon: 'emoji_events',  title: 'Certificate of Completion', desc: 'Gyanampeetham completion certificate upon passing the final assessment' },
  { icon: 'support_agent', title: 'Mentorship Access',        desc: 'Email and messaging support from course faculty for assignment review' },
]

const DEFAULT_INCLUDES = [
  'Live & Recorded Classes',
  'Comprehensive Study Materials',
  'Certificate of Completion',
  'Student Community Access',
  'Mentorship Support',
]

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (!m) return null
  return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1&autoplay=1`
}

export default function CoursesPage() {
  const { items: courses, loading } = useServiceItems('course')
  const [enrollModal, setEnrollModal] = useState<ServiceItem | null>(null)
  const [enrollStep, setEnrollStep] = useState<'confirm' | 'processing' | 'done'>('confirm')
  const [videoModal, setVideoModal] = useState<ServiceItem | null>(null)
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set())
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'live' | 'recorded'>('all')
  const [search, setSearch] = useState('')
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setCurrentUser({
        id: user.id,
        email: user.email!,
        name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Seeker',
      })
      // Load existing enrollments from DB
      const { data } = await (supabase as any)
        .from('service_bookings')
        .select('service_item_id')
        .eq('user_id', user.id)
        .eq('payment_status', 'paid')
      if (data?.length) {
        setEnrolled(new Set(data.map((b: any) => b.service_item_id as string)))
      }
    })
  }, [])

  function openEnrollModal(item: ServiceItem) {
    if (!currentUser) { toast.error('Please sign in to enroll'); return }
    setEnrollModal(item)
    setEnrollStep('confirm')
  }

  function closeModal() {
    setEnrollModal(null)
    setEnrollStep('confirm')
  }

  function openVideoFromModal() {
    const item = enrollModal!
    setEnrollModal(null)
    setEnrollStep('confirm')
    setVideoModal(item)
  }

  async function handleEnroll() {
    if (!enrollModal || !currentUser) return
    setEnrollStep('processing')
    const item = enrollModal

    try {
      if (!item.price || item.price === 0) {
        const res = await fetch('/api/courses/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'free', courseId: item.id, courseTitle: item.title, instructor: item.instructor_name }),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Enrollment failed')
        setEnrollStep('done')
        setEnrolled(s => new Set([...s, item.id]))
        return
      }

      const orderRes = await fetch('/api/courses/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', courseId: item.id, amount: item.price }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'Payment initialization failed')

      if (!document.getElementById('rzp-courses-script')) {
        await new Promise<void>(resolve => {
          const s = document.createElement('script')
          s.id = 'rzp-courses-script'
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = () => resolve()
          document.head.appendChild(s)
        })
      }

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: item.price * 100,
        currency: 'INR',
        order_id: orderData.order_id,
        name: 'MahaTathastu',
        description: item.title,
        prefill: { name: currentUser.name, email: currentUser.email },
        theme: { color: '#312e81' },
        handler: async (response: any) => {
          const vRes = await fetch('/api/courses/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify', courseId: item.id, courseTitle: item.title, coursePrice: item.price, instructor: item.instructor_name, ...response }),
          })
          if (vRes.ok) {
            setEnrollStep('done')
            setEnrolled(s => new Set([...s, item.id]))
          } else {
            toast.error('Payment successful but enrollment failed. Contact support.')
            closeModal()
          }
        },
        modal: { ondismiss: () => setEnrollStep('confirm') },
      })
      rzp.open()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
      setEnrollStep('confirm')
    }
  }

  const filtered = courses.filter(c => {
    if (levelFilter !== 'all' && c.level !== levelFilter) return false
    if (typeFilter === 'live' && !c.is_live) return false
    if (typeFilter === 'recorded' && c.is_live) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const levels = ['all', ...Array.from(new Set(courses.map(c => c.level).filter(Boolean)))]

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">

      {/* ── Video Viewer Modal ── */}
      {videoModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(5,3,20,0.95)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setVideoModal(null) }}
        >
          <div className="w-full max-w-4xl">
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h3 className="text-white font-bold text-lg leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{videoModal.title}</h3>
                {videoModal.instructor_name && (
                  <p className="text-white/50 text-sm flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                    with {videoModal.instructor_name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setVideoModal(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0 ml-4"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {getYouTubeEmbedUrl(videoModal.video_url || '') ? (
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%', height: 0 }}>
                <iframe
                  src={getYouTubeEmbedUrl(videoModal.video_url!) || ''}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={videoModal.title}
                  style={{ border: 'none' }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 rounded-2xl bg-white/5 text-white/40 text-sm">
                Video not available
              </div>
            )}
            <p className="text-white/25 text-[11px] text-center mt-3">Right-click is disabled to protect course content.</p>
          </div>
        </div>
      )}

      {/* ── Enrollment Modal ── */}
      {enrollModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ background: 'rgba(15,10,40,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden" style={{ maxHeight: '95vh', overflowY: 'auto' }}>

            {/* Modal Header — Light Theme */}
            <div className="relative border-b border-[var(--outline-variant)]/20" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)', padding: '24px 24px 20px' }}>
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--indigo-deep)]/10 hover:bg-[var(--indigo-deep)]/20 flex items-center justify-center text-[var(--indigo-deep)] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>

              <div className="flex gap-2 mb-3 flex-wrap">
                {enrollModal.is_live && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500 text-white font-bold tracking-wide">LIVE</span>
                )}
                {enrollModal.level && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.12)', color: '#3730a3' }}>{enrollModal.level}</span>
                )}
                {enrollModal.badge_text && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold" style={{ background: `${enrollModal.badge_color || '#D4A017'}18`, color: enrollModal.badge_color || '#D4A017', border: `1px solid ${enrollModal.badge_color || '#D4A017'}40` }}>{enrollModal.badge_text}</span>
                )}
              </div>

              <h2 className="text-xl font-bold leading-tight mb-1.5 pr-10 text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {enrollModal.title}
              </h2>
              {enrollModal.instructor_name && (
                <p className="text-sm text-[var(--warm-charcoal)]/60 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                  with {enrollModal.instructor_name}
                </p>
              )}
              {enrollModal.duration && (
                <p className="text-xs text-[var(--warm-charcoal)]/50 flex items-center gap-1 mt-1.5">
                  <span className="material-symbols-outlined text-[13px]">schedule</span>
                  {enrollModal.duration}
                </p>
              )}
            </div>

            {/* Confirm Step */}
            {enrollStep === 'confirm' && (
              <div className="p-6">
                {enrollModal.description && (
                  <p className="text-sm text-[var(--warm-charcoal)]/65 leading-relaxed mb-5 line-clamp-4">{enrollModal.description}</p>
                )}

                <div className="mb-5">
                  <p className="text-[10px] font-bold text-[var(--indigo-deep)] uppercase tracking-widest mb-3">What&apos;s Included</p>
                  <div className="space-y-2.5">
                    {((enrollModal.metadata?.includes as string[]) || DEFAULT_INCLUDES).map((inc: string) => (
                      <div key={inc} className="flex items-center gap-2.5 text-sm text-[var(--warm-charcoal)]/80">
                        <span className="material-symbols-outlined text-emerald-500 text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        {inc}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl p-4 mb-5" style={{ background: 'linear-gradient(135deg, #f0f4ff, #e8eeff)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#312e81]/50 uppercase tracking-widest mb-1">Enrollment Fee</p>
                      {enrollModal.price && enrollModal.price > 0 ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-[var(--indigo-deep)]">₹{enrollModal.price.toLocaleString('en-IN')}</span>
                          {enrollModal.original_price && (
                            <span className="text-sm line-through text-[var(--warm-charcoal)]/30">₹{enrollModal.original_price.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-2xl font-black text-emerald-600">Free</span>
                      )}
                    </div>
                    {enrollModal.original_price && enrollModal.price && enrollModal.price > 0 && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-600 font-bold">
                        Save ₹{(enrollModal.original_price - enrollModal.price).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                <button onClick={handleEnroll} className="btn-divine w-full py-4 text-sm font-semibold inline-flex items-center justify-center gap-2">
                  {enrollModal.price && enrollModal.price > 0 ? (
                    <><span className="material-symbols-outlined text-[18px]">lock</span>Secure Enrollment &mdash; ₹{enrollModal.price.toLocaleString('en-IN')}</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">school</span>Enroll Free</>
                  )}
                </button>
                {enrollModal.price && enrollModal.price > 0 && (
                  <p className="text-[10px] text-center text-[var(--warm-charcoal)]/40 mt-2">Secured by Razorpay &middot; 128-bit SSL</p>
                )}
              </div>
            )}

            {/* Processing Step */}
            {enrollStep === 'processing' && (
              <div className="p-12 flex flex-col items-center justify-center gap-5">
                <SudarshanLoader px={52} />
                <p className="text-sm text-[var(--warm-charcoal)]/50 text-center">Processing your enrollment&hellip;</p>
              </div>
            )}

            {/* Success Step */}
            {enrollStep === 'done' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[44px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h3 className="text-xl font-bold text-[var(--indigo-deep)] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>You&apos;re Enrolled!</h3>
                <p className="text-sm text-[var(--warm-charcoal)]/60 leading-relaxed mb-1">
                  Welcome to <strong>{enrollModal.title}</strong>.
                </p>
                <p className="text-sm text-[var(--warm-charcoal)]/45 leading-relaxed mb-6">
                  A confirmation email has been sent. Our team will share access details within 24 hours.
                </p>
                <div className="flex flex-col gap-3">
                  {enrollModal.video_url && getYouTubeEmbedUrl(enrollModal.video_url) && (
                    <button onClick={openVideoFromModal} className="btn-divine px-8 py-3 text-sm inline-flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                      Watch Course Now
                    </button>
                  )}
                  <button onClick={closeModal} className="btn-outline-divine px-8 py-3 text-sm">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(160deg, #eef2ff 0%, #e0e7ff 50%, #c7d2fe 100%)', borderBottom: '2px solid rgba(99,102,241,0.3)' }}>
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl" style={{ background: 'linear-gradient(135deg, #312e81, #3730a3)' }}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>menu_book</span>
          </div>
          <p className="text-xs text-[#312e81] tracking-[0.4em] uppercase mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>Gyanampeetham Institute</p>
          <h1 className="text-5xl font-black text-[#1e1b4b] mb-3 tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>Learning Courses</h1>
          <p className="text-sm text-[#312e81] tracking-[0.15em] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>Live &middot; Recorded &middot; Certified</p>
          <p className="text-base text-[var(--warm-charcoal)]/70 max-w-2xl mx-auto leading-relaxed">
            Structured courses in Vedic sciences taught by experienced Acharyas. From beginner foundations to advanced masterclasses &mdash; learn at your own pace or in live sessions.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-10">
            {[{ n: `${courses.length}+`, l: 'Courses' }, { n: '50+', l: 'Acharyas' }, { n: '500+', l: 'Students' }, { n: '15+', l: 'Years' }].map(s => (
              <div key={s.l} className="text-center">
                <div className="text-3xl font-black text-[var(--terracotta)]" style={{ fontFamily: "'Playfair Display', serif" }}>{s.n}</div>
                <div className="text-xs text-[var(--warm-charcoal)]/50 uppercase tracking-widest mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* ── Subjects ── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Subjects We Teach</h2>
            <p className="text-sm text-[var(--warm-charcoal)]/60 mt-2">Comprehensive curriculum across all Vedic sciences</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {SUBJECTS.map(s => (
              <div key={s.title} className="bento-card p-5 hover:shadow-md transition-all">
                <div className="mb-3"><span className="material-symbols-outlined text-[24px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span></div>
                <h3 className="font-bold text-[var(--indigo-deep)] mb-2 text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>{s.title}</h3>
                <p className="text-xs text-[var(--warm-charcoal)]/60 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Course Catalog ── */}
        <section id="courses">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Course Catalog</h2>
              <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">{courses.length} courses available</p>
            </div>
            {enrolled.size > 0 && (
              <Link href="/my-courses" className="btn-outline-divine text-xs px-4 py-2 inline-flex items-center gap-1.5 shrink-0">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                My Courses ({enrolled.size})
              </Link>
            )}
          </div>

          {courses.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses…"
                className="border border-[var(--warm-sand)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--indigo-deep)] w-full sm:w-56" />
              <div className="flex gap-2 flex-wrap">
                {(['all', 'live', 'recorded'] as const).map(t => (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${typeFilter === t ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                    {t === 'all' ? 'All Types' : t === 'live' ? 'Live' : 'Recorded'}
                  </button>
                ))}
                {levels.map(l => (
                  <button key={l} onClick={() => setLevelFilter(l)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${levelFilter === l ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                    {l === 'all' ? 'All Levels' : l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(4)].map((_, i) => <div key={i} className="h-72 bg-[var(--warm-sand)] rounded-2xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bento-card p-10 text-center">
              {courses.length === 0
                ? <p className="text-[var(--warm-charcoal)]/40">New courses launching soon! Register your interest by calling us.</p>
                : <p className="text-[var(--warm-charcoal)]/40">No courses match these filters.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(item => {
                const lc = LEVEL_CONFIG[item.level || ''] || { bg: '#f3f4f6', text: '#6b7280' }
                const isEnrolled = enrolled.has(item.id)
                const hasVideo = !!(item.video_url && getYouTubeEmbedUrl(item.video_url))
                return (
                  <div key={item.id} className="bento-card flex flex-col hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden group">

                    {/* Banner */}
                    {item.image_url ? (
                      <div className="w-full h-44 overflow-hidden relative">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(30,27,75,0.4) 0%, transparent 55%)' }} />
                        {item.is_live && <span className="absolute top-3 left-3 text-[10px] px-2.5 py-0.5 rounded-full bg-red-500 text-white font-bold shadow">LIVE</span>}
                      </div>
                    ) : (
                      <div className="w-full h-32 relative flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)' }}>
                        <span className="material-symbols-outlined text-[52px] text-white/15" style={{ fontVariationSettings: "'FILL' 0" }}>menu_book</span>
                        {item.is_live && <span className="absolute top-3 left-3 text-[10px] px-2.5 py-0.5 rounded-full bg-red-500 text-white font-bold">LIVE</span>}
                      </div>
                    )}

                    <div className="p-5 flex flex-col flex-1">
                      {/* Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                        {item.level && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: lc.bg, color: lc.text }}>{item.level}</span>}
                        {item.badge_text && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${item.badge_color || '#D4A017'}18`, color: item.badge_color || '#D4A017' }}>
                            {item.badge_text}
                          </span>
                        )}
                      </div>

                      {item.duration && (
                        <p className="text-[11px] text-[var(--warm-charcoal)]/40 mb-1.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>{item.duration}
                        </p>
                      )}

                      <h3 className="font-bold text-[var(--indigo-deep)] mb-2 text-sm leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>

                      {item.description && (
                        <p className="text-xs text-[var(--warm-charcoal)]/55 leading-relaxed mb-3 line-clamp-2 flex-1">{item.description}</p>
                      )}

                      {item.instructor_name && (
                        <p className="text-[11px] text-[var(--saffron)] mb-3 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                          {item.instructor_name}
                        </p>
                      )}

                      {item.max_participants > 0 && (
                        <p className="text-[10px] text-[var(--warm-charcoal)]/40 mb-3 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">group</span>
                          Max {item.max_participants} students per batch
                        </p>
                      )}

                      {/* Price + CTA */}
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--outline-variant)]/20 mt-auto">
                        {item.price && item.price > 0 ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-black text-[var(--terracotta)] text-base">₹{item.price.toLocaleString('en-IN')}</span>
                            {item.original_price && <span className="text-[11px] line-through text-[var(--warm-charcoal)]/30">₹{item.original_price.toLocaleString('en-IN')}</span>}
                          </div>
                        ) : (
                          <span className="text-sm text-emerald-600 font-bold">Free</span>
                        )}

                        {isEnrolled ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] px-2.5 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              Enrolled
                            </span>
                            {hasVideo && (
                              <button
                                onClick={() => setVideoModal(item)}
                                title="Watch Course"
                                className="w-8 h-8 rounded-full bg-[var(--indigo-deep)]/10 hover:bg-[var(--indigo-deep)] hover:text-white text-[var(--indigo-deep)] flex items-center justify-center transition-all"
                              >
                                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                              </button>
                            )}
                          </div>
                        ) : item.is_bookable ? (
                          <button onClick={() => openEnrollModal(item)} className="btn-divine text-xs px-4 py-2">
                            Enroll Now
                          </button>
                        ) : (
                          <span className="text-[11px] px-3 py-1.5 rounded-full border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/50">Notify Me</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── What's Included ── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>What&apos;s Included in Every Course</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {FORMAT_FEATURES.map(f => (
              <div key={f.title} className="bento-card p-5 flex gap-3 items-start hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}>
                  <span className="material-symbols-outlined text-[20px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-[var(--indigo-deep)] text-xs mb-1">{f.title}</h3>
                  <p className="text-[11px] text-[var(--warm-charcoal)]/60 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center py-10 rounded-2xl" style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <h2 className="text-2xl font-bold text-[#1e1b4b] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Ready to Begin Your Journey?</h2>
          <p className="text-sm text-[#312e81]/70 mb-6 max-w-lg mx-auto">
            All courses are guided by experienced Vedic scholars. Batch sizes are small to ensure personalized attention and quality of learning.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="tel:9858784784" className="btn-divine px-8 py-3 inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">call</span>Call for Admissions: 9858784784
            </a>
            <Link href="/gyanampeetham" className="btn-outline-divine px-8 py-3 inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">school</span>Visit Gyanampeetham
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}

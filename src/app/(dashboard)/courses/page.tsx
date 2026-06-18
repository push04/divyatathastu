'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useServiceItems } from '@/lib/hooks/useServiceItems'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const LEVEL_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  'Beginner':     { bg: '#dcfce7', text: '#166534', label: 'Beginner' },
  'Intermediate': { bg: '#dbeafe', text: '#1e40af', label: 'Intermediate' },
  'Advanced':     { bg: '#fce7f3', text: '#9d174d', label: 'Advanced' },
  'All Levels':   { bg: '#fef9c3', text: '#713f12', label: 'All Levels' },
}

const SUBJECTS = [
  { icon: 'stars', title: 'Vedic Astrology (Jyotish)', desc: 'The 12 rashis, 9 grahas, 27 nakshatras, dashas & transits. From lagna reading to advanced prediction techniques.' },
  { icon: 'home', title: 'Vastu Shastra', desc: 'Ancient science of space energetics - directional balance, Vastu Purusha Mandal, remedies without demolition.' },
  { icon: 'tag', title: 'Numerology & Yantra', desc: 'Pythagorean, Chaldean & Lo Shu grid systems. Yantra construction and number magic squares.' },
  { icon: 'spa', title: 'Ayurveda Basics', desc: 'Prakriti assessment, dinacharya (daily routine), seasonal eating, and herbal wisdom for modern life.' },
  { icon: 'self_improvement', title: 'Mantra & Tantra Shastra', desc: 'The science of sound - beej mantras, mantra siddhi, kavach creation, and protective practices.' },
  { icon: 'visibility', title: 'Palmistry & Face Reading', desc: 'Samudrika Shastra - reading destiny, character, and health through physical features.' },
]

const FORMAT_FEATURES = [
  { icon: 'videocam', title: 'Live Video Classes', desc: 'Weekly live sessions via video conference with real-time Q&A with the faculty' },
  { icon: 'movie', title: 'Recorded Library', desc: 'Lifetime access to all recorded sessions, additional lectures, and bonus content' },
  { icon: 'description', title: 'Study Materials', desc: 'Comprehensive PDF notes, worksheets, chart examples, and reference tables' },
  { icon: 'group', title: 'Student Community', desc: 'Access to private student group for peer learning, chart discussions, and practice' },
  { icon: 'emoji_events', title: 'Certificate of Completion', desc: 'Gyanampeetham completion certificate upon passing the final assessment' },
  { icon: 'support_agent', title: 'Mentorship Access', desc: 'Email and messaging support from course faculty for assignment review' },
]

export default function CoursesPage() {
  const { items: courses, loading } = useServiceItems('course')
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set())
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'live' | 'recorded'>('all')
  const [search, setSearch] = useState('')

  async function enroll(item: typeof courses[number]) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please login to enroll'); return }
    setEnrolling(item.id)
    const { error } = await (supabase as any).from('service_bookings').insert({
      service_item_id: item.id, user_id: user.id,
      status: 'pending', amount: item.price ?? 0, payment_status: 'pending',
    })
    if (error) toast.error('Enrollment failed. Try again.')
    else {
      toast.success(`Enrolled in "${item.title}"! Our team will send course access details within 24 hours.`)
      setEnrolled(s => new Set([...s, item.id]))
    }
    setEnrolling(null)
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

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #eef2ff 0%, #e0e7ff 50%, #c7d2fe 100%)', borderBottom: '2px solid rgba(99,102,241,0.3)' }}>
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl" style={{ background: 'linear-gradient(135deg, #312e81, #3730a3)' }}><span className="material-symbols-outlined text-white" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>menu_book</span></div>
          <p className="text-xs text-[#312e81] tracking-[0.4em] uppercase mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>Gyanampeetham Institute</p>
          <h1 className="text-5xl font-black text-[#1e1b4b] mb-3 tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>Learning Courses</h1>
          <p className="text-sm text-[#312e81] tracking-[0.15em] mb-6" style={{ fontFamily: "'Sora', sans-serif" }}>
            Live · Recorded · Certified
          </p>
          <p className="text-base text-[var(--warm-charcoal)]/70 max-w-2xl mx-auto leading-relaxed">
            Structured courses in Vedic sciences taught by experienced Acharyas. From beginner foundations to advanced masterclasses - learn astrology, Vastu, numerology, and more at your own pace or in live sessions.
          </p>
          {/* Stats */}
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

        {/* Subjects grid */}
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

        {/* Course catalog */}
        <section id="courses">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Course Catalog</h2>
              <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">{courses.length} courses available</p>
            </div>
          </div>

          {/* Filters */}
          {courses.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search courses…"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-56 bg-[var(--warm-sand)] rounded-2xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bento-card p-10 text-center">
              {courses.length === 0
                ? <p className="text-[var(--warm-charcoal)]/40">New courses launching soon! Register your interest by calling us.</p>
                : <p className="text-[var(--warm-charcoal)]/40">No courses match these filters. Try adjusting your search.</p>
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => {
                const lc = LEVEL_CONFIG[item.level || ''] || { bg: '#f3f4f6', text: '#6b7280', label: item.level || 'Open' }
                return (
                  <div key={item.id} className="bento-card flex flex-col hover:shadow-lg transition-all hover:-translate-y-0.5 overflow-hidden">
                    {item.image_url ? (
                      <div className="w-full h-36 overflow-hidden">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}>
                        <span className="material-symbols-outlined text-[48px] text-[var(--indigo-deep)]/30" style={{ fontVariationSettings: "'FILL' 0" }}>menu_book</span>
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: lc.bg, color: lc.text }}>{lc.label}</span>
                        <div className="flex gap-1 ml-2">
                          {item.is_live && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">Live</span>}
                        </div>
                      </div>
                      {item.duration && <p className="text-[11px] text-[var(--warm-charcoal)]/40 mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>{item.duration}</p>}
                      <h3 className="font-bold text-[var(--indigo-deep)] mb-2 text-sm flex-1" style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      {item.description && <p className="text-xs text-[var(--warm-charcoal)]/60 leading-relaxed mb-3 line-clamp-3 flex-1">{item.description}</p>}
                      {item.instructor_name && <p className="text-[11px] text-[var(--saffron)] mb-3 flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">person</span>{item.instructor_name}</p>}
                      {item.badge_text && (
                        <span className="self-start text-[10px] px-2 py-0.5 rounded-full font-semibold mb-3" style={{ background: `${item.badge_color || '#D4A017'}20`, color: item.badge_color || '#D4A017' }}>
                          {item.badge_text}
                        </span>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--outline-variant)]/20">
                        {item.price ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-[var(--terracotta)]">₹{item.price.toLocaleString('en-IN')}</span>
                            {item.original_price && <span className="text-[11px] line-through text-[var(--warm-charcoal)]/30">₹{item.original_price.toLocaleString('en-IN')}</span>}
                          </div>
                        ) : <span className="text-xs text-emerald-600 font-semibold">Free</span>}
                        {enrolled.has(item.id) ? (
                          <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">✓ Enrolled</span>
                        ) : (
                          <button onClick={() => enroll(item)} disabled={enrolling === item.id || !item.is_bookable}
                            className="btn-divine text-xs px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed">
                            {enrolling === item.id ? 'Enrolling…' : item.is_bookable ? 'Enroll' : 'Notify Me'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Course features */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>What's Included in Every Course</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {FORMAT_FEATURES.map(f => (
              <div key={f.title} className="bento-card p-5 flex gap-3 items-start hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}><span className="material-symbols-outlined text-[20px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span></div>
                <div>
                  <h3 className="font-bold text-[var(--indigo-deep)] text-xs mb-1">{f.title}</h3>
                  <p className="text-[11px] text-[var(--warm-charcoal)]/60 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
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

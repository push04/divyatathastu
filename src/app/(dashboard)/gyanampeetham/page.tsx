'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useServiceItems } from '@/lib/hooks/useServiceItems'
import { useServicePayment } from '@/lib/hooks/useServicePayment'

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  'Beginner':     { bg: '#dcfce7', text: '#166534' },
  'Intermediate': { bg: '#dbeafe', text: '#1e40af' },
  'Advanced':     { bg: '#fce7f3', text: '#9d174d' },
  'All Levels':   { bg: '#fef9c3', text: '#713f12' },
}

export default function GyanampeethamPage() {
  const { items: courses, loading } = useServiceItems('gyanampeetham')
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set())
  const { pay, bookingId: enrolling, NoticeModal } = useServicePayment()

  function enroll(item: typeof courses[number]) {
    pay({ id: item.id, title: item.title, price: item.price ?? 0 }, {
      onSuccess: (id) => setEnrolled(s => new Set([...s, id])),
    })
  }

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #fdf6e3 0%, #fef9ed 60%, #faf3de 100%)', borderBottom: '2px solid rgba(212,160,23,0.3)' }}>
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-[#6b3a2a] flex items-center justify-center text-white text-5xl font-black mx-auto mb-6 shadow-xl" style={{ fontFamily: "'Playfair Display', serif" }}>G</div>
          <h1 className="text-5xl font-black text-[#2c1a0e] mb-2 tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>GYANAMPEETHAM</h1>
          <p className="text-sm text-[#6b3a2a] tracking-[0.3em] uppercase mb-5">"Discover the Divine Within"</p>
          <p className="text-base text-[var(--warm-charcoal)]/70 max-w-2xl mx-auto leading-relaxed">
            India's premier Vedic wisdom institute offering live & recorded courses in Jyotish Astrology, Vastu Shastra, Numerology, Ayurveda, and Spiritual Sciences under the guidance of learned Gurus.
          </p>
          <div className="mt-4 inline-flex items-center gap-4 text-xs text-[var(--warm-charcoal)]/40 uppercase tracking-widest">
            <span>An Initiative of Anushthaan India</span>
            <span>·</span>
            <span>Educating Society with Wisdom</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Programs from DB */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Programs & Satsangs</h2>
            <span className="text-xs text-[var(--warm-charcoal)]/50">{courses.length} available</span>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-[var(--warm-sand)] rounded-2xl animate-pulse" />)}
            </div>
          ) : courses.length === 0 ? (
            <div className="bento-card p-10 text-center">
              <p className="text-[var(--warm-charcoal)]/40">Programs coming soon. Check back shortly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(item => {
                const lc = LEVEL_COLORS[item.level || ''] || { bg: '#f3f4f6', text: '#6b7280' }
                return (
                  <div key={item.id} className="bento-card p-5 flex flex-col hover:shadow-lg transition-all hover:-translate-y-0.5">
                    {item.image_url && (
                      <div className="w-full h-32 rounded-xl overflow-hidden mb-4">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: lc.bg, color: lc.text }}>{item.level || 'Open'}</span>
                      <div className="flex items-center gap-1.5">
                        {item.is_live && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">🔴 Live</span>}
                        {item.badge_text && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${item.badge_color || '#D4A017'}20`, color: item.badge_color || '#D4A017' }}>{item.badge_text}</span>}
                      </div>
                    </div>
                    {item.duration && <p className="text-[11px] text-[var(--warm-charcoal)]/40 mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>{item.duration}</p>}
                    <h3 className="font-bold text-[var(--indigo-deep)] mb-2 text-sm flex-1" style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                    {item.description && <p className="text-xs text-[var(--warm-charcoal)]/60 leading-relaxed mb-3 flex-1">{item.description}</p>}
                    {item.instructor_name && <p className="text-[11px] text-[var(--saffron)] mb-3">👤 {item.instructor_name}</p>}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--outline-variant)]/20">
                      {item.price ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-[var(--terracotta)]">₹{item.price.toLocaleString('en-IN')}</span>
                          {item.original_price && <span className="text-[11px] line-through text-[var(--warm-charcoal)]/30">₹{item.original_price.toLocaleString('en-IN')}</span>}
                        </div>
                      ) : <span className="text-xs text-emerald-600 font-semibold">Free</span>}
                      <button onClick={() => enroll(item)} disabled={enrolling === item.id || !item.is_bookable}
                        className="btn-divine text-xs px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed">
                        {enrolling === item.id ? 'Enrolling…' : item.is_bookable ? 'Enroll' : 'Notify Me'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 18 Acharyas */}
        <section style={{ background: 'linear-gradient(135deg, #fdf6e3, #fef9ed)', borderRadius: 20, padding: '40px', border: '1px solid rgba(212,160,23,0.3)' }}>
          <div className="text-center mb-6">
            <div className="text-3xl mb-2 text-[#D4A017]" style={{ fontFamily: "'Playfair Display', serif" }}>ॐ</div>
            <h2 className="text-xl font-bold text-[#2c1a0e]" style={{ fontFamily: "'Playfair Display', serif" }}>ज्योतिष शास्त्र के 18 आचार्य</h2>
            <p className="text-sm text-[#6b3a2a]/70 mt-1">Our teaching lineage flows from the 18 great sages of Vedic Jyotish</p>
          </div>
          <p className="text-sm text-center text-[#cc2200] font-semibold leading-relaxed">
            सूर्य, पितामह (ब्रह्मा), व्यास, वशिष्ठ, अत्रि, पराशर, कश्यप, नारद, गर्ग,<br />
            मरीचि, मनु, अंगिरा, लोमश, पौलिश, च्यवन, यवन, भृगु और शौनक
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 text-center">
            {[{ n: '500+', l: 'Students' }, { n: '18+', l: 'Courses' }, { n: '50+', l: 'Gurus' }, { n: '15+', l: 'Years' }].map(s => (
              <div key={s.l}>
                <div className="text-3xl font-black text-[var(--terracotta)]" style={{ fontFamily: "'Playfair Display', serif" }}>{s.n}</div>
                <div className="text-xs text-[var(--warm-charcoal)]/50 uppercase tracking-widest mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center space-y-3">
          <p className="text-sm text-[var(--warm-charcoal)]/60">For admissions, partnerships, and queries</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="tel:9858784784" className="btn-divine inline-flex items-center gap-2 px-6 py-3">
              <span className="material-symbols-outlined text-[18px]">call</span> 9858784784
            </a>
            <Link href="/consultations" className="btn-outline-divine inline-flex items-center gap-2 px-6 py-3">
              <span className="material-symbols-outlined text-[18px]">event</span> Book 1-on-1 Guidance
            </Link>
          </div>
        </div>
      </div>
      {NoticeModal}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import SudarshanLoader from '@/components/SudarshanLoader'

interface EnrolledCourse {
  booking_id: string
  enrolled_at: string
  amount: number
  status: string
  course: {
    id: string
    title: string
    subtitle?: string
    description?: string
    image_url?: string
    video_url?: string
    instructor_name?: string
    duration?: string
    level?: string
    is_live: boolean
    badge_text?: string
    badge_color?: string
  }
}

function getYouTubeId(url: string): string | null {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function MyCoursesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [videoModal, setVideoModal] = useState<EnrolledCourse | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: bookings, error } = await (supabase as any)
        .from('service_bookings')
        .select(`
          id,
          created_at,
          amount,
          status,
          service_items!inner(
            id, title, subtitle, description, image_url, video_url,
            instructor_name, duration, level, is_live, badge_text, badge_color
          )
        `)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formatted: EnrolledCourse[] = (bookings || [])
        .filter((b: any) => b.service_items?.id)
        .map((b: any) => ({
          booking_id: b.id,
          enrolled_at: b.created_at,
          amount: b.amount,
          status: b.status,
          course: {
            id: b.service_items.id,
            title: b.service_items.title,
            subtitle: b.service_items.subtitle,
            description: b.service_items.description,
            image_url: b.service_items.image_url,
            video_url: b.service_items.video_url,
            instructor_name: b.service_items.instructor_name,
            duration: b.service_items.duration,
            level: b.service_items.level,
            is_live: b.service_items.is_live,
            badge_text: b.service_items.badge_text,
            badge_color: b.service_items.badge_color,
          },
        }))

      setCourses(formatted)
    } catch (e: any) {
      toast.error('Failed to load courses: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const filtered = courses.filter(c =>
    !search || c.course.title.toLowerCase().includes(search.toLowerCase())
  )

  const enrolledAt = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
    catch { return iso }
  }

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">

      {/* ── Video Modal ── */}
      <AnimatePresence>
        {videoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(5,3,20,0.95)', backdropFilter: 'blur(10px)' }}
            onClick={e => { if (e.target === e.currentTarget) setVideoModal(null) }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 24 }}
              className="w-full max-w-4xl"
            >
              <div className="flex items-start justify-between mb-4 px-1">
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {videoModal.course.title}
                  </h3>
                  {videoModal.course.instructor_name && (
                    <p className="text-white/50 text-sm mt-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                      with {videoModal.course.instructor_name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setVideoModal(null)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all ml-4 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {videoModal.course.video_url && getYouTubeId(videoModal.course.video_url) ? (
                <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black"
                  style={{ paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${getYouTubeId(videoModal.course.video_url!)}?rel=0&modestbranding=1&autoplay=1`}
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={videoModal.course.title}
                    style={{ border: 'none' }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 rounded-2xl text-white/40 gap-4"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 0" }}>videocam_off</span>
                  <p className="text-sm">Course video not yet available</p>
                  <p className="text-xs text-white/25">Our team will share access within 24 hours of enrollment</p>
                </div>
              )}

              {videoModal.course.description && (
                <p className="text-white/40 text-xs mt-4 px-1 leading-relaxed line-clamp-3">
                  {videoModal.course.description}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(160deg, #eef2ff 0%, #e0e7ff 50%, #c7d2fe 100%)', borderBottom: '2px solid rgba(99,102,241,0.25)' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #312e81, #4338ca)' }}>
              <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#1e1b4b] tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>My Courses</h1>
              <p className="text-sm text-[#312e81]/60 mt-0.5">Your enrolled learning programs</p>
            </div>
          </div>

          {courses.length > 0 && (
            <div className="mt-6 grid grid-cols-3 sm:grid-cols-3 gap-4 max-w-xs">
              {[
                { n: courses.length, l: 'Enrolled' },
                { n: courses.filter(c => c.course.is_live).length, l: 'Live' },
                { n: courses.filter(c => !c.course.is_live).length, l: 'Recorded' },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <div className="text-2xl font-black" style={{ color: 'var(--terracotta)', fontFamily: "'Playfair Display', serif" }}>{s.n}</div>
                  <div className="text-[10px] uppercase tracking-widest text-[#312e81]/50 mt-0.5" style={{ fontFamily: "'Sora', sans-serif" }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <SudarshanLoader size="md" />
            <p className="text-[var(--warm-charcoal)]/40 text-sm">Loading your courses…</p>
          </div>
        ) : courses.length === 0 ? (
          /* ── Empty state ── */
          <div className="bento-card p-10 sm:p-16 text-center max-w-lg mx-auto mt-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}>
              <span className="material-symbols-outlined text-[40px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 0" }}>school</span>
            </div>
            <h2 className="text-xl font-bold text-[var(--indigo-deep)] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>No Courses Yet</h2>
            <p className="text-sm text-[var(--warm-charcoal)]/50 leading-relaxed mb-7">
              You haven&apos;t enrolled in any courses yet. Browse our Vedic science curriculum and begin your journey.
            </p>
            <Link href="/courses" className="btn-divine px-8 py-3 inline-flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-[18px]">explore</span>
              Browse Courses
            </Link>
          </div>
        ) : (
          <>
            {/* Search */}
            {courses.length > 2 && (
              <div className="mb-6">
                <div className="relative max-w-xs">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--warm-charcoal)]/35 text-[18px]">search</span>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search courses…"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-[var(--warm-sand)] rounded-xl focus:outline-none focus:border-[var(--indigo-deep)] bg-white"
                  />
                </div>
              </div>
            )}

            {/* Course grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {filtered.map((ec, idx) => {
                  const ytId = getYouTubeId(ec.course.video_url || '')
                  const hasVideo = !!ytId
                  return (
                    <motion.div
                      key={ec.booking_id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bento-card flex flex-col overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group"
                    >
                      {/* Thumbnail / cover */}
                      {ec.course.image_url ? (
                        <div className="relative w-full h-44 overflow-hidden">
                          <img src={ec.course.image_url} alt={ec.course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(30,27,75,0.55) 0%, transparent 55%)' }} />
                          {ec.course.is_live && (
                            <span className="absolute top-3 left-3 text-[10px] px-2.5 py-0.5 rounded-full bg-red-500 text-white font-bold shadow">LIVE</span>
                          )}
                          {hasVideo && (
                            <button
                              onClick={() => setVideoModal(ec)}
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                              </div>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="relative w-full h-36 flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)' }}>
                          <span className="material-symbols-outlined text-[56px] text-white/15" style={{ fontVariationSettings: "'FILL' 0" }}>menu_book</span>
                          {ec.course.is_live && (
                            <span className="absolute top-3 left-3 text-[10px] px-2.5 py-0.5 rounded-full bg-red-500 text-white font-bold">LIVE</span>
                          )}
                          {hasVideo && (
                            <button
                              onClick={() => setVideoModal(ec)}
                              className="absolute inset-0 flex items-center justify-center group/play">
                              <div className="w-14 h-14 rounded-full bg-white/15 group-hover/play:bg-white/25 flex items-center justify-center border border-white/20 transition-all">
                                <span className="material-symbols-outlined text-white text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                              </div>
                            </button>
                          )}
                        </div>
                      )}

                      <div className="p-5 flex flex-col flex-1">
                        {/* Level + badge */}
                        <div className="flex gap-1.5 flex-wrap mb-2.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Enrolled
                          </span>
                          {ec.course.level && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: 'rgba(99,102,241,0.1)', color: '#3730a3' }}>
                              {ec.course.level}
                            </span>
                          )}
                          {ec.course.badge_text && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: `${ec.course.badge_color || '#D4A017'}18`, color: ec.course.badge_color || '#D4A017' }}>
                              {ec.course.badge_text}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-[var(--indigo-deep)] text-sm leading-snug mb-2"
                          style={{ fontFamily: "'Playfair Display', serif" }}>
                          {ec.course.title}
                        </h3>

                        {ec.course.instructor_name && (
                          <p className="text-[11px] text-[var(--saffron)] mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                            {ec.course.instructor_name}
                          </p>
                        )}

                        {ec.course.duration && (
                          <p className="text-[11px] text-[var(--warm-charcoal)]/40 mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            {ec.course.duration}
                          </p>
                        )}

                        <p className="text-[10px] text-[var(--warm-charcoal)]/35 mt-auto pt-3 border-t border-[var(--outline-variant)]/20">
                          Enrolled {enrolledAt(ec.enrolled_at)}
                          {ec.amount > 0 && ` · ₹${ec.amount.toLocaleString('en-IN')} paid`}
                        </p>
                      </div>

                      {/* CTA bottom strip */}
                      <div className="px-5 pb-4 flex gap-2">
                        {hasVideo ? (
                          <button
                            onClick={() => setVideoModal(ec)}
                            className="flex-1 btn-divine text-xs py-2.5 inline-flex items-center justify-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                            Watch Now
                          </button>
                        ) : (
                          <div className="flex-1 py-2.5 text-center text-[11px] text-[var(--warm-charcoal)]/40 border border-[var(--warm-sand)] rounded-xl">
                            Access coming soon
                          </div>
                        )}
                        <Link href="/courses"
                          className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--warm-sand)] text-[var(--indigo-deep)]/40 hover:border-[var(--indigo-deep)] hover:text-[var(--indigo-deep)] transition-all"
                          title="Browse more courses">
                          <span className="material-symbols-outlined text-[18px]">explore</span>
                        </Link>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Browse more */}
            <div className="mt-10 text-center">
              <Link href="/courses"
                className="btn-outline-divine px-8 py-3 inline-flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-[18px]">explore</span>
                Browse More Courses
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import SudarshanLoader from '@/components/SudarshanLoader'
import LecturePlayer from '@/components/LecturePlayer'

interface Lesson {
  id: string
  module_id: string
  title: string
  description: string | null
  lesson_type: 'youtube' | 'video' | 'pdf' | 'text'
  content_url: string | null
  content_text: string | null
  duration_minutes: number | null
  is_free_preview: boolean
  signed_url?: string | null
}

interface Module {
  id: string
  title: string
  description: string | null
  display_order: number
  lessons: Lesson[]
}

function getYouTubeId(url: string): string | null {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function fmtMin(m: number | null) {
  if (!m) return ''
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

const TYPE_ICON: Record<string, string> = { youtube: 'smart_display', video: 'videocam', pdf: 'picture_as_pdf', text: 'article' }
const TYPE_COLOR: Record<string, string> = { youtube: '#FF0000', video: '#6366f1', pdf: '#f97316', text: '#10b981' }

export default function CourseViewerPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [modules, setModules] = useState<Module[]>([])
  const [courseName, setCourseName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  const [userEmail, setUserEmail] = useState('')

  // PDF viewer state
  const [pdfPages, setPdfPages] = useState<string[]>([])
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfPage, setPdfPage] = useState(0)
  const pdfCancelRef = useRef(false)

  const storageKey = `course-progress-${courseId}`

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) setCompleted(new Set(JSON.parse(saved)))
  }, [storageKey])

  const markComplete = (lessonId: string) => {
    setCompleted(prev => {
      const next = new Set([...prev, lessonId])
      localStorage.setItem(storageKey, JSON.stringify([...next]))
      return next
    })
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [courseRes, contentRes, { data: { user } }] = await Promise.all([
        (supabase as any).from('service_items').select('title').eq('id', courseId).single(),
        fetch(`/api/courses/content?courseId=${courseId}`),
        supabase.auth.getUser(),
      ])
      if (user?.email) setUserEmail(user.email)
      if (courseRes.data) setCourseName(courseRes.data.title)
      const contentData = await contentRes.json()
      if (!contentRes.ok) throw new Error(contentData.error || 'Could not load course content')
      const mods: Module[] = contentData.modules || []
      setModules(mods)
      setExpandedModules(new Set(mods.map(m => m.id)))
      // Auto-select first lesson
      const first = mods[0]?.lessons?.[0]
      if (first) setActiveLesson(first)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [courseId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  // Load PDF when active lesson is a PDF
  useEffect(() => {
    if (!activeLesson || activeLesson.lesson_type !== 'pdf') { setPdfPages([]); return }
    const url = activeLesson.signed_url || activeLesson.content_url
    if (!url) return

    setPdfLoading(true)
    setPdfPages([])
    setPdfPage(0)
    pdfCancelRef.current = false

    const renderPdf = async () => {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const doc = await pdfjsLib.getDocument({ url }).promise
      const imgs: string[] = []
      for (let i = 1; i <= doc.numPages; i++) {
        if (pdfCancelRef.current) return
        const page = await doc.getPage(i)
        const vp = page.getViewport({ scale: 1.8 })
        const canvas = document.createElement('canvas')
        canvas.width = vp.width; canvas.height = vp.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, canvas, viewport: vp } as any).promise
        imgs.push(canvas.toDataURL('image/jpeg', 0.9))
      }
      if (!pdfCancelRef.current) { setPdfPages(imgs); setPdfLoading(false) }
    }
    renderPdf().catch(e => { console.error(e); setPdfLoading(false) })
    return () => { pdfCancelRef.current = true }
  }, [activeLesson?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const allLessons = modules.flatMap(m => m.lessons)
  const activeIdx = allLessons.findIndex(l => l.id === activeLesson?.id)
  const goNext = () => { if (activeIdx < allLessons.length - 1) { setActiveLesson(allLessons[activeIdx + 1]) } }
  const goPrev = () => { if (activeIdx > 0) setActiveLesson(allLessons[activeIdx - 1]) }

  const totalLessons = allLessons.length
  const completedCount = allLessons.filter(l => completed.has(l.id)).length
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-5">
      <SudarshanLoader size="md" />
      <p className="text-[var(--warm-charcoal)]/40 text-sm">Loading course…</p>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <span className="material-symbols-outlined text-[48px] text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
      <p className="font-semibold text-gray-700">{error}</p>
      <button onClick={() => router.back()} className="px-6 py-2 rounded-xl text-sm text-white" style={{ background: 'var(--terracotta)' }}>Go Back</button>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 bg-[#0E0C1E] border-r border-white/5 flex flex-col overflow-hidden"
            style={{ width: 320 }}
          >
            {/* Course header */}
            <div className="px-4 py-4 border-b border-white/5 flex-shrink-0">
              <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs mb-3 transition-colors">
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>My Courses
              </button>
              <h2 className="text-white/85 font-bold text-sm leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>{courseName}</h2>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-white/30 mb-1">
                  <span>{completedCount}/{totalLessons} lessons</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: 'linear-gradient(to right, var(--terracotta), var(--saffron))' }} />
                </div>
              </div>
            </div>

            {/* Curriculum tree */}
            <div className="flex-1 overflow-y-auto py-2">
              {modules.map((mod, mi) => {
                const isExpanded = expandedModules.has(mod.id)
                return (
                  <div key={mod.id}>
                    <button
                      onClick={() => setExpandedModules(prev => { const n = new Set(prev); if (n.has(mod.id)) n.delete(mod.id); else n.add(mod.id); return n })}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-white/5 transition-colors">
                      <span className="text-[10px] text-white/30 font-mono w-4 flex-shrink-0">{mi + 1}</span>
                      <p className="text-xs text-white/60 font-semibold flex-1 truncate">{mod.title}</p>
                      <span className="material-symbols-outlined text-[14px] text-white/25 transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : '' }}>expand_more</span>
                    </button>
                    {isExpanded && mod.lessons.map((lesson, li) => {
                      const isActive = activeLesson?.id === lesson.id
                      const isDone = completed.has(lesson.id)
                      return (
                        <button key={lesson.id} onClick={() => setActiveLesson(lesson)}
                          className={`w-full flex items-center gap-2.5 pl-9 pr-4 py-2 text-left transition-colors ${isActive ? 'bg-white/12' : 'hover:bg-white/5'}`}>
                          {isDone
                            ? <span className="material-symbols-outlined text-[14px] text-emerald-400 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            : <span className="material-symbols-outlined text-[14px] flex-shrink-0" style={{ color: TYPE_COLOR[lesson.lesson_type], fontVariationSettings: "'FILL' 1" }}>{TYPE_ICON[lesson.lesson_type]}</span>
                          }
                          <span className={`text-xs flex-1 truncate ${isActive ? 'text-white font-semibold' : 'text-white/50'}`}>{lesson.title}</span>
                          {lesson.duration_minutes && (
                            <span className="text-[10px] text-white/20 flex-shrink-0">{fmtMin(lesson.duration_minutes)}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0E0C1E] flex-shrink-0 z-10">
          <button onClick={() => setSidebarOpen(s => !s)}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all">
            <span className="material-symbols-outlined text-[18px]">{sidebarOpen ? 'menu_open' : 'menu'}</span>
          </button>

          {activeLesson && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]" style={{ color: TYPE_COLOR[activeLesson.lesson_type], fontVariationSettings: "'FILL' 1" }}>
                  {TYPE_ICON[activeLesson.lesson_type]}
                </span>
                <p className="text-white/80 text-sm font-semibold truncate">{activeLesson.title}</p>
                {activeLesson.is_free_preview && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold flex-shrink-0">FREE</span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={goPrev} disabled={activeIdx <= 0}
              className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 disabled:opacity-30 transition-all">
              <span className="material-symbols-outlined text-[18px]">skip_previous</span>
            </button>
            {activeLesson && (
              <button onClick={() => { markComplete(activeLesson.id); if (activeIdx < allLessons.length - 1) goNext() }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${completed.has(activeLesson.id) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/60 hover:bg-emerald-500/20 hover:text-emerald-400'}`}>
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {completed.has(activeLesson.id) ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span className="hidden sm:inline">{completed.has(activeLesson.id) ? 'Completed' : 'Mark Complete'}</span>
              </button>
            )}
            <button onClick={goNext} disabled={activeIdx >= allLessons.length - 1}
              className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 disabled:opacity-30 transition-all">
              <span className="material-symbols-outlined text-[18px]">skip_next</span>
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto bg-gray-950">
          {!activeLesson ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-white/30">
              <span className="material-symbols-outlined text-[52px]" style={{ fontVariationSettings: "'FILL' 0" }}>play_lesson</span>
              <p>Select a lesson to begin</p>
            </div>
          ) : activeLesson.lesson_type === 'youtube' ? (
            /* ── YouTube (custom branded player) ── */
            <div className="flex flex-col">
              {getYouTubeId(activeLesson.content_url || '') ? (
                <LecturePlayer
                  key={activeLesson.id}
                  videoId={getYouTubeId(activeLesson.content_url!)!}
                  watermarkText={userEmail || undefined}
                  onEnded={() => markComplete(activeLesson.id)}
                  onNextLesson={activeIdx < allLessons.length - 1 ? goNext : undefined}
                  hasNextLesson={activeIdx < allLessons.length - 1}
                />
              ) : (
                <div className="w-full flex items-center justify-center text-white/30 text-sm bg-black" style={{ aspectRatio: '16/9' }}>
                  Invalid YouTube URL
                </div>
              )}
              {activeLesson.description && (
                <div className="p-6 max-w-3xl">
                  <p className="text-white/50 text-sm leading-relaxed">{activeLesson.description}</p>
                </div>
              )}
            </div>

          ) : activeLesson.lesson_type === 'video' ? (
            /* ── Uploaded Video ── */
            <div className="flex flex-col">
              <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                {activeLesson.signed_url ? (
                  <video
                    key={activeLesson.id}
                    src={activeLesson.signed_url}
                    controls autoPlay
                    className="absolute inset-0 w-full h-full"
                    style={{ outline: 'none' }}
                    onEnded={() => markComplete(activeLesson.id)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">Video not available</div>
                )}
              </div>
              {activeLesson.description && (
                <div className="p-6 max-w-3xl">
                  <p className="text-white/50 text-sm leading-relaxed">{activeLesson.description}</p>
                </div>
              )}
            </div>

          ) : activeLesson.lesson_type === 'pdf' ? (
            /* ── PDF ── */
            <div className="flex flex-col items-center p-4 gap-4">
              {pdfLoading ? (
                <div className="flex flex-col items-center gap-4 py-20">
                  <SudarshanLoader size="md" />
                  <p className="text-white/40 text-sm">Loading PDF…</p>
                </div>
              ) : pdfPages.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 text-white/30">
                  <span className="material-symbols-outlined text-[48px]">picture_as_pdf</span>
                  <p className="text-sm">PDF not available</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 sticky top-0 z-10 py-2 px-4 rounded-xl"
                    style={{ background: 'rgba(14,12,30,0.95)', backdropFilter: 'blur(10px)' }}>
                    <button onClick={() => setPdfPage(p => Math.max(0, p - 1))} disabled={pdfPage === 0}
                      className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 transition-all">
                      <span className="material-symbols-outlined text-[18px]">navigate_before</span>
                    </button>
                    <span className="text-white/50 text-xs">{pdfPage + 1} / {pdfPages.length}</span>
                    <button onClick={() => setPdfPage(p => Math.min(pdfPages.length - 1, p + 1))} disabled={pdfPage === pdfPages.length - 1}
                      className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 transition-all">
                      <span className="material-symbols-outlined text-[18px]">navigate_next</span>
                    </button>
                  </div>
                  <img src={pdfPages[pdfPage]} alt={`Page ${pdfPage + 1}`}
                    className="max-w-3xl w-full rounded-xl shadow-2xl"
                    onContextMenu={e => e.preventDefault()} draggable={false} />
                </>
              )}
            </div>

          ) : (
            /* ── Text ── */
            <div className="max-w-3xl mx-auto p-6 sm:p-10">
              <h2 className="text-2xl font-bold text-white/85 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>{activeLesson.title}</h2>
              {activeLesson.content_text ? (
                <div className="text-white/65 leading-relaxed text-[15px] space-y-4">
                  {activeLesson.content_text.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 text-sm">No content available for this lesson.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

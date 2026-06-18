'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import SudarshanLoader from '@/components/SudarshanLoader'
import { createClient } from '@/lib/supabase/client'

interface PageEntry { num: number; dir: number }

const PAPER_BG = '#F7F3EA'

function BookGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div style={{
        width: '70%', height: '80%',
        background: 'radial-gradient(ellipse, rgba(212,160,23,0.06) 0%, transparent 65%)',
      }} />
    </div>
  )
}

function PageCornerFold() {
  return (
    <div className="absolute bottom-0 right-0 w-9 h-9 pointer-events-none" style={{
      background: 'linear-gradient(225deg, rgba(0,0,0,0.16) 42%, transparent 55%)',
    }} />
  )
}

// Book-spread flip animation
const spreadVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '14%' : '-14%',
    rotateY: dir > 0 ? 9 : -9,
    opacity: 0,
    scale: 0.965,
    filter: 'brightness(0.55)',
  }),
  center: {
    x: 0, rotateY: 0, opacity: 1, scale: 1, filter: 'brightness(1)',
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-9%' : '9%',
    rotateY: dir > 0 ? -7 : 7,
    opacity: 0,
    scale: 0.965,
    filter: 'brightness(0.45)',
  }),
}

export default function EbookReaderPage() {
  const { ebookId } = useParams<{ ebookId: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [meta, setMeta] = useState<{ title: string; author?: string } | null>(null)
  const [pdfRef, setPdfRef] = useState<any>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState<PageEntry>({ num: 1, dir: 1 })
  const [rendered, setRendered] = useState<Record<number, string>>({})
  const [userEmail, setUserEmail] = useState('')
  const [showUI, setShowUI] = useState(true)
  const [pageInput, setPageInput] = useState('1')
  const [isTwoPage, setIsTwoPage] = useState(false)
  const uiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const renderingSet = useRef<Set<number>>(new Set())

  // Detect desktop vs mobile
  useEffect(() => {
    const check = () => setIsTwoPage(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Load PDF
  useEffect(() => {
    let alive = true
    async function init() {
      try {
        const [sessionRes, urlRes] = await Promise.all([
          supabase.auth.getUser(),
          fetch(`/api/ebooks/read-url?ebookId=${ebookId}`),
        ])
        const urlData = await urlRes.json()
        if (!urlRes.ok) throw new Error(urlData.error || 'Access denied')

        if (alive) {
          setMeta({ title: urlData.title, author: urlData.author })
          setUserEmail(sessionRes.data.user?.email || 'MahaTathastu')
        }

        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

        const doc = await pdfjsLib.getDocument({ url: urlData.url }).promise
        if (!alive) return

        setPdfRef(doc)
        setTotalPages(doc.numPages)
        setStatus('ready')
      } catch (e: any) {
        if (alive) { setError(e.message); setStatus('error') }
      }
    }
    init()
    return () => { alive = false }
  }, [ebookId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Render a single PDF page to dataURL with clean watermark
  const renderPage = useCallback(async (doc: any, num: number, email: string) => {
    if (num < 1 || num > doc.numPages) return
    if (renderingSet.current.has(num)) return
    renderingSet.current.add(num)
    try {
      const pdfPage = await doc.getPage(num)
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1.5
      const viewport = pdfPage.getViewport({ scale: dpr * 1.3 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')!

      await pdfPage.render({ canvasContext: ctx, viewport }).promise

      // Clean sparse diagonal watermark — 3×3 grid, barely visible
      ctx.save()
      ctx.globalAlpha = 0.055
      ctx.fillStyle = '#555'
      ctx.font = `${Math.round(viewport.width / 22)}px Arial, sans-serif`
      ctx.rotate(-Math.PI / 6)
      const wm = 'MahaTathastu.com'
      const stepX = viewport.width * 1.1
      const stepY = viewport.height * 0.88
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.fillText(wm, -viewport.width * 0.4 + col * stepX, -viewport.height * 0.25 + row * stepY)
        }
      }
      ctx.restore()

      const dataUrl = canvas.toDataURL('image/jpeg', 0.94)
      setRendered(prev => ({ ...prev, [num]: dataUrl }))
    } catch { renderingSet.current.delete(num) }
  }, [])

  // Pre-render current spread + one ahead
  useEffect(() => {
    if (!pdfRef) return
    const cur = page.num
    const pagesToLoad = [cur, cur - 1, cur + 1, cur + 2, cur + 3]
      .filter(n => n >= 1 && n <= totalPages)
    pagesToLoad.forEach(n => {
      if (!rendered[n]) renderPage(pdfRef, n, userEmail)
    })
    setPageInput(String(cur))
  }, [pdfRef, page.num, totalPages, userEmail, renderPage]) // eslint-disable-line react-hooks/exhaustive-deps

  // Navigation
  const goto = useCallback((n: number, dir: number) => {
    if (n < 1 || n > totalPages) return
    setPage({ num: n, dir })
  }, [totalPages])

  const goNext = useCallback(() => {
    const step = isTwoPage ? 2 : 1
    goto(Math.min(page.num + step, totalPages), 1)
  }, [page.num, isTwoPage, totalPages, goto])

  const goPrev = useCallback(() => {
    const step = isTwoPage ? 2 : 1
    goto(Math.max(page.num - step, 1), -1)
  }, [page.num, isTwoPage, goto])

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'u'].includes(e.key)) e.preventDefault()
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [goNext, goPrev])

  // Touch swipe
  const touchX = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchX.current
    if (dx < -50) goNext()
    else if (dx > 50) goPrev()
  }

  // Auto-hide UI
  const resetUITimer = useCallback(() => {
    setShowUI(true)
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current)
    uiTimerRef.current = setTimeout(() => setShowUI(false), 3500)
  }, [])
  useEffect(() => {
    window.addEventListener('mousemove', resetUITimer)
    window.addEventListener('touchstart', resetUITimer)
    return () => {
      window.removeEventListener('mousemove', resetUITimer)
      window.removeEventListener('touchstart', resetUITimer)
      if (uiTimerRef.current) clearTimeout(uiTimerRef.current)
    }
  }, [resetUITimer])

  // Refresh signed URL every 55 min
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/ebooks/read-url?ebookId=${ebookId}`)
        const d = await res.json()
        if (res.ok && pdfRef) {
          const pdfjsLib = await import('pdfjs-dist')
          const newDoc = await pdfjsLib.getDocument({ url: d.url }).promise
          setPdfRef(newDoc)
          renderingSet.current.clear()
          setRendered({})
        }
      } catch {}
    }, 55 * 60 * 1000)
    return () => clearInterval(id)
  }, [ebookId, pdfRef])

  // page.num = right page; left = page.num - 1 (if two-page and > 1)
  const rightNum = page.num
  const leftNum = isTwoPage && page.num > 1 ? page.num - 1 : null
  const rightImg = rendered[rightNum]
  const leftImg = leftNum ? rendered[leftNum] : null
  const progress = totalPages > 1 ? ((page.num - 1) / (totalPages - 1)) * 100 : 100

  // ── Loading ───────────────────────────────────────────────────────────
  if (status === 'loading') return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5" style={{ background: '#0D0C1D' }}>
      <SudarshanLoader size="lg" />
      <p className="text-white/40 text-sm tracking-wide">Opening your book…</p>
    </div>
  )

  if (status === 'error') return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4" style={{ background: '#0D0C1D' }}>
      <span className="material-symbols-outlined text-[52px] text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
      <p className="text-white/80 font-semibold text-lg">{error}</p>
      <p className="text-white/40 text-sm">Purchase this ebook to access it</p>
      <button onClick={() => router.back()} className="mt-3 px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--terracotta)' }}>
        Go Back
      </button>
    </div>
  )

  // ── Reader ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @media print { body { display:none!important; } }
        .no-select { -webkit-user-select:none; user-select:none; }
        .no-select * { -webkit-user-select:none; user-select:none; }
      `}</style>

      <div
        className="fixed inset-0 flex flex-col no-select"
        style={{ background: 'linear-gradient(150deg,#0C0B1E 0%,#13112B 55%,#0C0B1E 100%)' }}
        onContextMenu={e => e.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        {/* ── Top bar ── */}
        <motion.div
          animate={{ opacity: showUI ? 1 : 0, y: showUI ? 0 : -52 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex items-center justify-between px-5 flex-shrink-0 z-20 border-b"
          style={{ background: 'rgba(18,16,38,0.92)', borderColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', height: 52 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/50 hover:text-white/90 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Library
          </button>

          <div className="text-center absolute left-1/2 -translate-x-1/2 max-w-sm hidden sm:block">
            <p className="text-white/75 text-[13px] font-semibold truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
              {meta?.title}
            </p>
            {meta?.author && <p className="text-white/30 text-[10px] mt-0.5">{meta.author}</p>}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide" style={{ background: 'rgba(212,160,23,0.1)', color: '#D4A017' }}>
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              Protected
            </div>
          </div>
        </motion.div>

        {/* ── Reading area ── */}
        <div className="flex-1 relative overflow-hidden" style={{ perspective: '2800px' }}>
          <BookGlow />

          {/* Nav arrows */}
          <motion.button
            onClick={goPrev}
            animate={{ opacity: showUI ? (page.num > 1 ? 0.85 : 0.12) : 0 }}
            whileHover={{ scale: 1.12, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            disabled={page.num <= 1}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <span className="material-symbols-outlined text-[22px]">chevron_left</span>
          </motion.button>

          <motion.button
            onClick={goNext}
            animate={{ opacity: showUI ? (page.num < totalPages ? 0.85 : 0.12) : 0 }}
            whileHover={{ scale: 1.12, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            disabled={page.num >= totalPages}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <span className="material-symbols-outlined text-[22px]">chevron_right</span>
          </motion.button>

          {/* ── Book display ── */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '16px 52px' }}>
            <AnimatePresence initial={false} custom={page.dir} mode="wait">
              <motion.div
                key={page.num}
                custom={page.dir}
                variants={spreadVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  transformStyle: 'preserve-3d',
                  display: 'flex',
                  alignItems: 'stretch',
                  height: 'min(calc(100vh - 140px), 88vh)',
                  boxShadow: [
                    '0 48px 96px rgba(0,0,0,0.78)',
                    '0 20px 40px rgba(0,0,0,0.55)',
                    '6px 0 20px rgba(0,0,0,0.35)',
                    '-6px 0 20px rgba(0,0,0,0.25)',
                  ].join(', '),
                  borderRadius: 4,
                }}
              >
                {isTwoPage ? (
                  /* ── Two-page book spread (desktop) ── */
                  <>
                    {/* Left page */}
                    <div style={{
                      height: '100%',
                      aspectRatio: '0.707 / 1',
                      maxWidth: 'min(41vw, 530px)',
                      flexShrink: 0,
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '4px 0 0 4px',
                      background: PAPER_BG,
                    }}>
                      {leftNum && leftImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={leftImg}
                          alt={`Page ${leftNum}`}
                          draggable={false}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        />
                      ) : leftNum ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <SudarshanLoader size="sm" />
                        </div>
                      ) : (
                        /* Blank/cover left page */
                        <div style={{
                          width: '100%', height: '100%',
                          background: 'linear-gradient(to right, #E5DCC8, #EDE5D2)',
                        }} />
                      )}
                      {/* Right-edge spine shadow on left page */}
                      <div style={{
                        position: 'absolute', top: 0, right: 0, bottom: 0, width: 28,
                        background: 'linear-gradient(to left, rgba(0,0,0,0.2), transparent)',
                        pointerEvents: 'none',
                      }} />
                    </div>

                    {/* Spine */}
                    <div style={{
                      width: 12,
                      flexShrink: 0,
                      background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(20,14,40,0.55) 50%, rgba(0,0,0,0.28) 100%)',
                    }} />

                    {/* Right page */}
                    <div style={{
                      height: '100%',
                      aspectRatio: '0.707 / 1',
                      maxWidth: 'min(41vw, 530px)',
                      flexShrink: 0,
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '0 4px 4px 0',
                      background: PAPER_BG,
                    }}>
                      {rightImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rightImg}
                          alt={`Page ${rightNum}`}
                          draggable={false}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <SudarshanLoader size="sm" />
                        </div>
                      )}
                      {/* Left-edge spine shadow on right page */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, bottom: 0, width: 28,
                        background: 'linear-gradient(to right, rgba(0,0,0,0.18), transparent)',
                        pointerEvents: 'none',
                      }} />
                      {/* Page texture overlay */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.03) 100%)',
                        mixBlendMode: 'overlay',
                        pointerEvents: 'none',
                      }} />
                      <PageCornerFold />
                    </div>
                  </>
                ) : (
                  /* ── Single page (mobile) ── */
                  <div style={{
                    height: '100%',
                    aspectRatio: '0.707 / 1',
                    maxWidth: 'min(86vw, 500px)',
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 4,
                    background: PAPER_BG,
                  }}>
                    {rightImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rightImg}
                        alt={`Page ${rightNum}`}
                        draggable={false}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SudarshanLoader size="sm" />
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, bottom: 0, width: 10,
                      background: 'linear-gradient(to right, rgba(0,0,0,0.22), transparent)',
                      pointerEvents: 'none',
                      borderRadius: '4px 0 0 4px',
                    }} />
                    <PageCornerFold />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <motion.div
          animate={{ opacity: showUI ? 1 : 0, y: showUI ? 0 : 50 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex items-center justify-between px-5 flex-shrink-0 z-20 border-t gap-4"
          style={{ background: 'rgba(18,16,38,0.92)', borderColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', height: 56 }}
        >
          {/* Progress bar */}
          <div className="flex-1 max-w-[200px] hidden sm:block">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(to right, var(--terracotta), var(--saffron))' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.22)' }}>{Math.round(progress)}% complete</p>
          </div>

          {/* Page controls */}
          <div className="flex items-center gap-3 mx-auto sm:mx-0">
            <button
              onClick={goPrev}
              disabled={page.num <= 1}
              className="text-white/40 hover:text-white/80 disabled:opacity-20 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">navigate_before</span>
            </button>

            <div className="flex items-center gap-1.5 text-sm">
              <input
                type="number"
                value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const n = parseInt(pageInput, 10)
                    if (n >= 1 && n <= totalPages) goto(n, n > page.num ? 1 : -1)
                  }
                }}
                className="w-11 text-center text-white text-sm rounded focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.09)', padding: '3px 4px' }}
                min={1}
                max={totalPages}
              />
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{totalPages}</span>
            </div>

            <button
              onClick={goNext}
              disabled={page.num >= totalPages}
              className="text-white/40 hover:text-white/80 disabled:opacity-20 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">navigate_next</span>
            </button>
          </div>

          <p className="text-[10px] tracking-widest uppercase hidden sm:block" style={{ color: 'rgba(255,255,255,0.15)' }}>
            MahaTathastu · Read-only
          </p>
        </motion.div>
      </div>
    </>
  )
}

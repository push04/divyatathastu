'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import SudarshanLoader from '@/components/SudarshanLoader'
import { createClient } from '@/lib/supabase/client'

export default function EbookReaderPage() {
  const { ebookId } = useParams<{ ebookId: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [loadStatus, setLoadStatus] = useState<'init' | 'rendering' | 'ready' | 'error'>('init')
  const [error, setError] = useState('')
  const [meta, setMeta] = useState<{ title: string; author?: string } | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [renderedCount, setRenderedCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [showUI, setShowUI] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [bookmark, setBookmark] = useState<number | null>(null)
  const [showToC, setShowToC] = useState(false)
  const [toc, setToc] = useState<{ title: string; page: number }[]>([])
  const [theme, setTheme] = useState<'dark' | 'sepia'>('dark')

  const bookContainerRef = useRef<HTMLDivElement>(null)
  const pageFlipRef = useRef<any>(null)
  const uiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageImagesRef = useRef<string[]>([])

  // Init: load PDF + render ALL pages to dataURLs, then hand off to PageFlip
  useEffect(() => {
    let alive = true
    async function init() {
      try {
        const [, urlRes] = await Promise.all([
          supabase.auth.getUser(),
          fetch(`/api/ebooks/read-url?ebookId=${ebookId}`),
        ])
        const urlData = await urlRes.json()
        if (!urlRes.ok) throw new Error(urlData.error || 'Access denied')

        if (alive) setMeta({ title: urlData.title, author: urlData.author })

        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        const doc = await pdfjsLib.getDocument({ url: urlData.url }).promise
        if (!alive) return

        const pages = doc.numPages
        if (alive) { setTotalPages(pages); setLoadStatus('rendering') }

        // Extract table of contents
        try {
          const outline = await doc.getOutline()
          if (outline && outline.length) {
            const items: { title: string; page: number }[] = []
            const processItems = async (entries: any[]) => {
              for (const entry of entries.slice(0, 40)) {
                if (entry.dest) {
                  try {
                    const dest = typeof entry.dest === 'string' ? await doc.getDestination(entry.dest) : entry.dest
                    if (dest) {
                      const ref = dest[0]
                      const pageIdx = await doc.getPageIndex(ref)
                      items.push({ title: entry.title, page: pageIdx })
                    }
                  } catch {}
                }
                if (entry.items?.length) await processItems(entry.items.slice(0, 10))
              }
            }
            await processItems(outline)
            if (alive && items.length) setToc(items)
          }
        } catch {}

        // Restore bookmark
        const saved = localStorage.getItem(`ebook-bm-${ebookId}`)
        if (saved && alive) setBookmark(parseInt(saved, 10))

        const images: string[] = []
        for (let i = 1; i <= pages; i++) {
          if (!alive) return
          const pdfPage = await doc.getPage(i)
          const dpr = Math.min(window.devicePixelRatio || 1, 2)
          const vp = pdfPage.getViewport({ scale: dpr * 1.5 })
          const canvas = document.createElement('canvas')
          canvas.width = vp.width
          canvas.height = vp.height
          const ctx = canvas.getContext('2d')!
          await pdfPage.render({ canvasContext: ctx, canvas, viewport: vp } as any).promise

          // Sparse, clean watermark
          ctx.save()
          ctx.globalAlpha = 0.05
          ctx.fillStyle = '#444'
          ctx.font = `${Math.round(vp.width / 22)}px Arial, sans-serif`
          ctx.rotate(-Math.PI / 6)
          const wm = 'MahaTathastu.com'
          const sx = vp.width * 1.15, sy = vp.height * 0.9
          for (let r = 0; r < 4; r++)
            for (let c = 0; c < 3; c++)
              ctx.fillText(wm, -vp.width * 0.35 + c * sx, -vp.height * 0.2 + r * sy)
          ctx.restore()

          images.push(canvas.toDataURL('image/jpeg', 0.93))
          if (alive) setRenderedCount(i)
        }

        if (!alive) return
        pageImagesRef.current = images
        setLoadStatus('ready')
      } catch (e: any) {
        if (alive) { setError(e.message); setLoadStatus('error') }
      }
    }
    init()
    return () => { alive = false }
  }, [ebookId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mount StPageFlip once all pages are ready
  useEffect(() => {
    if (loadStatus !== 'ready') return
    if (!bookContainerRef.current) return
    if (pageFlipRef.current) return
    const images = pageImagesRef.current
    if (!images.length) return

    let pf: any = null

    const mount = async () => {
      const { PageFlip } = await import('page-flip')
      const mobile = window.innerWidth < 768

      pf = new PageFlip(bookContainerRef.current!, {
        width: 550,
        height: 733,
        size: 'stretch',
        minWidth: mobile ? 280 : 360,
        maxWidth: mobile ? 520 : 760,
        minHeight: mobile ? 380 : 480,
        maxHeight: 1100,
        drawShadow: true,
        flippingTime: 700,
        usePortrait: mobile,
        autoSize: true,
        maxShadowOpacity: 0.65,
        showCover: true,
        mobileScrollSupport: false,
        swipeDistance: 25,
        clickEventForward: true,
        useMouseEvents: true,
      })

      pf.loadFromImages(images)
      pageFlipRef.current = pf

      pf.on('flip', (e: any) => {
        setCurrentPage(e.data)
        setPageInput(String(e.data + 1))
        setShowUI(true)
        saveBookmark(e.data)
      })
    }

    mount()
    return () => {
      if (pf) { try { pf.destroy?.() } catch {} }
      pageFlipRef.current = null
    }
  }, [loadStatus])

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen()
    }
  }, [])
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  // Bookmark save when page flips
  const saveBookmark = useCallback((page: number) => {
    setBookmark(page)
    localStorage.setItem(`ebook-bm-${ebookId}`, String(page))
  }, [ebookId])

  const goNext = useCallback(() => pageFlipRef.current?.flipNext(), [])
  const goPrev = useCallback(() => pageFlipRef.current?.flipPrev(), [])
  const goToPage = useCallback((idx: number) => {
    pageFlipRef.current?.turnToPage(idx)
    setCurrentPage(idx)
    setPageInput(String(idx + 1))
  }, [])

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(+(z + 0.15).toFixed(2), 2.5))
      if (e.key === '-') setZoom(z => Math.max(+(z - 0.15).toFixed(2), 0.4))
      if (e.key === '0') setZoom(1)
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen() }
      if (e.key === 'b' || e.key === 'B') { if (bookmark !== null) goToPage(bookmark) }
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'u'].includes(e.key)) e.preventDefault()
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [goNext, goPrev])

  // Pinch-to-zoom on mobile
  const lastDist = useRef<number | null>(null)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) { lastDist.current = null; return }
    e.preventDefault()
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (lastDist.current !== null) {
      const delta = (dist - lastDist.current) * 0.008
      setZoom(z => Math.min(Math.max(+(z + delta).toFixed(2), 0.4), 2.5))
    }
    lastDist.current = dist
  }
  const handleTouchEnd = () => { lastDist.current = null }

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

  const progress = totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0
  const renderPct = totalPages > 0 ? Math.round((renderedCount / totalPages) * 100) : 0

  // ── Loading / rendering ───────────────────────────────────────────────────
  if (loadStatus !== 'ready' && loadStatus !== 'error') return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-8"
      style={{ background: 'linear-gradient(150deg,#0C0B1E 0%,#13112B 55%,#0C0B1E 100%)' }}>
      <SudarshanLoader size="lg" />
      {loadStatus === 'rendering' ? (
        <div className="text-center space-y-3 w-72">
          <p className="text-white/60 text-sm font-medium">Preparing your book…</p>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: 'linear-gradient(to right, var(--terracotta), var(--saffron))' }}
              animate={{ width: `${renderPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-white/30 text-xs">{renderedCount} of {totalPages} pages · {renderPct}%</p>
        </div>
      ) : (
        <p className="text-white/40 text-sm">Opening your book…</p>
      )}
    </div>
  )

  if (loadStatus === 'error') return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4" style={{ background: '#0D0C1D' }}>
      <span className="material-symbols-outlined text-[52px] text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
      <p className="text-white/80 font-semibold text-lg">{error}</p>
      <p className="text-white/40 text-sm">Purchase this ebook to access it</p>
      <button onClick={() => router.back()}
        className="mt-3 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: 'var(--terracotta)' }}>
        Go Back
      </button>
    </div>
  )

  // ── Reader ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @media print { body { display:none!important; } }
        .no-ctx * { -webkit-user-select:none; user-select:none; }
        /* StPageFlip: ensure canvas layers stack correctly */
        .stf__parent { touch-action: none; }
      `}</style>

      <div
        className="fixed inset-0 flex flex-col no-ctx"
        style={{ background: theme === 'sepia'
          ? 'linear-gradient(150deg,#2c2015 0%,#3a2a18 55%,#2c2015 100%)'
          : 'linear-gradient(150deg,#0C0B1E 0%,#13112B 55%,#0C0B1E 100%)' }}
        onContextMenu={e => e.preventDefault()}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={resetUITimer}
      >
        {/* ── Top bar ── */}
        <motion.div
          animate={{ opacity: showUI ? 1 : 0, y: showUI ? 0 : -52 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between px-4 sm:px-5 flex-shrink-0 z-30 border-b"
          style={{ background: 'rgba(14,12,30,0.96)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', height: 52 }}
        >
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/50 hover:text-white/90 transition-colors text-sm">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Library
          </button>

          <div className="text-center absolute left-1/2 -translate-x-1/2 max-w-[260px] sm:max-w-sm">
            <p className="text-white/75 text-[13px] font-semibold truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
              {meta?.title}
            </p>
            {meta?.author && <p className="text-white/30 text-[10px] mt-0.5 hidden sm:block">{meta.author}</p>}
          </div>

          <div className="flex items-center gap-1">
            {/* ToC */}
            {toc.length > 0 && (
              <button onClick={() => setShowToC(s => !s)} title="Table of Contents"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${showToC ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
                <span className="material-symbols-outlined text-[17px]">toc</span>
              </button>
            )}

            {/* Bookmark */}
            <button onClick={() => saveBookmark(currentPage)} title={`Bookmark page ${currentPage + 1}`}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${bookmark === currentPage ? 'text-[var(--saffron)]' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
              <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: bookmark === currentPage ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
            </button>

            <div className="w-px h-5 mx-0.5 hidden sm:block" style={{ background: 'rgba(255,255,255,0.08)' }} />

            {/* Zoom */}
            <button onClick={() => setZoom(z => Math.max(+(z - 0.15).toFixed(2), 0.4))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
              <span className="material-symbols-outlined text-[17px]">zoom_out</span>
            </button>
            <button onClick={() => setZoom(1)}
              className="text-[10px] text-white/30 hover:text-white/70 transition-colors w-10 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => setZoom(z => Math.min(+(z + 0.15).toFixed(2), 2.5))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
              <span className="material-symbols-outlined text-[17px]">zoom_in</span>
            </button>

            <div className="w-px h-5 mx-0.5 hidden sm:block" style={{ background: 'rgba(255,255,255,0.08)' }} />

            {/* Sepia toggle */}
            <button onClick={() => setTheme(t => t === 'dark' ? 'sepia' : 'dark')} title="Toggle sepia mode"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${theme === 'sepia' ? 'bg-amber-500/20 text-amber-400' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
              <span className="material-symbols-outlined text-[17px]">wb_sunny</span>
            </button>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
              <span className="material-symbols-outlined text-[17px]">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
            </button>

            <div className="w-px h-5 mx-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />

            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide"
              style={{ background: 'rgba(212,160,23,0.1)', color: '#D4A017' }}>
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <span className="hidden sm:inline">Protected</span>
            </div>
          </div>
        </motion.div>

        {/* ── ToC Drawer ── */}
        {showToC && toc.length > 0 && (
          <motion.div
            initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute left-0 top-[52px] bottom-[56px] z-40 w-64 flex flex-col border-r overflow-hidden"
            style={{ background: 'rgba(10,9,24,0.97)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <span className="text-white/80 text-sm font-semibold tracking-wide">Contents</span>
              <button onClick={() => setShowToC(false)} className="text-white/40 hover:text-white/80 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {toc.map((item, i) => (
                <button key={i} onClick={() => { pageFlipRef.current?.turnToPage(item.page); setShowToC(false) }}
                  className="w-full text-left px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all truncate">
                  {item.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Book area ── */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">

          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div style={{ width: '65%', height: '75%', background: 'radial-gradient(ellipse, rgba(212,160,23,0.055) 0%, transparent 65%)' }} />
          </div>

          {/* Left nav arrow */}
          <motion.button
            onClick={goPrev}
            animate={{ opacity: showUI ? 0.85 : 0 }}
            whileHover={{ scale: 1.12, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(255,255,255,0.07)', top: '50%', transform: 'translateY(-50%)' }}
          >
            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
          </motion.button>

          {/* Right nav arrow */}
          <motion.button
            onClick={goNext}
            animate={{ opacity: showUI ? 0.85 : 0 }}
            whileHover={{ scale: 1.12, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(255,255,255,0.07)', top: '50%', transform: 'translateY(-50%)' }}
          >
            <span className="material-symbols-outlined text-[24px]">chevron_right</span>
          </motion.button>

          {/* StPageFlip mount point — zoom via CSS transform */}
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${zoom})`,
              transition: 'transform 0.22s ease',
              transformOrigin: 'center center',
            }}
          >
            <div
              ref={bookContainerRef}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <motion.div
          animate={{ opacity: showUI ? 1 : 0, y: showUI ? 0 : 56 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between px-4 sm:px-5 flex-shrink-0 z-30 border-t gap-4"
          style={{ background: 'rgba(14,12,30,0.96)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', height: 56 }}
        >
          {/* Progress */}
          <div className="flex-1 max-w-[160px] hidden sm:block">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div className="h-full rounded-full"
                style={{ background: 'linear-gradient(to right, var(--terracotta), var(--saffron))' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{Math.round(progress)}% complete</p>
          </div>

          {/* Page controls */}
          <div className="flex items-center gap-3 mx-auto sm:mx-0">
            <button onClick={goPrev} className="text-white/40 hover:text-white/80 transition-colors">
              <span className="material-symbols-outlined text-[20px]">navigate_before</span>
            </button>

            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const n = parseInt(pageInput, 10)
                    if (n >= 1 && n <= totalPages) goToPage(n - 1)
                  }
                }}
                className="w-12 text-center text-white text-sm rounded focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.09)', padding: '4px 4px' }}
                min={1} max={totalPages}
              />
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{totalPages}</span>
            </div>

            <button onClick={goNext} className="text-white/40 hover:text-white/80 transition-colors">
              <span className="material-symbols-outlined text-[20px]">navigate_next</span>
            </button>
          </div>

          <p className="text-[10px] tracking-widest uppercase hidden sm:block" style={{ color: 'rgba(255,255,255,0.12)' }}>
            MahaTathastu · Read-only
          </p>
        </motion.div>
      </div>
    </>
  )
}

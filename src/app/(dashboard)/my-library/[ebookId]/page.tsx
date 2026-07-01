'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import SudarshanLoader from '@/components/SudarshanLoader'
import { createClient } from '@/lib/supabase/client'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PageFlipInstance = any

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
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [pageInput, setPageInput] = useState('1')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [bookmark, setBookmark] = useState<number | null>(null)
  const [showToC, setShowToC] = useState(false)
  const [toc, setToc] = useState<{ title: string; page: number }[]>([])
  const [theme, setTheme] = useState<'dark' | 'sepia'>('dark')

  const uiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageImagesRef = useRef<string[]>([])
  const pageAreaRef = useRef<HTMLDivElement>(null)
  const flipContainerRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<PageFlipInstance | null>(null)
  const panRef = useRef({ x: 0, y: 0 })
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 })
  const dragMovedRef = useRef(false) // true once drag threshold exceeded

  // Init: load PDF + render ALL pages to dataURLs
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

        // Fill with a lightweight placeholder up front so the reader can open with the
        // correct page count/navigation as soon as page 1 is ready, instead of blocking
        // on every page rendering first (which made long books take ages to open).
        const placeholderSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1131"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="50%" y="50%" fill="#666" font-family="sans-serif" font-size="24" text-anchor="middle">Loading page…</text></svg>'
        const placeholder = 'data:image/svg+xml,' + encodeURIComponent(placeholderSvg)
        const images: string[] = new Array(pages).fill(placeholder)
        pageImagesRef.current = images

        for (let i = 1; i <= pages; i++) {
          if (!alive) return
          const pdfPage = await doc.getPage(i)
          // Use higher scale for crisp rendering on all DPR levels.
          // We render at 3× the native PDF unit size — this is enough for 3× displays
          // and still sharp when downsampled for 1× or 2× displays.
          const scale = Math.max(window.devicePixelRatio * 2, 3)
          const vp = pdfPage.getViewport({ scale })
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

          // PNG for maximum sharpness (no lossy JPEG artifacts on text)
          images[i - 1] = canvas.toDataURL('image/png')
          if (!alive) return
          setRenderedCount(i)

          if (i === 1) {
            // Open the reader now — the rest render in the background below
            setLoadStatus('ready')
          } else if (flipRef.current && (i % 3 === 0 || i === pages)) {
            // Backfill already-open reader with newly rendered pages, preserving current page
            flipRef.current.updateFromImages(images)
          }
        }

        if (alive && flipRef.current) flipRef.current.updateFromImages(images)
      } catch (e: any) {
        if (alive) { setError(e.message); setLoadStatus('error') }
      }
    }
    init()
    return () => { alive = false }
  }, [ebookId]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Bookmark save
  const saveBookmark = useCallback((page: number) => {
    setBookmark(page)
    localStorage.setItem(`ebook-bm-${ebookId}`, String(page))
  }, [ebookId])

  // ── PageFlip init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (loadStatus !== 'ready') return
    const imgs = pageImagesRef.current
    if (!imgs.length || !flipContainerRef.current || !pageAreaRef.current) return

    const areaRect = pageAreaRef.current.getBoundingClientRect()
    const pad = 48
    const availW = areaRect.width - pad * 2
    const availH = areaRect.height - pad * 2

    // Fit page into available area preserving A4 ratio (1:1.414)
    const ratio = 1 / 1.414
    let pageW = Math.min(availW, availH * ratio)
    let pageH = pageW / ratio
    if (pageH > availH) { pageH = availH; pageW = pageH * ratio }
    pageW = Math.max(200, Math.round(pageW))
    pageH = Math.max(280, Math.round(pageH))

    let pf: PageFlipInstance | null = null
    let onResize: (() => void) | null = null

    // page-flip's internal canvas is sized to raw CSS pixels with no devicePixelRatio
    // scaling, so on any Retina/high-DPI screen the browser upscales a low-res bitmap —
    // this is what makes the reader look blurry. Re-raise the canvas's backing-store
    // resolution and compensate with a matching context scale so drawing stays crisp.
    function applyHiDpiFix() {
      const canvas = flipContainerRef.current?.querySelector('canvas.stf__canvas') as HTMLCanvasElement | null
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      if (dpr <= 1) return
      const cssW = canvas.width
      const cssH = canvas.height
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      const ctx = canvas.getContext('2d')
      ctx?.scale(dpr, dpr)
    }

    import('page-flip').then(mod => {
      const PageFlip = (mod as any).PageFlip || mod.default?.PageFlip || mod.default
      if (!flipContainerRef.current || !PageFlip) return

      pf = new PageFlip(flipContainerRef.current, {
        width: pageW,
        height: pageH,
        size: 'fixed',
        minWidth: 100,
        maxWidth: pageW,
        minHeight: 100,
        maxHeight: pageH,
        drawShadow: true,
        flippingTime: 600,
        usePortrait: true,
        startZIndex: 0,
        autoSize: true,
        showCover: false,
        mobileScrollSupport: false,
        showPageCorners: true,
        disableFlipByClick: false,
        clickEventForward: false,
      })

      pf.loadFromImages(imgs)
      applyHiDpiFix()

      pf.on('flip', (e: any) => {
        const page = e.data as number
        setCurrentPage(page)
        setPageInput(String(page + 1))
        saveBookmark(page)
      })

      pf.on('changeState', () => {
        const page = pf?.getCurrentPageIndex() ?? 0
        setCurrentPage(page)
        setPageInput(String(page + 1))
      })

      flipRef.current = pf

      // page-flip resets the canvas (and its transform) on window resize — registering
      // our listener after its own ensures we re-apply the fix right after each resize.
      onResize = () => applyHiDpiFix()
      window.addEventListener('resize', onResize)
    })

    return () => {
      if (onResize) window.removeEventListener('resize', onResize)
      if (pf) {
        try { pf.destroy() } catch {}
      }
      if (flipContainerRef.current) flipContainerRef.current.innerHTML = ''
      flipRef.current = null
    }
  }, [loadStatus, saveBookmark]) // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = useCallback(() => {
    if (flipRef.current) flipRef.current.flipNext('bottom')
  }, [])

  const goPrev = useCallback(() => {
    if (flipRef.current) flipRef.current.flipPrev('bottom')
  }, [])

  const goToPage = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, pageImagesRef.current.length - 1))
    if (flipRef.current) flipRef.current.turnToPage(clamped)
    setCurrentPage(clamped)
    setPageInput(String(clamped + 1))
    saveBookmark(clamped)
  }, [saveBookmark])

  // Reset pan when page changes or zoom returns to 1
  useEffect(() => {
    panRef.current = { x: 0, y: 0 }
    setPanX(0); setPanY(0)
  }, [currentPage])

  useEffect(() => {
    if (zoom <= 1) { panRef.current = { x: 0, y: 0 }; setPanX(0); setPanY(0) }
  }, [zoom])

  const clampPan = useCallback((x: number, y: number) => {
    const el = pageAreaRef.current
    if (!el) return { x, y }
    const maxX = (el.clientWidth * (zoom - 1)) / 2
    const maxY = (el.clientHeight * (zoom - 1)) / 2
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) }
  }, [zoom])

  const handlePanStart = useCallback((clientX: number, clientY: number) => {
    if (zoom <= 1) return
    dragStartRef.current = { mouseX: clientX, mouseY: clientY, panX: panRef.current.x, panY: panRef.current.y }
    dragMovedRef.current = false
    setIsDragging(true)
  }, [zoom])

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return
    const dx = clientX - dragStartRef.current.mouseX
    const dy = clientY - dragStartRef.current.mouseY
    if (!dragMovedRef.current && Math.abs(dx) < 5 && Math.abs(dy) < 5) return
    dragMovedRef.current = true
    const { x, y } = clampPan(dragStartRef.current.panX + dx, dragStartRef.current.panY + dy)
    panRef.current = { x, y }
    setPanX(x); setPanY(y)
  }, [isDragging, clampPan])

  const handlePanEnd = useCallback(() => {
    setIsDragging(false)
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
  }, [goNext, goPrev, toggleFullscreen, bookmark, goToPage])

  // Pinch-to-zoom + single-finger pan on mobile
  const lastDist = useRef<number | null>(null)
  const lastTouchPos = useRef<{ x: number; y: number } | null>(null)
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom
      lastTouchPos.current = null
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (lastDist.current !== null) {
        const delta = (dist - lastDist.current) * 0.008
        setZoom(z => Math.min(Math.max(+(z + delta).toFixed(2), 0.4), 2.5))
      }
      lastDist.current = dist
    } else if (e.touches.length === 1 && zoom > 1) {
      // Single-finger pan when zoomed
      lastDist.current = null
      e.preventDefault()
      const touch = e.touches[0]
      if (lastTouchPos.current) {
        const dx = touch.clientX - lastTouchPos.current.x
        const dy = touch.clientY - lastTouchPos.current.y
        const { x, y } = clampPan(panRef.current.x + dx, panRef.current.y + dy)
        panRef.current = { x, y }
        setPanX(x); setPanY(y)
      }
      lastTouchPos.current = { x: touch.clientX, y: touch.clientY }
    } else {
      lastDist.current = null
      lastTouchPos.current = null
    }
  }, [zoom, clampPan])
  const handleTouchEnd = useCallback(() => {
    lastDist.current = null
    lastTouchPos.current = null
    setIsDragging(false)
  }, [])

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

  const images = pageImagesRef.current

  // ── Reader ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @media print { body { display:none!important; } }
        .no-ctx * { -webkit-user-select:none; user-select:none; }
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
                <button key={i} onClick={() => { goToPage(item.page); setShowToC(false) }}
                  className="w-full text-left px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all truncate">
                  {item.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Page area ── */}
        <div
          ref={pageAreaRef}
          className="flex-1 relative overflow-hidden flex items-center justify-center"
          style={{ cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
          onMouseDown={e => { handlePanStart(e.clientX, e.clientY); resetUITimer() }}
          onMouseMove={e => handlePanMove(e.clientX, e.clientY)}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
        >

          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div style={{ width: '65%', height: '75%', background: 'radial-gradient(ellipse, rgba(212,160,23,0.055) 0%, transparent 65%)' }} />
          </div>

          {/* Left nav arrow */}
          <motion.button
            onClick={e => { if (!dragMovedRef.current) goPrev(); e.stopPropagation() }}
            animate={{ opacity: showUI && currentPage > 0 ? 0.85 : 0 }}
            whileHover={{ scale: 1.12, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(255,255,255,0.07)', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
          </motion.button>

          {/* Right nav arrow */}
          <motion.button
            onClick={e => { if (!dragMovedRef.current) goNext(); e.stopPropagation() }}
            animate={{ opacity: showUI && currentPage < images.length - 1 ? 0.85 : 0 }}
            whileHover={{ scale: 1.12, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(255,255,255,0.07)', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined text-[24px]">chevron_right</span>
          </motion.button>

          {/* Pan layer (screen-space translate) → Zoom layer → PageFlip canvas */}
          <div style={{ transform: `translate(${panX}px, ${panY}px)`, transition: isDragging ? 'none' : 'transform 0.15s ease', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ transform: `scale(${zoom})`, transition: isDragging ? 'none' : 'transform 0.22s ease', transformOrigin: 'center center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div ref={flipContainerRef} style={{ position: 'relative' }} />
            </div>
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

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import SudarshanLoader from '@/components/SudarshanLoader'

export default function EbookReaderPage() {
  const { ebookId } = useParams<{ ebookId: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [readUrl, setReadUrl] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ title: string; author?: string } | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchUrl() {
      try {
        const res = await fetch(`/api/ebooks/read-url?ebookId=${ebookId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Cannot open ebook')
        // Append PDF viewer params to disable toolbar/download
        const url = new URL(data.url)
        const iframeSrc = url.href + '#toolbar=0&navpanes=0&scrollbar=1&view=FitH'
        setReadUrl(iframeSrc)
        setMeta({ title: data.title, author: data.author })
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchUrl()
  }, [ebookId])

  // Refresh signed URL every 55 minutes before it expires
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/ebooks/read-url?ebookId=${ebookId}`)
        const data = await res.json()
        if (res.ok) {
          const url = new URL(data.url)
          setReadUrl(url.href + '#toolbar=0&navpanes=0&scrollbar=1&view=FitH')
        }
      } catch {}
    }, 55 * 60 * 1000)
    return () => clearInterval(id)
  }, [ebookId])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const onFsc = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsc)
    return () => document.removeEventListener('fullscreenchange', onFsc)
  }, [])

  // Block keyboard shortcuts that could trigger print (Ctrl+P) or save (Ctrl+S)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [])

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4" style={{ background: '#12112A' }}>
        <SudarshanLoader size="lg" />
        <p className="text-white/50 text-sm">Opening your book…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4" style={{ background: '#12112A' }}>
        <span className="material-symbols-outlined text-[48px] text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
        <p className="text-white/80 text-base font-semibold">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--terracotta)' }}
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Print/screenshot protection */}
      <style>{`
        @media print { body { display: none !important; } }
        .reader-iframe { pointer-events: auto; user-select: none; -webkit-user-select: none; }
      `}</style>

      <div
        ref={containerRef}
        className="fixed inset-0 flex flex-col select-none"
        style={{ background: '#12112A' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Top bar — Kindle-style */}
        <div
          className="flex items-center justify-between px-4 h-12 flex-shrink-0 border-b"
          style={{ background: '#1C1A38', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/50 hover:text-white/90 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Library
          </button>

          {meta && (
            <div className="text-center hidden sm:block">
              <p className="text-white/80 text-xs font-semibold truncate max-w-[300px]">{meta.title}</p>
              {meta.author && <p className="text-white/30 text-[10px]">{meta.author}</p>}
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {fullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>

            {/* Protected — no download icon shown */}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
              style={{ background: 'rgba(212,160,23,0.12)', color: '#D4A017' }}
              title="This book is protected. Reading only."
            >
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              Protected
            </div>
          </div>
        </div>

        {/* Reader area */}
        <div className="flex-1 relative overflow-hidden">
          {readUrl && (
            <iframe
              src={readUrl}
              className="reader-iframe w-full h-full border-0"
              title={meta?.title || 'Ebook Reader'}
              sandbox="allow-scripts allow-same-origin"
              allow="fullscreen"
              // referrerPolicy="no-referrer" can break signed URLs
            />
          )}

          {/* Invisible overlay to block right-click on iframe edges */}
          <div
            className="absolute inset-0 pointer-events-none"
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}
          />
        </div>

        {/* Bottom bar */}
        <div
          className="flex items-center justify-center h-10 flex-shrink-0 border-t"
          style={{ background: '#1C1A38', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-white/20 text-[10px] tracking-wider uppercase select-none">
            MahaTathastu · Read-only · Protected Content
          </p>
        </div>
      </div>
    </>
  )
}

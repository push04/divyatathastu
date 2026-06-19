'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { loadYouTubeApi } from '@/lib/youtubeApiLoader'

interface LecturePlayerProps {
  videoId: string
  watermarkText?: string
  onEnded?: () => void
  onNextLesson?: () => void
  hasNextLesson?: boolean
}

type PlayerState = 'unstarted' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error'

const YT_STATE_MAP: Record<number, PlayerState> = {
  [-1]: 'unstarted',
  [0]: 'ended',
  [1]: 'playing',
  [2]: 'paused',
  [3]: 'buffering',
  [5]: 'unstarted',
}

const ERROR_MESSAGES: Record<number, string> = {
  2: 'This lecture is temporarily unavailable.',
  5: 'Playback error. Please try again.',
  100: 'This video could not be found.',
  101: 'Embedding is not allowed for this video. Enable it in YouTube Studio.',
  150: 'Embedding is not allowed for this video. Enable it in YouTube Studio.',
}

function fmtTime(s: number) {
  if (!s || isNaN(s) || !isFinite(s)) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

const WM_POSITIONS = [
  { top: '12%', left: '8%' },
  { top: '12%', left: '58%' },
  { top: '68%', left: '8%' },
  { top: '68%', left: '58%' },
  { top: '38%', left: '30%' },
  { top: '22%', left: '48%' },
]

let playerCounter = 0

export default function LecturePlayer({
  videoId,
  watermarkText,
  onEnded,
  onNextLesson,
  hasNextLesson,
}: LecturePlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const playerIdRef = useRef(`yt-lp-${++playerCounter}`)
  const playerRef = useRef<any>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seekBarRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef<{ time: number; zone: string }>({ time: 0, zone: '' })
  const wmIdxRef = useRef(0)
  const pStateRef = useRef<PlayerState>('unstarted')

  const [pState, setPState] = useState<PlayerState>('unstarted')
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(100)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [rates, setRates] = useState<number[]>([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2])
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [wmPos, setWmPos] = useState(WM_POSITIONS[0])
  const [wmVisible, setWmVisible] = useState(true)

  const updatePState = useCallback((s: PlayerState) => {
    pStateRef.current = s
    setPState(s)
  }, [])

  const stopPolling = useCallback(() => {
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    progressRef.current = setInterval(() => {
      const p = playerRef.current
      if (!p?.getCurrentTime) return
      setTime(p.getCurrentTime() || 0)
      setDuration(p.getDuration() || 0)
      setBuffered(p.getVideoLoadedFraction() || 0)
    }, 250)
  }, [stopPolling])

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      if (pStateRef.current === 'playing') setShowControls(false)
    }, 3000)
  }, [])

  // Init player using element ID (more reliable than passing element reference)
  useEffect(() => {
    let alive = true

    loadYouTubeApi().then((YT: any) => {
      if (!alive || !YT?.Player) return

      playerRef.current = new YT.Player(playerIdRef.current, {
        videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          controls: 0,       // Hide all YouTube chrome
          disablekb: 1,      // Disable YouTube keyboard shortcuts (we handle them)
          fs: 0,             // No native fullscreen button (we build our own)
          iv_load_policy: 3, // No annotations/info cards
          modestbranding: 1,
          playsinline: 1,    // Critical for iOS — prevents native fullscreen takeover
          rel: 0,
          cc_load_policy: 0,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
          enablejsapi: 1,
        },
        events: {
          onReady: (e: any) => {
            if (!alive) return
            // Force iframe to be non-interactive — click-catcher handles all events
            const iframe = e.target.getIframe?.()
            if (iframe) {
              iframe.style.pointerEvents = 'none'
              iframe.setAttribute('tabindex', '-1')
            }
            const r = e.target.getAvailablePlaybackRates?.()
            if (r?.length) setRates(r)
            setVolume(e.target.getVolume?.() || 100)
          },
          onStateChange: (e: any) => {
            if (!alive) return
            const mapped = YT_STATE_MAP[e.data as number] || 'unstarted'
            updatePState(mapped)
            if (mapped === 'playing') { startPolling(); showControlsTemporarily() }
            else { stopPolling(); setShowControls(true) }
            if (mapped === 'ended') onEnded?.()
          },
          onError: (e: any) => {
            if (!alive) return
            setErrorMsg(ERROR_MESSAGES[e.data as number] || 'An error occurred during playback.')
            updatePState('error')
            stopPolling()
          },
        },
      })
    })

    return () => {
      alive = false
      stopPolling()
      try { playerRef.current?.destroy?.() } catch (_) {}
      playerRef.current = null
    }
  }, [videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fullscreen events
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    document.addEventListener('webkitfullscreenchange', h)
    return () => {
      document.removeEventListener('fullscreenchange', h)
      document.removeEventListener('webkitfullscreenchange', h)
    }
  }, [])

  // Watermark drift — move every 25s
  useEffect(() => {
    const iv = setInterval(() => {
      setWmVisible(false)
      setTimeout(() => {
        wmIdxRef.current = (wmIdxRef.current + 1) % WM_POSITIONS.length
        setWmPos(WM_POSITIONS[wmIdxRef.current])
        setWmVisible(true)
      }, 700)
    }, 25000)
    return () => clearInterval(iv)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const p = playerRef.current
      if (!p) return

      switch (e.key) {
        case ' ': case 'k': case 'K':
          e.preventDefault()
          pStateRef.current === 'playing' ? p.pauseVideo() : p.playVideo()
          break
        case 'ArrowLeft':
          e.preventDefault()
          p.seekTo(Math.max(0, (p.getCurrentTime() || 0) - 5), true)
          break
        case 'ArrowRight':
          e.preventDefault()
          p.seekTo((p.getCurrentTime() || 0) + 5, true)
          break
        case 'ArrowUp':
          e.preventDefault()
          { const v = Math.min(100, (p.getVolume?.() || 0) + 5); p.setVolume(v); setVolume(v); p.unMute?.(); setMuted(false) }
          break
        case 'ArrowDown':
          e.preventDefault()
          { const v = Math.max(0, (p.getVolume?.() || 100) - 5); p.setVolume(v); setVolume(v) }
          break
        case 'f': case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm': case 'M':
          e.preventDefault()
          p.isMuted?.() ? (p.unMute?.(), setMuted(false)) : (p.mute?.(), setMuted(true))
          break
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
          e.preventDefault()
          { const d = p.getDuration?.() || 0; if (d) p.seekTo(d * (parseInt(e.key) / 10), true) }
          break
        default: return
      }
      showControlsTemporarily()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showControlsTemporarily]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }, [])

  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.() ?? (el as any).webkitRequestFullscreen?.()
    } else {
      document.exitFullscreen?.() ?? (document as any).webkitExitFullscreen?.()
    }
  }, [])

  const togglePlayPause = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    pStateRef.current === 'playing' ? p.pauseVideo() : p.playVideo()
    showControlsTemporarily()
  }, [showControlsTemporarily])

  const handleSeekClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const bar = seekBarRef.current
    const p = playerRef.current
    if (!bar || !p) return
    const rect = bar.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const target = frac * (p.getDuration() || 0)
    p.seekTo(target, true)
    setTime(target)
  }, [])

  const handleOverlayDoubleClick = useCallback((e: React.MouseEvent) => {
    const p = playerRef.current
    if (!p) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const third = rect.width / 3
    if (x < third) p.seekTo(Math.max(0, p.getCurrentTime() - 10), true)
    else if (x > third * 2) p.seekTo(p.getCurrentTime() + 10, true)
  }, [])

  const handleTouchTap = useCallback((e: React.TouchEvent) => {
    const t = e.changedTouches[0]
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = t.clientX - rect.left
    const third = rect.width / 3
    const zone = x < third ? 'left' : x > third * 2 ? 'right' : 'mid'
    const now = Date.now()
    const last = lastTapRef.current
    if (now - last.time < 300 && last.zone === zone) {
      const p = playerRef.current
      if (p) {
        if (zone === 'left') p.seekTo(Math.max(0, p.getCurrentTime() - 10), true)
        else if (zone === 'right') p.seekTo(p.getCurrentTime() + 10, true)
      }
      lastTapRef.current = { time: 0, zone: '' }
    } else {
      lastTapRef.current = { time: now, zone }
      togglePlayPause()
    }
  }, [togglePlayPause])

  const setVolumeUI = useCallback((v: number) => {
    const p = playerRef.current
    if (!p) return
    p.setVolume(v)
    setVolume(v)
    if (v === 0) { p.mute?.(); setMuted(true) }
    else { p.unMute?.(); setMuted(false) }
  }, [])

  const toggleMute = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (p.isMuted?.()) { p.unMute?.(); setMuted(false) }
    else { p.mute?.(); setMuted(true) }
  }, [])

  const setPlaybackRate = useCallback((r: number) => {
    playerRef.current?.setPlaybackRate(r)
    setRate(r)
    setShowSettings(false)
  }, [])

  const timeFrac = duration > 0 ? time / duration : 0
  const volIcon = muted || volume === 0 ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up'

  // States that require showing the cover (hide YouTube UI completely)
  const showCover = pState === 'unstarted' || pState === 'paused'

  return (
    <div
      ref={wrapperRef}
      className="relative w-full bg-black select-none overflow-hidden"
      style={{ aspectRatio: '16/9' }}
      onMouseMove={showControlsTemporarily}
      onContextMenu={e => e.preventDefault()}
    >
      {/* YT iframe target — YouTube API replaces this div with an iframe */}
      <div id={playerIdRef.current} className="absolute inset-0 z-[1] w-full h-full" />

      {/* ── ALWAYS-ON click-catcher — no YouTube chrome ever receives a direct click ── */}
      <div
        className="absolute inset-0 z-[2] cursor-pointer"
        onClick={pState === 'ended' || pState === 'error' ? undefined : togglePlayPause}
        onDoubleClick={pState !== 'ended' && pState !== 'error' ? handleOverlayDoubleClick : undefined}
        onContextMenu={e => e.preventDefault()}
        onMouseMove={showControlsTemporarily}
        onTouchEnd={pState !== 'ended' && pState !== 'error' ? handleTouchTap : undefined}
      />

      {/* ── Pause / unstarted cover — completely hides YouTube UI when not playing ── */}
      {showCover && (
        <div className="absolute inset-0 z-[3] flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.72)' }}>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center transition-transform"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
          >
            <span
              className="material-symbols-outlined text-white ml-1"
              style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}
            >
              play_arrow
            </span>
          </div>
        </div>
      )}

      {/* ── Buffering spinner ── */}
      {pState === 'buffering' && (
        <div className="absolute inset-0 z-[3] flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="w-12 h-12 rounded-full border-[3px] border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* ── Error overlay ── */}
      {pState === 'error' && errorMsg && (
        <div className="absolute inset-0 z-[4] flex flex-col items-center justify-center gap-3 bg-black/95">
          <span className="material-symbols-outlined text-[44px] text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <p className="text-white/70 text-sm text-center px-8 max-w-xs">{errorMsg}</p>
          <p className="text-white/30 text-xs text-center px-4">Ensure "Allow embedding" is checked in YouTube Studio for this video.</p>
        </div>
      )}

      {/* ── End card — replaces YouTube's related-video grid ── */}
      {pState === 'ended' && (
        <div className="absolute inset-0 z-[4] flex flex-col items-center justify-center gap-5 bg-black/90">
          <span className="material-symbols-outlined text-[56px] text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <p className="text-white/80 font-semibold">Lesson complete</p>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => { playerRef.current?.seekTo(0, true); playerRef.current?.playVideo(); updatePState('playing') }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            >
              <span className="material-symbols-outlined text-[18px]">replay</span>
              Replay
            </button>
            {hasNextLesson && onNextLesson && (
              <button
                onClick={onNextLesson}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: 'var(--terracotta)' }}
              >
                Next Lesson
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Watermark — slowly drifts position every 25s ── */}
      {watermarkText && (
        <div
          className="absolute z-[5] pointer-events-none"
          style={{ top: wmPos.top, left: wmPos.left, opacity: wmVisible ? 0.28 : 0, transition: 'opacity 0.7s ease' }}
        >
          <p className="text-white text-[11px] font-mono whitespace-nowrap" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {watermarkText}
          </p>
        </div>
      )}

      {/* ── Custom controls — always on top ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[6]"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 65%, transparent 100%)',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
          padding: '44px 14px 12px',
        }}
      >
        {/* Seek bar */}
        <div
          ref={seekBarRef}
          className="relative h-[5px] rounded-full cursor-pointer mb-3 group"
          style={{ background: 'rgba(255,255,255,0.2)' }}
          onClick={handleSeekClick}
          onTouchStart={handleSeekClick}
        >
          <div className="absolute left-0 top-0 h-full rounded-full pointer-events-none"
            style={{ width: `${buffered * 100}%`, background: 'rgba(255,255,255,0.38)' }} />
          <div className="absolute left-0 top-0 h-full rounded-full pointer-events-none"
            style={{ width: `${timeFrac * 100}%`, background: 'var(--terracotta)' }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${timeFrac * 100}% - 7px)` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-1.5">
          <button onClick={togglePlayPause} className="w-9 h-9 flex items-center justify-center text-white hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {pState === 'playing' ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button onClick={toggleMute} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">{volIcon}</span>
          </button>
          <input
            type="range" min={0} max={100} value={muted ? 0 : volume}
            onChange={e => setVolumeUI(Number(e.target.value))}
            className="w-20 hidden sm:block h-1 rounded-full cursor-pointer"
            style={{ accentColor: 'var(--terracotta)' }}
          />

          <span className="text-white/60 text-[11px] tabular-nums ml-1 whitespace-nowrap">
            {fmtTime(time)} / {fmtTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Speed */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(s => !s)}
              className="h-8 px-2.5 flex items-center justify-center text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-all text-[12px] font-bold"
            >
              {rate}x
            </button>
            {showSettings && (
              <div
                className="absolute bottom-10 right-0 z-50 rounded-xl overflow-hidden border"
                style={{ background: 'rgba(10,9,24,0.97)', borderColor: 'rgba(255,255,255,0.1)', minWidth: 128 }}
              >
                <div className="px-3 py-2 text-[10px] text-white/40 font-semibold tracking-widest uppercase border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}>Speed</div>
                {rates.map(r => (
                  <button key={r} onClick={() => setPlaybackRate(r)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${rate === r ? 'text-white font-semibold' : 'text-white/55 hover:text-white hover:bg-white/5'}`}>
                    {r === 1 ? 'Normal' : `${r}x`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={toggleFullscreen} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

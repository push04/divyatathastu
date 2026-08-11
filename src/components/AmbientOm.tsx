'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/components/ui/Icon'
import { useLanguage } from '@/components/i18n/LanguageProvider'

/* ═══════════════════════════════════════════════════════════════════════════
   AMBIENT OM

   A continuous, low tanpura-style drone for the whole site.

   Synthesised with the Web Audio API rather than streamed from an mp3:
     · no asset to download, so it costs nothing on first paint
     · genuinely seamless - a looped file always seams somewhere
     · a few hundred bytes of code instead of a few hundred kB of audio

   Tuning is Sa = C#2 (136.1 Hz), the pitch conventionally associated with Om,
   with its fifth and octave layered above and a pair of slightly detuned
   voices for warmth. Two very slow LFOs breathe the amplitude and open and
   close the filter so it never sits perfectly still - that stillness is what
   makes synthetic drones feel cheap.

   ── On autoplay ──
   Browsers block audio until the user has interacted with the page, so this
   genuinely cannot start "on open" for a first-time visitor and no amount of
   code changes that. What it does instead: try immediately, and if the
   browser refuses, arm a one-shot listener and start on the very first click,
   key press, scroll or tap. In practice that is the first thing anyone does.
   ═══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'mt_ambient_sound'

const MASTER_GAIN = 0.055   // deliberately low - this sits under the content
const FADE_IN_SEC = 4.0     // long, so it arrives rather than starts
const FADE_OUT_SEC = 0.7

const SA = 136.1            // C#2

/** [frequency, relative gain, waveform] */
const PARTIALS: Array<[number, number, OscillatorType]> = [
  [SA / 2,        0.28, 'sine'],      // sub-octave body
  [SA,            1.00, 'sine'],      // Sa
  [SA * 1.004,    0.42, 'sine'],      // detuned twin -> slow chorus beat
  [SA * 1.5,      0.30, 'sine'],      // Pa, the fifth
  [SA * 2,        0.20, 'triangle'],  // upper Sa, a little harmonic edge
  [SA * 3,        0.05, 'sine'],      // faint shimmer
]

interface Engine {
  ctx: AudioContext
  master: GainNode
  stop: () => void
}

function readPref(): boolean {
  if (typeof window === 'undefined') return true
  try {
    // Default ON; only an explicit opt-out is remembered.
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true // Safari private mode throws on storage access
  }
}

function writePref(on: boolean) {
  try { window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off') } catch { /* private mode */ }
}

function buildEngine(): Engine | null {
  const Ctor: typeof AudioContext | undefined =
    typeof window !== 'undefined'
      ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined
  if (!Ctor) return null

  const ctx = new Ctor()

  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  // Breathing amplitude, driven by a very slow LFO added around a base of 1.
  const breath = ctx.createGain()
  breath.gain.value = 1
  breath.connect(master)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 720
  filter.Q.value = 0.6
  filter.connect(breath)

  const nodes: Array<OscillatorNode> = []

  for (const [freq, gain, type] of PARTIALS) {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = gain
    osc.connect(g)
    g.connect(filter)
    osc.start()
    nodes.push(osc)
  }

  // ── LFO 1: amplitude, ~17 s period ──
  const ampLfo = ctx.createOscillator()
  ampLfo.frequency.value = 0.058
  const ampDepth = ctx.createGain()
  ampDepth.gain.value = 0.17
  ampLfo.connect(ampDepth)
  ampDepth.connect(breath.gain)
  ampLfo.start()
  nodes.push(ampLfo)

  // ── LFO 2: filter cutoff, ~43 s period, so the two never line up ──
  const filtLfo = ctx.createOscillator()
  filtLfo.frequency.value = 0.023
  const filtDepth = ctx.createGain()
  filtDepth.gain.value = 190
  filtLfo.connect(filtDepth)
  filtDepth.connect(filter.frequency)
  filtLfo.start()
  nodes.push(filtLfo)

  return {
    ctx,
    master,
    stop: () => {
      nodes.forEach(n => { try { n.stop() } catch { /* already stopped */ } })
      void ctx.close().catch(() => {})
    },
  }
}

export default function AmbientOm() {
  const { t } = useLanguage()
  const engineRef = useRef<Engine | null>(null)
  const armedRef = useRef(false)
  /** What the user currently wants, readable from inside timers/callbacks. */
  const desiredRef = useRef(false)

  const [enabled, setEnabled] = useState(false) // set from storage after mount
  const [playing, setPlaying] = useState(false)
  const [awaitingGesture, setAwaitingGesture] = useState(false)
  const [mounted, setMounted] = useState(false)

  const fadeTo = useCallback((value: number, seconds: number) => {
    const eng = engineRef.current
    if (!eng) return
    const now = eng.ctx.currentTime
    eng.master.gain.cancelScheduledValues(now)
    eng.master.gain.setValueAtTime(eng.master.gain.value, now)
    eng.master.gain.linearRampToValueAtTime(value, now + seconds)
  }, [])

  /** Returns false when the browser refused to start audio. */
  const start = useCallback(async (): Promise<boolean> => {
    desiredRef.current = true
    if (!engineRef.current) engineRef.current = buildEngine()
    const eng = engineRef.current
    if (!eng) return false

    try {
      if (eng.ctx.state === 'suspended') await eng.ctx.resume()
    } catch {
      return false
    }
    if (eng.ctx.state !== 'running') return false

    fadeTo(MASTER_GAIN, FADE_IN_SEC)
    setPlaying(true)
    setAwaitingGesture(false)
    return true
  }, [fadeTo])

  const stop = useCallback(() => {
    const eng = engineRef.current
    if (!eng) return
    desiredRef.current = false
    fadeTo(0, FADE_OUT_SEC)
    setPlaying(false)
    // Suspend once silent so a muted tab costs no CPU or battery. Gated on
    // `desiredRef` rather than the gain value: unmuting inside the fade window
    // would otherwise have this timer suspend a context that should be running,
    // leaving the button showing "on" with nothing audible.
    window.setTimeout(() => {
      if (!desiredRef.current) {
        void engineRef.current?.ctx.suspend().catch(() => {})
      }
    }, FADE_OUT_SEC * 1000 + 120)
  }, [fadeTo])

  // Read the stored preference after mount so server and client HTML match.
  useEffect(() => {
    setMounted(true)
    setEnabled(readPref())
  }, [])

  // Try to start, and fall back to the first user gesture if blocked.
  useEffect(() => {
    if (!mounted || !enabled) return

    let cancelled = false

    ;(async () => {
      const ok = await start()
      if (cancelled || ok || armedRef.current) return

      // Blocked by the autoplay policy - wait for any first interaction.
      armedRef.current = true
      setAwaitingGesture(true)

      const kick = async () => {
        const started = await start()
        if (started) detach()
      }
      const detach = () => {
        armedRef.current = false
        window.removeEventListener('pointerdown', kick)
        window.removeEventListener('keydown', kick)
        window.removeEventListener('touchstart', kick)
        window.removeEventListener('scroll', kick)
      }
      window.addEventListener('pointerdown', kick, { passive: true })
      window.addEventListener('keydown', kick)
      window.addEventListener('touchstart', kick, { passive: true })
      window.addEventListener('scroll', kick, { passive: true })
    })()

    return () => { cancelled = true }
  }, [mounted, enabled, start])

  // Never leave a drone playing in a tab nobody is looking at.
  useEffect(() => {
    function onVisibility() {
      const eng = engineRef.current
      if (!eng) return
      if (document.hidden) {
        void eng.ctx.suspend().catch(() => {})
      } else if (desiredRef.current && enabled && playing) {
        void eng.ctx.resume().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [enabled, playing])

  // Tear the graph down on unmount.
  useEffect(() => () => { engineRef.current?.stop(); engineRef.current = null }, [])

  const toggle = useCallback(() => {
    const next = !enabled
    setEnabled(next)
    writePref(next)
    if (next) void start()
    else { stop(); setAwaitingGesture(false) }
  }, [enabled, start, stop])

  // Nothing server-rendered: the correct icon depends on stored preference.
  if (!mounted) return null

  const isAudible = enabled && playing
  const label = isAudible ? t('sound.on') : t('sound.off')

  return (
    <div
      className="fixed z-[79] bottom-24 right-5 sm:bottom-28 sm:right-6 group"
      // The chat launcher sits at bottom-5/6; this rides just above it.
    >
      {/* Tooltip - hover on desktop, and on keyboard focus for parity */}
      <div
        role="tooltip"
        className="pointer-events-none absolute right-0 bottom-full mb-2.5 w-60 origin-bottom-right scale-95 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100"
      >
        <div
          className="rounded-2xl px-4 py-3 shadow-lg"
          style={{
            background: 'var(--surface-dark, #1B1233)',
            border: '1px solid rgba(201,153,46,0.35)',
          }}
        >
          <p
            className="mb-1 font-bold"
            style={{ fontFamily: 'var(--font-label)', fontSize: 13, color: 'var(--saffron, #C9992E)' }}
          >
            {t('sound.title')}
          </p>
          <p
            style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-on-dark-secondary, rgba(255,255,255,0.72))' }}
          >
            {awaitingGesture ? t('sound.tapToPlay') : t('sound.desc')}
          </p>
          <p
            className="mt-2 pt-2"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.10)',
              fontFamily: 'var(--font-label)',
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isAudible ? '#34d399' : 'rgba(255,255,255,0.45)',
            }}
          >
            {label}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-pressed={isAudible}
        title={label}
        className="flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          width: 42,
          height: 42,
          background: isAudible ? 'var(--indigo-deep, #1C1E4A)' : 'rgba(255,255,255,0.92)',
          border: `1px solid ${isAudible ? 'rgba(201,153,46,0.55)' : 'rgba(28,30,74,0.15)'}`,
          color: isAudible ? 'var(--saffron, #C9992E)' : 'rgba(28,30,74,0.5)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.14)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Icon name={isAudible ? 'volume_up' : 'volume_off'} size={19} />
        {/* A single soft ring while we wait for the first interaction, so the
            control reads as "armed" rather than broken. */}
        {awaitingGesture && (
          <span
            className="absolute inset-0 rounded-full animate-ping pointer-events-none"
            style={{ border: '1px solid rgba(201,153,46,0.5)', animationDuration: '2.4s' }}
          />
        )}
      </button>
    </div>
  )
}

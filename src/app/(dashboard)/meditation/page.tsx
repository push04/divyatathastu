'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '@/components/ui/Icon'
import {
  MANTRAS,
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  type Mantra,
  type MantraCategory,
} from '@/lib/meditation/library'
import {
  SOUNDSCAPES,
  SoundscapePlayer,
  claimExclusiveAudio,
  type ScapeKey,
} from '@/lib/audio/soundscapes'

/* ═══════════════════════════════════════════════════════════════════════════
   MEDITATION

   A practice space, deliberately distinct from /sadhana - that page sells
   guided programmes, this one is the room you actually sit in.

   Three things happen here and nothing else, so the page never competes with
   the practice for attention:
     · choose a shloka or mantra and read it properly (script, sound, sense)
     · choose an ambience and set its level
     · count a mala, or sit to a timer that opens and closes with a bell
   ═══════════════════════════════════════════════════════════════════════════ */

const VOL_KEY = 'mt_med_volume'
const SCAPE_KEY = 'mt_med_scape'
const DURATIONS = [5, 10, 15, 20, 30]

function fmtClock(totalSec: number) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function MeditationPage() {
  const playerRef = useRef<SoundscapePlayer | null>(null)

  const [category, setCategory] = useState<MantraCategory | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string>(MANTRAS[0].id)
  const [showMeaning, setShowMeaning] = useState(true)

  const [scape, setScape] = useState<ScapeKey | null>(null)
  const [volume, setVolume] = useState(0.5)
  const [audioBlocked, setAudioBlocked] = useState(false)

  const [count, setCount] = useState(0)
  const [rounds, setRounds] = useState(0)

  const [duration, setDuration] = useState(10)
  const [remaining, setRemaining] = useState<number | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selected: Mantra = useMemo(
    () => MANTRAS.find(m => m.id === selectedId) ?? MANTRAS[0],
    [selectedId],
  )
  const visible = useMemo(
    () => (category === 'all' ? MANTRAS : MANTRAS.filter(m => m.category === category)),
    [category],
  )

  // ── audio ────────────────────────────────────────────────────────────────
  useEffect(() => {
    playerRef.current = new SoundscapePlayer()
    try {
      const v = localStorage.getItem(VOL_KEY)
      if (v !== null) setVolume(Math.max(0, Math.min(1, Number(v))))
    } catch { /* private mode */ }
    return () => {
      playerRef.current?.destroy()
      playerRef.current = null
      claimExclusiveAudio(false) // let the site-wide drone resume
    }
  }, [])

  const chooseScape = useCallback(async (key: ScapeKey | null) => {
    const p = playerRef.current
    if (!p) return

    if (key === null) {
      p.stop()
      setScape(null)
      claimExclusiveAudio(false)
      try { localStorage.removeItem(SCAPE_KEY) } catch { /* private mode */ }
      return
    }

    // Silence the global Om first so the two are never audible together.
    claimExclusiveAudio(true)
    p.setVolume(volume, 0)
    const ok = await p.play(key)
    setAudioBlocked(!ok)
    if (ok) {
      setScape(key)
      try { localStorage.setItem(SCAPE_KEY, key) } catch { /* private mode */ }
    } else {
      claimExclusiveAudio(false)
    }
  }, [volume])

  function changeVolume(v: number) {
    setVolume(v)
    playerRef.current?.setVolume(v)
    try { localStorage.setItem(VOL_KEY, String(v)) } catch { /* private mode */ }
  }

  // ── mala counter ─────────────────────────────────────────────────────────
  function bead() {
    setCount(c => {
      const next = c + 1
      if (next >= 108) {
        setRounds(r => r + 1)
        playerRef.current?.chime(0.45) // a bell closes each mala
        return 0
      }
      return next
    })
  }

  function resetMala() {
    setCount(0)
    setRounds(0)
  }

  // ── sitting timer ────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
    setRemaining(null)
  }, [])

  function startTimer() {
    playerRef.current?.chime(0.5) // opening bell
    setRemaining(duration * 60)
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      setRemaining(r => {
        if (r === null) return null
        if (r <= 1) {
          if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
          playerRef.current?.chime(0.6) // closing bell
          return null
        }
        return r - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current) }, [])

  const timerPct = remaining !== null ? 1 - remaining / (duration * 60) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--kutch-white)' }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden" style={{ background: 'var(--indigo-deep)', padding: '30px 24px 26px' }}>
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1.5px, transparent 1.5px)',
          backgroundSize: '26px 26px',
        }} />
        <div className="relative max-w-6xl mx-auto">
          <p className="font-semibold tracking-widest uppercase mb-1.5"
            style={{ color: 'var(--saffron)', fontFamily: 'var(--font-label)', fontSize: 13 }}>
            Dhyana
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, color: 'white', lineHeight: 1.15 }}>
            Meditation
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-on-dark-secondary)', marginTop: 6, maxWidth: 620 }}>
            {MANTRAS.length} shlokas and mantras with their sound, sense and source — and an ambience to sit in.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

        {/* ══ LEFT: library ══ */}
        <div className="lg:col-span-2 space-y-4">

          {/* Category filter */}
          <div className="bg-white rounded-2xl border border-[var(--warm-sand)] shadow-sm p-4">
            <p className="mb-3" style={{ fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(28,30,74,0.4)' }}>
              Collections
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategory('all')}
                className="px-3 py-1.5 rounded-full font-semibold transition-all"
                style={{
                  fontSize: 13,
                  fontFamily: 'var(--font-label)',
                  background: category === 'all' ? 'var(--indigo-deep)' : 'var(--warm-sand)',
                  color: category === 'all' ? 'white' : 'var(--warm-charcoal)',
                }}
              >
                All {MANTRAS.length}
              </button>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all"
                  style={{
                    fontSize: 13,
                    fontFamily: 'var(--font-label)',
                    background: category === c ? 'var(--indigo-deep)' : 'var(--warm-sand)',
                    color: category === c ? 'white' : 'var(--warm-charcoal)',
                  }}
                >
                  <Icon name={CATEGORY_ICONS[c]} size={14} />
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Mantra list */}
          <div className="bg-white rounded-2xl border border-[var(--warm-sand)] shadow-sm p-3 space-y-1.5 max-h-[560px] overflow-y-auto">
            {visible.map(m => {
              const active = m.id === selected.id
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className="w-full text-left rounded-xl px-3.5 py-3 transition-all"
                  style={{
                    background: active ? 'rgba(198,125,83,0.12)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(198,125,83,0.4)' : 'transparent'}`,
                  }}
                >
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: active ? 'var(--terracotta)' : 'var(--indigo-deep)', lineHeight: 1.3 }}>
                    {m.title}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(28,30,74,0.55)', marginTop: 2 }}>
                    {m.subtitle}
                  </p>
                  <p style={{ fontFamily: 'var(--font-label)', fontSize: 11.5, color: 'rgba(28,30,74,0.38)', marginTop: 4 }}>
                    {m.source}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ══ RIGHT: the practice ══ */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── The verse ── */}
          <div className="bg-white rounded-2xl border border-[var(--warm-sand)] shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-5">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--indigo-deep)', lineHeight: 1.2 }}>
                    {selected.title}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'rgba(28,30,74,0.55)', marginTop: 3 }}>
                    {selected.subtitle}
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-full font-bold whitespace-nowrap"
                  style={{ fontSize: 12.5, fontFamily: 'var(--font-label)', background: 'var(--warm-sand)', color: 'var(--terracotta)' }}>
                  {selected.count === 1 ? 'once' : `${selected.count}×`}
                </span>
              </div>

              {/* Devanagari — the reason this page exists, so it gets the room */}
              <div className="mt-5 rounded-2xl px-5 py-6"
                style={{ background: 'linear-gradient(160deg, rgba(201,153,46,0.09), rgba(198,125,83,0.06))', border: '1px solid rgba(201,153,46,0.25)' }}>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(20px, 2.6vw, 27px)',
                  fontWeight: 600,
                  lineHeight: 1.95,
                  color: 'var(--indigo-deep)',
                  whiteSpace: 'pre-line',
                  textAlign: 'center',
                }}>
                  {selected.devanagari}
                </p>
              </div>

              {/* Transliteration */}
              <p className="mt-4" style={{
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontSize: 15,
                lineHeight: 1.9,
                color: 'rgba(28,30,74,0.72)',
                whiteSpace: 'pre-line',
                textAlign: 'center',
              }}>
                {selected.transliteration}
              </p>

              {/* Meaning — collapsible, because during practice you want it gone */}
              <button
                onClick={() => setShowMeaning(v => !v)}
                className="mt-5 inline-flex items-center gap-1.5 font-semibold"
                style={{ fontFamily: 'var(--font-label)', fontSize: 13, color: 'var(--terracotta)' }}
              >
                <Icon name={showMeaning ? 'expand_less' : 'expand_more'} size={16} />
                {showMeaning ? 'Hide meaning' : 'Show meaning'}
              </button>

              {showMeaning && (
                <div className="mt-3 space-y-3">
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7, color: 'rgba(28,30,74,0.78)' }}>
                    {selected.meaning}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {[
                      { icon: 'menu_book', label: 'Source', value: selected.source },
                      { icon: 'schedule', label: 'Traditionally', value: selected.bestTime },
                    ].map(x => (
                      <div key={x.label} className="rounded-xl px-3.5 py-3" style={{ background: 'var(--warm-sand)' }}>
                        <p className="inline-flex items-center gap-1.5 mb-1"
                          style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(28,30,74,0.45)' }}>
                          <Icon name={x.icon} size={13} /> {x.label}
                        </p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--indigo-deep)', lineHeight: 1.5 }}>{x.value}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'rgba(28,30,74,0.55)', lineHeight: 1.6 }}>
                    {selected.benefit}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Ambience ── */}
          <div className="bg-white rounded-2xl border border-[var(--warm-sand)] shadow-sm p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <h3 className="inline-flex items-center gap-2" style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: 'var(--indigo-deep)' }}>
                <Icon name="volume_up" size={18} className="text-[var(--saffron)]" />
                Ambience
              </h3>
              {scape && (
                <button onClick={() => chooseScape(null)}
                  className="inline-flex items-center gap-1.5 font-semibold"
                  style={{ fontFamily: 'var(--font-label)', fontSize: 13, color: 'var(--terracotta)' }}>
                  <Icon name="volume_off" size={15} /> Silence
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SOUNDSCAPES.map(s => {
                const active = scape === s.key
                return (
                  <button
                    key={s.key}
                    onClick={() => chooseScape(active ? null : s.key)}
                    title={s.hint}
                    className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3.5 transition-all hover:scale-[1.03]"
                    style={{
                      background: active ? 'var(--indigo-deep)' : 'var(--warm-sand)',
                      border: `1px solid ${active ? 'rgba(201,153,46,0.6)' : 'transparent'}`,
                      color: active ? 'var(--saffron)' : 'var(--warm-charcoal)',
                    }}
                  >
                    <Icon name={s.icon} size={20} />
                    <span style={{ fontFamily: 'var(--font-label)', fontSize: 12.5, fontWeight: 600, textAlign: 'center', lineHeight: 1.25 }}>
                      {s.name}
                    </span>
                  </button>
                )
              })}
            </div>

            {audioBlocked && (
              <p className="mt-3 flex items-start gap-1.5" style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#b45309' }}>
                <Icon name="info" size={15} className="flex-shrink-0 mt-0.5" />
                Your browser blocked audio. Tap any ambience again to start it.
              </p>
            )}

            <div className="flex items-center gap-3 mt-4">
              <Icon name="volume_off" size={16} style={{ color: 'rgba(28,30,74,0.35)' }} />
              <input
                type="range" min={0} max={1} step={0.01} value={volume}
                onChange={e => changeVolume(Number(e.target.value))}
                aria-label="Ambience volume"
                className="flex-1 accent-[var(--terracotta)]"
              />
              <Icon name="volume_up" size={16} style={{ color: 'rgba(28,30,74,0.35)' }} />
              <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'rgba(28,30,74,0.5)', width: 34, textAlign: 'right' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* ── Mala + timer ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Mala counter */}
            <div className="bg-white rounded-2xl border border-[var(--warm-sand)] shadow-sm p-5 flex flex-col">
              <h3 className="inline-flex items-center gap-2 mb-3" style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: 'var(--indigo-deep)' }}>
                <Icon name="mantra" size={18} className="text-[var(--terracotta)]" />
                Japa Mala
              </h3>

              <button
                onClick={bead}
                className="relative mx-auto flex items-center justify-center rounded-full transition-transform active:scale-95"
                style={{
                  width: 132, height: 132,
                  background: 'radial-gradient(circle at 35% 30%, rgba(201,153,46,0.20), var(--warm-sand))',
                  border: '2px solid rgba(201,153,46,0.45)',
                }}
                aria-label={`Count bead. ${count} of 108`}
              >
                <div className="text-center">
                  <span className="block tabular-nums" style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 700, color: 'var(--indigo-deep)', lineHeight: 1 }}>
                    {count}
                  </span>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: 11.5, color: 'rgba(28,30,74,0.45)', letterSpacing: '0.1em' }}>
                    / 108
                  </span>
                </div>
              </button>

              <div className="flex items-center justify-between mt-4">
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'rgba(28,30,74,0.6)' }}>
                  {rounds} mala{rounds === 1 ? '' : 's'} complete
                </span>
                <button onClick={resetMala}
                  style={{ fontFamily: 'var(--font-label)', fontSize: 12.5, color: 'var(--terracotta)' }}
                  className="hover:underline font-semibold">
                  Reset
                </button>
              </div>
            </div>

            {/* Sitting timer */}
            <div className="bg-white rounded-2xl border border-[var(--warm-sand)] shadow-sm p-5 flex flex-col">
              <h3 className="inline-flex items-center gap-2 mb-3" style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: 'var(--indigo-deep)' }}>
                <Icon name="timer" size={18} className="text-[var(--saffron)]" />
                Sitting
              </h3>

              {remaining === null ? (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {DURATIONS.map(d => (
                      <button key={d} onClick={() => setDuration(d)}
                        className="px-3 py-1.5 rounded-full font-semibold transition-all"
                        style={{
                          fontSize: 13, fontFamily: 'var(--font-label)',
                          background: duration === d ? 'var(--indigo-deep)' : 'var(--warm-sand)',
                          color: duration === d ? 'white' : 'var(--warm-charcoal)',
                        }}>
                        {d}m
                      </button>
                    ))}
                  </div>
                  <button onClick={startTimer} className="btn-divine w-full py-3 text-sm mt-auto inline-flex items-center justify-center gap-2">
                    <Icon name="play_circle" size={18} />
                    Begin {duration} minutes
                  </button>
                  <p className="mt-2" style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'rgba(28,30,74,0.45)', lineHeight: 1.5 }}>
                    A bell opens and closes the sitting.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex-1 flex flex-col items-center justify-center py-2">
                    <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 42, fontWeight: 700, color: 'var(--indigo-deep)', lineHeight: 1 }}>
                      {fmtClock(remaining)}
                    </span>
                    <div className="w-full h-1.5 rounded-full mt-4 overflow-hidden" style={{ background: 'var(--warm-sand)' }}>
                      <div className="h-full rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${timerPct * 100}%`, background: 'linear-gradient(90deg, var(--terracotta), var(--saffron))' }} />
                    </div>
                  </div>
                  <button onClick={stopTimer}
                    className="w-full py-2.5 rounded-xl font-semibold text-sm mt-3 transition-colors"
                    style={{ background: 'var(--warm-sand)', color: 'var(--warm-charcoal)' }}>
                    End early
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="text-center" style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'rgba(28,30,74,0.4)', lineHeight: 1.6 }}>
            Every ambience here is generated live in your browser — nothing is downloaded, and no two sittings sound the same.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SOUNDSCAPES

   Every ambience on the site is synthesised with the Web Audio API. Nothing
   is streamed or bundled, which matters here more than usual: eight loopable
   ambiences as audio files would be 40-80 MB, would seam audibly on loop, and
   would each cost a network round trip. This whole module is a few kB and
   runs forever without repeating.

   Three families of sound, built three ways:
     · DRONES  - continuous detuned oscillator stacks (Om, tanpura body)
     · NOISE   - a looping pink-noise buffer shaped by moving filters
                 (rain, river, wind)
     · EVENTS  - short enveloped voices scheduled on a timer
                 (temple bells, singing bowl, tanpura plucks)

   Non-commensurate LFO periods throughout, so nothing ever lines up into an
   audible loop.
   ═══════════════════════════════════════════════════════════════════════════ */

export type ScapeKey = 'om' | 'tanpura' | 'rain' | 'river' | 'wind' | 'bells' | 'bowl'

export interface ScapeHandle {
  /** Node to connect into the player's master gain. */
  output: AudioNode
  /** Tear down oscillators, buffers and any timers. */
  stop: () => void
}

export interface ScapeDef {
  key: ScapeKey
  name: string
  hint: string
  icon: string
  build: (ctx: AudioContext) => ScapeHandle
  /**
   * Optional path to a looping recording under /public. When present it is
   * used INSTEAD of `build`, and `build` stays as the fallback if the file
   * fails to load.
   *
   * Why both: for the tonal scapes synthesis is not a compromise but the
   * correct method - a singing bowl genuinely is inharmonic partials decaying
   * at different rates. For rain, river and wind a real field recording is
   * simply better than filtered noise, so those three are the ones worth
   * upgrading. Drop an mp3 in /public/soundscapes and set `file` here; nothing
   * else has to change.
   */
  file?: string
}

/** Sa = C#2, the pitch conventionally associated with Om. */
export const SA = 136.1

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * A few seconds of pink noise, looped. Pink (not white) because its -3dB/octave
 * slope is what natural sounds like rain and wind actually have; white noise
 * reads as tape hiss.  Paul Kellet's approximation.
 */
function pinkNoiseBuffer(ctx: AudioContext, seconds = 6): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + w * 0.0555179
    b1 = 0.99332 * b1 + w * 0.0750759
    b2 = 0.969 * b2 + w * 0.153852
    b3 = 0.8665 * b3 + w * 0.3104856
    b4 = 0.55 * b4 + w * 0.5329522
    b5 = -0.7616 * b5 - w * 0.016898
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
    b6 = w * 0.115926
  }
  return buf
}

function noiseSource(ctx: AudioContext): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = pinkNoiseBuffer(ctx)
  src.loop = true
  src.start()
  return src
}

/** An LFO wired to modulate `target` around its current value. */
function lfo(ctx: AudioContext, rateHz: number, depth: number, target: AudioParam): OscillatorNode {
  const osc = ctx.createOscillator()
  osc.frequency.value = rateHz
  const g = ctx.createGain()
  g.gain.value = depth
  osc.connect(g)
  g.connect(target)
  osc.start()
  return osc
}

/**
 * A struck voice: inharmonic partials with exponential decay. Bells and bowls
 * are inharmonic - that is precisely why they sound like metal rather than an
 * organ - so the ratios below are deliberately not integers.
 */
function strike(
  ctx: AudioContext,
  out: AudioNode,
  fundamental: number,
  partials: number[],
  decay: number,
  level: number,
) {
  const t = ctx.currentTime
  partials.forEach((ratio, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = fundamental * ratio
    // Slight detune so the partials beat gently against each other.
    osc.detune.value = (i % 2 ? 1 : -1) * (i * 1.7)

    const g = ctx.createGain()
    const amp = (level / (i + 1.6)) // upper partials quieter
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(amp, t + 0.012)          // fast attack
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay * (1 - i * 0.12))

    osc.connect(g)
    g.connect(out)
    osc.start(t)
    osc.stop(t + decay + 0.4)
  })
}

/** Repeating scheduler that cleans up after itself. */
function every(ms: number, fn: () => void, immediate = true): () => void {
  if (immediate) fn()
  const id = window.setInterval(fn, ms)
  return () => window.clearInterval(id)
}

// ── the scapes ─────────────────────────────────────────────────────────────

function buildOm(ctx: AudioContext): ScapeHandle {
  const out = ctx.createGain()
  out.gain.value = 1

  const breath = ctx.createGain()
  breath.gain.value = 1
  breath.connect(out)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 720
  filter.Q.value = 0.6
  filter.connect(breath)

  const nodes: OscillatorNode[] = []
  const partials: Array<[number, number, OscillatorType]> = [
    [SA / 2, 0.28, 'sine'],
    [SA, 1.0, 'sine'],
    [SA * 1.004, 0.42, 'sine'],
    [SA * 1.5, 0.3, 'sine'],
    [SA * 2, 0.2, 'triangle'],
    [SA * 3, 0.05, 'sine'],
  ]
  for (const [f, g, type] of partials) {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = f
    const gain = ctx.createGain()
    gain.gain.value = g
    osc.connect(gain)
    gain.connect(filter)
    osc.start()
    nodes.push(osc)
  }
  nodes.push(lfo(ctx, 0.058, 0.17, breath.gain))
  nodes.push(lfo(ctx, 0.023, 190, filter.frequency))

  return {
    output: out,
    stop: () => nodes.forEach(n => { try { n.stop() } catch { /* already stopped */ } }),
  }
}

function buildTanpura(ctx: AudioContext): ScapeHandle {
  const out = ctx.createGain()
  out.gain.value = 0.9

  // Quiet sustained body under the plucks so silence between strings is never
  // total - a real tanpura room never goes fully quiet.
  const body = ctx.createGain()
  body.gain.value = 0.16
  body.connect(out)
  const bodyOsc = ctx.createOscillator()
  bodyOsc.frequency.value = SA
  bodyOsc.type = 'sine'
  bodyOsc.connect(body)
  bodyOsc.start()

  const pluckBus = ctx.createGain()
  pluckBus.gain.value = 1
  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 1900
  tone.Q.value = 0.4
  pluckBus.connect(tone)
  tone.connect(out)

  // Classic tanpura cycle: Pa, Sa, Sa, Sa (lower octave on the last).
  const cycle = [SA * 1.5, SA * 2, SA * 2, SA]
  let i = 0
  const cancel = every(1450, () => {
    const f = cycle[i % cycle.length]
    i++
    strike(ctx, pluckBus, f, [1, 2, 3, 4.02, 5.04], 3.6, 0.30)
  })

  const wobble = lfo(ctx, 0.031, 220, tone.frequency)

  return {
    output: out,
    stop: () => {
      cancel()
      try { bodyOsc.stop() } catch { /* already stopped */ }
      try { wobble.stop() } catch { /* already stopped */ }
    },
  }
}

function buildRain(ctx: AudioContext): ScapeHandle {
  const out = ctx.createGain()
  out.gain.value = 1

  const src = noiseSource(ctx)

  // Two layers: a low "body" of falling water and a high "patter" on surfaces.
  const body = ctx.createBiquadFilter()
  body.type = 'lowpass'
  body.frequency.value = 900
  const bodyGain = ctx.createGain()
  bodyGain.gain.value = 0.55

  const patter = ctx.createBiquadFilter()
  patter.type = 'highpass'
  patter.frequency.value = 2200
  const patterGain = ctx.createGain()
  patterGain.gain.value = 0.32

  src.connect(body); body.connect(bodyGain); bodyGain.connect(out)
  src.connect(patter); patter.connect(patterGain); patterGain.connect(out)

  // Rain is never steady - shower intensity drifts.
  const l1 = lfo(ctx, 0.047, 0.16, bodyGain.gain)
  const l2 = lfo(ctx, 0.019, 0.12, patterGain.gain)
  const l3 = lfo(ctx, 0.013, 700, patter.frequency)

  return {
    output: out,
    stop: () => [src, l1, l2, l3].forEach(n => { try { n.stop() } catch { /* already stopped */ } }),
  }
}

function buildRiver(ctx: AudioContext): ScapeHandle {
  const out = ctx.createGain()
  out.gain.value = 1

  const src = noiseSource(ctx)

  const flow = ctx.createBiquadFilter()
  flow.type = 'lowpass'
  flow.frequency.value = 620
  flow.Q.value = 0.7
  const flowGain = ctx.createGain()
  flowGain.gain.value = 0.75

  // A narrow resonant band gives the gurgle of water over stones.
  const gurgle = ctx.createBiquadFilter()
  gurgle.type = 'bandpass'
  gurgle.frequency.value = 340
  gurgle.Q.value = 3.2
  const gurgleGain = ctx.createGain()
  gurgleGain.gain.value = 0.30

  src.connect(flow); flow.connect(flowGain); flowGain.connect(out)
  src.connect(gurgle); gurgle.connect(gurgleGain); gurgleGain.connect(out)

  const l1 = lfo(ctx, 0.037, 210, flow.frequency)
  const l2 = lfo(ctx, 0.021, 120, gurgle.frequency)
  const l3 = lfo(ctx, 0.011, 0.10, flowGain.gain)

  return {
    output: out,
    stop: () => [src, l1, l2, l3].forEach(n => { try { n.stop() } catch { /* already stopped */ } }),
  }
}

function buildWind(ctx: AudioContext): ScapeHandle {
  const out = ctx.createGain()
  out.gain.value = 1

  const src = noiseSource(ctx)

  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 480
  band.Q.value = 1.9
  const g = ctx.createGain()
  g.gain.value = 0.8

  src.connect(band); band.connect(g); g.connect(out)

  // Gusts: a slow sweep of the band plus a slower swell of level.
  const l1 = lfo(ctx, 0.029, 320, band.frequency)
  const l2 = lfo(ctx, 0.017, 0.30, g.gain)
  const l3 = lfo(ctx, 0.007, 160, band.frequency)

  return {
    output: out,
    stop: () => [src, l1, l2, l3].forEach(n => { try { n.stop() } catch { /* already stopped */ } }),
  }
}

function buildBells(ctx: AudioContext): ScapeHandle {
  const out = ctx.createGain()
  out.gain.value = 1

  // A breath of air under the bells so the gaps are not dead silence.
  const src = noiseSource(ctx)
  const air = ctx.createBiquadFilter()
  air.type = 'lowpass'
  air.frequency.value = 300
  const airGain = ctx.createGain()
  airGain.gain.value = 0.10
  src.connect(air); air.connect(airGain); airGain.connect(out)

  const bellBus = ctx.createGain()
  bellBus.gain.value = 0.9
  bellBus.connect(out)

  // Temple bell partials are strongly inharmonic.
  let n = 0
  const cancel = every(13000, () => {
    const f = 262 * (n % 3 === 2 ? 0.75 : 1)   // occasional lower bell
    n++
    strike(ctx, bellBus, f, [1, 2.76, 5.4, 8.93], 7.5, 0.34)
  })

  return {
    output: out,
    stop: () => { cancel(); try { src.stop() } catch { /* already stopped */ } },
  }
}

function buildBowl(ctx: AudioContext): ScapeHandle {
  const out = ctx.createGain()
  out.gain.value = 1

  // Singing bowls sustain far longer and sit lower than temple bells.
  const bus = ctx.createGain()
  bus.gain.value = 0.85
  const warm = ctx.createBiquadFilter()
  warm.type = 'lowpass'
  warm.frequency.value = 1400
  bus.connect(warm)
  warm.connect(out)

  const cancel = every(21000, () => {
    strike(ctx, bus, 174, [1, 2.32, 4.25, 6.63], 13, 0.34)
  })

  return {
    output: out,
    stop: () => cancel(),
  }
}

export const SOUNDSCAPES: ScapeDef[] = [
  { key: 'om',      name: 'Om Drone',     hint: 'Sa · 136.1 Hz, the Om pitch',      icon: 'yantra',       build: buildOm },
  { key: 'tanpura', name: 'Tanpura',      hint: 'Pa Sa Sa Sa, plucked slowly',      icon: 'mantra',       build: buildTanpura },
  { key: 'bowl',    name: 'Singing Bowl', hint: 'A long bowl every 21 seconds',     icon: 'kalash',       build: buildBowl },
  { key: 'bells',   name: 'Temple Bells', hint: 'Distant bells over still air',     icon: 'shikhara',     build: buildBells },
  { key: 'rain',    name: 'Rain',         hint: 'Steady monsoon rain',              icon: 'water_drop',   build: buildRain },
  { key: 'river',   name: 'River',        hint: 'Water over stones',                icon: 'waves',        build: buildRiver },
  { key: 'wind',    name: 'Mountain Wind',hint: 'Slow gusts across open ground',    icon: 'air',          build: buildWind },
]

export function scapeByKey(key: ScapeKey): ScapeDef | undefined {
  return SOUNDSCAPES.find(s => s.key === key)
}

// ── player ─────────────────────────────────────────────────────────────────

/**
 * Owns one AudioContext and crossfades between scapes. Volume changes and
 * scape switches are always ramped - an instant gain change on a running
 * oscillator is an audible click.
 */
export class SoundscapePlayer {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private current: ScapeHandle | null = null
  private currentGain: GainNode | null = null
  private volume = 0.5

  /** True once the browser has actually allowed audio to run. */
  get running(): boolean {
    return this.ctx?.state === 'running'
  }

  private ensure(): boolean {
    if (this.ctx) return true
    const Ctor: typeof AudioContext | undefined =
      typeof window !== 'undefined'
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined
    if (!Ctor) return false
    this.ctx = new Ctor()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(this.ctx.destination)
    return true
  }

  /**
   * Stream a looping recording. Uses a media element rather than decoding the
   * whole file into memory, so a five-minute ambience starts immediately and
   * costs no heap.
   */
  private buildFromFile(ctx: AudioContext, src: string): ScapeHandle | null {
    try {
      const el = new Audio(src)
      el.loop = true
      el.crossOrigin = 'anonymous'
      el.preload = 'auto'
      const node = ctx.createMediaElementSource(el)
      const out = ctx.createGain()
      out.gain.value = 1
      node.connect(out)
      void el.play().catch(() => {})
      return {
        output: out,
        stop: () => { el.pause(); el.src = ''; try { node.disconnect() } catch { /* already gone */ } },
      }
    } catch {
      return null
    }
  }

  async play(key: ScapeKey, fadeSec = 2.5): Promise<boolean> {
    if (!this.ensure() || !this.ctx || !this.master) return false
    try {
      if (this.ctx.state === 'suspended') await this.ctx.resume()
    } catch {
      return false
    }
    if (this.ctx.state !== 'running') return false

    const def = scapeByKey(key)
    if (!def) return false

    this.fadeOutCurrent(fadeSec * 0.6)

    // A recording when one has been supplied, synthesis otherwise.
    const handle = (def.file ? this.buildFromFile(this.ctx, def.file) : null) ?? def.build(this.ctx)
    const g = this.ctx.createGain()
    g.gain.value = 0
    handle.output.connect(g)
    g.connect(this.master)

    const now = this.ctx.currentTime
    g.gain.linearRampToValueAtTime(1, now + fadeSec)
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(this.master.gain.value, now)
    this.master.gain.linearRampToValueAtTime(this.volume, now + fadeSec)

    this.current = handle
    this.currentGain = g
    return true
  }

  private fadeOutCurrent(fadeSec: number) {
    const handle = this.current
    const g = this.currentGain
    if (!handle || !g || !this.ctx) return
    const now = this.ctx.currentTime
    g.gain.cancelScheduledValues(now)
    g.gain.setValueAtTime(g.gain.value, now)
    g.gain.linearRampToValueAtTime(0, now + fadeSec)
    window.setTimeout(() => handle.stop(), fadeSec * 1000 + 150)
    this.current = null
    this.currentGain = null
  }

  setVolume(v: number, rampSec = 0.25) {
    this.volume = Math.max(0, Math.min(1, v))
    if (!this.ctx || !this.master) return
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(this.master.gain.value, now)
    this.master.gain.linearRampToValueAtTime(this.volume, now + rampSec)
  }

  stop(fadeSec = 1.2) {
    if (!this.ctx || !this.master) return
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(this.master.gain.value, now)
    this.master.gain.linearRampToValueAtTime(0, now + fadeSec)
    this.fadeOutCurrent(fadeSec)
    window.setTimeout(() => { void this.ctx?.suspend().catch(() => {}) }, fadeSec * 1000 + 200)
  }

  /** One-off bell, used to open and close a timed sitting. */
  chime(level = 0.5) {
    if (!this.ensure() || !this.ctx || !this.master) return
    if (this.ctx.state !== 'running') return
    const bus = this.ctx.createGain()
    bus.gain.value = 1
    bus.connect(this.ctx.destination)
    strike(this.ctx, bus, 330, [1, 2.76, 5.4], 5.5, level)
  }

  destroy() {
    this.current?.stop()
    this.current = null
    this.currentGain = null
    void this.ctx?.close().catch(() => {})
    this.ctx = null
    this.master = null
  }
}

// ── coordination with the site-wide ambient drone ──────────────────────────
/*
 * The meditation player and the global <AmbientOm/> would otherwise both be
 * audible at once, in different keys. The meditation page claims exclusivity
 * while it is playing and releases it on unmount.
 */
type Listener = (claimed: boolean) => void
const listeners = new Set<Listener>()
let claimed = false

export function claimExclusiveAudio(next: boolean) {
  if (claimed === next) return
  claimed = next
  listeners.forEach(l => l(next))
}

export function isAudioClaimed(): boolean {
  return claimed
}

export function onExclusiveAudioChange(cb: Listener): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

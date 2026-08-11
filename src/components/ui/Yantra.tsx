/* ═══════════════════════════════════════════════════════════════════════════
   YANTRA - the sacred-geometry motif system.
   ───────────────────────────────────────────────────────────────────────────
   The Sri Yantra was the strongest thing on the site and appeared exactly
   once, in the hero. Its geometry is decomposed here into reusable parts so
   the same line-work recurs as connective tissue across every page:

     <YantraMark />       full figure - hero, empty states, loaders
     <YantraWatermark />  huge + very faint, behind section headers
     <YantraDivider />    horizontal rule between sections
     <YantraCorner />     bracket line-work in a card corner

   All parts share one construction: interlocking upward (Shiva) and downward
   (Shakti) triangles, a 24-mark outer ring, two lotus rings, and the bindu.
   ═══════════════════════════════════════════════════════════════════════════ */

const S60 = 0.86603

/** Points for an upward-pointing triangle of radius r about (cx, cy). */
export function triUp(cx: number, cy: number, r: number) {
  return `${cx},${cy - r} ${cx - r * S60},${cy + r * 0.5} ${cx + r * S60},${cy + r * 0.5}`
}
/** Points for a downward-pointing triangle of radius r about (cx, cy). */
export function triDown(cx: number, cy: number, r: number) {
  return `${cx},${cy + r} ${cx - r * S60},${cy - r * 0.5} ${cx + r * S60},${cy - r * 0.5}`
}

type Tone = 'light' | 'dark'

const TONE = {
  light: { ink: '#1B1233', hot: '#B4231F', gold: '#8A6410' },
  dark:  { ink: '#F5EFE3', hot: '#E07A6B', gold: '#C9992E' },
} as const

/* ─────────────────────────────────────────────────────────────────────────
   The full figure. `animated` drives the ambient counter-rotation; it is
   gated on prefers-reduced-motion by the global CSS reset, and only ever
   animates transform, never layout.
   ───────────────────────────────────────────────────────────────────────── */
export function YantraMark({
  size = 480,
  tone = 'light',
  animated = true,
  className = '',
  drawIn = false,
}: {
  size?: number
  tone?: Tone
  animated?: boolean
  className?: string
  /** One-time line-draw on mount, for the hero. */
  drawIn?: boolean
}) {
  const c = TONE[tone]
  const cx = 240, cy = 240
  const marks = Array.from({ length: 24 }, (_, i) => {
    const a = (i * Math.PI * 2) / 24
    return {
      x1: cx + 168 * Math.sin(a), y1: cy - 168 * Math.cos(a),
      x2: cx + 177 * Math.sin(a), y2: cy - 177 * Math.cos(a),
    }
  })

  return (
    <svg
      viewBox="0 0 480 480"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      style={{ width: '100%', maxWidth: size }}
      aria-hidden="true"
    >
      {/* Outer ring + 24 nakshatra marks */}
      <g style={animated ? { transformOrigin: '240px 240px', animation: 'orbit-cw 44s linear infinite' } : undefined}>
        <circle cx={cx} cy={cy} r="222" fill="none" stroke={c.hot} strokeWidth="1.2" opacity="0.30" className={drawIn ? 'line-draw' : undefined} />
        <circle cx={cx} cy={cy} r="210" fill="none" stroke={c.hot} strokeWidth="0.8" opacity="0.16" strokeDasharray="4 8" />
        {marks.map((m, i) => (
          <line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={c.gold} strokeWidth="1.2" opacity="0.30" />
        ))}
      </g>

      {/* 16-petal lotus, counter-rotating */}
      <g style={animated ? { transformOrigin: '240px 240px', animation: 'orbit-ccw 32s linear infinite' } : undefined}>
        <circle cx={cx} cy={cy} r="174" fill="none" stroke={c.gold} strokeWidth="0.8" opacity="0.22" />
        {Array.from({ length: 16 }, (_, i) => (
          <ellipse key={i} cx={cx} cy={75} rx={13} ry={29}
            fill={c.hot} fillOpacity="0.10" stroke={c.hot} strokeWidth="1" strokeOpacity="0.26"
            transform={`rotate(${i * 22.5} ${cx} ${cy})`} />
        ))}
      </g>

      {/* 8-petal inner lotus */}
      <g style={animated ? { transformOrigin: '240px 240px', animation: 'orbit-cw 22s linear infinite' } : undefined}>
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx={cx} cy={112} rx={10} ry={20}
            fill={c.gold} fillOpacity="0.11" stroke={c.gold} strokeWidth="1" strokeOpacity="0.30"
            transform={`rotate(${i * 45} ${cx} ${cy})`} />
        ))}
      </g>

      {/* Interlocking triangles - static, so the figure stays legible */}
      <polygon points={triDown(cx, cy, 145)} fill={c.ink} fillOpacity="0.16" stroke={c.ink} strokeWidth="1.6" strokeOpacity="0.40" />
      <polygon points={triUp(cx, cy, 145)}   fill={c.hot} fillOpacity="0.14" stroke={c.hot} strokeWidth="1.6" strokeOpacity="0.42" />
      <polygon points={triDown(cx, cy, 100)} fill={c.ink} fillOpacity="0.14" stroke={c.ink} strokeWidth="1.4" strokeOpacity="0.36" />
      <polygon points={triUp(cx, cy, 100)}   fill={c.gold} fillOpacity="0.16" stroke={c.gold} strokeWidth="1.4" strokeOpacity="0.38" />
      <polygon points={triUp(cx, cy, 58)}    fill={c.hot} fillOpacity="0.18" stroke={c.hot} strokeWidth="1.2" strokeOpacity="0.46" />
      <polygon points={triDown(cx, cy, 36)}  fill={c.ink} fillOpacity="0.20" stroke={c.ink} strokeWidth="1.2" strokeOpacity="0.46" />

      {/* Bindu */}
      <circle cx={cx} cy={cy} r="48" fill="none" stroke={c.gold} strokeWidth="1.2"
        style={animated ? { animation: 'divine-pulse 4s ease-in-out infinite', opacity: 0.34 } : { opacity: 0.34 }} />
      <circle cx={cx} cy={cy} r="22" fill="none" stroke={c.hot} strokeWidth="1.2" opacity="0.38" />
      <circle cx={cx} cy={cy} r="6" fill={c.hot}
        style={animated ? { animation: 'divine-pulse 3s ease-in-out infinite', opacity: 0.55 } : { opacity: 0.55 }} />
      <circle cx={cx} cy={cy} r="2.5" fill={c.gold} opacity="0.75" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Section watermark - the yantra reduced to bare line-work, oversized and
   nearly invisible, sitting behind a section heading. Absolutely positioned;
   the parent needs `position: relative` and the heading needs a z-index.
   ───────────────────────────────────────────────────────────────────────── */
export function YantraWatermark({
  size = 380,
  tone = 'light',
  className = '',
  style,
}: {
  size?: number
  tone?: Tone
  className?: string
  style?: React.CSSProperties
}) {
  const c = TONE[tone]
  const cx = 120, cy = 120
  return (
    <svg
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={`pointer-events-none select-none absolute ${className}`}
      style={{ opacity: tone === 'dark' ? 0.16 : 0.09, ...style }}
      aria-hidden="true"
    >
      <g fill="none" stroke={c.hot} strokeWidth="1">
        <polygon points={triUp(cx, cy, 84)} />
        <polygon points={triDown(cx, cy, 84)} />
        <polygon points={triUp(cx, cy, 56)} />
        <polygon points={triDown(cx, cy, 56)} />
        <circle cx={cx} cy={cy} r="104" />
        <circle cx={cx} cy={cy} r="112" strokeDasharray="3 7" />
        <circle cx={cx} cy={cy} r="18" />
      </g>
      <g fill="none" stroke={c.gold} strokeWidth="1">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI * 2) / 12
          return (
            <line key={i}
              x1={cx + 104 * Math.sin(a)} y1={cy - 104 * Math.cos(a)}
              x2={cx + 112 * Math.sin(a)} y2={cy - 112 * Math.cos(a)} />
          )
        })}
      </g>
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Section divider - tapering rules meeting a small yantra. Replaces the
   plain <hr>/border-t breaks between sections.
   ───────────────────────────────────────────────────────────────────────── */
export function YantraDivider({
  tone = 'light',
  className = '',
}: {
  tone?: Tone
  className?: string
}) {
  const c = TONE[tone]
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden="true">
      <span
        className="h-px flex-1 max-w-[140px]"
        style={{ background: `linear-gradient(90deg, transparent, ${c.hot}55)` }}
      />
      <svg width="34" height="30" viewBox="0 0 34 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points={triUp(17, 15, 13)} stroke={c.hot} strokeWidth="1.1" strokeOpacity="0.75" fill="none" />
        <polygon points={triDown(17, 15, 13)} stroke={c.gold} strokeWidth="1.1" strokeOpacity="0.75" fill="none" />
        <circle cx="17" cy="15" r="2.2" fill={c.hot} fillOpacity="0.8" />
      </svg>
      <span
        className="h-px flex-1 max-w-[140px]"
        style={{ background: `linear-gradient(90deg, ${c.hot}55, transparent)` }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Corner bracket - a fragment of the yantra ring, for card corners and
   panel edges. Four corners via the `at` prop.
   ───────────────────────────────────────────────────────────────────────── */
export function YantraCorner({
  at = 'tl',
  size = 44,
  tone = 'light',
  className = '',
  opacity = 0.4,
}: {
  at?: 'tl' | 'tr' | 'bl' | 'br'
  size?: number
  tone?: Tone
  className?: string
  opacity?: number
}) {
  const c = TONE[tone]
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[at]
  const pos = {
    tl: { top: 0, left: 0 },
    tr: { top: 0, right: 0 },
    bl: { bottom: 0, left: 0 },
    br: { bottom: 0, right: 0 },
  }[at]

  return (
    <svg
      width={size} height={size} viewBox="0 0 44 44" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none absolute ${className}`}
      style={{ ...pos, opacity, transform: `rotate(${rot}deg)` }}
      aria-hidden="true"
    >
      <path d="M4 20 V8 a4 4 0 0 1 4-4 h12" stroke={c.gold} strokeWidth="1.2" />
      <path d="M10 22 V13 a3 3 0 0 1 3-3 h9" stroke={c.hot} strokeWidth="1" strokeOpacity="0.7" />
      <circle cx="8" cy="8" r="1.6" fill={c.hot} fillOpacity="0.65" />
    </svg>
  )
}

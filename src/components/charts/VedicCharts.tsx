'use client'

// Vedic astrology charts: North Indian Kundli (D-1), Navamsha (D-9), Dasha Timeline

const RASHIS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
const RASHIS_SHORT: Record<string, string> = {
  Aries:'Ar', Taurus:'Ta', Gemini:'Ge', Cancer:'Ca', Leo:'Le', Virgo:'Vi',
  Libra:'Li', Scorpio:'Sc', Sagittarius:'Sg', Capricorn:'Cp', Aquarius:'Aq', Pisces:'Pi',
}
const RASHIS_HI: Record<string, string> = {
  Aries:'मेष', Taurus:'वृष', Gemini:'मिथु', Cancer:'कर्क', Leo:'सिंह', Virgo:'कन्या',
  Libra:'तुला', Scorpio:'वृश्चि', Sagittarius:'धनु', Capricorn:'मकर', Aquarius:'कुंभ', Pisces:'मीन',
}
const PLANET_SHORT: Record<string, string> = {
  Sun:'Su', Moon:'Mo', Mars:'Ma', Mercury:'Me', Jupiter:'Ju',
  Venus:'Ve', Saturn:'Sa', Rahu:'Ra', Ketu:'Ke',
}
const PLANET_COLORS: Record<string, string> = {
  Sun:'#f59e0b', Moon:'#94a3b8', Mars:'#ef4444', Mercury:'#10b981',
  Jupiter:'#f97316', Venus:'#ec4899', Saturn:'#6366f1', Rahu:'#8b5cf6', Ketu:'#78716c',
}
const DASHA_YEARS: Record<string, number> = {
  Ketu:7, Venus:20, Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17,
}
const DASHA_ORDER = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury']

// 4×4 grid positions for each house (row, col) - 0-indexed
// Houses fixed: H12=[0,0] H1=[0,1] H2=[0,2] H3=[0,3]
//               H11=[1,0]          [blank]  H4=[1,3]
//               H10=[2,0]          [blank]  H5=[2,3]
//               H9=[3,0]  H8=[3,1] H7=[3,2] H6=[3,3]
const HOUSE_POS: [number, number][] = [
  [0,1],[0,2],[0,3],[1,3],[2,3],[3,3],[3,2],[3,1],[3,0],[2,0],[1,0],[0,0],
//  H1    H2    H3    H4    H5    H6    H7    H8    H9   H10   H11   H12
]

interface Planet {
  name: string; rashi: string; rashiNum: number; degree: number
  house: number; retrograde: boolean; nakshatra?: string; pada?: number
}
interface KundliData {
  ascendant: string; ascendantDegree: number
  moonSign: string; sunSign: string; nakshatra: string
  planets: Planet[]
  dashaLord: string; currentDasha: string; currentAntardasha: string
}

// Navamsha sign from ecliptic longitude (0-360)
function navamshaRashiIdx(lon: number): number {
  const signIdx = Math.floor(lon / 30) % 12
  const deg = lon % 30
  const part = Math.min(8, Math.floor(deg / (10 / 3))) // 0-8
  const starts = [0, 9, 6, 3] // Fire→Ar, Earth→Cp, Air→Li, Water→Ca
  return (starts[signIdx % 4] + part) % 12
}

// ─── North Indian Kundli Grid ─────────────────────────────────────────
function KundliGrid({
  planets, ascRashiIdx, label, accentColor, bgColor, titleColor,
}: {
  planets: { name: string; houseIdx: number; retrograde?: boolean; extra?: string }[]
  ascRashiIdx: number
  label: string; accentColor: string; bgColor: string; titleColor: string
}) {
  const CS = 72 // cell size
  const W = CS * 4, H = CS * 4

  // Build planets-by-house map
  const byHouse: Record<number, typeof planets[0][]> = {}
  planets.forEach(p => {
    if (!byHouse[p.houseIdx]) byHouse[p.houseIdx] = []
    byHouse[p.houseIdx].push(p)
  })

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="max-w-full w-full">
      <defs>
        <linearGradient id={`bg-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bgColor} />
          <stop offset="100%" stopColor="#fef9f0" />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect width={W} height={H} fill={`url(#bg-${label})`} />
      {/* Center decorative area */}
      <rect x={CS} y={CS} width={CS * 2} height={CS * 2} fill={accentColor} fillOpacity="0.05" />
      <polygon points={`${W/2},${H/2-18} ${W/2+10},${H/2-6} ${W/2+16},${H/2+10} ${W/2},${H/2+16} ${W/2-16},${H/2+10} ${W/2-10},${H/2-6}`} fill={accentColor} fillOpacity={0.08} stroke={accentColor} strokeOpacity={0.12} strokeWidth="0.8" />
      <text x={W / 2} y={H / 2 + 8} textAnchor="middle" fontSize={8.5} fill={accentColor} letterSpacing="1.5" fontWeight="600">{label}</text>
      {/* Grid lines */}
      <rect width={W} height={H} fill="none" stroke={accentColor} strokeWidth="1.5" />
      {[1,2,3].map(i => (
        <g key={i}>
          <line x1={CS * i} y1={0} x2={CS * i} y2={H} stroke={accentColor} strokeWidth="0.7" strokeOpacity="0.5" />
          <line x1={0} y1={CS * i} x2={W} y2={CS * i} stroke={accentColor} strokeWidth="0.7" strokeOpacity="0.5" />
        </g>
      ))}
      {/* Houses */}
      {HOUSE_POS.map(([row, col], idx) => {
        const house = idx + 1
        const x = col * CS, y = row * CS
        const cx = x + CS / 2, cy = y + CS / 2
        const signIdx = (ascRashiIdx + idx) % 12
        const signName = RASHIS[signIdx]
        const hPlanets = byHouse[house] || []
        const isLagna = house === 1
        return (
          <g key={house}>
            {isLagna && <rect x={x + 1} y={y + 1} width={CS - 2} height={CS - 2} fill={accentColor} fillOpacity="0.12" />}
            {/* House number */}
            <text x={x + 4} y={y + 11} fontSize={7} fill={accentColor} fillOpacity="0.75">{house}</text>
            {/* Sign abbreviation (small, top-right) */}
            <text x={x + CS - 3} y={y + 11} textAnchor="end" fontSize={7} fill="#9ca3af">
              {RASHIS_SHORT[signName]}
            </text>
            {/* Sign Hindi (tiny, below abbrev) */}
            <text x={x + CS - 3} y={y + 20} textAnchor="end" fontSize={6} fill="#c4b5a8">
              {RASHIS_HI[signName]}
            </text>
            {isLagna && (
              <text x={cx} y={y + 22} textAnchor="middle" fontSize={7} fill={accentColor} fontWeight="700">Lagna</text>
            )}
            {/* Planets */}
            {hPlanets.map((p, pi) => {
              const total = hPlanets.length
              const spread = (total - 1) * 9
              const startY = cy - spread / 2 + (isLagna ? 6 : 0)
              const py = startY + pi * 9
              return (
                <text key={p.name} x={cx} y={py} textAnchor="middle" dominantBaseline="middle"
                  fontSize={9.5} fontWeight="700" fill={PLANET_COLORS[p.name] || '#374151'}>
                  {PLANET_SHORT[p.name] || p.name.slice(0, 2)}
                  {p.retrograde ? 'R' : ''}
                  {p.extra ? <tspan fontSize={7} fill="#9ca3af"> {p.extra}</tspan> : null}
                </text>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

// ─── North Indian D-1 Kundli ──────────────────────────────────────────
export function NorthIndianKundli({ kundli }: { kundli: KundliData }) {
  if (!kundli?.planets?.length) return null
  const ascRashiIdx = RASHIS.indexOf(kundli.ascendant)
  if (ascRashiIdx < 0) return null
  const planets = kundli.planets.map(p => ({
    name: p.name,
    houseIdx: p.house,
    retrograde: p.retrograde,
    extra: p.nakshatra ? p.nakshatra.slice(0, 3) : undefined,
  }))
  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <KundliGrid
        planets={planets}
        ascRashiIdx={ascRashiIdx}
        label="NORTH INDIAN · D-1"
        accentColor="#D4A017"
        bgColor="#fef9f0"
        titleColor="#D4A017"
      />
      {/* Planet legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
        {kundli.planets.map(p => (
          <span key={p.name} className="text-[10px] font-semibold" style={{ color: PLANET_COLORS[p.name] || '#6b7280' }}>
            {PLANET_SHORT[p.name]} = {p.name}{p.retrograde ? ' R' : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Navamsha D-9 Chart ───────────────────────────────────────────────
export function NavamshaChart({ kundli }: { kundli: KundliData }) {
  if (!kundli?.planets?.length) return null

  // Compute navamsha ascendant
  const navAscIdx = navamshaRashiIdx(kundli.ascendantDegree)

  // Compute navamsha sign for each planet
  const planets = kundli.planets.map(p => {
    const lon = p.rashiNum * 30 + p.degree
    const navRashiIdx = navamshaRashiIdx(lon)
    // House in navamsha = navamsha sign relative to navamsha ascendant
    const houseIdx = ((navRashiIdx - navAscIdx + 12) % 12) + 1
    return { name: p.name, houseIdx, retrograde: p.retrograde }
  })

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <KundliGrid
        planets={planets}
        ascRashiIdx={navAscIdx}
        label="NAVAMSHA · D-9"
        accentColor="#7c3aed"
        bgColor="#faf5ff"
        titleColor="#7c3aed"
      />
      <p className="text-[10px] text-center" style={{ color: '#9ca3af' }}>
        Navamsha Lagna: {RASHIS[navAscIdx]} · Reveals marriage, dharma &amp; deeper soul purpose
      </p>
    </div>
  )
}

// ─── Vimshottari Dasha Timeline ───────────────────────────────────────
export function DashaTimeline({ kundli, birthDate }: { kundli: KundliData; birthDate?: string }) {
  if (!kundli?.dashaLord) return null

  const startLordIdx = DASHA_ORDER.indexOf(kundli.dashaLord)
  if (startLordIdx < 0) return null

  // Build full 120-year dasha sequence from birth
  const sequence: { lord: string; years: number; cumStart: number }[] = []
  let cum = 0
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(startLordIdx + i) % 9]
    sequence.push({ lord, years: DASHA_YEARS[lord], cumStart: cum })
    cum += DASHA_YEARS[lord]
  }

  const totalYears = 120
  const currentDasha = kundli.currentDasha
  const currentAntardasha = kundli.currentAntardasha

  // Get birth year for approximate timeline labels
  const birthYear = birthDate ? new Date(birthDate).getFullYear() : null

  return (
    <div className="w-full space-y-2">
      <div className="text-center">
        <p className="text-xs font-bold text-[var(--indigo-deep)]">
          Current Dasha: <span style={{ color: PLANET_COLORS[currentDasha] }}>{currentDasha}</span>
          <span className="text-[var(--warm-charcoal)]/50 font-normal"> · Antardasha: </span>
          <span style={{ color: PLANET_COLORS[currentAntardasha] }}>{currentAntardasha}</span>
        </p>
      </div>

      {/* Timeline bar */}
      <div className="relative h-10 rounded-full overflow-hidden flex" style={{ border: '1px solid #e5e7eb' }}>
        {sequence.map((seg, i) => {
          const widthPct = (seg.years / totalYears) * 100
          const isCurrent = seg.lord === currentDasha
          const color = PLANET_COLORS[seg.lord] || '#9ca3af'
          return (
            <div key={seg.lord} className="relative flex items-center justify-center text-white transition-all"
              title={`${seg.lord}: ${seg.years} years (${birthYear ? birthYear + seg.cumStart : ''}–${birthYear ? birthYear + seg.cumStart + seg.years : ''})`}
              style={{
                width: `${widthPct}%`, minWidth: widthPct < 6 ? 24 : undefined,
                background: color, opacity: isCurrent ? 1 : 0.55,
                boxShadow: isCurrent ? `inset 0 0 0 2px rgba(255,255,255,0.5)` : 'none',
              }}>
              <span className="text-[9px] font-bold drop-shadow-sm px-0.5 truncate">
                {PLANET_SHORT[seg.lord]}
              </span>
              {isCurrent && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Dasha detail cards */}
      <div className="grid grid-cols-3 gap-1.5">
        {sequence.map(seg => {
          const isCurrent = seg.lord === currentDasha
          const color = PLANET_COLORS[seg.lord] || '#9ca3af'
          const startYear = birthYear ? birthYear + seg.cumStart : null
          const endYear = birthYear ? birthYear + seg.cumStart + seg.years : null
          return (
            <div key={seg.lord}
              className="rounded-xl p-2 text-center transition-all"
              style={{
                background: isCurrent ? color + '18' : 'var(--warm-sand)',
                border: isCurrent ? `1.5px solid ${color}` : '1px solid transparent',
              }}>
              <p className="text-[11px] font-bold" style={{ color }}>{seg.lord}</p>
              <p className="text-[10px] text-[var(--warm-charcoal)]/50">{seg.years} yrs</p>
              {startYear && <p className="text-[9px] text-[var(--warm-charcoal)]/40">{startYear}–{endYear}</p>}
              {isCurrent && currentAntardasha !== seg.lord && (
                <p className="text-[9px] font-semibold mt-0.5" style={{ color: PLANET_COLORS[currentAntardasha] }}>
                  Antar: {currentAntardasha}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

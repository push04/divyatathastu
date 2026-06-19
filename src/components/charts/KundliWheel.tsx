'use client'

// Western-style circular birth chart wheel
// Shows 12 houses, zodiac signs, and planet positions

const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃',
  Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
}

const ZODIAC_COLORS: Record<string, string> = {
  Aries: '#ef4444', Taurus: '#84cc16', Gemini: '#facc15', Cancer: '#60a5fa',
  Leo: '#f97316', Virgo: '#4ade80', Libra: '#fb7185', Scorpio: '#a855f7',
  Sagittarius: '#fb923c', Capricorn: '#64748b', Aquarius: '#38bdf8', Pisces: '#818cf8',
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#f59e0b', Moon: '#cbd5e1', Mars: '#ef4444', Mercury: '#10b981',
  Jupiter: '#f97316', Venus: '#ec4899', Saturn: '#6366f1', Rahu: '#8b5cf6', Ketu: '#78716c',
}

const RASHIS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']

interface Planet {
  name: string
  rashi: string
  degree: number
  house: number
  retrograde?: boolean
}

interface KundliData {
  ascendant: string
  moonSign: string
  sunSign: string
  planets: Planet[]
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export default function KundliWheel({ kundli }: { kundli: KundliData }) {
  if (!kundli?.planets?.length) return null

  const cx = 200, cy = 200
  const rOuter = 185, rZodiac = 165, rHouseNum = 145, rInner = 128, rPlanet = 105

  // Ascendant rashi index determines rotation offset
  const ascIdx = RASHIS.indexOf(kundli.ascendant)
  const rotOffset = ascIdx >= 0 ? -(ascIdx * 30) : 0

  // Each house is 30° starting from ascendant
  const houseStartAngle = (houseNum: number) => rotOffset + (houseNum - 1) * 30
  const houseMidAngle = (houseNum: number) => houseStartAngle(houseNum) + 15

  // Get rashi for each house (ascendant rashi = house 1, then sequential)
  const rashiForHouse = (h: number) => RASHIS[(ascIdx + h - 1) % 12]

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="400" height="400" viewBox="0 0 400 400" className="max-w-full">
        <defs>
          <radialGradient id="chartBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef9f0" />
            <stop offset="100%" stopColor="#f3e8da" />
          </radialGradient>
          <filter id="planetGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer background disc */}
        <circle cx={cx} cy={cy} r={rOuter} fill="url(#chartBg)" stroke="#D4A017" strokeWidth="1.5" />

        {/* 12 zodiac sign segments */}
        {Array.from({ length: 12 }, (_, i) => {
          const startA = rotOffset + i * 30
          const endA = startA + 30
          const midA = startA + 15
          const p1 = polarToXY(cx, cy, rZodiac, startA)
          const p2 = polarToXY(cx, cy, rOuter - 2, startA)
          const p3 = polarToXY(cx, cy, rOuter - 2, endA)
          const p4 = polarToXY(cx, cy, rZodiac, endA)
          const rashi = RASHIS[i]
          const color = ZODIAC_COLORS[rashi] || '#c4a882'
          const symPos = polarToXY(cx, cy, rOuter - 12, midA)

          return (
            <g key={i}>
              {/* Segment fill */}
              <path
                d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${rOuter - 2} ${rOuter - 2} 0 0 1 ${p3.x} ${p3.y} L ${p4.x} ${p4.y} A ${rZodiac} ${rZodiac} 0 0 0 ${p1.x} ${p1.y}`}
                fill={color}
                fillOpacity="0.15"
                stroke={color}
                strokeWidth="0.5"
                strokeOpacity="0.4"
              />
              {/* Zodiac symbol */}
              <text x={symPos.x} y={symPos.y + 4} textAnchor="middle" fontSize="12" fill={color} fontWeight="bold"
                style={{ filter: 'brightness(0.8)' }}>
                {ZODIAC_SYMBOLS[rashi] || rashi.slice(0, 2)}
              </text>
            </g>
          )
        })}

        {/* House divider lines */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = rotOffset + i * 30
          const p1 = polarToXY(cx, cy, rInner, angle)
          const p2 = polarToXY(cx, cy, rZodiac, angle)
          return (
            <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#D4A017" strokeWidth={i === 0 ? 2.5 : 0.8} strokeOpacity={i === 0 ? 1 : 0.5} />
          )
        })}

        {/* Inner ring border */}
        <circle cx={cx} cy={cy} r={rZodiac} fill="none" stroke="#D4A017" strokeWidth="1.5" strokeOpacity="0.6" />
        <circle cx={cx} cy={cy} r={rInner} fill="#fef5ec" stroke="#D4A017" strokeWidth="1" strokeOpacity="0.5" />

        {/* House numbers */}
        {Array.from({ length: 12 }, (_, i) => {
          const midA = houseMidAngle(i + 1)
          const pos = polarToXY(cx, cy, rHouseNum - 8, midA)
          const isKendra = [1, 4, 7, 10].includes(i + 1)
          const isTrikona = [1, 5, 9].includes(i + 1)
          return (
            <text key={i} x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="11"
              fill={isTrikona ? '#E36414' : isKendra ? '#2F2A44' : '#6b7280'}
              fontWeight={isTrikona || isKendra ? 'bold' : 'normal'}
              style={{ fontFamily: "'Sora', sans-serif" }}>
              {i + 1}
            </text>
          )
        })}

        {/* Rashi labels inside houses */}
        {Array.from({ length: 12 }, (_, i) => {
          const midA = houseMidAngle(i + 1)
          const pos = polarToXY(cx, cy, rHouseNum + 10, midA)
          const rashi = rashiForHouse(i + 1)
          return (
            <text key={i} x={pos.x} y={pos.y + 3} textAnchor="middle" fontSize="7.5"
              fill="#9ca3af" style={{ fontFamily: "'Sora', sans-serif" }}>
              {rashi.slice(0, 3)}
            </text>
          )
        })}

        {/* Planets */}
        {kundli.planets.map((planet, idx) => {
          const rashiIdx = RASHIS.indexOf(planet.rashi)
          if (rashiIdx < 0) return null

          // Convert planet position to angle
          const baseAngle = rotOffset + rashiIdx * 30 + (planet.degree / 30) * 30
          // Spread planets in same house slightly
          const sameHousePlanets = kundli.planets.filter(p => p.rashi === planet.rashi)
          const posInHouse = sameHousePlanets.indexOf(planet)
          const spread = sameHousePlanets.length > 1 ? (posInHouse - (sameHousePlanets.length - 1) / 2) * 8 : 0
          const angle = baseAngle + spread

          const pos = polarToXY(cx, cy, rPlanet - (posInHouse % 2) * 14, angle)
          const color = PLANET_COLORS[planet.name] || '#c4a882'
          const sym = PLANET_SYMBOLS[planet.name] || planet.name.slice(0, 2)

          return (
            <g key={idx} filter="url(#planetGlow)">
              <circle cx={pos.x} cy={pos.y} r="11" fill={color} fillOpacity="0.15"
                stroke={color} strokeWidth="1.2" />
              <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fill={color} fontWeight="bold">
                {sym}
              </text>
              {planet.retrograde && (
                <text x={pos.x + 7} y={pos.y - 7} fontSize="6" fill={color} fontWeight="bold">R</text>
              )}
            </g>
          )
        })}

        {/* Center hub */}
        <circle cx={cx} cy={cy} r="38" fill="#fef9f0" stroke="#D4A017" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="35" fill="none" stroke="#D4A017" strokeWidth="0.6" strokeOpacity="0.5" />
        <text x={cx} y={cy - 9} textAnchor="middle" fontSize="8" fill="#D4A017"
          style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '0.1em' }}>LAGNA</text>
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="14" fill="#2F2A44" fontWeight="bold"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          {(kundli.ascendant || '').slice(0, 3).toUpperCase()}
        </text>
        <text x={cx} y={cy + 17} textAnchor="middle" fontSize="8" fill="#D4A017"
          style={{ fontFamily: "'Sora', sans-serif" }}>
          {ZODIAC_SYMBOLS[kundli.ascendant] || ''}
        </text>

        {/* Ascendant pointer */}
        <line x1={polarToXY(cx, cy, rInner + 2, rotOffset).x} y1={polarToXY(cx, cy, rInner + 2, rotOffset).y}
          x2={polarToXY(cx, cy, rZodiac - 5, rotOffset).x} y2={polarToXY(cx, cy, rZodiac - 5, rotOffset).y}
          stroke="#E36414" strokeWidth="2" />
        <circle cx={polarToXY(cx, cy, rZodiac - 5, rotOffset).x}
          cy={polarToXY(cx, cy, rZodiac - 5, rotOffset).y} r="3" fill="#E36414" />
      </svg>

      {/* Planet legend */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full max-w-md">
        {kundli.planets.map(p => (
          <div key={p.name} className="flex items-center gap-1.5 text-xs">
            <span style={{ color: PLANET_COLORS[p.name] || '#c4a882', fontSize: 14 }}>
              {PLANET_SYMBOLS[p.name] || '●'}
            </span>
            <span className="text-[var(--warm-charcoal)]/70 font-medium">{p.name}</span>
            {p.retrograde && <span className="text-[var(--terracotta)] text-[9px]">R</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

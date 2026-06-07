'use client'

const CHAKRA_META = [
  { key: 'muladhara',  label: 'Mūlādhāra',  eng: 'Root',       color: '#dc2626', element: 'Earth',  petals: 4  },
  { key: 'svadhisthana', label: 'Svādhiṣṭhāna', eng: 'Sacral', color: '#ea580c', element: 'Water', petals: 6  },
  { key: 'manipura',  label: 'Maṇipūra',    eng: 'Solar Plexus', color: '#ca8a04', element: 'Fire', petals: 10 },
  { key: 'anahata',   label: 'Anāhata',     eng: 'Heart',       color: '#16a34a', element: 'Air',   petals: 12 },
  { key: 'vishuddha', label: 'Viśuddha',    eng: 'Throat',      color: '#0284c7', element: 'Ether', petals: 16 },
  { key: 'ajna',      label: 'Ājñā',        eng: 'Third Eye',   color: '#4f46e5', element: 'Light', petals: 2  },
  { key: 'sahasrara', label: 'Sahasrāra',   eng: 'Crown',       color: '#7c3aed', element: 'Cosmos', petals: 1000 },
]

interface Chakra {
  name: string
  sanskrit?: string
  balanceScore?: number
  status?: string
  color?: string
  element?: string
}

interface ChakraData {
  chakras: Chakra[]
  overallBalance?: number
}

function findMeta(chakra: Chakra) {
  const n = chakra.name.toLowerCase()
  return CHAKRA_META.find(m => n.includes(m.key) || n.includes(m.eng.toLowerCase().split(' ')[0])) || null
}

function Lotus({ color, petals, size = 28 }: { color: string; petals: number; size?: number }) {
  const cx = size / 2, cy = size / 2
  const r = size / 2 - 2
  const pCount = Math.min(petals, 12) // visual cap
  const pts = Array.from({ length: pCount }, (_, i) => {
    const a = (i / pCount) * Math.PI * 2 - Math.PI / 2
    const pr = r * 0.55
    return { x: cx + pr * Math.cos(a), y: cy + pr * Math.sin(a) }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pts.map((p, i) => (
        <ellipse key={i}
          cx={(cx + p.x) / 2} cy={(cy + p.y) / 2}
          rx={r * 0.28} ry={r * 0.14}
          transform={`rotate(${(i / pCount) * 360}, ${(cx + p.x) / 2}, ${(cy + p.y) / 2})`}
          fill={color} opacity="0.6"
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.28} fill={color} />
    </svg>
  )
}

export default function ChakraChart({ data }: { data: ChakraData }) {
  if (!data?.chakras?.length) return null

  // Sort chakras from root to crown
  const sorted = [...data.chakras].sort((a, b) => {
    const ai = CHAKRA_META.findIndex(m => a.name.toLowerCase().includes(m.key))
    const bi = CHAKRA_META.findIndex(m => b.name.toLowerCase().includes(m.key))
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
  })

  return (
    <div className="space-y-5">
      {/* Vertical chakra stack */}
      <div className="relative flex flex-col gap-3">
        {/* Spine line */}
        <div className="absolute left-[28px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#7c3aed] via-[#16a34a] to-[#dc2626] opacity-30 rounded-full" />

        {sorted.map((chakra, idx) => {
          const meta = findMeta(chakra)
          const color = meta?.color || chakra.color || '#c4a882'
          const score = typeof chakra.balanceScore === 'number' ? chakra.balanceScore : 70
          const status = chakra.status || (score >= 75 ? 'Balanced' : score >= 50 ? 'Moderate' : 'Needs Work')

          return (
            <div key={idx} className="flex items-center gap-3 relative">
              {/* Lotus icon */}
              <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 z-10"
                style={{ background: `${color}15`, border: `2px solid ${color}40` }}>
                <Lotus color={color} petals={meta?.petals || 6} size={34} />
              </div>

              {/* Info + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-[var(--warm-charcoal)]/80"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {meta?.label || chakra.name}
                  </span>
                  <span className="text-[10px] text-[var(--warm-charcoal)]/40">
                    {meta?.eng || ''} · {meta?.element || chakra.element || ''}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-[var(--warm-sand)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(5, score)}%`,
                      background: `linear-gradient(90deg, ${color}90, ${color})`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px]" style={{ color }}>{status}</span>
                  <span className="text-[9px] text-[var(--warm-charcoal)]/40">{score}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Overall balance meter */}
      {typeof data.overallBalance === 'number' && (
        <div className="bg-gradient-to-r from-[var(--warm-sand)] to-amber-50 rounded-xl p-3 border border-[var(--saffron)]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--warm-charcoal)]/70">Overall Chakra Balance</span>
            <span className="text-lg font-bold text-[var(--terracotta)]"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              {data.overallBalance}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/60 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#dc2626] via-[#16a34a] to-[#7c3aed] transition-all duration-1000"
              style={{ width: `${data.overallBalance}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

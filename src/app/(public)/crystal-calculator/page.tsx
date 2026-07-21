'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ─── Crystal Data ─────────────────────────────────────────────────────────────
const CRYSTAL_STATIC: Record<string, {
  id: string; name: string; sanskrit: string; slug: string
  chakra: string; planet: string; element: string; numerology: number[]
  benefits: string[]; wearing: string; mantra: string
  fallbackPrice: number; salePrice: number
  color: string; accent: string; symbol: string
}> = {
  amethyst: {
    id: 'amethyst', name: 'Amethyst', sanskrit: 'Jamunia', slug: 'amethyst-crystal',
    chakra: 'Crown & Third Eye', planet: 'Saturn & Jupiter', element: 'Air', numerology: [2,3,7,9],
    benefits: ['Spiritual awakening', 'Intuition', 'Stress relief', 'Dream clarity', 'Protection'],
    wearing: 'Ring finger, right hand, Saturday morning.',
    mantra: 'OM Sham Shanaischaraya Namah',
    fallbackPrice: 849, salePrice: 999,
    color: '#7C3AED', accent: '#EDE9FE', symbol: 'hexagon',
  },
  'rose-quartz': {
    id: 'rose-quartz', name: 'Rose Quartz', sanskrit: 'Paniya Pushkraj', slug: 'rose-quartz-crystal',
    chakra: 'Heart', planet: 'Venus', element: 'Water', numerology: [2,6,7],
    benefits: ['Unconditional love', 'Emotional healing', 'Relationship harmony', 'Self-compassion', 'Fertility'],
    wearing: 'Ring or little finger, left hand, Friday.',
    mantra: 'OM Shukraya Namah',
    fallbackPrice: 649, salePrice: 799,
    color: '#DB2777', accent: '#FCE7F3', symbol: 'favorite',
  },
  'clear-quartz': {
    id: 'clear-quartz', name: 'Clear Quartz', sanskrit: 'Sphatik', slug: 'clear-quartz-crystal',
    chakra: 'All Chakras', planet: 'Sun & Moon', element: 'All Elements', numerology: [1,4,7,8],
    benefits: ['Amplifies intentions', 'Mental clarity', 'Energy purification', 'Memory', 'Manifestation'],
    wearing: 'Any finger, Sunday or Monday morning.',
    mantra: 'OM Krim Krishnaya Namah',
    fallbackPrice: 549, salePrice: 699,
    color: '#0891B2', accent: '#CFFAFE', symbol: 'lens',
  },
  citrine: {
    id: 'citrine', name: 'Citrine', sanskrit: 'Sunhela', slug: 'citrine-crystal',
    chakra: 'Solar Plexus', planet: 'Sun & Jupiter', element: 'Fire', numerology: [1,3,6,9],
    benefits: ['Wealth & abundance', 'Confidence', 'Creative energy', 'Positivity', 'Business success'],
    wearing: 'Index finger, right hand, Thursday morning.',
    mantra: 'OM Brim Brihaspataye Namah',
    fallbackPrice: 749, salePrice: 899,
    color: '#D97706', accent: '#FEF3C7', symbol: 'brightness_high',
  },
  'black-tourmaline': {
    id: 'black-tourmaline', name: 'Black Tourmaline', sanskrit: 'Shyam Vaikrant', slug: 'black-tourmaline-crystal',
    chakra: 'Root', planet: 'Saturn', element: 'Earth', numerology: [2,4,8],
    benefits: ['EMF protection', 'Grounding', 'Negative energy shield', 'Anxiety relief', 'Aura cleansing'],
    wearing: 'Pocket or pendant. Activate on Saturday.',
    mantra: 'OM Sham Shanaischaraya Namah',
    fallbackPrice: 699, salePrice: 849,
    color: '#1C1917', accent: '#D6D3D1', symbol: 'shield',
  },
  'lapis-lazuli': {
    id: 'lapis-lazuli', name: 'Lapis Lazuli', sanskrit: 'Lajward', slug: 'lapis-lazuli-crystal',
    chakra: 'Third Eye & Throat', planet: 'Jupiter & Venus', element: 'Water', numerology: [3,7,9],
    benefits: ['Wisdom & truth', 'Communication', 'Inner vision', 'Royal energy', 'Psychic abilities'],
    wearing: 'Index or middle finger, right hand, Thursday.',
    mantra: 'OM Aim Saraswatyai Namah',
    fallbackPrice: 899, salePrice: 1099,
    color: '#1D4ED8', accent: '#DBEAFE', symbol: 'visibility',
  },
  moonstone: {
    id: 'moonstone', name: 'Moonstone', sanskrit: 'Chandrakant Mani', slug: 'moonstone-crystal',
    chakra: 'Crown & Sacral', planet: 'Moon', element: 'Water', numerology: [2,4,7],
    benefits: ['Intuition', 'Feminine energy', 'Emotional balance', 'New beginnings', 'Fertility'],
    wearing: 'Ring finger, right hand, Monday evening.',
    mantra: 'OM Somaya Namah',
    fallbackPrice: 999, salePrice: 1199,
    color: '#64748B', accent: '#F1F5F9', symbol: 'nights_stay',
  },
  'green-aventurine': {
    id: 'green-aventurine', name: 'Green Aventurine', sanskrit: 'Harit Sphatik', slug: 'green-aventurine-crystal',
    chakra: 'Heart', planet: 'Mercury & Venus', element: 'Earth', numerology: [1,3,6],
    benefits: ['Luck & opportunity', 'Heart healing', 'Prosperity', 'Emotional calm', 'Career growth'],
    wearing: 'Little finger, right hand, Wednesday.',
    mantra: 'OM Budhaya Namah',
    fallbackPrice: 599, salePrice: 749,
    color: '#047857', accent: '#D1FAE5', symbol: 'eco',
  },
  'tigers-eye': {
    id: 'tigers-eye', name: "Tiger's Eye", sanskrit: 'Vaidurya', slug: 'tigers-eye-crystal',
    chakra: 'Solar Plexus & Root', planet: 'Sun & Mars', element: 'Fire', numerology: [1,4,8,9],
    benefits: ['Courage & strength', 'Willpower', 'Travel protection', 'Decision making', 'Overcoming fear'],
    wearing: 'Index finger, right hand, Sunday or Tuesday.',
    mantra: 'OM Suryaya Namah',
    fallbackPrice: 679, salePrice: 829,
    color: '#B45309', accent: '#FEF3C7', symbol: 'pets',
  },
  sodalite: {
    id: 'sodalite', name: 'Sodalite', sanskrit: 'Neeli Vaidurya', slug: 'sodalite-crystal',
    chakra: 'Third Eye & Throat', planet: 'Mercury', element: 'Air', numerology: [2,6,7],
    benefits: ['Logical thinking', 'Communication', 'Self-discipline', 'Truth speaking', 'Insomnia relief'],
    wearing: 'Middle finger, Wednesday, or under pillow.',
    mantra: 'OM Bum Budhaya Namah',
    fallbackPrice: 729, salePrice: 879,
    color: '#2563EB', accent: '#EFF6FF', symbol: 'psychology',
  },
  'red-jasper': {
    id: 'red-jasper', name: 'Red Jasper', sanskrit: 'Rakta Pashaan', slug: 'red-jasper-crystal',
    chakra: 'Root & Sacral', planet: 'Mars', element: 'Earth', numerology: [1,4,8],
    benefits: ['Vitality & strength', 'Emotional stability', 'Physical energy', 'Endurance', 'Sexual health'],
    wearing: 'Ring finger, right hand, Tuesday morning.',
    mantra: 'OM Am Angarkaya Namah',
    fallbackPrice: 629, salePrice: 779,
    color: '#DC2626', accent: '#FEE2E2', symbol: 'local_fire_department',
  },
  labradorite: {
    id: 'labradorite', name: 'Labradorite', sanskrit: 'Indraneela', slug: 'labradorite-crystal',
    chakra: 'Third Eye & Throat', planet: 'Moon', element: 'Water', numerology: [5,7,9],
    benefits: ['Transformation', 'Magic & synchronicity', 'Psychic protection', 'Hidden potential', 'Spiritual awakening'],
    wearing: 'Pendant on full moon nights or near meditation space.',
    mantra: 'OM Chandraya Namah',
    fallbackPrice: 1099, salePrice: 1299,
    color: '#0E7490', accent: '#ECFEFF', symbol: 'auto_awesome',
  },
}

const CRYSTAL_IDS = Object.keys(CRYSTAL_STATIC)

// ─── Types ────────────────────────────────────────────────────────────────────
interface CrystalWithPrice {
  id: string; name: string; sanskrit: string; slug: string
  chakra: string; planet: string; element: string; numerology: number[]
  benefits: string[]; wearing: string; mantra: string
  color: string; accent: string; symbol: string
  price: number; originalPrice?: number; dbProductId?: string
}

interface NumerologyProfile {
  lifePathNumber: number; nameNumber: number; destinyNumber: number
  dayNumber: number; monthNumber: number
  rulingPlanet: string; dayLord: string; birthHourPlanet: string
}

interface GroqRecommendation { crystalId: string; rank: number; rationale: string }

interface CrystalResult {
  profile: NumerologyProfile
  primary: CrystalWithPrice; secondary: CrystalWithPrice; tertiary: CrystalWithPrice
  aiRationales: Record<string, string>
  soulMessage: string; source: 'ai' | 'math'
}

// ─── Vedic Mathematical Engine ────────────────────────────────────────────────
function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return Math.abs(h)
}

function reduce(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33)
    n = String(n).split('').reduce((s, d) => s + +d, 0)
  return n
}

function chaldeanName(name: string): number {
  const MAP: Record<string, number> = {
    A:1,I:1,J:1,Q:1,Y:1,B:2,K:2,R:2,C:3,G:3,L:3,S:3,D:4,M:4,T:4,
    E:5,H:5,N:5,X:5,U:6,V:6,W:6,O:7,Z:7,F:8,P:8,
  }
  const cleaned = name.toUpperCase().replace(/[^A-Z]/g, '')
  let sum = cleaned.split('').reduce((acc, ch) => acc + (MAP[ch] || 0), 0)
  while (sum > 9) sum = String(sum).split('').reduce((s, d) => s + +d, 0)
  return sum || 1
}

function rulingPlanetFor(lpn: number): string {
  const m: Record<number, string> = {
    1:'Sun',2:'Moon',3:'Jupiter',4:'Rahu',5:'Mercury',
    6:'Venus',7:'Ketu',8:'Saturn',9:'Mars',11:'Moon',22:'Saturn',33:'Jupiter',
  }
  return m[lpn] || m[lpn % 9 || 9]!
}

function dayLordOf(dob: string): string {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const planets = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']
  return planets[new Date(dob).getDay()]
}

const HORA = ['Sun','Venus','Mercury','Moon','Saturn','Jupiter','Mars']
function birthHourPlanet(dob: string, time: string): string {
  if (!time) return ''
  const [h] = time.split(':').map(Number)
  return HORA[(new Date(dob).getDay() * 24 + h) % 7]
}

function destinyNumber(dob: string): number {
  return reduce(dob.replace(/-/g, '').split('').reduce((s, d) => s + +d, 0))
}

function buildProfile(dob: string, name: string, time: string): NumerologyProfile {
  const parts = dob.split('-')
  const allDigits = dob.replace(/-/g, '').split('').map(Number)
  const lpn = reduce(allDigits.reduce((a, b) => a + b, 0))
  return {
    lifePathNumber: lpn,
    nameNumber: chaldeanName(name),
    destinyNumber: destinyNumber(dob),
    dayNumber: reduce(parseInt(parts[2])),
    monthNumber: reduce(parseInt(parts[1])),
    rulingPlanet: rulingPlanetFor(lpn),
    dayLord: dayLordOf(dob),
    birthHourPlanet: birthHourPlanet(dob, time),
  }
}

function scoreCrystal(id: string, profile: NumerologyProfile, gender: string, key: string): number {
  const c = CRYSTAL_STATIC[id]!
  let score = 0
  if (c.numerology.includes(profile.lifePathNumber)) score += 50
  if (c.numerology.includes(profile.nameNumber))     score += 35
  if (c.numerology.includes(profile.destinyNumber))  score += 25
  if (c.numerology.includes(profile.dayNumber))      score += 15
  if (c.numerology.includes(profile.monthNumber))    score += 10
  if (c.planet.toLowerCase().includes(profile.rulingPlanet.toLowerCase())) score += 30
  if (c.planet.toLowerCase().includes(profile.dayLord.toLowerCase()))       score += 15
  if (profile.birthHourPlanet && c.planet.toLowerCase().includes(profile.birthHourPlanet.toLowerCase())) score += 20
  if (gender === 'female' && ['Venus','Moon'].some(p => c.planet.includes(p))) score += 12
  if (gender === 'male'   && ['Sun','Mars','Jupiter'].some(p => c.planet.includes(p))) score += 12
  score += djb2(`${key}${id}`) % 15
  return score
}

function mathRanking(profile: NumerologyProfile, gender: string, key: string) {
  return CRYSTAL_IDS
    .map(id => ({ id, score: scoreCrystal(id, profile, gender, key) }))
    .sort((a, b) => b.score !== a.score ? b.score - a.score : djb2(`${b.id}${key}`) - djb2(`${a.id}${key}`))
}

function pickDiverseTop3(ranked: { id: string; score: number }[]): [string, string, string] {
  const first = ranked[0].id
  const firstEl = CRYSTAL_STATIC[first]!.element
  const second = ranked.find((r, i) => i > 0 && CRYSTAL_STATIC[r.id]!.element !== firstEl)?.id ?? ranked[1].id
  const third = ranked.find(r => r.id !== first && r.id !== second)?.id ?? ranked[2].id
  return [first, second!, third!]
}

function buildMathResult(
  profile: NumerologyProfile, gender: string,
  form: { dob: string; name: string; timeOfBirth: string },
  priceMap: Record<string, { price: number; originalPrice?: number; id?: string }>,
): CrystalResult {
  const key = `${form.dob}|${form.name.toLowerCase().trim()}|${form.timeOfBirth}|${gender}`
  const ranked = mathRanking(profile, gender, key)
  const [pId, sId, tId] = pickDiverseTop3(ranked)

  function enrich(id: string): CrystalWithPrice {
    const s = CRYSTAL_STATIC[id]!
    const p = priceMap[id]
    return { ...s, price: p?.price ?? s.fallbackPrice, originalPrice: p?.originalPrice, dbProductId: p?.id }
  }

  const INSIGHTS: Record<number, string> = {
    1:'You carry the solar frequency of independent leadership. Your soul blueprint is that of the pioneer — built to initiate, create, and forge new paths.',
    2:'Your Moon-ruled soul operates through sensitivity and deep relational intelligence. You are the diplomat, the nurturer, the one who brings people together.',
    3:'Jupiter governs your expansive nature. You are a communicator, teacher, and creator by soul design — here to inspire through joy and expression.',
    4:'Rahu gives you earthly mastery. Disciplined, methodical, and structured — you are built to create lasting foundations that outlive you.',
    5:'Mercury blesses you with adaptability and intellect. Variety, travel, and ideas fuel your dharma. Freedom is your greatest teacher.',
    6:'Venus rules your life path, gifting you beauty, love, and a profound artistic nature. Harmony and family are at the core of your soul mission.',
    7:'Ketu guides you inward — the mystic and philosopher, seeking liberation through wisdom. Solitude is your teacher, not your punishment.',
    8:'Saturn demands karmic accountability. Your path brings power through discipline and responsibility. What you build is meant to last.',
    9:'Mars completes the cycle in you — a warrior of compassion, built for service and transformation. You are the humanitarian of the zodiac.',
    11:'You carry the Master 11 vibration — heightened intuition and a mission to inspire humanity through spiritual channels.',
    22:'The Master Builder. You are encoded to manifest the greatest visions into physical reality. Yours is the most powerful Life Path.',
    33:'The Master Teacher. Your entire existence is an act of sacred service and unconditional love.',
  }

  return {
    profile, primary: enrich(pId), secondary: enrich(sId), tertiary: enrich(tId),
    aiRationales: {},
    soulMessage: INSIGHTS[profile.lifePathNumber] ?? INSIGHTS[9],
    source: 'math',
  }
}

// ─── Crystal Icon — clean SVG shape per stone ────────────────────────────────
function CrystalIcon({ color, symbol, size = 40 }: { color: string; symbol: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{ width: size, height: size, background: `${color}15`, border: `1.5px solid ${color}30` }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: size * 0.5, color, fontVariationSettings: "'FILL' 1" }}
      >
        {symbol}
      </span>
    </div>
  )
}

// ─── Crystal Card ─────────────────────────────────────────────────────────────
const RANK_LABEL = { primary: 'Primary', secondary: 'Secondary', tertiary: 'Supporting' }
const RANK_NUM   = { primary: '01', secondary: '02', tertiary: '03' }

function CrystalCard({
  crystal, rank, rationale,
}: {
  crystal: CrystalWithPrice
  rank: 'primary' | 'secondary' | 'tertiary'
  rationale?: string
}) {
  const isPrimary = rank === 'primary'
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
      style={{
        background: '#ffffff',
        border: isPrimary ? `2px solid ${crystal.color}` : '1.5px solid #E9E3DC',
        boxShadow: isPrimary ? `0 4px 24px ${crystal.color}18` : '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Top stripe */}
      <div
        className="h-1 w-full"
        style={{ background: isPrimary ? crystal.color : '#E9E3DC' }}
      />

      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start gap-5 mb-6">
          <CrystalIcon color={crystal.color} symbol={crystal.symbol} size={56} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span
                className="text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full"
                style={{ background: `${crystal.color}12`, color: crystal.color, fontFamily: "'Sora', sans-serif" }}
              >
                {RANK_NUM[rank]} — {RANK_LABEL[rank]}
              </span>
              {isPrimary && (
                <span
                  className="text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-0.5 rounded-full"
                  style={{ background: '#FEF3C7', color: '#92400E', fontFamily: "'Sora', sans-serif" }}
                >
                  Best Match
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#2F2A44]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {crystal.name}
            </h3>
            <p className="text-sm text-[#9C8F85] mt-0.5" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: '0.08em' }}>
              {crystal.sanskrit}
            </p>
          </div>
        </div>

        {/* Properties row */}
        <div
          className="grid grid-cols-3 gap-3 mb-6 p-4 rounded-xl"
          style={{ background: '#FBFAF7', border: '1px solid #EDE8E2' }}
        >
          {([
            ['Chakra', crystal.chakra],
            ['Planet', crystal.planet],
            ['Element', crystal.element],
          ] as [string, string][]).map(([l, v]) => (
            <div key={l}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#B5A89E] mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>{l}</p>
              <p className="text-xs font-semibold text-[#2F2A44] leading-tight">{v}</p>
            </div>
          ))}
        </div>

        {/* AI rationale */}
        {rationale && (
          <div
            className="mb-6 p-4 rounded-xl"
            style={{ background: `${crystal.color}08`, border: `1px solid ${crystal.color}25` }}
          >
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: crystal.color, fontFamily: "'Sora', sans-serif" }}>
              Vedic Analysis
            </p>
            <p className="text-sm text-[#4A4060] leading-relaxed">{rationale}</p>
          </div>
        )}

        {/* Benefits */}
        <div className="mb-6">
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#B5A89E] mb-2.5" style={{ fontFamily: "'Sora', sans-serif" }}>Key Benefits</p>
          <div className="flex flex-wrap gap-2">
            {crystal.benefits.slice(0, 4).map(b => (
              <span
                key={b}
                className="text-xs px-2.5 py-1 rounded-full text-[#53443C]"
                style={{ background: '#F2E2D9', fontFamily: "'DM Sans', sans-serif" }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Mantra + Wearing */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl" style={{ background: '#FBFAF7', border: '1px solid #EDE8E2' }}>
            <p className="text-[9px] font-bold tracking-widest uppercase text-[#B5A89E] mb-1.5" style={{ fontFamily: "'Sora', sans-serif" }}>Sacred Mantra</p>
            <p className="text-sm font-semibold text-[#2F2A44]" style={{ fontFamily: "'Playfair Display', serif" }}>{crystal.mantra}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: '#FBFAF7', border: '1px solid #EDE8E2' }}>
            <p className="text-[9px] font-bold tracking-widest uppercase text-[#B5A89E] mb-1.5" style={{ fontFamily: "'Sora', sans-serif" }}>How to Wear</p>
            <p className="text-xs text-[#6B5E55] leading-relaxed">{crystal.wearing}</p>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t border-[#EDE8E2]">
          <div>
            <p className="text-[9px] font-bold tracking-widest uppercase text-[#B5A89E] mb-0.5" style={{ fontFamily: "'Sora', sans-serif" }}>Price</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#2F2A44]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ₹{crystal.price.toLocaleString('en-IN')}
              </span>
              {crystal.originalPrice && crystal.originalPrice > crystal.price && (
                <span className="text-sm text-[#B5A89E] line-through" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ₹{crystal.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3 flex-1 justify-end flex-wrap">
            <Link
              href={`/shop?slug=${crystal.slug}`}
              className="flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: crystal.color, fontFamily: "'Sora', sans-serif" }}
            >
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
              Order Now
            </Link>
            <a
              href={`https://wa.me/919858784784?text=${encodeURIComponent(`Namaste! The Crystal Calculator recommended ${crystal.name} for me. I would like to order it. Please guide me.`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all hover:bg-[#F2E2D9]"
              style={{ background: '#FBFAF7', border: '1.5px solid #E0D4C8', color: '#53443C', fontFamily: "'Sora', sans-serif" }}
            >
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CrystalCalculatorPage() {
  const supabase = createClient()
  const [form, setForm] = useState({ name: '', dob: '', timeOfBirth: '', gender: 'female' })
  const [result, setResult] = useState<CrystalResult | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [aiStatus, setAiStatus] = useState<'idle'|'loading'|'done'|'fallback'>('idle')
  const [priceMap, setPriceMap] = useState<Record<string, { price: number; originalPrice?: number; id?: string }>>({})
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchPrices() {
      const { data } = await (supabase as any)
        .from('products').select('id,slug,price,sale_price').eq('product_type','crystal').eq('is_active',true)
      if (!data) return
      const map: Record<string, { price: number; originalPrice?: number; id?: string }> = {}
      for (const row of data as { id: string; slug: string; price: number; sale_price?: number }[]) {
        const cid = row.slug?.replace('-crystal','')
        if (cid && CRYSTAL_STATIC[cid]) {
          map[cid] = { price: row.sale_price ?? row.price, originalPrice: row.sale_price ? row.price : undefined, id: row.id }
        }
      }
      setPriceMap(map)
    }
    fetchPrices()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Please enter your full name (minimum 2 characters).'
    if (!form.dob) errs.dob = 'Please enter your date of birth.'
    else if (new Date(form.dob) >= new Date()) errs.dob = 'Date of birth must be in the past.'
    return errs
  }

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(); setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setCalculating(true); setAiStatus('loading'); setResult(null)

    const profile = buildProfile(form.dob, form.name, form.timeOfBirth)
    const key = `${form.dob}|${form.name.toLowerCase().trim()}|${form.timeOfBirth}|${form.gender}`
    const ranked = mathRanking(profile, form.gender, key)
    const mathRes = buildMathResult(profile, form.gender, form, priceMap)

    setResult(mathRes); setCalculating(false)
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)

    try {
      const res = await fetch('/api/crystal-recommendation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(), dob: form.dob, timeOfBirth: form.timeOfBirth, gender: form.gender,
          lifePathNumber: profile.lifePathNumber, nameNumber: profile.nameNumber, destinyNumber: profile.destinyNumber,
          rulingPlanet: profile.rulingPlanet, dayLord: profile.dayLord, birthHourPlanet: profile.birthHourPlanet,
          mathRanking: ranked.slice(0, 6),
        }),
      })
      if (!res.ok) throw new Error()
      const aiData = await res.json()
      if (!aiData.recommendations || aiData.recommendations.length < 3) throw new Error()

      const recs = (aiData.recommendations as GroqRecommendation[]).sort((a, b) => a.rank - b.rank)
      const [r1, r2, r3] = recs
      function enrichFromId(id: string): CrystalWithPrice {
        const s = CRYSTAL_STATIC[id] ?? CRYSTAL_STATIC[ranked[0].id]!
        const p = priceMap[s.id]
        return { ...s, price: p?.price ?? s.fallbackPrice, originalPrice: p?.originalPrice, dbProductId: p?.id }
      }
      const rationales: Record<string, string> = {}
      for (const rec of recs) rationales[rec.crystalId] = rec.rationale

      setResult({ profile, primary: enrichFromId(r1.crystalId), secondary: enrichFromId(r2.crystalId), tertiary: enrichFromId(r3.crystalId), aiRationales: rationales, soulMessage: aiData.soulMessage || mathRes.soulMessage, source: 'ai' })
      setAiStatus('done')
    } catch {
      setAiStatus('fallback')
    }
  }

  function handleReset() {
    setResult(null); setForm({ name: '', dob: '', timeOfBirth: '', gender: 'female' })
    setErrors({}); setAiStatus('idle')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const today = new Date().toISOString().split('T')[0]
  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    background: '#ffffff',
    border: `1.5px solid ${hasError ? '#DC2626' : '#E0D4C8'}`,
    borderRadius: 12,
    color: '#2F2A44',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    padding: '14px 18px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
    colorScheme: 'light',
  })

  return (
    <div className="min-h-screen" style={{ background: '#FBFAF7' }}>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6"
        style={{ background: 'linear-gradient(160deg, #FBFAF7 60%, #F2E2D9 100%)' }}
      >
        {/* Subtle geometric accent */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <svg className="absolute right-0 top-0 w-96 h-96 opacity-[0.04]" viewBox="0 0 400 400">
            <polygon points="200,20 380,380 20,380" fill="none" stroke="#C67D53" strokeWidth="2"/>
            <circle cx="200" cy="200" r="160" fill="none" stroke="#C67D53" strokeWidth="1"/>
            <circle cx="200" cy="200" r="80"  fill="none" stroke="#C67D53" strokeWidth="1"/>
          </svg>
          <svg className="absolute left-0 bottom-0 w-64 h-64 opacity-[0.04]" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r="120" fill="none" stroke="#2F2A44" strokeWidth="1"/>
            <polygon points="150,30 270,270 30,270" fill="none" stroke="#2F2A44" strokeWidth="1"/>
          </svg>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12" style={{ background: '#C67D53', opacity: 0.4 }} />
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#C67D53]" style={{ fontFamily: "'Sora', sans-serif" }}>
              Vedic Crystal Science
            </p>
            <div className="h-px w-12" style={{ background: '#C67D53', opacity: 0.4 }} />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#2F2A44] mb-5 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Crystal<br />
            <span style={{ color: '#C67D53' }}>Calculator</span>
          </h1>

          <p className="text-[#6B5E55] text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-3">
            Discover the healing crystals aligned to your birth vibration — calculated through classical Vedic numerology and AI-assisted planetary analysis.
          </p>
          <p className="text-[#B5A89E] text-sm mb-10" style={{ fontFamily: "'Sora', sans-serif" }}>
            Deterministic algorithm — identical inputs always produce the same sacred result.
          </p>

          {/* Method pills */}
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { icon: 'calculate', label: 'Life Path Numerology' },
              { icon: 'language',  label: 'Navagraha Planets'   },
              { icon: 'schedule',  label: 'Vedic Hora (Birth Hour)' },
              { icon: 'auto_awesome', label: 'Groq AI Refinement' },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: '#ffffff', border: '1.5px solid #E0D4C8' }}
              >
                <span className="material-symbols-outlined text-[14px] text-[#C67D53]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                <span className="text-[11px] font-semibold text-[#53443C]" style={{ fontFamily: "'Sora', sans-serif" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORM ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6" id="calculator">
        <div className="max-w-xl mx-auto">
          <div className="mb-8">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#C67D53] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
              Step 1 — Enter Your Details
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2F2A44]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Birth Information
            </h2>
          </div>

          <form
            onSubmit={handleCalculate}
            className="rounded-2xl p-6 sm:p-8 space-y-6"
            style={{ background: '#ffffff', border: '1.5px solid #E9E3DC', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
          >
            {/* Name */}
            <div>
              <label className="block text-xs font-bold tracking-[0.18em] uppercase mb-2 text-[#8A7D75]" style={{ fontFamily: "'Sora', sans-serif" }}>
                Full Name <span className="text-[#C67D53]">*</span>
              </label>
              <input
                id="crystal-name" type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="As commonly used or per birth certificate"
                style={inputStyle(!!errors.name)}
                onFocus={e => e.target.style.borderColor = '#C67D53'}
                onBlur={e => e.target.style.borderColor = errors.name ? '#DC2626' : '#E0D4C8'}
              />
              {errors.name && <p className="text-[#DC2626] text-xs mt-1.5">{errors.name}</p>}
            </div>

            {/* DOB */}
            <div>
              <label className="block text-xs font-bold tracking-[0.18em] uppercase mb-2 text-[#8A7D75]" style={{ fontFamily: "'Sora', sans-serif" }}>
                Date of Birth <span className="text-[#C67D53]">*</span>
              </label>
              <input
                id="crystal-dob" type="date" value={form.dob} max={today}
                onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                style={inputStyle(!!errors.dob)}
                onFocus={e => e.target.style.borderColor = '#C67D53'}
                onBlur={e => e.target.style.borderColor = errors.dob ? '#DC2626' : '#E0D4C8'}
              />
              {errors.dob && <p className="text-[#DC2626] text-xs mt-1.5">{errors.dob}</p>}
            </div>

            {/* Time of Birth */}
            <div>
              <label className="block text-xs font-bold tracking-[0.18em] uppercase mb-2 text-[#8A7D75]" style={{ fontFamily: "'Sora', sans-serif" }}>
                Time of Birth{' '}
                <span className="normal-case tracking-normal font-normal text-[#B5A89E]">(optional)</span>
              </label>
              <input
                id="crystal-tob" type="time" value={form.timeOfBirth}
                onChange={e => setForm(f => ({ ...f, timeOfBirth: e.target.value }))}
                style={inputStyle()}
                onFocus={e => e.target.style.borderColor = '#C67D53'}
                onBlur={e => e.target.style.borderColor = '#E0D4C8'}
              />
              <p className="text-[#B5A89E] text-xs mt-1.5">
                Enables Vedic Hora (planetary hour) calculation for greater precision.
              </p>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold tracking-[0.18em] uppercase mb-3 text-[#8A7D75]" style={{ fontFamily: "'Sora', sans-serif" }}>
                Gender
              </label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { v: 'female', l: 'Female', icon: 'female' },
                  { v: 'male',   l: 'Male',   icon: 'male'   },
                  { v: 'other',  l: 'Other',  icon: 'transgender' },
                ] as { v: string; l: string; icon: string }[]).map(opt => (
                  <button
                    key={opt.v} type="button" id={`gender-${opt.v}`}
                    onClick={() => setForm(f => ({ ...f, gender: opt.v }))}
                    className="py-3 px-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    style={{
                      background: form.gender === opt.v ? '#C67D53' : '#FBFAF7',
                      border: `1.5px solid ${form.gender === opt.v ? '#C67D53' : '#E0D4C8'}`,
                      color: form.gender === opt.v ? '#ffffff' : '#6B5E55',
                      fontFamily: "'Sora', sans-serif",
                    }}
                  >
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>{opt.icon}</span>
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="calculate-crystals-btn" type="submit" disabled={calculating}
              className="w-full py-4 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-3 disabled:opacity-60"
              style={{ background: calculating ? '#C67D53aa' : '#C67D53', fontFamily: "'Sora', sans-serif", letterSpacing: '0.08em' }}
            >
              {calculating
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Calculating your cosmic blueprint...</>
                : <><span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>Reveal My Sacred Crystals</>
              }
            </button>
          </form>
        </div>
      </section>

      {/* ── AI STATUS ───────────────────────────────────────────── */}
      {result && aiStatus === 'loading' && (
        <div className="px-4 sm:px-6 pb-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3 px-5 py-3 rounded-xl" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
            <span className="w-3.5 h-3.5 border-2 border-amber-400/50 border-t-amber-500 rounded-full animate-spin flex-shrink-0" />
            <p className="text-amber-800 text-xs" style={{ fontFamily: "'Sora', sans-serif" }}>
              Groq AI is refining your recommendations with Vedic analysis...
            </p>
          </div>
        </div>
      )}
      {result && aiStatus === 'done' && (
        <div className="px-4 sm:px-6 pb-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3 px-5 py-3 rounded-xl" style={{ background: '#D1FAE5', border: '1px solid #A7F3D0' }}>
            <span className="material-symbols-outlined text-[15px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <p className="text-emerald-800 text-xs" style={{ fontFamily: "'Sora', sans-serif" }}>
              Analysis complete — recommendations refined by Vedic AI.
            </p>
          </div>
        </div>
      )}

      {/* ── RESULTS ─────────────────────────────────────────────── */}
      {result && (
        <section ref={resultRef} className="py-8 px-4 sm:px-6 pb-24">
          <div className="max-w-3xl mx-auto">

            <div className="mb-8">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#C67D53] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                Step 2 — Your Sacred Crystals
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#2F2A44]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Crystal Blueprint for {form.name.trim().split(' ')[0]}
              </h2>
              <p className="text-[#9C8F85] text-sm mt-1">
                {result.source === 'ai' ? 'Refined by Vedic AI analysis.' : 'Calculated by Vedic numerology engine.'} Same inputs always yield the same result.
              </p>
            </div>

            {/* Numerology panel */}
            <div
              className="rounded-2xl p-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-5"
              style={{ background: '#ffffff', border: '1.5px solid #E9E3DC' }}
            >
              {([
                { label: 'Life Path', value: result.profile.lifePathNumber, icon: 'route' },
                { label: 'Name Number', value: result.profile.nameNumber, icon: 'text_fields' },
                { label: 'Ruling Planet', value: result.profile.rulingPlanet, icon: 'public' },
                { label: 'Day Lord', value: result.profile.dayLord, icon: 'calendar_today' },
              ] as { label: string; value: string | number; icon: string }[]).map(item => (
                <div key={item.label} className="text-center">
                  <span className="material-symbols-outlined text-[16px] text-[#C67D53] mb-1 block" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  <div className="text-xl font-bold text-[#2F2A44]" style={{ fontFamily: "'Playfair Display', serif" }}>{item.value}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#B5A89E] mt-0.5" style={{ fontFamily: "'Sora', sans-serif" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Soul message */}
            <div className="rounded-2xl p-5 mb-8" style={{ background: '#ffffff', border: '1.5px solid #E9E3DC' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#C67D53] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                Soul Blueprint — Life Path {result.profile.lifePathNumber} · {result.profile.rulingPlanet}
              </p>
              <p className="text-[#4A4060] leading-relaxed text-sm sm:text-[15px]">{result.soulMessage}</p>
            </div>

            {/* Crystal cards */}
            <div className="space-y-5">
              <CrystalCard crystal={result.primary}   rank="primary"   rationale={result.aiRationales[result.primary.id]}   />
              <CrystalCard crystal={result.secondary} rank="secondary" rationale={result.aiRationales[result.secondary.id]} />
              <CrystalCard crystal={result.tertiary}  rank="tertiary"  rationale={result.aiRationales[result.tertiary.id]}  />
            </div>

            {/* Crystal care */}
            <div className="mt-8 rounded-2xl p-6 sm:p-8" style={{ background: '#ffffff', border: '1.5px solid #E9E3DC' }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="material-symbols-outlined text-[20px] text-[#C67D53]" style={{ fontVariationSettings: "'FILL' 1" }}>nights_stay</span>
                <h3 className="text-lg font-bold text-[#2F2A44]" style={{ fontFamily: "'Playfair Display', serif" }}>Crystal Care Protocol</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {([
                  { n:'01', t:'Initial Cleansing', d:'Place under full moonlight overnight, or rinse under running water for 30 seconds while setting a clear intention.' },
                  { n:'02', t:'Programming',       d:'Hold in both hands, breathe deeply, and mentally state your intention three times with complete sincerity.' },
                  { n:'03', t:'Daily Practice',    d:'Follow the wearing instructions — the correct finger, hand, and auspicious weekday matter deeply in Vedic practice.' },
                  { n:'04', t:'Periodic Cleansing',d:'Cleanse every two weeks on a selenite plate overnight, or briefly buried in natural sea salt.' },
                ]).map(item => (
                  <div key={item.n} className="flex gap-4 p-4 rounded-xl" style={{ background: '#FBFAF7', border: '1px solid #EDE8E2' }}>
                    <div className="text-sm font-bold text-[#C67D53] font-mono flex-shrink-0 mt-0.5">{item.n}</div>
                    <div>
                      <p className="text-[#2F2A44] text-sm font-semibold mb-1">{item.t}</p>
                      <p className="text-[#6B5E55] text-xs leading-relaxed">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold transition-all"
                style={{ background: '#FBFAF7', border: '1.5px solid #E0D4C8', color: '#6B5E55', fontFamily: "'Sora', sans-serif" }}
              >
                <span className="material-symbols-outlined text-[15px]">refresh</span>
                Calculate for Another Person
              </button>
              <Link
                href="/shop"
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: '#C67D53', fontFamily: "'Sora', sans-serif" }}
              >
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
                Browse All Crystals
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── PRE-RESULT: COLLECTION + METHODOLOGY ────────────────── */}
      {!result && !calculating && (
        <section className="py-12 px-4 sm:px-6 pb-24">
          <div className="max-w-4xl mx-auto">

            {/* Collection grid */}
            <div className="mb-12">
              <div className="mb-6">
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#C67D53] mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>Our Collection</p>
                <h2 className="text-2xl font-bold text-[#2F2A44]" style={{ fontFamily: "'Playfair Display', serif" }}>12 Sacred Vedic Crystals</h2>
                <p className="text-[#9C8F85] text-sm mt-1">Prices managed live from admin panel.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.values(CRYSTAL_STATIC).map(crystal => (
                  <Link
                    key={crystal.id}
                    href={`/shop?slug=${crystal.slug}`}
                    className="group p-4 rounded-xl transition-all hover:shadow-md"
                    style={{ background: '#ffffff', border: '1.5px solid #E9E3DC' }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <CrystalIcon color={crystal.color} symbol={crystal.symbol} size={36} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2F2A44] leading-tight truncate" style={{ fontFamily: "'Sora', sans-serif" }}>{crystal.name}</p>
                        <p className="text-[10px] text-[#B5A89E]">{crystal.planet}</p>
                      </div>
                    </div>
                    <p className="text-xs font-semibold font-mono" style={{ color: crystal.color }}>
                      ₹{(priceMap[crystal.id]?.price ?? crystal.fallbackPrice).toLocaleString('en-IN')}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Methodology */}
            <div className="mb-2">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#C67D53] mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>Methodology</p>
              <h2 className="text-2xl font-bold text-[#2F2A44] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>How the Algorithm Works</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {([
                { icon:'route',         t:'Life Path Number',       d:'Pythagorean digit reduction of your full DOB — the primary soul vibration, weighted highest in the algorithm.' },
                { icon:'text_fields',   t:'Chaldean Name Number',   d:'Each letter mapped to ancient Chaldean numeric values, reduced to reveal your destiny expression.' },
                { icon:'schedule',      t:'Vedic Hora (Birth Hour)',d:'The 7-planet Hora wheel determines which Navagraha governed your exact birth hour.' },
                { icon:'public',        t:'Navagraha Resonance',    d:'Each crystal is mapped to Vedic planets. Your ruling planet alignment carries major weight.' },
                { icon:'calendar_today',t:'Day Lord Alignment',     d:'The weekday planet of your birth day cross-referenced against each crystal\'s planetary ruler.' },
                { icon: 'auto_awesome', t:'Vedic AI Refinement',    d:'Vedic AI reasons over your full numerological profile to apply deeper crystal correspondences and planetary wisdom.' },
              ]).map(item => (
                <div key={item.t} className="p-5 rounded-xl" style={{ background: '#ffffff', border: '1.5px solid #E9E3DC' }}>
                  <span className="material-symbols-outlined text-[20px] text-[#C67D53] mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  <h3 className="text-sm font-bold text-[#2F2A44] mb-1.5" style={{ fontFamily: "'Playfair Display', serif" }}>{item.t}</h3>
                  <p className="text-xs text-[#6B5E55] leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

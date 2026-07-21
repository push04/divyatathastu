'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

// ─── Crystal Static Data ─────────────────────────────────────────────────────
// Prices are fetched live from the products table. These are fallback defaults.
const CRYSTAL_STATIC: Record<string, {
  id: string; name: string; sanskrit: string; slug: string
  chakra: string; planet: string; element: string
  numerology: number[]
  benefits: string[]; wearing: string; mantra: string
  imageUrl: string
  fallbackPrice: number
}> = {
  amethyst: {
    id: 'amethyst', name: 'Amethyst', sanskrit: 'Jamunia', slug: 'amethyst-crystal',
    chakra: 'Crown & Third Eye', planet: 'Saturn & Jupiter', element: 'Air',
    numerology: [2, 3, 7, 9],
    benefits: ['Spiritual awakening', 'Intuition enhancement', 'Stress relief', 'Dream clarity', 'Protection from negativity'],
    wearing: 'Ring finger of the right hand on Saturday morning.',
    mantra: 'OM Sham Shanaischaraya Namah',
    imageUrl: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=600&q=80',
    fallbackPrice: 849,
  },
  'rose-quartz': {
    id: 'rose-quartz', name: 'Rose Quartz', sanskrit: 'Paniya Pushkraj', slug: 'rose-quartz-crystal',
    chakra: 'Heart', planet: 'Venus', element: 'Water',
    numerology: [2, 6, 7],
    benefits: ['Unconditional love', 'Emotional healing', 'Relationship harmony', 'Self-compassion', 'Fertility'],
    wearing: 'Ring or little finger of the left hand on Friday.',
    mantra: 'OM Shukraya Namah',
    imageUrl: 'https://images.unsplash.com/photo-1612686635542-2244ed5f7149?w=600&q=80',
    fallbackPrice: 649,
  },
  'clear-quartz': {
    id: 'clear-quartz', name: 'Clear Quartz', sanskrit: 'Sphatik', slug: 'clear-quartz-crystal',
    chakra: 'All Chakras', planet: 'Sun & Moon', element: 'All Elements',
    numerology: [1, 4, 7, 8],
    benefits: ['Amplifies intentions', 'Mental clarity', 'Energy purification', 'Memory enhancement', 'Manifestation'],
    wearing: 'Any finger of either hand. Best on Sunday or Monday morning.',
    mantra: 'OM Krim Krishnaya Namah',
    imageUrl: 'https://images.unsplash.com/photo-1518095933-8a9e08e11c3c?w=600&q=80',
    fallbackPrice: 549,
  },
  citrine: {
    id: 'citrine', name: 'Citrine', sanskrit: 'Sunhela', slug: 'citrine-crystal',
    chakra: 'Solar Plexus', planet: 'Sun & Jupiter', element: 'Fire',
    numerology: [1, 3, 6, 9],
    benefits: ['Wealth & abundance', 'Confidence boost', 'Creative energy', 'Positivity', 'Business success'],
    wearing: 'Index finger of the right hand on Thursday morning.',
    mantra: 'OM Brim Brihaspataye Namah',
    imageUrl: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=600&q=80',
    fallbackPrice: 749,
  },
  'black-tourmaline': {
    id: 'black-tourmaline', name: 'Black Tourmaline', sanskrit: 'Shyam Vaikrant', slug: 'black-tourmaline-crystal',
    chakra: 'Root', planet: 'Saturn', element: 'Earth',
    numerology: [2, 4, 8],
    benefits: ['EMF protection', 'Grounding energy', 'Negative energy shield', 'Anxiety relief', 'Aura cleansing'],
    wearing: 'Keep in pocket or wear as pendant. Activate on Saturday.',
    mantra: 'OM Sham Shanaischaraya Namah',
    imageUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&q=80',
    fallbackPrice: 699,
  },
  'lapis-lazuli': {
    id: 'lapis-lazuli', name: 'Lapis Lazuli', sanskrit: 'Lajward', slug: 'lapis-lazuli-crystal',
    chakra: 'Third Eye & Throat', planet: 'Jupiter & Venus', element: 'Water',
    numerology: [3, 7, 9],
    benefits: ['Wisdom & truth', 'Communication clarity', 'Inner vision', 'Royal energy', 'Psychic abilities'],
    wearing: 'Index or middle finger of the right hand on Thursday.',
    mantra: 'OM Aim Saraswatyai Namah',
    imageUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&q=80',
    fallbackPrice: 899,
  },
  moonstone: {
    id: 'moonstone', name: 'Moonstone', sanskrit: 'Chandrakant Mani', slug: 'moonstone-crystal',
    chakra: 'Crown & Sacral', planet: 'Moon', element: 'Water',
    numerology: [2, 4, 7],
    benefits: ['Intuition', 'Feminine energy', 'Emotional balance', 'New beginnings', 'Fertility & love'],
    wearing: 'Ring finger of the right hand on Monday evening.',
    mantra: 'OM Somaya Namah',
    imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600&q=80',
    fallbackPrice: 999,
  },
  'green-aventurine': {
    id: 'green-aventurine', name: 'Green Aventurine', sanskrit: 'Harit Sphatik', slug: 'green-aventurine-crystal',
    chakra: 'Heart', planet: 'Mercury & Venus', element: 'Earth',
    numerology: [1, 3, 6],
    benefits: ['Luck & opportunity', 'Heart healing', 'Prosperity', 'Emotional calm', 'Career growth'],
    wearing: 'Little finger of the right hand on Wednesday.',
    mantra: 'OM Budhaya Namah',
    imageUrl: 'https://images.unsplash.com/photo-1567601452716-8e0e95e51c3e?w=600&q=80',
    fallbackPrice: 599,
  },
  'tigers-eye': {
    id: 'tigers-eye', name: "Tiger's Eye", sanskrit: 'Vaidurya', slug: 'tigers-eye-crystal',
    chakra: 'Solar Plexus & Root', planet: 'Sun & Mars', element: 'Fire',
    numerology: [1, 4, 8, 9],
    benefits: ['Courage & strength', 'Willpower', 'Protection in travel', 'Decision making', 'Overcoming fear'],
    wearing: 'Index finger of the right hand on Sunday or Tuesday.',
    mantra: 'OM Suryaya Namah',
    imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80',
    fallbackPrice: 679,
  },
  sodalite: {
    id: 'sodalite', name: 'Sodalite', sanskrit: 'Neeli Vaidurya', slug: 'sodalite-crystal',
    chakra: 'Third Eye & Throat', planet: 'Mercury', element: 'Air',
    numerology: [2, 6, 7],
    benefits: ['Logical thinking', 'Communication', 'Self-discipline', 'Truth speaking', 'Insomnia relief'],
    wearing: 'Middle finger on Wednesday or under pillow for peaceful sleep.',
    mantra: 'OM Bum Budhaya Namah',
    imageUrl: 'https://images.unsplash.com/photo-1612831455359-970e23a1e4e9?w=600&q=80',
    fallbackPrice: 729,
  },
  'red-jasper': {
    id: 'red-jasper', name: 'Red Jasper', sanskrit: 'Rakta Pashaan', slug: 'red-jasper-crystal',
    chakra: 'Root & Sacral', planet: 'Mars', element: 'Earth',
    numerology: [1, 4, 8],
    benefits: ['Vitality & strength', 'Emotional stability', 'Physical energy', 'Endurance', 'Sexual health'],
    wearing: 'Ring finger of the right hand on Tuesday morning.',
    mantra: 'OM Am Angarkaya Namah',
    imageUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=80',
    fallbackPrice: 629,
  },
  labradorite: {
    id: 'labradorite', name: 'Labradorite', sanskrit: 'Indraneela', slug: 'labradorite-crystal',
    chakra: 'Third Eye & Throat', planet: 'Moon', element: 'Water',
    numerology: [5, 7, 9],
    benefits: ['Transformation', 'Magic & synchronicity', 'Psychic protection', 'Hidden potential', 'Spiritual awakening'],
    wearing: 'Wear as pendant on full moon nights or near meditation space.',
    mantra: 'OM Chandraya Namah',
    imageUrl: 'https://images.unsplash.com/photo-1510598969022-c4c6c5d05769?w=600&q=80',
    fallbackPrice: 1099,
  },
}

const CRYSTAL_IDS = Object.keys(CRYSTAL_STATIC)

// ─── Types ────────────────────────────────────────────────────────────────────
interface CrystalWithPrice {
  id: string
  name: string
  sanskrit: string
  slug: string
  chakra: string
  planet: string
  element: string
  numerology: number[]
  benefits: string[]
  wearing: string
  mantra: string
  imageUrl: string
  price: number
  originalPrice?: number
  dbProductId?: string
}

interface NumerologyProfile {
  lifePathNumber: number
  nameNumber: number
  destinyNumber: number
  dayNumber: number
  monthNumber: number
  rulingPlanet: string
  dayLord: string
  birthHourPlanet: string
}

interface GroqRecommendation {
  crystalId: string
  rank: number
  rationale: string
}

interface CrystalResult {
  profile: NumerologyProfile
  primary: CrystalWithPrice
  secondary: CrystalWithPrice
  tertiary: CrystalWithPrice
  aiRationales: Record<string, string>
  soulMessage: string
  source: 'ai' | 'math'
}

// ─── Vedic Mathematical Engine ────────────────────────────────────────────────

// djb2 hash — ensures tie-breaking is deterministic per person
function djb2(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i)
  return Math.abs(h)
}

// Pythagorean digit reduction (preserves 11, 22, 33)
function reduce(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33)
    n = String(n).split('').reduce((s, d) => s + +d, 0)
  return n
}

// Chaldean name number
function chaldeanName(name: string): number {
  const MAP: Record<string, number> = {
    A:1,I:1,J:1,Q:1,Y:1,B:2,K:2,R:2,
    C:3,G:3,L:3,S:3,D:4,M:4,T:4,E:5,
    H:5,N:5,X:5,U:6,V:6,W:6,O:7,Z:7,F:8,P:8,
  }
  const cleaned = name.toUpperCase().replace(/[^A-Z]/g, '')
  let sum = cleaned.split('').reduce((acc, ch) => acc + (MAP[ch] || 0), 0)
  while (sum > 9) sum = String(sum).split('').reduce((s, d) => s + +d, 0)
  return sum || 1
}

// Planet for Life Path number (Vedic Navagraha mapping)
function rulingPlanetFor(lpn: number): string {
  const map: Record<number, string> = {
    1:'Sun', 2:'Moon', 3:'Jupiter', 4:'Rahu',
    5:'Mercury', 6:'Venus', 7:'Ketu', 8:'Saturn', 9:'Mars',
    11:'Moon', 22:'Saturn', 33:'Jupiter',
  }
  return map[lpn] || map[lpn % 9 || 9]!
}

// Day lord — Vedic weekday planet
function dayLordOf(dob: string): string {
  const d = new Date(dob)
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()].replace(
    'Sun','Sun').replace('Mon','Moon').replace('Tue','Mars')
    .replace('Wed','Mercury').replace('Thu','Jupiter')
    .replace('Fri','Venus').replace('Sat','Saturn')
}

// Hora (planetary hour) wheel — standard Vedic order starting Sunday 6am
const HORA_SEQUENCE = ['Sun','Venus','Mercury','Moon','Saturn','Jupiter','Mars']
function birthHourPlanet(dob: string, time: string): string {
  if (!time) return ''
  const weekday = new Date(dob).getDay() // 0=Sun
  const [h] = time.split(':').map(Number)
  const horaIdx = (weekday * 24 + h) % 7
  return HORA_SEQUENCE[horaIdx]
}

// Destiny number — sum ALL digits of dob
function destinyNumber(dob: string): number {
  return reduce(dob.replace(/-/g, '').split('').reduce((s, d) => s + +d, 0))
}

// Compute full numerology profile
function buildProfile(dob: string, name: string, time: string): NumerologyProfile {
  const parts = dob.split('-')
  const allDigits = dob.replace(/-/g, '').split('').map(Number)
  const lpn = reduce(allDigits.reduce((a, b) => a + b, 0))
  const day = reduce(parseInt(parts[2]))
  const month = reduce(parseInt(parts[1]))

  return {
    lifePathNumber: lpn,
    nameNumber: chaldeanName(name),
    destinyNumber: destinyNumber(dob),
    dayNumber: day,
    monthNumber: month,
    rulingPlanet: rulingPlanetFor(lpn),
    dayLord: dayLordOf(dob),
    birthHourPlanet: birthHourPlanet(dob, time),
  }
}

// Crystal resonance score — pure math (used as fallback & sent to Groq as context)
function scoreCrystal(
  id: string,
  profile: NumerologyProfile,
  gender: string,
  compositeKey: string
): number {
  const c = CRYSTAL_STATIC[id]!
  let score = 0

  // Primary numerological resonance (weighted)
  if (c.numerology.includes(profile.lifePathNumber)) score += 50   // highest
  if (c.numerology.includes(profile.nameNumber))     score += 35
  if (c.numerology.includes(profile.destinyNumber))  score += 25
  if (c.numerology.includes(profile.dayNumber))      score += 15
  if (c.numerology.includes(profile.monthNumber))    score += 10

  // Planetary alignment
  const planet = profile.rulingPlanet
  const matchPlanet = c.planet.toLowerCase().includes(planet.toLowerCase())
  if (matchPlanet) score += 30

  const dayP = profile.dayLord
  if (c.planet.toLowerCase().includes(dayP.toLowerCase())) score += 15

  if (profile.birthHourPlanet && c.planet.toLowerCase().includes(profile.birthHourPlanet.toLowerCase())) score += 20

  // Gender resonance (Venus/Moon lean feminine, Sun/Mars lean masculine)
  if (gender === 'female' && ['Venus','Moon'].some(p => c.planet.includes(p))) score += 12
  if (gender === 'male'   && ['Sun','Mars','Jupiter'].some(p => c.planet.includes(p))) score += 12

  // Deterministic tie-breaking — same person always same rank
  score += djb2(`${compositeKey}${id}`) % 15

  return score
}

function mathRanking(profile: NumerologyProfile, gender: string, compositeKey: string) {
  return CRYSTAL_IDS
    .map(id => ({ id, score: scoreCrystal(id, profile, gender, compositeKey) }))
    .sort((a, b) => b.score !== a.score
      ? b.score - a.score
      : djb2(`${b.id}${compositeKey}`) - djb2(`${a.id}${compositeKey}`)
    )
}

function pickDiverseTop3(
  ranked: { id: string; score: number }[]
): [string, string, string] {
  const first = ranked[0].id
  const firstEl = CRYSTAL_STATIC[first]!.element
  const second = ranked.find((r, i) => i > 0 && CRYSTAL_STATIC[r.id]!.element !== firstEl)?.id
    ?? ranked[1].id
  const third = ranked.find(r => r.id !== first && r.id !== second)?.id
    ?? ranked[2].id
  return [first, second!, third!]
}

// Build result from pure math (no Groq)
function buildMathResult(
  profile: NumerologyProfile,
  gender: string,
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
    1:'You carry the solar frequency of independent leadership. Your soul blueprint is that of the pioneer.',
    2:'Your Moon-ruled soul operates through sensitivity, diplomacy, and deep relational intelligence.',
    3:'Jupiter governs your expansive nature. You are a communicator, teacher, and creator by soul design.',
    4:'Rahu gives you earthly mastery — disciplined, methodical, and built to create lasting structures.',
    5:'Mercury blesses you with adaptability and intellect. Variety, travel, and ideas fuel your dharma.',
    6:'Venus rules your life path, gifting you beauty, love, and a profound artistic nature.',
    7:'Ketu guides you inward — the mystic, the philosopher, seeking liberation through wisdom.',
    8:'Saturn demands karmic accountability. Your path brings power through discipline and responsibility.',
    9:'Mars completes the cycle in you — a warrior of compassion, built for service and transformation.',
    11:'You carry the Master 11 vibration — heightened intuition and a mission to inspire humanity.',
    22:'The Master Builder number. You are encoded to manifest the greatest visions into physical form.',
    33:'The Master Teacher. Your entire existence is an act of sacred service and divine love.',
  }

  return {
    profile,
    primary: enrich(pId),
    secondary: enrich(sId),
    tertiary: enrich(tId),
    aiRationales: {},
    soulMessage: INSIGHTS[profile.lifePathNumber] ?? INSIGHTS[9],
    source: 'math',
  }
}

// ─── Crystal Card Component ───────────────────────────────────────────────────
const RANK_STYLE = {
  primary: {
    label: 'Primary Crystal',
    labelCls: 'bg-amber-400/20 text-amber-300 border border-amber-400/30',
    borderCls: '2px solid rgba(155,89,182,0.7)',
    glow: '0 0 40px rgba(155,89,182,0.18), 0 20px 60px rgba(0,0,0,0.4)',
  },
  secondary: {
    label: 'Secondary Crystal',
    labelCls: 'bg-white/10 text-white/70 border border-white/15',
    borderCls: '1px solid rgba(255,255,255,0.12)',
    glow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  tertiary: {
    label: 'Supporting Crystal',
    labelCls: 'bg-white/6 text-white/50 border border-white/10',
    borderCls: '1px solid rgba(255,255,255,0.07)',
    glow: '0 4px 16px rgba(0,0,0,0.2)',
  },
}

function CrystalCard({
  crystal, rank, rationale,
}: {
  crystal: CrystalWithPrice
  rank: 'primary' | 'secondary' | 'tertiary'
  rationale?: string
}) {
  const style = RANK_STYLE[rank]
  const [imgErr, setImgErr] = useState(false)

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.005]"
      style={{ background: 'linear-gradient(135deg,#12071e 0%,#0d1525 60%,#12071e 100%)', border: style.borderCls, boxShadow: style.glow }}
    >
      {/* Colour accent glow */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, #9B59B6, transparent 65%)' }} />

      <div className="relative z-10 p-6 md:p-8">
        {/* Rank badge + icon row */}
        <div className="flex items-center justify-between mb-5">
          <span className={`text-[10px] font-bold tracking-[0.22em] uppercase px-3 py-1 rounded-full ${style.labelCls}`}
            style={{ fontFamily: "'Sora', sans-serif" }}>
            {style.label}
          </span>
          <span className="material-symbols-outlined text-[28px] text-purple-300/60"
            style={{ fontVariationSettings: "'FILL' 1" }}>
            diamond
          </span>
        </div>

        {/* Crystal image + name */}
        <div className="flex gap-5 mb-6">
          <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
            {!imgErr ? (
              <Image
                src={crystal.imageUrl}
                alt={crystal.name}
                fill
                className="object-cover"
                onError={() => setImgErr(true)}
                sizes="96px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[40px] text-purple-300/50"
                  style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {crystal.name}
            </h3>
            <p className="text-xs tracking-widest text-white/40 mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
              {crystal.sanskrit}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {([['Chakra', crystal.chakra], ['Planet', crystal.planet], ['Element', crystal.element]] as [string, string][]).map(([l, v]) => (
                <div key={l} className="text-xs">
                  <span className="text-white/30">{l}: </span>
                  <span className="text-white/70 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI / math rationale */}
        {rationale && (
          <div className="mb-5 p-4 rounded-xl" style={{ background: 'rgba(155,89,182,0.08)', border: '1px solid rgba(155,89,182,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[14px] text-purple-400" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-purple-400/80" style={{ fontFamily: "'Sora', sans-serif" }}>
                AI Vedic Analysis
              </p>
            </div>
            <p className="text-white/65 text-sm leading-relaxed">{rationale}</p>
          </div>
        )}

        {/* Benefits */}
        <div className="mb-5">
          <p className="text-[10px] tracking-widest uppercase text-white/25 mb-2.5" style={{ fontFamily: "'Sora', sans-serif" }}>
            Key Benefits
          </p>
          <div className="flex flex-wrap gap-2">
            {crystal.benefits.slice(0, 4).map(b => (
              <span key={b} className="text-xs px-2.5 py-1 rounded-full text-white/75"
                style={{ background: 'rgba(155,89,182,0.12)', border: '1px solid rgba(155,89,182,0.25)' }}>
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Mantra + Wearing */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div>
            <p className="text-[10px] tracking-widest uppercase text-white/25 mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
              Sacred Mantra
            </p>
            <p className="text-white/85 text-sm font-medium leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>
              {crystal.mantra}
            </p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase text-white/25 mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
              How to Wear
            </p>
            <p className="text-white/60 text-xs leading-relaxed">{crystal.wearing}</p>
          </div>
        </div>

        {/* Price + CTAs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5" style={{ fontFamily: "'Sora', sans-serif" }}>
              Price
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ₹{crystal.price.toLocaleString('en-IN')}
              </span>
              {crystal.originalPrice && crystal.originalPrice > crystal.price && (
                <span className="text-sm text-white/35 line-through" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ₹{crystal.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3 flex-1 justify-end flex-wrap">
            <Link
              href={`/shop?category=crystal&search=${encodeURIComponent(crystal.name)}`}
              className="flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#7B2DBF,#9B59B6)', fontFamily: "'Sora', sans-serif", boxShadow: '0 4px 20px rgba(155,89,182,0.35)' }}>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
              Add to Cart
            </Link>
            <a
              href={`https://wa.me/919858784784?text=${encodeURIComponent(`Namaste! The Crystal Calculator recommended ${crystal.name} for me. I would like to order it. Please guide me.`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white/65 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Sora', sans-serif" }}>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
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
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'done' | 'fallback'>('idle')
  const [priceMap, setPriceMap] = useState<Record<string, { price: number; originalPrice?: number; id?: string }>>({})
  const resultRef = useRef<HTMLDivElement>(null)

  // Fetch live crystal prices from products table on mount
  useEffect(() => {
    async function fetchPrices() {
      const { data } = await (supabase as any)
        .from('products')
        .select('id,slug,price,sale_price')
        .eq('product_type', 'crystal')
        .eq('is_active', true)
      if (!data) return
      const map: Record<string, { price: number; originalPrice?: number; id?: string }> = {}
      for (const row of data as { id: string; slug: string; price: number; sale_price?: number }[]) {
        const crystalId = row.slug?.replace('-crystal', '')
        if (crystalId && CRYSTAL_STATIC[crystalId]) {
          map[crystalId] = {
            price: row.sale_price ?? row.price,
            originalPrice: row.sale_price ? row.price : undefined,
            id: row.id,
          }
        }
      }
      setPriceMap(map)
    }
    fetchPrices()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Please enter your full name (minimum 2 characters)'
    if (!form.dob) errs.dob = 'Please enter your date of birth'
    else if (new Date(form.dob) >= new Date()) errs.dob = 'Date of birth must be in the past'
    return errs
  }

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setCalculating(true)
    setAiStatus('loading')
    setResult(null)

    const profile = buildProfile(form.dob, form.name, form.timeOfBirth)
    const key = `${form.dob}|${form.name.toLowerCase().trim()}|${form.timeOfBirth}|${form.gender}`
    const ranked = mathRanking(profile, form.gender, key)
    const mathRes = buildMathResult(profile, form.gender, form, priceMap)

    // Show math result immediately while Groq loads
    setResult(mathRes)
    setCalculating(false)
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)

    // Then call Groq AI in background
    try {
      const res = await fetch('/api/crystal-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          dob: form.dob,
          timeOfBirth: form.timeOfBirth,
          gender: form.gender,
          lifePathNumber: profile.lifePathNumber,
          nameNumber: profile.nameNumber,
          destinyNumber: profile.destinyNumber,
          rulingPlanet: profile.rulingPlanet,
          dayLord: profile.dayLord,
          birthHourPlanet: profile.birthHourPlanet,
          mathRanking: ranked.slice(0, 6),
        }),
      })

      if (!res.ok) throw new Error('groq_failed')
      const aiData = await res.json()
      if (!aiData.recommendations || aiData.recommendations.length < 3) throw new Error('incomplete')

      // Rebuild result with AI rankings
      const recs = aiData.recommendations as GroqRecommendation[]
      const [r1, r2, r3] = recs.sort((a, b) => a.rank - b.rank)

      function enrichFromId(id: string): CrystalWithPrice {
        const s = CRYSTAL_STATIC[id] ?? CRYSTAL_STATIC[ranked[0].id]!
        const p = priceMap[s.id]
        return { ...s, price: p?.price ?? s.fallbackPrice, originalPrice: p?.originalPrice, dbProductId: p?.id }
      }

      const rationales: Record<string, string> = {}
      for (const rec of recs) rationales[rec.crystalId] = rec.rationale

      setResult({
        profile,
        primary: enrichFromId(r1.crystalId),
        secondary: enrichFromId(r2.crystalId),
        tertiary: enrichFromId(r3.crystalId),
        aiRationales: rationales,
        soulMessage: aiData.soulMessage || mathRes.soulMessage,
        source: 'ai',
      })
      setAiStatus('done')
    } catch {
      setAiStatus('fallback')
    }
  }

  function handleReset() {
    setResult(null)
    setForm({ name: '', dob: '', timeOfBirth: '', gender: 'female' })
    setErrors({})
    setAiStatus('idle')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen" style={{ background: '#08030f' }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: '100vh' }}>
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 20%,#1a0530 0%,#08030f 40%,#030812 100%)' }} />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle,#9B59B6,transparent)' }} />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle,#2E86AB,transparent)' }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cgeo" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <polygon points="60,5 115,90 5,90" fill="none" stroke="#9B59B6" strokeWidth="0.5" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="#9B59B6" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cgeo)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12" style={{ background: 'linear-gradient(90deg,transparent,rgba(155,89,182,0.6))' }} />
            <p className="text-purple-400/80 text-xs font-bold tracking-[0.35em] uppercase" style={{ fontFamily: "'Sora', sans-serif" }}>
              Vedic Crystal Science
            </p>
            <div className="h-px w-12" style={{ background: 'linear-gradient(270deg,transparent,rgba(155,89,182,0.6))' }} />
          </div>

          <div className="flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-[48px] text-purple-300/60"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              diamond
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-center mb-6 leading-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: 'linear-gradient(135deg,#ffffff 0%,#d4a0ff 40%,#9B59B6 70%,#ffffff 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
            Crystal<br />
            <span style={{
              background: 'linear-gradient(135deg,#f59e0b 0%,#c084fc 50%,#9B59B6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Calculator</span>
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-16" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.5))' }} />
            <span className="material-symbols-outlined text-[14px] text-amber-400/60"
              style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <div className="h-px w-16" style={{ background: 'linear-gradient(270deg,transparent,rgba(245,158,11,0.5))' }} />
          </div>

          <p className="text-white/50 text-base sm:text-lg text-center max-w-xl leading-relaxed mb-3">
            Discover your sacred crystals through Vedic numerology, Navagraha science, and AI-powered analysis.
          </p>
          <p className="text-purple-400/50 text-sm text-center mb-12" style={{ fontFamily: "'Sora', sans-serif" }}>
            Deterministic algorithm — same inputs always yield the same sacred result.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-12">
            {[
              { icon: 'calculate', label: 'Vedic Numerology' },
              { icon: 'language', label: 'Navagraha Science' },
              { icon: 'auto_awesome', label: 'Groq AI Analysis' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                  style={{ background: 'rgba(155,89,182,0.12)', border: '1px solid rgba(155,89,182,0.2)' }}>
                  <span className="material-symbols-outlined text-[18px] text-purple-300/70"
                    style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <p className="text-white/35 text-[10px] leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>{item.label}</p>
              </div>
            ))}
          </div>

          <button onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center gap-2 group">
            <span className="text-white/25 text-xs tracking-widest uppercase group-hover:text-white/45 transition-colors"
              style={{ fontFamily: "'Sora', sans-serif" }}>
              Begin Your Reading
            </span>
            <div className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center pt-1.5 animate-bounce"
              style={{ animationDuration: '2s' }}>
              <div className="w-1 h-2 rounded-full bg-white/35" />
            </div>
          </button>
        </div>
      </section>

      {/* ── FORM ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6" id="calculator">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-purple-400/70 text-xs font-bold tracking-[0.25em] uppercase mb-3"
              style={{ fontFamily: "'Sora', sans-serif" }}>
              Step 1 — Your Details
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Enter Your Birth Details
            </h2>
            <p className="text-white/35 text-sm">
              Your Life Path, Name Vibration, and Planetary Hour are calculated from these inputs.
            </p>
          </div>

          <form onSubmit={handleCalculate} className="rounded-2xl p-6 sm:p-8 space-y-6"
            style={{ background: 'linear-gradient(135deg,rgba(155,89,182,0.06),rgba(255,255,255,0.02))', border: '1px solid rgba(155,89,182,0.15)', backdropFilter: 'blur(20px)' }}>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold tracking-[0.2em] uppercase mb-2 text-white/45"
                style={{ fontFamily: "'Sora', sans-serif" }}>
                Full Name <span className="text-purple-400">*</span>
              </label>
              <input
                id="crystal-name"
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="As per birth certificate or commonly used"
                className="w-full px-5 py-4 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: errors.name ? '1px solid #ef4444' : '1px solid rgba(155,89,182,0.2)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={e => { e.target.style.border = '1px solid rgba(155,89,182,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(155,89,182,0.08)' }}
                onBlur={e => { e.target.style.border = errors.name ? '1px solid #ef4444' : '1px solid rgba(155,89,182,0.2)'; e.target.style.boxShadow = 'none' }}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.name}</p>}
            </div>

            {/* DOB */}
            <div>
              <label className="block text-xs font-bold tracking-[0.2em] uppercase mb-2 text-white/45"
                style={{ fontFamily: "'Sora', sans-serif" }}>
                Date of Birth <span className="text-purple-400">*</span>
              </label>
              <input
                id="crystal-dob"
                type="date"
                value={form.dob}
                max={today}
                onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                className="w-full px-5 py-4 rounded-xl text-white text-sm focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: errors.dob ? '1px solid #ef4444' : '1px solid rgba(155,89,182,0.2)',
                  colorScheme: 'dark',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={e => { e.target.style.border = '1px solid rgba(155,89,182,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(155,89,182,0.08)' }}
                onBlur={e => { e.target.style.border = errors.dob ? '1px solid #ef4444' : '1px solid rgba(155,89,182,0.2)'; e.target.style.boxShadow = 'none' }}
              />
              {errors.dob && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.dob}</p>}
            </div>

            {/* Time of Birth */}
            <div>
              <label className="block text-xs font-bold tracking-[0.2em] uppercase mb-2 text-white/45"
                style={{ fontFamily: "'Sora', sans-serif" }}>
                Time of Birth{' '}
                <span className="text-white/25 normal-case tracking-normal font-normal">(optional — enables Hora calculation)</span>
              </label>
              <input
                id="crystal-tob"
                type="time"
                value={form.timeOfBirth}
                onChange={e => setForm(f => ({ ...f, timeOfBirth: e.target.value }))}
                className="w-full px-5 py-4 rounded-xl text-white text-sm focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(155,89,182,0.2)',
                  colorScheme: 'dark',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={e => { e.target.style.border = '1px solid rgba(155,89,182,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(155,89,182,0.08)' }}
                onBlur={e => { e.target.style.border = '1px solid rgba(155,89,182,0.2)'; e.target.style.boxShadow = 'none' }}
              />
              <p className="text-white/20 text-xs mt-1.5 ml-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">info</span>
                Birth time activates Vedic Hora (planetary hour) analysis for maximum precision.
              </p>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold tracking-[0.2em] uppercase mb-3 text-white/45"
                style={{ fontFamily: "'Sora', sans-serif" }}>
                Gender
              </label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { v: 'female', l: 'Female', icon: 'female' },
                  { v: 'male', l: 'Male', icon: 'male' },
                  { v: 'other', l: 'Non-binary', icon: 'transgender' },
                ] as { v: string; l: string; icon: string }[]).map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    id={`gender-${opt.v}`}
                    onClick={() => setForm(f => ({ ...f, gender: opt.v }))}
                    className="py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    style={{
                      background: form.gender === opt.v ? 'linear-gradient(135deg,#7B2DBF,#9B59B6)' : 'rgba(255,255,255,0.04)',
                      border: form.gender === opt.v ? '1px solid rgba(155,89,182,0.6)' : '1px solid rgba(155,89,182,0.15)',
                      color: form.gender === opt.v ? 'white' : 'rgba(255,255,255,0.4)',
                      fontFamily: "'Sora', sans-serif",
                      boxShadow: form.gender === opt.v ? '0 4px 16px rgba(155,89,182,0.25)' : 'none',
                    }}>
                    <span className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}>{opt.icon}</span>
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="calculate-crystals-btn"
              type="submit"
              disabled={calculating}
              className="w-full py-5 rounded-xl font-bold text-base transition-all disabled:opacity-60 flex items-center justify-center gap-3"
              style={{
                background: calculating ? 'rgba(155,89,182,0.3)' : 'linear-gradient(135deg,#5B21B6,#7B2DBF,#9B59B6)',
                color: 'white',
                fontFamily: "'Sora', sans-serif",
                letterSpacing: '0.06em',
                boxShadow: calculating ? 'none' : '0 8px 32px rgba(155,89,182,0.35)',
              }}>
              {calculating
                ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Calculating your cosmic crystal blueprint...</>)
                : (<><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>Reveal My Sacred Crystals</>)
              }
            </button>
          </form>
        </div>
      </section>

      {/* ── AI STATUS BANNER ─────────────────────────────────────── */}
      {result && aiStatus === 'loading' && (
        <div className="px-4 sm:px-6 pb-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3 px-5 py-3 rounded-xl"
            style={{ background: 'rgba(155,89,182,0.12)', border: '1px solid rgba(155,89,182,0.25)' }}>
            <span className="w-3.5 h-3.5 border-2 border-purple-400/40 border-t-purple-400 rounded-full animate-spin flex-shrink-0" />
            <p className="text-purple-300/80 text-xs" style={{ fontFamily: "'Sora', sans-serif" }}>
              Groq AI is refining your crystal recommendations with deeper Vedic analysis...
            </p>
          </div>
        </div>
      )}

      {result && aiStatus === 'done' && (
        <div className="px-4 sm:px-6 pb-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3 px-5 py-3 rounded-xl"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <span className="material-symbols-outlined text-[16px] text-green-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <p className="text-green-400/80 text-xs" style={{ fontFamily: "'Sora', sans-serif" }}>
              AI analysis complete — recommendations refined with llama-3.3-70b Vedic reasoning.
            </p>
          </div>
        </div>
      )}

      {/* ── RESULTS ───────────────────────────────────────────────── */}
      {result && (
        <section ref={resultRef} className="py-8 px-4 sm:px-6 pb-24">
          <div className="max-w-4xl mx-auto">

            <div className="text-center mb-10">
              <p className="text-purple-400/70 text-xs font-bold tracking-[0.25em] uppercase mb-3"
                style={{ fontFamily: "'Sora', sans-serif" }}>
                Your Personal Crystal Reading
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Sacred Crystals for{' '}
                <span style={{ background: 'linear-gradient(135deg,#f59e0b,#9B59B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {form.name.trim().split(' ')[0]}
                </span>
              </h2>
            </div>

            {/* Numerology Summary */}
            <div className="rounded-2xl p-6 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-6"
              style={{ background: 'linear-gradient(135deg,rgba(155,89,182,0.12),rgba(245,158,11,0.07))', border: '1px solid rgba(155,89,182,0.25)' }}>
              {([
                { label: 'Life Path', value: result.profile.lifePathNumber, icon: 'route' },
                { label: 'Name Number', value: result.profile.nameNumber, icon: 'text_fields' },
                { label: 'Ruling Planet', value: result.profile.rulingPlanet, icon: 'public' },
                { label: 'Day Lord', value: result.profile.dayLord, icon: 'calendar_today' },
              ] as { label: string; value: string | number; icon: string }[]).map(item => (
                <div key={item.label} className="text-center">
                  <span className="material-symbols-outlined text-[18px] text-purple-400/50 mb-1 block"
                    style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  <div className="text-xl sm:text-2xl font-bold text-white mb-0.5"
                    style={{ fontFamily: "'Playfair Display', serif" }}>{item.value}</div>
                  <div className="text-white/35 text-[10px] uppercase tracking-widest"
                    style={{ fontFamily: "'Sora', sans-serif" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Soul message */}
            <div className="rounded-2xl p-5 mb-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-[24px] text-purple-400/50 flex-shrink-0 mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  self_improvement
                </span>
                <div>
                  <p className="text-white/40 text-[10px] tracking-widest uppercase mb-2"
                    style={{ fontFamily: "'Sora', sans-serif" }}>
                    Soul Blueprint — Life Path {result.profile.lifePathNumber} · {result.profile.rulingPlanet}
                  </p>
                  <p className="text-white/75 leading-relaxed text-sm sm:text-base">{result.soulMessage}</p>
                </div>
              </div>
            </div>

            {/* Analysis breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
              {[
                {
                  icon: 'event', label: 'Date Analysis',
                  text: `DOB reduces to Life Path ${result.profile.lifePathNumber} (Day ${result.profile.dayNumber}, Month ${result.profile.monthNumber}). Destiny number: ${result.profile.destinyNumber}.`,
                },
                {
                  icon: 'text_fields', label: 'Name Vibration',
                  text: `Chaldean name number ${result.profile.nameNumber} governs your worldly expression and soul's outward purpose.`,
                },
                {
                  icon: 'schedule', label: form.timeOfBirth ? 'Hora Analysis' : 'Time Not Provided',
                  text: form.timeOfBirth
                    ? `Birth hour ${form.timeOfBirth} falls in ${result.profile.birthHourPlanet || 'unknown'} Hora. Day lord: ${result.profile.dayLord}.`
                    : 'Add your time of birth to unlock Vedic Hora (planetary hour) analysis.',
                },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[14px] text-purple-400/60"
                      style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                    <p className="text-white/35 text-[10px] uppercase tracking-widest"
                      style={{ fontFamily: "'Sora', sans-serif" }}>{item.label}</p>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="text-center mb-8">
              <p className="text-purple-400/60 text-xs font-bold tracking-[0.25em] uppercase mb-1"
                style={{ fontFamily: "'Sora', sans-serif" }}>
                Step 2 — Your Sacred Crystals
              </p>
              <p className="text-white/25 text-sm">
                Ranked by cosmic resonance — {result.source === 'ai' ? 'refined by Groq AI Vedic analysis' : 'calculated by Vedic numerology engine'}
              </p>
            </div>

            <div className="space-y-5">
              <CrystalCard crystal={result.primary} rank="primary" rationale={result.aiRationales[result.primary.id]} />
              <CrystalCard crystal={result.secondary} rank="secondary" rationale={result.aiRationales[result.secondary.id]} />
              <CrystalCard crystal={result.tertiary} rank="tertiary" rationale={result.aiRationales[result.tertiary.id]} />
            </div>

            {/* Crystal care guide */}
            <div className="mt-10 rounded-2xl p-6 sm:p-8"
              style={{ background: 'linear-gradient(135deg,rgba(27,17,60,0.9),rgba(10,15,30,0.9))', border: '1px solid rgba(155,89,182,0.18)' }}>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-[22px] text-purple-400/70"
                  style={{ fontVariationSettings: "'FILL' 1" }}>nights_stay</span>
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Crystal Care Protocol
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { step: '01', title: 'Initial Cleansing', desc: 'Place under full moonlight for one night, or rinse under running water for 30 seconds while holding a clear intention.' },
                  { step: '02', title: 'Programming', desc: 'Hold the crystal in both hands, breathe deeply, and mentally state your intention three times with conviction.' },
                  { step: '03', title: 'Daily Practice', desc: 'Follow the wearing instructions specific to each crystal — the correct finger, hand, and auspicious day matter deeply.' },
                  { step: '04', title: 'Periodic Cleansing', desc: 'Cleanse every two weeks by placing on a selenite plate overnight or burying briefly in natural sea salt.' },
                ] as { step: string; title: string; desc: string }[]).map(item => (
                  <div key={item.step} className="flex gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-xs font-bold text-purple-400/50 w-6 flex-shrink-0 mt-0.5 font-mono">{item.step}</div>
                    <div>
                      <p className="text-white/75 text-sm font-semibold mb-1">{item.title}</p>
                      <p className="text-white/35 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Sora', sans-serif" }}>
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Calculate for Another Person
              </button>
              <Link
                href="/shop?category=crystal"
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#7B2DBF,#9B59B6)', fontFamily: "'Sora', sans-serif", boxShadow: '0 4px 16px rgba(155,89,182,0.35)' }}>
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
                Browse All Crystals in Shop
              </Link>
            </div>

          </div>
        </section>
      )}

      {/* ── SCIENCE SECTION (shown before first result) ───────────── */}
      {!result && !calculating && (
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                The Science Behind the Recommendation
              </h2>
              <p className="text-white/35 text-sm max-w-xl mx-auto leading-relaxed">
                Our engine combines classical Vedic mathematics with AI reasoning to determine your most resonant healing crystals.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
              {([
                { icon: 'route', title: 'Life Path Number', desc: 'Pythagorean digit reduction of your full DOB — the primary soul vibration with highest weight in the algorithm.' },
                { icon: 'text_fields', title: 'Chaldean Name Number', desc: 'Each letter mapped to ancient Chaldean values, reduced to a single digit revealing your destiny expression.' },
                { icon: 'schedule', title: 'Vedic Hora (Birth Hour)', desc: 'The 7-planet Hora wheel determines which planet governed your birth hour — a precise astronomical calculation.' },
                { icon: 'public', title: 'Navagraha Resonance', desc: 'Each crystal is mapped to Vedic planets. Your ruling planet alignment adds significant resonance weight.' },
                { icon: 'calendar_today', title: 'Day Lord Alignment', desc: 'The weekday planet of your birth day is cross-referenced against each crystal\'s planetary ruler.' },
                { icon: 'auto_awesome', title: 'Groq AI Refinement', desc: 'LLaMA 3.3 70B reasons over your complete numerological profile to apply deeper Vedic crystal wisdom.' },
              ] as { icon: string; title: string; desc: string }[]).map(item => (
                <div key={item.title} className="p-5 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(155,89,182,0.1)' }}>
                  <span className="material-symbols-outlined text-[22px] text-purple-400/50 mb-3 block"
                    style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  <h3 className="text-white/75 font-bold text-sm mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                  <p className="text-white/30 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Our Crystal Collection
              </h2>
              <p className="text-white/30 text-sm">12 sacred Vedic healing crystals — prices managed live from admin panel</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.values(CRYSTAL_STATIC).map(crystal => (
                <Link
                  key={crystal.id}
                  href={`/shop?category=crystal&search=${encodeURIComponent(crystal.name)}`}
                  className="group p-4 rounded-xl text-center transition-all hover:scale-[1.03]"
                  style={{ background: 'rgba(155,89,182,0.06)', border: '1px solid rgba(155,89,182,0.15)' }}>
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden mx-auto mb-2">
                    <Image
                      src={crystal.imageUrl}
                      alt={crystal.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="48px"
                    />
                  </div>
                  <p className="text-white/65 text-xs font-bold leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                    {crystal.name}
                  </p>
                  <p className="text-white/25 text-[10px] mt-0.5">{crystal.planet}</p>
                  <p className="text-purple-400/60 text-xs font-mono mt-1">
                    ₹{(priceMap[crystal.id]?.price ?? crystal.fallbackPrice).toLocaleString('en-IN')}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

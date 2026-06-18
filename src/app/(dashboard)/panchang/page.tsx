'use client'

import SudarshanLoader from '@/components/SudarshanLoader'

import { useEffect, useState, useRef } from 'react'
import { getSavedCity, saveCity } from '@/lib/utils/getLocation'

interface ChogPeriod {
  name: string; quality: string; color: string
  start: string; end: string; startH: number; endH: number; period: 'day' | 'night'
}
interface HoraPeriod {
  planet: string; color: string; start: string; end: string; startH: number; endH: number; isDay: boolean
}
interface DoGhatiPeriod {
  name: string; quality: string; color: string; start: string; end: string; period: string
}

interface PanchangData {
  tithi: string; tithiNum: number
  nakshatra: string; nakshatraNum: number
  yoga: string; karana: string
  sunrise: string; sunset: string
  moonSign: string; sunSign: string
  rahuKaal: string; abhijitMuhurat: string; brahmaHour: string
  moonPhase: string; date: string
  festivals: { name: string; days: number }[]
  hora: HoraPeriod[]
  choghadiya: ChogPeriod[]
  doGhatiMuhurt: DoGhatiPeriod[]
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

const CITIES = [
  { name: 'New Delhi',  lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai',     lat: 19.0760, lng: 72.8777 },
  { name: 'Varanasi',   lat: 25.3176, lng: 82.9739 },
  { name: 'Kolkata',    lat: 22.5726, lng: 88.3639 },
  { name: 'Chennai',    lat: 13.0827, lng: 80.2707 },
  { name: 'Bengaluru',  lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad',  lat: 17.3850, lng: 78.4867 },
  { name: 'Pune',       lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad',  lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur',     lat: 26.9124, lng: 75.7873 },
]

const DATA_ITEMS = [
  { key: 'tithi',          icon: 'dark_mode',    label: 'Tithi',           desc: 'Lunar day',             accent: false },
  { key: 'nakshatra',      icon: 'star',         label: 'Nakshatra',       desc: 'Lunar mansion',         accent: false },
  { key: 'yoga',           icon: 'brightness_7', label: 'Yoga',            desc: 'Sun-Moon combination',  accent: false },
  { key: 'karana',         icon: 'bolt',         label: 'Karana',          desc: 'Half-tithi period',     accent: false },
  { key: 'sunrise',        icon: 'light_mode',   label: 'Sunrise',         desc: 'Best time for prayers', accent: false },
  { key: 'sunset',         icon: 'wb_twilight',  label: 'Sunset',          desc: 'Evening aarti time',    accent: false },
  { key: 'moonSign',       icon: 'nightlight',   label: 'Moon Sign',       desc: 'Chandra Rashi',         accent: false },
  { key: 'sunSign',        icon: 'wb_sunny',     label: 'Sun Sign',        desc: 'Surya Rashi',           accent: false },
  { key: 'abhijitMuhurat', icon: 'schedule',     label: 'Abhijit Muhurat', desc: 'Most auspicious window',accent: false },
  { key: 'brahmaHour',     icon: 'bedtime',      label: 'Brahma Muhurta',  desc: 'Ideal meditation time', accent: false },
  { key: 'rahuKaal',       icon: 'warning',      label: 'Rahu Kaal',       desc: 'Avoid new ventures',    accent: true  },
]

const PLANET_SYMBOL: Record<string, string> = {
  Sun: '☉', Venus: '♀', Mercury: '☿', Moon: '☽', Saturn: '♄', Jupiter: '♃', Mars: '♂',
}

const CHOG_MEANING: Record<string, string> = {
  Amrit: 'Very Auspicious', Shubh: 'Auspicious', Labh: 'Profitable', Char: 'Travel/Movement',
  Udveg: 'Avoid', Rog: 'Inauspicious', Kaal: 'Inauspicious',
}

function CalendarDay({ date, isToday, isCurrentMonth, isSelected, onClick }: {
  date: Date; isToday: boolean; isCurrentMonth: boolean; isSelected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center
        ${isToday && !isSelected ? 'ring-2 ring-[var(--terracotta)] text-[var(--terracotta)] font-bold' : ''}
        ${isSelected ? 'bg-[var(--terracotta)] text-white font-bold shadow-md' : ''}
        ${!isSelected && isCurrentMonth ? 'hover:bg-[var(--warm-sand)] text-[var(--indigo-deep)]' : ''}
        ${!isCurrentMonth ? 'text-[var(--warm-charcoal)]/25' : ''}
      `}
    >
      {date.getDate()}
    </button>
  )
}

function MoonGlyph({ tithiNum }: { tithiNum: number }) {
  const pct = tithiNum / 29
  const isFull = tithiNum === 14
  const isNew  = tithiNum === 29 || tithiNum === 0
  const moonIcons = ['🌒','🌓','🌔']
  const moonIconsW = ['🌖','🌗','🌘']
  if (isFull) return <span className="text-[var(--saffron)]" style={{ fontSize: 28 }}>🌕</span>
  if (isNew)  return <span style={{ fontSize: 28 }}>🌑</span>
  if (pct < 0.5) return <span style={{ fontSize: 28 }}>{moonIcons[Math.floor(pct * 6) % 3]}</span>
  return <span style={{ fontSize: 28 }}>{moonIconsW[Math.floor((pct - 0.5) * 6) % 3]}</span>
}

function getDaysInMonth(date: Date) {
  const y = date.getFullYear(), mo = date.getMonth()
  const firstDay = new Date(y, mo, 1).getDay()
  const daysInMonth = new Date(y, mo + 1, 0).getDate()
  const days: Date[] = []
  for (let i = 0; i < firstDay; i++) days.push(new Date(y, mo, -firstDay + i + 1))
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(y, mo, i))
  while (days.length % 7 !== 0) days.push(new Date(y, mo + 1, days.length - daysInMonth - firstDay + 1))
  return days
}

// ─── Choghadiya Chakra SVG - two-ring dark design ───────────────────
function ChoghadiyaChakra({ choghadiya, currentH }: { choghadiya: ChogPeriod[]; currentH: number }) {
  if (!choghadiya?.length) return null

  const day   = choghadiya.filter(c => c.period === 'day')    // 8 segments
  const night = choghadiya.filter(c => c.period === 'night')  // 8 segments

  const cx = 145, cy = 145
  // Outer ring = Day, Inner ring = Night
  const rDayOut  = 136, rDayIn  = 92
  const rNightOut = 84, rNightIn = 50
  const rHub = 46

  const toRad = (a: number) => a * Math.PI / 180
  const SEG = 45 // 360/8 degrees each

  function segmentPath(r1: number, r2: number, startDeg: number) {
    const s = startDeg - 90, e = s + SEG
    const x1 = cx + r2 * Math.cos(toRad(s)), y1 = cy + r2 * Math.sin(toRad(s))
    const x2 = cx + r2 * Math.cos(toRad(e)), y2 = cy + r2 * Math.sin(toRad(e))
    const x3 = cx + r1 * Math.cos(toRad(e)), y3 = cy + r1 * Math.sin(toRad(e))
    const x4 = cx + r1 * Math.cos(toRad(s)), y4 = cy + r1 * Math.sin(toRad(s))
    return `M ${x1} ${y1} A ${r2} ${r2} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r1} ${r1} 0 0 0 ${x4} ${y4} Z`
  }

  function labelPos(r1: number, r2: number, idx: number) {
    const mid = (idx * SEG) + SEG / 2 - 90
    const r = (r1 + r2) / 2
    return { x: cx + r * Math.cos(toRad(mid)), y: cy + r * Math.sin(toRad(mid)) }
  }

  return (
    <svg width={cx * 2} height={cy * 2} viewBox={`0 0 ${cx * 2} ${cy * 2}`} style={{ maxWidth: '100%' }}>
      <defs>
        <radialGradient id="darkBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f0c29" />
        </radialGradient>
        <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </radialGradient>
        <filter id="segGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Dark background disc */}
      <circle cx={cx} cy={cy} r={rDayOut + 6} fill="url(#darkBg)" />
      <circle cx={cx} cy={cy} r={rDayOut + 6} fill="none" stroke="#c8922a" strokeWidth="1.5" />

      {/* ── DAY ring (outer) ── */}
      {day.map((c, i) => {
        const isNow = currentH >= c.startH && currentH < c.endH
        const lp = labelPos(rDayIn, rDayOut, i)
        return (
          <g key={`d${i}`} filter={isNow ? 'url(#segGlow)' : undefined}>
            <path d={segmentPath(rDayIn, rDayOut, i * SEG)} fill={c.color} fillOpacity={isNow ? 1 : 0.65}
              stroke={isNow ? '#fff' : '#0f0c29'} strokeWidth={isNow ? 1.5 : 0.8} />
            <text x={lp.x} y={lp.y + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize={isNow ? 9 : 8} fontWeight={isNow ? '700' : '400'}
              fill={isNow ? '#fff' : 'rgba(255,255,255,0.88)'}>{c.name}</text>
            {isNow && <circle cx={lp.x} cy={lp.y + 12} r={2.5} fill="#fff" opacity={0.9} />}
          </g>
        )
      })}

      {/* Divider rings */}
      <circle cx={cx} cy={cy} r={rDayIn} fill="none" stroke="#c8922a" strokeWidth="1" opacity="0.7" />
      <circle cx={cx} cy={cy} r={rNightOut + 1} fill="#0f0c29" />

      {/* ── NIGHT ring (inner) ── */}
      {night.map((c, i) => {
        const isNow = currentH >= c.startH && currentH < c.endH
        const lp = labelPos(rNightIn, rNightOut, i)
        return (
          <g key={`n${i}`} filter={isNow ? 'url(#segGlow)' : undefined}>
            <path d={segmentPath(rNightIn, rNightOut, i * SEG)} fill={c.color} fillOpacity={isNow ? 1 : 0.55}
              stroke={isNow ? '#fff' : '#0f0c29'} strokeWidth={isNow ? 1.5 : 0.6} />
            <text x={lp.x} y={lp.y + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize={isNow ? 7.5 : 7} fontWeight={isNow ? '700' : '400'}
              fill={isNow ? '#fff' : 'rgba(255,255,255,0.75)'}>{c.name}</text>
          </g>
        )
      })}

      <circle cx={cx} cy={cy} r={rNightIn} fill="none" stroke="#c8922a" strokeWidth="0.8" opacity="0.5" />

      {/* Center hub */}
      <circle cx={cx} cy={cy} r={rHub} fill="url(#hubGrad)" />
      <circle cx={cx} cy={cy} r={rHub - 4} fill="none" stroke="#c8922a" strokeWidth="1" />
      <text x={cx} y={cy - 13} textAnchor="middle" fontSize={8} fill="#D4A017" fontWeight="bold">चोघड़िया</text>
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={20} fill="white" fontWeight="900" fontFamily="Georgia, serif">ॐ</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize={6.5} fill="#D4A017" letterSpacing="2">CHAKRA</text>

      {/* Ring labels */}
      <text x={cx} y={14} textAnchor="middle" fontSize={7} fill="#fbbf24" letterSpacing="3" fontWeight="600">DAY RING</text>
      <text x={cx} y={cy * 2 - 6} textAnchor="middle" fontSize={7} fill="#94a3b8" letterSpacing="3">NIGHT RING</text>
    </svg>
  )
}

export default function PanchangPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMonth, setViewMonth]       = useState(new Date())
  const [city, setCity]                 = useState(() => getSavedCity() || CITIES[0])
  const [panchang, setPanchang]         = useState<PanchangData | null>(null)
  const [loading, setLoading]           = useState(false)
  const [nowH, setNowH]                 = useState(0)
  const [activeChogTab, setActiveChogTab] = useState<'day' | 'night'>('day')
  const [rightTab, setRightTab] = useState<'panchang' | 'hora' | 'choghadiya' | 'doghati' | 'guidance'>('panchang')
  const today = new Date()

  // Live clock - update current fractional hour every minute
  useEffect(() => {
    function tick() {
      const n = new Date()
      setNowH(n.getHours() + n.getMinutes() / 60 + n.getSeconds() / 3600)
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { fetchPanchang() }, [selectedDate, city]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleCityChange(cityName: string) {
    const found = CITIES.find(c => c.name === cityName) || CITIES[0]
    saveCity(found)
    setCity(found)
  }

  async function fetchPanchang() {
    setLoading(true)
    setPanchang(null)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const res  = await fetch(`/api/panchang?lat=${city.lat}&lng=${city.lng}&date=${dateStr}`)
      const json = await res.json()
      if (json.success) setPanchang(json.data)
    } catch {}
    setLoading(false)
  }

  const isToday = selectedDate.toDateString() === today.toDateString()
  const days = getDaysInMonth(viewMonth)
  const dateLabel = selectedDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // Current hora
  const currentHora = panchang?.hora?.find(h => nowH >= h.startH && nowH < h.endH) ?? panchang?.hora?.[0]
  // Current choghadiya
  const currentChog = panchang?.choghadiya?.find(c => isToday && nowH >= c.startH && nowH < c.endH)

  return (
    <div className="min-h-screen" style={{ background: 'var(--kutch-white)' }}>

      {/* Banner */}
      <div className="relative overflow-hidden" style={{ background: 'var(--indigo-deep)', padding: '32px 24px 28px' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="absolute right-[-60px] top-1/2 -translate-y-1/2 opacity-[0.04] select-none pointer-events-none">
          <SudarshanLoader px={220} spin={false} />
        </div>
        <div className="relative max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--saffron)', fontFamily: "'Sora', sans-serif" }}>Vedic Calendar</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Daily Panchang</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{dateLabel}</p>
          </div>
          <select
            value={city.name}
            onChange={e => handleCityChange(e.target.value)}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              background: 'rgba(255,255,255,0.1)', color: 'white',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 12px',
              outline: 'none', cursor: 'pointer',
            }}
          >
            {CITIES.map(c => <option key={c.name} value={c.name} style={{ background: '#2F2A44', color: 'white' }}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left column - calendar + moon + festivals */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[var(--warm-sand)] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--warm-sand)] transition-colors text-[var(--indigo-deep)]/50">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: 'var(--indigo-deep)', fontSize: 16 }}>
                {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </h2>
              <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--warm-sand)] transition-colors text-[var(--indigo-deep)]/50">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} className="text-center py-1" style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 700, color: 'rgba(28,30,74,0.35)', letterSpacing: '0.05em' }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => (
                <CalendarDay
                  key={i} date={d}
                  isToday={d.toDateString() === today.toDateString()}
                  isCurrentMonth={d.getMonth() === viewMonth.getMonth()}
                  isSelected={d.toDateString() === selectedDate.toDateString()}
                  onClick={() => { setSelectedDate(d); setViewMonth(d) }}
                />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--warm-sand)] text-center">
              <button onClick={() => { setSelectedDate(today); setViewMonth(today) }}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--terracotta)', fontWeight: 500 }}
                className="hover:underline">
                Go to Today
              </button>
            </div>
          </div>

          {panchang && (
            <div className="bg-white rounded-2xl border border-[var(--warm-sand)] shadow-sm p-4 flex items-center gap-4">
              <MoonGlyph tithiNum={panchang.tithiNum} />
              <div>
                <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(28,30,74,0.4)' }}>Moon Phase</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--indigo-deep)', marginTop: 2 }}>{panchang.moonPhase}</p>
              </div>
            </div>
          )}

          {/* Upcoming festivals */}
          <div className="bg-white rounded-2xl border border-[var(--warm-sand)] shadow-sm p-5">
            <h3 className="flex items-center gap-2 mb-4" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--indigo-deep)' }}>
              <span className="material-symbols-outlined text-[16px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
              Upcoming Tithis
            </h3>
            <div className="space-y-3">
              {(panchang?.festivals ?? [{ name: 'Ekadashi', days: 11 }, { name: 'Purnima (Full Moon)', days: 15 }, { name: 'Amavasya (New Moon)', days: 29 }]).map(f => (
                <div key={f.name} className="flex items-center justify-between">
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--indigo-deep)' }}>{f.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--warm-sand)', color: 'var(--terracotta)', fontFamily: "'Sora', sans-serif" }}>
                    {f.days === 1 ? 'Tomorrow' : `in ${f.days} days`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Choghadiya Chakra wheel */}
          {panchang?.choghadiya && (
            <div className="bg-white rounded-2xl border border-[var(--warm-sand)] shadow-sm p-5">
              <h3 className="flex items-center gap-2 mb-4" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--indigo-deep)' }}>
                <span className="material-symbols-outlined text-[16px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>donut_large</span>
                Choghadiya Chakra
              </h3>
              <div className="flex justify-center">
                <ChoghadiyaChakra choghadiya={panchang.choghadiya} currentH={isToday ? nowH : -1} />
              </div>
              {/* Legend */}
              <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10px]">
                {[['#10b981','Amrit'],['#3b82f6','Shubh'],['#22c55e','Labh'],['#f59e0b','Char'],['#ef4444','Udveg'],['#dc2626','Rog'],['#6b7280','Kaal']].map(([color, name]) => (
                  <div key={name} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color as string }} />
                    <span style={{ color: 'var(--warm-charcoal)', fontFamily: "'Sora', sans-serif" }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - tabbed features */}
        <div className="lg:col-span-3 space-y-4">

          {/* Tab bar */}
          <div className="bg-white rounded-2xl border border-[var(--warm-sand)] shadow-sm overflow-hidden">
            <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid var(--warm-sand)' }}>
              {[
                { id: 'panchang',   icon: 'brightness_7', label: 'Panchang' },
                { id: 'hora',       icon: 'schedule',      label: 'Live Hora',    live: isToday },
                { id: 'choghadiya', icon: 'wb_sunny',      label: 'Choghadiya',   live: isToday },
                { id: 'doghati',    icon: 'timer',         label: 'Do Ghati',     badge: '48 min' },
                { id: 'guidance',   icon: 'auto_awesome',  label: 'Guidance' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setRightTab(tab.id as typeof rightTab)}
                  className="flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all border-b-2"
                  style={{
                    borderBottomColor: rightTab === tab.id ? 'var(--terracotta)' : 'transparent',
                    color: rightTab === tab.id ? 'var(--terracotta)' : 'rgba(28,30,74,0.45)',
                    background: rightTab === tab.id ? 'rgba(198,125,83,0.04)' : 'transparent',
                    fontFamily: "'Sora', sans-serif",
                  }}>
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{tab.icon}</span>
                  {tab.label}
                  {tab.live && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">LIVE</span>}
                  {tab.badge && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{tab.badge}</span>}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* ── PANCHANG TAB ── */}
              {rightTab === 'panchang' && (
                loading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <SudarshanLoader size="md" className="opacity-30" />
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(28,30,74,0.35)', marginTop: 12 }}>Computing positions…</p>
                    </div>
                  </div>
                ) : panchang ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {DATA_ITEMS.map(item => {
                      const value = panchang[item.key as keyof PanchangData] as string
                      if (!value) return null
                      return (
                        <div key={item.key} className="rounded-xl p-3"
                          style={{ background: item.accent ? 'rgba(209,67,67,0.06)' : 'var(--warm-sand)', border: item.accent ? '1px solid rgba(209,67,67,0.2)' : '1px solid transparent' }}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1", color: item.accent ? '#D14343' : 'var(--terracotta)' }}>{item.icon}</span>
                            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: item.accent ? 'rgba(209,67,67,0.7)' : 'rgba(28,30,74,0.45)' }}>{item.label}</span>
                          </div>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: item.accent ? '#D14343' : 'var(--indigo-deep)', lineHeight: 1.3 }}>{value}</p>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'rgba(28,30,74,0.38)', marginTop: 2 }}>{item.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <SudarshanLoader px={36} spin={false} className="opacity-20" />
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(28,30,74,0.4)', marginTop: 8 }}>Select a date to view panchang</p>
                  </div>
                )
              )}

              {/* ── HORA TAB ── */}
              {rightTab === 'hora' && (
                !panchang ? (
                  <p className="text-center text-sm text-[var(--warm-charcoal)]/40 py-12">Select a date first</p>
                ) : (
                  <div>
                    {isToday && currentHora && (
                      <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: currentHora.color + '18', border: `1.5px solid ${currentHora.color}50` }}>
                        <span style={{ fontSize: 24, color: currentHora.color }}>{PLANET_SYMBOL[currentHora.planet]}</span>
                        <div>
                          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700, color: currentHora.color }}>Current Hora: {currentHora.planet}</p>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(28,30,74,0.5)' }}>{currentHora.start} – {currentHora.end}</p>
                        </div>
                        <span className="ml-auto text-[10px] px-2 py-1 rounded-full font-bold text-white animate-pulse" style={{ background: currentHora.color }}>LIVE</span>
                      </div>
                    )}
                    <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                      {panchang.hora.filter(h => h.isDay).map((h, i) => {
                        const isCurrent = isToday && nowH >= h.startH && nowH < h.endH
                        return (
                          <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2 transition-all"
                            style={{ background: isCurrent ? h.color + '15' : 'var(--warm-sand)', border: isCurrent ? `1.5px solid ${h.color}50` : '1px solid transparent' }}>
                            <span style={{ fontSize: 20, color: h.color, width: 28, textAlign: 'center' }}>{PLANET_SYMBOL[h.planet]}</span>
                            <div className="flex-1">
                              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: isCurrent ? 700 : 600, color: isCurrent ? h.color : 'var(--indigo-deep)' }}>{h.planet}</span>
                              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(28,30,74,0.45)', marginLeft: 8 }}>{h.start} – {h.end}</span>
                            </div>
                            {isCurrent && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ background: h.color }}>Now</span>}
                          </div>
                        )
                      })}
                    </div>
                    <p className="mt-3 text-[10px] text-[var(--warm-charcoal)]/40" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Chaldean order - 12 day horas from sunrise. Each planeta rules activities suited to its nature.
                    </p>
                  </div>
                )
              )}

              {/* ── CHOGHADIYA TAB ── */}
              {rightTab === 'choghadiya' && (
                !panchang ? (
                  <p className="text-center text-sm text-[var(--warm-charcoal)]/40 py-12">Select a date first</p>
                ) : (
                  <div>
                    {currentChog && isToday && (
                      <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-2.5" style={{ background: currentChog.color + '15', border: `1.5px solid ${currentChog.color}` }}>
                        <div className="w-3 h-3 rounded-full animate-pulse flex-shrink-0" style={{ background: currentChog.color }} />
                        <div>
                          <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: currentChog.color }}>{currentChog.name} - {CHOG_MEANING[currentChog.name]}</span>
                          <span className="block" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(28,30,74,0.6)' }}>{currentChog.start} – {currentChog.end}</span>
                        </div>
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ background: currentChog.color }}>Current</span>
                      </div>
                    )}
                    <div className="flex gap-1 bg-[var(--warm-sand)] rounded-lg p-0.5 mb-4 w-fit">
                      {(['day','night'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveChogTab(tab)}
                          className="px-4 py-1.5 rounded-md text-xs font-bold transition-all"
                          style={{ background: activeChogTab === tab ? 'var(--indigo-deep)' : 'transparent', color: activeChogTab === tab ? 'white' : 'var(--warm-charcoal)', fontFamily: "'Sora', sans-serif" }}>
                          {tab === 'day' ? 'Din (Day)' : 'Raat (Night)'}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {panchang.choghadiya.filter(c => c.period === activeChogTab).map((c, i) => {
                        const isCurrent = isToday && nowH >= c.startH && nowH < c.endH
                        const isGood = ['Amrit','Shubh','Labh'].includes(c.name)
                        return (
                          <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2"
                            style={{ background: isCurrent ? c.color + '15' : isGood ? c.color + '0A' : 'var(--warm-sand)', border: isCurrent ? `1.5px solid ${c.color}50` : '1px solid transparent' }}>
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700, color: c.color, minWidth: 52 }}>{c.name}</span>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(28,30,74,0.6)', flex: 1 }}>{c.start} – {c.end}</span>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: isGood ? '#15803d' : '#dc2626', fontWeight: 600 }}>{CHOG_MEANING[c.name]}</span>
                            {isCurrent && <span className="w-1.5 h-1.5 rounded-full animate-pulse ml-1" style={{ background: c.color }} />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              )}

              {/* ── DO GHATI TAB ── */}
              {rightTab === 'doghati' && (
                !panchang || !panchang.doGhatiMuhurt?.length ? (
                  <p className="text-center text-sm text-[var(--warm-charcoal)]/40 py-12">Select a date first</p>
                ) : (
                  <div>
                    <p className="text-xs text-[var(--warm-charcoal)]/50 mb-4 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      <strong>Do Ghati</strong> = 2 Ghati = 48 minutes. These are the most auspicious first 48 minutes of each Amrit or Shubh choghadiya - ideal for starting new ventures, prayers, business, travel, or important decisions.
                    </p>
                    <div className="space-y-3">
                      {panchang.doGhatiMuhurt.map((m, i) => {
                        const baseH = panchang.choghadiya.find(c => c.name === m.name.split(' ')[0] && c.period === m.period)?.startH ?? -1
                        const isCurrent = isToday && nowH >= baseH && nowH < baseH + 0.8
                        return (
                          <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3"
                            style={{ background: m.color + '12', border: `1.5px solid ${m.color}${isCurrent ? 'cc' : '40'}` }}>
                            <span className="material-symbols-outlined text-[22px]" style={{ color: m.color, fontVariationSettings: "'FILL' 1" }}>
                              {m.name.includes('Amrit') ? 'local_drink' : 'star'}
                            </span>
                            <div className="flex-1">
                              <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: m.color }}>{m.name}</p>
                              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(28,30,74,0.6)' }}>{m.start} – {m.end} · {m.period === 'day' ? 'Daytime' : 'Nighttime'}</p>
                            </div>
                            {isCurrent && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: m.color }} />
                                <span className="text-[10px] font-bold" style={{ color: m.color }}>Now</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              )}

              {/* ── GUIDANCE TAB ── */}
              {rightTab === 'guidance' && (
                <div className="space-y-3">
                  {[
                    { icon: 'light_mode',      text: `Begin prayers after sunrise - ${panchang?.sunrise || '-'}` },
                    { icon: 'bedtime',         text: `Brahma Muhurta (meditation): ${panchang?.brahmaHour || '4:30 – 6:00 AM'}` },
                    { icon: 'schedule',        text: `Abhijit Muhurat (auspicious): ${panchang?.abhijitMuhurat || '11:48 – 12:36 PM'}` },
                    { icon: 'local_florist',   text: 'Abhishek & puja: best performed before noon' },
                    { icon: 'warning',         text: `Rahu Kaal - avoid new ventures: ${panchang?.rahuKaal || '-'}` },
                    { icon: 'candle',          text: `Light deepam at sunset - ${panchang?.sunset || '-'}` },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1", color: icon === 'warning' ? '#D14343' : 'var(--terracotta)' }}>{icon}</span>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(28,30,74,0.65)', lineHeight: 1.5 }}>{text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

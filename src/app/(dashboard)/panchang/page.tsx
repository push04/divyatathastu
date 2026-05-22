'use client'

import { useEffect, useState } from 'react'

interface PanchangData {
  tithi: string; tithiNum: number
  nakshatra: string; nakshatraNum: number
  yoga: string; karana: string
  sunrise: string; sunset: string
  moonSign: string; sunSign: string
  rahuKaal: string; abhijitMuhurat: string; brahmaHour: string
  moonPhase: string; date: string
  festivals: { name: string; days: number }[]
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
  if (isFull) return <span className="text-[var(--saffron)]" style={{ fontSize: 28 }}>🌕</span>
  if (isNew)  return <span style={{ fontSize: 28 }}>🌑</span>
  if (pct < 0.5) return <span style={{ fontSize: 28 }}>{['🌒','🌓','🌔'][Math.floor(pct * 6) % 3]}</span>
  return <span style={{ fontSize: 28 }}>{['🌖','🌗','🌘'][Math.floor((pct - 0.5) * 6) % 3]}</span>
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

export default function PanchangPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMonth, setViewMonth]       = useState(new Date())
  const [city, setCity]                 = useState(CITIES[0])
  const [panchang, setPanchang]         = useState<PanchangData | null>(null)
  const [loading, setLoading]           = useState(false)
  const today = new Date()

  useEffect(() => { fetchPanchang() }, [selectedDate, city])

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

  const days = getDaysInMonth(viewMonth)
  const dateLabel = selectedDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen" style={{ background: 'var(--kutch-white)' }}>

      {/* ── Banner ── */}
      <div className="relative overflow-hidden" style={{ background: 'var(--indigo-deep)', padding: '32px 24px 28px' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }} />
        <div className="absolute right-[-40px] top-[-20px] text-white opacity-[0.04] select-none pointer-events-none"
          style={{ fontSize: 220, fontFamily: 'serif', lineHeight: 1 }}>ॐ</div>
        <div className="relative max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--saffron)', fontFamily: "'Sora', sans-serif" }}>Vedic Calendar</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Daily Panchang</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              {dateLabel}
            </p>
          </div>
          <select
            value={city.name}
            onChange={e => setCity(CITIES.find(c => c.name === e.target.value) || CITIES[0])}
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

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Calendar ── */}
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

          {/* Moon phase card */}
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
        </div>

        {/* ── Panchang Details ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Panchang data grid */}
          <div className="bg-white rounded-2xl border border-[var(--warm-sand)] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, color: 'var(--indigo-deep)' }}>
                {city.name} Panchang
              </h2>
              {loading && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(28,30,74,0.4)' }}>Calculating…</span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div style={{ fontSize: 40, fontFamily: 'serif', color: 'var(--terracotta)', opacity: 0.3 }} className="animate-spin-slow">ॐ</div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(28,30,74,0.35)', marginTop: 12 }}>Computing positions…</p>
                </div>
              </div>
            ) : panchang ? (
              <div className="grid grid-cols-2 gap-2.5">
                {DATA_ITEMS.map(item => {
                  const value = panchang[item.key as keyof PanchangData] as string
                  if (!value) return null
                  return (
                    <div key={item.key}
                      className="rounded-xl p-3 transition-colors"
                      style={{
                        background: item.accent ? 'rgba(209,67,67,0.06)' : 'var(--warm-sand)',
                        border: item.accent ? '1px solid rgba(209,67,67,0.2)' : '1px solid transparent',
                      }}>
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
                <div style={{ fontSize: 36, opacity: 0.15, fontFamily: 'serif' }}>ॐ</div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(28,30,74,0.4)', marginTop: 8 }}>Select a date to view panchang</p>
              </div>
            )}
          </div>

          {/* Daily Guidance */}
          <div className="bg-white rounded-2xl border border-[var(--warm-sand)] shadow-sm p-5">
            <h3 className="flex items-center gap-2 mb-4" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--indigo-deep)' }}>
              <span className="material-symbols-outlined text-[16px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              Today's Guidance
            </h3>
            <div className="space-y-3">
              {[
                { icon: 'light_mode',      text: `Begin prayers after sunrise — ${panchang?.sunrise || '—'}` },
                { icon: 'bedtime',         text: `Brahma Muhurta (meditation): ${panchang?.brahmaHour || '4:30 – 6:00 AM'}` },
                { icon: 'schedule',        text: `Abhijit Muhurat (auspicious): ${panchang?.abhijitMuhurat || '11:48 – 12:36 PM'}` },
                { icon: 'local_florist',   text: 'Abhishek & puja: best performed before noon' },
                { icon: 'warning',         text: `Rahu Kaal — avoid new ventures: ${panchang?.rahuKaal || '—'}` },
                { icon: 'candle',          text: `Light deepam at sunset — ${panchang?.sunset || '—'}` },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1", color: icon === 'warning' ? '#D14343' : 'var(--terracotta)' }}>{icon}</span>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(28,30,74,0.65)', lineHeight: 1.5 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

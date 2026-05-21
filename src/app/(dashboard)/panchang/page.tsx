'use client'

import { useEffect, useState } from 'react'

interface PanchangData {
  tithi: string
  nakshatra: string
  yoga: string
  karana: string
  sunrise: string
  sunset: string
  rahuKaal: string
  moonPhase?: string
  date?: string
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function CalendarDay({ date, isToday, isCurrentMonth, onClick }: { date: Date; isToday: boolean; isCurrentMonth: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center ${isToday ? 'bg-[var(--terracotta)] text-white font-bold' : isCurrentMonth ? 'hover:bg-[var(--warm-sand)] text-[var(--indigo-deep)]' : 'text-[var(--warm-charcoal)]/30'}`}
    >
      {date.getDate()}
    </button>
  )
}

const INDIAN_CITIES = [
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
]

export default function PanchangPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMonth, setViewMonth] = useState(new Date())
  const [city, setCity] = useState(INDIAN_CITIES[0])
  const [panchang, setPanchang] = useState<PanchangData | null>(null)
  const [loading, setLoading] = useState(false)
  const today = new Date()

  useEffect(() => {
    fetchPanchang()
  }, [selectedDate, city])

  async function fetchPanchang() {
    setLoading(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const res = await fetch(`/api/panchang?lat=${city.lat}&lng=${city.lng}&date=${dateStr}`)
      const data = await res.json()
      if (data.success) setPanchang(data.data)
    } catch {}
    setLoading(false)
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear(), month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: Date[] = []
    for (let i = 0; i < firstDay; i++) days.push(new Date(year, month, -firstDay + i + 1))
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i))
    while (days.length % 7 !== 0) days.push(new Date(year, month + 1, days.length - daysInMonth - firstDay + 1))
    return days
  }

  const days = getDaysInMonth(viewMonth)

  const auspiciousInfo = [
    { label: 'Tithi', value: panchang?.tithi, icon: 'dark_mode', desc: 'Lunar day' },
    { label: 'Nakshatra', value: panchang?.nakshatra, icon: 'star', desc: 'Lunar mansion' },
    { label: 'Yoga', value: panchang?.yoga, icon: 'brightness_7', desc: 'Planetary combination' },
    { label: 'Karana', value: panchang?.karana, icon: 'bolt', desc: 'Half tithi period' },
    { label: 'Sunrise', value: panchang?.sunrise, icon: 'light_mode', desc: 'Best for prayers' },
    { label: 'Sunset', value: panchang?.sunset, icon: 'wb_twilight', desc: 'Evening aarti time' },
    { label: 'Rahu Kaal', value: panchang?.rahuKaal, icon: 'warning', desc: 'Inauspicious period' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)] inline-flex items-center gap-2"><span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span> Daily Panchang</h1>
          <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">Vedic calendar & auspicious timings</p>
        </div>
        <select
          value={city.name}
          onChange={e => setCity(INDIAN_CITIES.find(c => c.name === e.target.value) || INDIAN_CITIES[0])}
          className="px-3 py-2 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)]"
        >
          {INDIAN_CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card-divine p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))} className="w-8 h-8 rounded-lg hover:bg-[var(--warm-sand)] flex items-center justify-center text-[var(--indigo-deep)]/60"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
            <h2 className="font-bold text-[var(--indigo-deep)]">{MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}</h2>
            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))} className="w-8 h-8 rounded-lg hover:bg-[var(--warm-sand)] flex items-center justify-center text-[var(--indigo-deep)]/60"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-[var(--warm-charcoal)]/40 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => (
              <CalendarDay
                key={i}
                date={d}
                isToday={d.toDateString() === today.toDateString()}
                isCurrentMonth={d.getMonth() === viewMonth.getMonth()}
                onClick={() => { setSelectedDate(d); setViewMonth(d) }}
              />
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--warm-sand)] text-center">
            <button onClick={() => { setSelectedDate(today); setViewMonth(today) }} className="text-sm text-[var(--terracotta)] font-medium hover:underline">
              Go to Today
            </button>
          </div>
        </div>

        {/* Panchang Details */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card-divine p-5">
            <h2 className="font-bold text-[var(--indigo-deep)] mb-1">
              {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
            <p className="text-sm text-[var(--warm-charcoal)]/60 mb-4">{city.name} Panchang</p>

            {loading ? (
              <div className="flex items-center justify-center h-32"><div className="text-3xl animate-spin-slow">ॐ</div></div>
            ) : panchang ? (
              <div className="grid grid-cols-2 gap-3">
                {auspiciousInfo.map(item => item.value && (
                  <div key={item.label} className={`bg-[var(--warm-sand)] rounded-xl p-3 ${item.label === 'Rahu Kaal' ? 'border border-red-200' : ''}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                      <span className="text-xs text-[var(--warm-charcoal)]/50">{item.label}</span>
                    </div>
                    <p className={`font-bold text-sm ${item.label === 'Rahu Kaal' ? 'text-red-600' : 'text-[var(--indigo-deep)]'}`}>{item.value}</p>
                    <p className="text-xs text-[var(--warm-charcoal)]/40 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--warm-charcoal)]/50 text-sm">No data available</p>
            )}
          </div>

          {/* Auspicious activities */}
          <div className="card-divine p-5">
            <h3 className="font-bold text-[var(--indigo-deep)] mb-3 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Today's Guidance</h3>
            <div className="space-y-2 text-sm text-[var(--warm-charcoal)]/70">
              <p className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>light_mode</span> Begin prayers after sunrise ({panchang?.sunrise || '—'})</p>
              <p className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Best time for mantra chanting: Brahma Muhurta (4:00–5:30 AM)</p>
              <p className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_florist</span> Abhishek/puja: Before noon</p>
              <p className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span> Avoid new ventures during Rahu Kaal ({panchang?.rahuKaal || '—'})</p>
              <p className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>candle</span> Light deepam at sunset ({panchang?.sunset || '—'})</p>
            </div>
          </div>

          {/* Festivals */}
          <div className="card-divine p-5">
            <h3 className="font-bold text-[var(--indigo-deep)] mb-3 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span> Upcoming Festivals</h3>
            <div className="space-y-2">
              {[
                { name: 'Ekadashi', days: 11 },
                { name: 'Purnima (Full Moon)', days: 15 },
                { name: 'Amavasya (New Moon)', days: 29 },
              ].map(f => (
                <div key={f.name} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--indigo-deep)]">{f.name}</span>
                  <span className="text-xs text-[var(--warm-charcoal)]/50">~{f.days} days away</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import SudarshanLoader from '@/components/SudarshanLoader'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Mandir {
  id: string
  name: string
  city: string
  state: string
  deity: string
  timing: string
}

interface Itinerary {
  title: string
  totalDays: number
  startCity: string
  highlights: string[]
  days: {
    day: number
    date: string
    title: string
    mandirs: { time: string; name: string; activity: string; duration: string; tips?: string }[]
    travel?: { from: string; to: string; mode: string; duration: string; trainNumber?: string }
    accommodation: string
    meals: string
    auspiciousTiming: string
  }[]
  estimatedCost: { budget: string; comfortable: string; luxury: string }
  packingList: string[]
  importantNotes: string[]
}

const TRAVEL_MODES = ['Train', 'Car', 'Bus', 'Flight', 'Mixed']

export default function PilgrimagePage() {
  const [mandirs, setMandirs] = useState<Mandir[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [startCity, setStartCity] = useState('')
  const [days, setDays] = useState(7)
  const [travelMode, setTravelMode] = useState('mixed')
  const [startDate, setStartDate] = useState('')
  const [generating, setGenerating] = useState(false)
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [savedItineraries, setSavedItineraries] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      // Mandir list and auth check are independent — run in parallel
      const [res, { data: { user } }] = await Promise.all([
        fetch('/api/mandir'),
        supabase.auth.getUser(),
      ])
      const data = await res.json()
      if (data.success) setMandirs(data.data)

      if (user) {
        const { data: saved } = await supabase.from('itineraries').select('id,title,created_at,schedule').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
        if (saved) setSavedItineraries(saved)
      }
    }
    load()
  }, [])

  function toggleMandir(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id); else s.add(id)
      return s
    })
  }

  async function generate() {
    if (selected.size === 0) { toast.error('Select at least one temple'); return }
    if (!startCity) { toast.error('Enter starting city'); return }

    setGenerating(true)
    const selectedMandirs = mandirs.filter(m => selected.has(m.id))

    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandirs: selectedMandirs, startCity, days, travelMode, startDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setItinerary(data.data)

      // Save to DB
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('itineraries').insert({
          user_id: user.id,
          title: data.data.title,
          start_city: startCity,
          duration_days: days,
          travel_mode: travelMode,
          mandirs: selectedMandirs as unknown as import('@/types/database.types').Json,
          schedule: data.data as unknown as import('@/types/database.types').Json,
        })
      }
      toast.success('Pilgrimage itinerary created!')
    } catch (err: any) {
      toast.error(err.message || 'Generation failed')
    }
    setGenerating(false)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)] inline-flex items-center gap-2"><span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>train</span> Pilgrimage Itinerary</h1>
        <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">AI-powered sacred journey planner</p>
      </div>

      {!itinerary ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config */}
          <div className="space-y-4">
            <div className="card-divine p-5 space-y-4">
              <h2 className="text-lg font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Journey Details</h2>
              <div>
                <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Starting City *</label>
                <input type="text" value={startCity} onChange={e => setStartCity(e.target.value)} placeholder="e.g. Delhi, Mumbai" className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Duration: {days} days</label>
                <input type="range" min={3} max={21} value={days} onChange={e => setDays(Number(e.target.value))} className="w-full accent-[var(--terracotta)]" />
                <div className="flex justify-between text-xs text-[var(--warm-charcoal)]/40 mt-1"><span>3</span><span>21 days</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Travel Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {TRAVEL_MODES.map(m => (
                    <button key={m} onClick={() => setTravelMode(m.toLowerCase())}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-all ${travelMode === m.toLowerCase() ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:border-[var(--indigo-deep)]'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Start Date (optional)</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm" />
              </div>
              <button onClick={generate} disabled={generating} className="btn-divine w-full py-3 font-bold disabled:opacity-50">
                {generating ? (
                  <span className="flex items-center justify-center gap-2"><SudarshanLoader size="sm" /> Planning...</span>
                ) : <span className="inline-flex items-center gap-2"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Plan Pilgrimage ({selected.size} temples)</span>}
              </button>
            </div>

            {savedItineraries.length > 0 && (
              <div className="card-divine p-5">
                <h2 className="text-lg font-bold text-[var(--indigo-deep)] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Previous Itineraries</h2>
                <div className="space-y-2">
                  {savedItineraries.map(s => (
                    <button key={s.id} onClick={() => setItinerary(s.schedule as any)} className="w-full text-left p-2.5 rounded-lg hover:bg-[var(--warm-sand)] transition-all">
                      <p className="text-sm font-medium text-[var(--indigo-deep)] truncate">{s.title}</p>
                      <p className="text-xs text-[var(--warm-charcoal)]/50">{new Date(s.created_at).toLocaleDateString('en-IN')}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Temple selector */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Select Temples ({selected.size} chosen)</h2>
              <button onClick={() => setSelected(new Set())} className="text-xs text-[var(--warm-charcoal)]/50 hover:text-[var(--terracotta)]">Clear all</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[600px] overflow-y-auto pr-1">
              {mandirs.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleMandir(m.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${selected.has(m.id) ? 'border-[var(--terracotta)] bg-[var(--warm-sand)]' : 'border-[var(--warm-sand)] bg-white hover:border-[var(--saffron)]'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${selected.has(m.id) ? 'bg-[var(--terracotta)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50'}`}>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{selected.has(m.id) ? 'check' : 'temple_hindu'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--indigo-deep)] truncate">{m.name}</p>
                    <p className="text-xs text-[var(--warm-charcoal)]/60">{m.city}, {m.state}</p>
                    <p className="text-xs text-[var(--warm-charcoal)]/40 mt-0.5">{m.deity}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--indigo-deep)]">{itinerary.title}</h2>
              <p className="text-sm text-[var(--warm-charcoal)]/60">{itinerary.totalDays} days · Starting from {itinerary.startCity}</p>
            </div>
            <button onClick={() => setItinerary(null)} className="text-sm text-[var(--terracotta)] hover:underline inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">arrow_back</span>New Plan</button>
          </div>

          {/* Highlights */}
          {itinerary.highlights?.length > 0 && (
            <div className="card-divine p-5">
              <h3 className="font-bold text-[var(--indigo-deep)] mb-3 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Highlights</h3>
              <div className="flex gap-2 flex-wrap">
                {itinerary.highlights.map(h => <span key={h} className="text-sm bg-[var(--warm-sand)] px-3 py-1 rounded-full text-[var(--warm-charcoal)]/70">{h}</span>)}
              </div>
            </div>
          )}

          {/* Day-by-day */}
          <div className="space-y-4">
            {itinerary.days.map(day => (
              <div key={day.day} className="card-divine p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--indigo-deep)] text-white flex items-center justify-center font-bold flex-shrink-0">{day.day}</div>
                  <div>
                    <h3 className="font-bold text-[var(--indigo-deep)]">{day.title}</h3>
                    <p className="text-xs text-[var(--warm-charcoal)]/50">{day.date} · {day.auspiciousTiming}</p>
                  </div>
                </div>

                {day.mandirs?.map(m => (
                  <div key={m.name} className="flex gap-3 mb-3 pb-3 border-b border-[var(--warm-sand)] last:border-0">
                    <span className="text-sm font-bold text-[var(--terracotta)] w-16 flex-shrink-0">{m.time}</span>
                    <div>
                      <p className="font-medium text-[var(--indigo-deep)] text-sm inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>temple_hindu</span> {m.name}</p>
                      <p className="text-xs text-[var(--warm-charcoal)]/70 mt-0.5">{m.activity} · {m.duration}</p>
                      {m.tips && <p className="text-xs text-[var(--saffron)] mt-0.5 inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span> {m.tips}</p>}
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-[var(--warm-charcoal)]/60">
                  {day.travel && <div className="bg-[var(--warm-sand)] rounded-lg p-2"><p className="font-medium text-[var(--indigo-deep)] mb-0.5 inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>train</span> Travel</p><p>{day.travel.from} → {day.travel.to}</p><p>{day.travel.mode} · {day.travel.duration}</p></div>}
                  <div className="bg-[var(--warm-sand)] rounded-lg p-2"><p className="font-medium text-[var(--indigo-deep)] mb-0.5 inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>hotel</span> Stay</p><p>{day.accommodation}</p></div>
                  <div className="bg-[var(--warm-sand)] rounded-lg p-2"><p className="font-medium text-[var(--indigo-deep)] mb-0.5 inline-flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span> Food</p><p>{day.meals}</p></div>
                </div>
              </div>
            ))}
          </div>

          {/* Cost estimate */}
          {itinerary.estimatedCost && (
            <div className="card-divine p-5">
              <h3 className="font-bold text-[var(--indigo-deep)] mb-3 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span> Estimated Cost (per person)</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Budget', value: itinerary.estimatedCost.budget },
                  { label: 'Comfortable', value: itinerary.estimatedCost.comfortable },
                  { label: 'Luxury', value: itinerary.estimatedCost.luxury },
                ].map(c => (
                  <div key={c.label} className="bg-[var(--warm-sand)] rounded-xl p-3">
                    <p className="text-xs text-[var(--warm-charcoal)]/50 mb-1">{c.label}</p>
                    <p className="font-bold text-[var(--indigo-deep)]">{c.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Packing + Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {itinerary.packingList?.length > 0 && (
              <div className="card-divine p-5">
                <h3 className="font-bold text-[var(--indigo-deep)] mb-3 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>backpack</span> Packing List</h3>
                <ul className="space-y-1">{itinerary.packingList.map(i => <li key={i} className="text-sm text-[var(--warm-charcoal)]/70 flex gap-2"><span>•</span>{i}</li>)}</ul>
              </div>
            )}
            {itinerary.importantNotes?.length > 0 && (
              <div className="card-divine p-5">
                <h3 className="font-bold text-[var(--indigo-deep)] mb-3 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span> Important Notes</h3>
                <ul className="space-y-1">{itinerary.importantNotes.map(n => <li key={n} className="text-sm text-[var(--warm-charcoal)]/70 flex gap-2"><span className="material-symbols-outlined text-[14px] flex-shrink-0 text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>{n}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

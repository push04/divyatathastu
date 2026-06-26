'use client'

import { useState, useMemo, useEffect } from 'react'
import indiaMap from '@svg-maps/india'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Temple {
  id: string; name: string; local_name: string; deity: string; deity_type: string
  categories: string[]; city: string; district?: string; state: string
  coordinates: { latitude: number; longitude: number }
  darshan_timings: string; best_time_to_visit: string; significance: string
  special_events: string[]; nearest_airport?: string; nearest_railway?: string
  pilgrimage_circuits: string[]; architecture_style?: string
}

interface Circuit {
  id: string; name: string; local_name: string; circuit_type: string
  deity_focus: string; total_temples: number; states_covered: string[]
  best_months: string[]; approx_duration_days: number; difficulty: string
  significance: string; traditional_route_order?: string
  temples: { stop_number: number; temple_id: string; name: string; city: string; coordinates: { latitude: number; longitude: number } }[]
}

const STATE_NAME_TO_ID: Record<string, string> = {
  'Andaman and Nicobar Islands': 'an', 'Andhra Pradesh': 'ap', 'Arunachal Pradesh': 'ar',
  'Assam': 'as', 'Bihar': 'br', 'Chandigarh': 'ch', 'Chhattisgarh': 'ct',
  'Dadra and Nagar Haveli': 'dn', 'Daman and Diu': 'dd', 'Delhi': 'dl',
  'Goa': 'ga', 'Gujarat': 'gj', 'Haryana': 'hr', 'Himachal Pradesh': 'hp',
  'Jammu and Kashmir': 'jk', 'Jammu & Kashmir': 'jk', 'Jharkhand': 'jh',
  'Karnataka': 'ka', 'Kerala': 'kl', 'Lakshadweep': 'ld', 'Madhya Pradesh': 'mp',
  'Maharashtra': 'mh', 'Manipur': 'mn', 'Meghalaya': 'ml', 'Mizoram': 'mz',
  'Nagaland': 'nl', 'Odisha': 'or', 'Puducherry': 'py', 'Punjab': 'pb',
  'Rajasthan': 'rj', 'Sikkim': 'sk', 'Tamil Nadu': 'tn', 'Telangana': 'tg',
  'Tripura': 'tr', 'Uttar Pradesh': 'up', 'Uttarakhand': 'ut', 'West Bengal': 'wb',
}

const CATEGORY_COLORS: Record<string, string> = {
  'Jyotirlinga': 'bg-orange-100 text-orange-700',
  'Shakti Peetha': 'bg-pink-100 text-pink-700',
  'Char Dham': 'bg-blue-100 text-blue-700',
  'Char Dham (Himalayan)': 'bg-sky-100 text-sky-700',
  'Char Dham (Pan-India)': 'bg-blue-100 text-blue-700',
  'Divya Desam': 'bg-violet-100 text-violet-700',
  'Major Pilgrimage': 'bg-amber-100 text-amber-700',
  'Heritage Temple': 'bg-emerald-100 text-emerald-700',
  'Panch Kedar': 'bg-teal-100 text-teal-700',
  'Panch Badri': 'bg-cyan-100 text-cyan-700',
  'Ashtavinayak': 'bg-yellow-100 text-yellow-700',
  'Sapta Puri': 'bg-purple-100 text-purple-700',
}

function getTempleColor(count: number): string {
  if (count === 0) return '#F5ECD7'
  if (count <= 2) return '#F5C97B'
  if (count <= 4) return '#E8A255'
  if (count <= 6) return '#C67D53'
  return '#8B3A2F'
}

export default function IndiaMandirMap() {
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedCircuit, setSelectedCircuit] = useState<Circuit | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [temples, setTemples] = useState<Temple[]>([])
  const [circuits, setCircuits] = useState<Circuit[]>([])
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map')
  const supabase = createClient()

  useEffect(() => {
    if (selectedState || selectedCircuit) {
      setMobileView('list')
    }
  }, [selectedState, selectedCircuit])

  useEffect(() => {
    Promise.all([
      fetch('/data/mandirs.json').then(r => r.json()),
      fetch('/data/pilgrimageroutes.json').then(r => r.json()),
    ]).then(([mandirData, routeData]) => {
      setTemples(mandirData.temples as Temple[])
      setCircuits(routeData.pilgrimage_circuits as Circuit[])
    }).catch(() => {})

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('saved_mandirs').select('google_place_id').eq('user_id', user.id)
        .then(({ data }) => { if (data) setSavedIds(new Set(data.map((r: any) => r.google_place_id))) })
    })
  }, [])

  const stateTemples = useMemo(() => {
    const map: Record<string, Temple[]> = {}
    temples.forEach(t => {
      const id = STATE_NAME_TO_ID[t.state]
      if (id) {
        if (!map[id]) map[id] = []
        map[id].push(t)
      }
    })
    return map
  }, [temples])

  const circuitStateIds = useMemo(() => {
    if (!selectedCircuit) return new Set<string>()
    const ids = new Set<string>()
    selectedCircuit.states_covered.forEach(s => {
      const id = STATE_NAME_TO_ID[s]
      if (id) ids.add(id)
    })
    return ids
  }, [selectedCircuit])

  const activeTemples = selectedState ? (stateTemples[selectedState] || []) : []
  const activeStateName = selectedState
    ? indiaMap.locations.find(l => l.id === selectedState)?.name || ''
    : ''

  async function saveTemple(temple: Temple) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please login to save'); return }
    if (savedIds.has(temple.id)) {
      await supabase.from('saved_mandirs').delete().eq('user_id', user.id).eq('google_place_id', temple.id)
      setSavedIds(prev => { const s = new Set(prev); s.delete(temple.id); return s })
      toast.success('Removed')
    } else {
      await supabase.from('saved_mandirs').insert({
        user_id: user.id, google_place_id: temple.id, mandir_name: temple.name,
        city: temple.city, state: temple.state,
        lat: temple.coordinates.latitude, lng: temple.coordinates.longitude
      } as any)
      setSavedIds(prev => new Set([...prev, temple.id]))
      toast.success('Saved!')
    }
  }

  return (
    <div className="flex h-full flex-col lg:flex-row gap-0 overflow-hidden relative">
      {/* SVG Map Panel */}
      <div className={`flex-1 bg-[var(--kutch-white)] flex flex-col ${mobileView === 'map' ? 'flex' : 'hidden lg:flex'}`}>
        {/* Circuit filter strip */}
        <div className="p-3 border-b border-[var(--warm-sand)] bg-white flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCircuit(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${!selectedCircuit ? 'bg-[var(--indigo-deep)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:bg-[var(--warm-sand)]/80'}`}
          >All States</button>
          {circuits.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCircuit(selectedCircuit?.id === c.id ? null : c)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${selectedCircuit?.id === c.id ? 'bg-[var(--terracotta)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:bg-[var(--warm-sand)]/80'}`}
            >{c.name}</button>
          ))}
        </div>

        {/* Map */}
        <div className="flex-1 relative p-4 flex items-center justify-center">
          {selectedCircuit && (
            <div className="absolute top-4 left-4 right-4 z-10 bg-white/95 rounded-xl border border-[var(--warm-sand)] p-3 shadow-md pointer-events-none">
              <p className="text-xs font-bold text-[var(--indigo-deep)]">{selectedCircuit.name}</p>
              <p className="text-xs text-[var(--warm-charcoal)]/60 mt-0.5">{(selectedCircuit.significance || '').slice(0, 120)}...</p>
              <p className="text-xs text-[var(--terracotta)] mt-1 font-medium">{selectedCircuit.total_temples} temples · {selectedCircuit.approx_duration_days} days · {selectedCircuit.difficulty}</p>
              {selectedCircuit.traditional_route_order && (
                <p className="text-xs text-[var(--warm-charcoal)]/50 mt-0.5 font-mono">{selectedCircuit.traditional_route_order}</p>
              )}
            </div>
          )}

          <svg
            viewBox={indiaMap.viewBox}
            className="w-full h-full max-h-[600px] drop-shadow-sm"
            style={{ maxWidth: '500px' }}
          >
            {indiaMap.locations.map(loc => {
              const count = stateTemples[loc.id]?.length || 0
              const isHovered = hoveredState === loc.id
              const isSelected = selectedState === loc.id
              const isCircuitState = circuitStateIds.has(loc.id)
              const fill = selectedCircuit
                ? (isCircuitState ? '#C67D53' : '#F5ECD7')
                : getTempleColor(count)

              return (
                <path
                  key={loc.id}
                  id={loc.id}
                  d={loc.path}
                  fill={isSelected ? '#8B3A2F' : isHovered ? '#E8A255' : fill}
                  stroke="white"
                  strokeWidth="0.8"
                  strokeLinejoin="round"
                  className="transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredState(loc.id)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => {
                    setSelectedState(selectedState === loc.id ? null : loc.id)
                    setSelectedCircuit(null)
                  }}
                />
              )
            })}
          </svg>

          {/* Hover tooltip */}
          {hoveredState && !selectedState && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--indigo-deep)] text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg pointer-events-none z-20">
              {indiaMap.locations.find(l => l.id === hoveredState)?.name}
              {stateTemples[hoveredState]?.length
                ? ` · ${stateTemples[hoveredState].length} temple${stateTemples[hoveredState].length > 1 ? 's' : ''}`
                : ' · No temples in dataset'}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg p-2 text-xs space-y-1 border border-[var(--warm-sand)]">
            {[['1-2', '#F5C97B'], ['3-4', '#E8A255'], ['5-6', '#C67D53'], ['7+', '#8B3A2F']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
                <span className="text-[var(--warm-charcoal)]/60">{label} temples</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className={`w-full lg:w-80 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--warm-sand)] bg-white flex flex-col overflow-hidden flex-1 lg:flex-initial lg:max-h-none ${mobileView === 'list' ? 'flex' : 'hidden lg:flex'}`}>
        {selectedState ? (
          <>
            <div className="px-4 py-3 border-b border-[var(--warm-sand)] flex items-center justify-between">
              <div>
                <p className="font-bold text-[var(--indigo-deep)] text-sm">{activeStateName}</p>
                <p className="text-xs text-[var(--warm-charcoal)]/50">{activeTemples.length} sacred sites</p>
              </div>
              <button onClick={() => { setSelectedState(null); setMobileView('map') }} className="text-[var(--warm-charcoal)]/40 hover:text-[var(--warm-charcoal)]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--warm-sand)]/60">
              {activeTemples.length === 0 ? (
                <p className="p-4 text-sm text-[var(--warm-charcoal)]/40 text-center">No temples in dataset for this state</p>
              ) : activeTemples.map(t => (
                <div key={t.id} className="p-3 hover:bg-[var(--warm-sand)]/20 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--indigo-deep)] leading-tight">{t.name}</p>
                      <p className="text-xs text-[var(--saffron)] font-medium">{t.local_name}</p>
                    </div>
                    <button onClick={() => saveTemple(t)} className="flex-shrink-0 mt-0.5">
                      <span className={`material-symbols-outlined text-[18px] ${savedIds.has(t.id) ? 'text-[var(--terracotta)]' : 'text-[var(--warm-charcoal)]/30 hover:text-[var(--terracotta)]'}`} style={{ fontVariationSettings: savedIds.has(t.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {t.categories.slice(0, 2).map(cat => (
                      <span key={cat} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[cat] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{cat}</span>
                    ))}
                  </div>
                  <div className="space-y-0.5 text-xs text-[var(--warm-charcoal)]/60">
                    <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>temple_hindu</span>{t.deity}</p>
                    <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>{t.darshan_timings}</p>
                    <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>{t.city}</p>
                  </div>
                  <p className="text-xs text-[var(--warm-charcoal)]/50 mt-1.5 line-clamp-2">{t.significance}</p>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${t.coordinates.latitude}&mlon=${t.coordinates.longitude}&zoom=14`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--indigo-deep)] hover:underline font-medium"
                  >
                    <span className="material-symbols-outlined text-[12px]">map</span>View on Map
                  </a>
                </div>
              ))}
            </div>
          </>
        ) : selectedCircuit ? (
          <>
            <div className="px-4 py-3 border-b border-[var(--warm-sand)] flex items-center justify-between">
              <div>
                <p className="font-bold text-[var(--indigo-deep)] text-sm">{selectedCircuit.name}</p>
                <p className="text-xs text-[var(--warm-charcoal)]/50">{selectedCircuit.total_temples} temples · {selectedCircuit.approx_duration_days} days</p>
              </div>
              <button onClick={() => { setSelectedCircuit(null); setMobileView('map') }} className="text-[var(--warm-charcoal)]/40 hover:text-[var(--warm-charcoal)]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--warm-sand)]/60">
              {(selectedCircuit.temples || []).map(stop => {
                const temple = temples.find(t => t.id === stop.temple_id)
                return (
                  <div key={stop.stop_number} className="p-3 hover:bg-[var(--warm-sand)]/20 transition-colors">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[var(--terracotta)] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{stop.stop_number}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--indigo-deep)]">{stop.name}</p>
                        <p className="text-xs text-[var(--warm-charcoal)]/60">{stop.city}</p>
                        {temple && <p className="text-xs text-[var(--warm-charcoal)]/50 mt-1 line-clamp-2">{temple.significance}</p>}
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${stop.coordinates.latitude}&mlon=${stop.coordinates.longitude}&zoom=13`}
                          target="_blank" rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--indigo-deep)] hover:underline"
                        >
                          <span className="material-symbols-outlined text-[12px]">map</span>Map
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <span className="material-symbols-outlined text-[48px] text-[var(--warm-charcoal)]/20 block mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>temple_hindu</span>
              <p className="text-sm font-medium text-[var(--warm-charcoal)]/40">Tap a state to explore</p>
              <p className="text-xs text-[var(--warm-charcoal)]/30 mt-1">or select a pilgrimage circuit above</p>
              <div className="mt-4 text-left space-y-1">
                <p className="text-xs text-[var(--warm-charcoal)]/50 font-semibold uppercase tracking-wide">Dataset</p>
                <p className="text-xs text-[var(--warm-charcoal)]/40">{temples.length} sacred sites</p>
                <p className="text-xs text-[var(--warm-charcoal)]/40">{circuits.length} pilgrimage circuits</p>
                <p className="text-xs text-[var(--warm-charcoal)]/40">{[...new Set(temples.map(t => t.state))].length} states covered</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Toggle Button on Mobile */}
      {(selectedState || selectedCircuit) && (
        <div className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setMobileView(prev => prev === 'map' ? 'list' : 'map')}
            className="bg-[var(--indigo-deep)] text-white px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-1.5 border border-white/20 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[16px]">
              {mobileView === 'map' ? 'format_list_bulleted' : 'map'}
            </span>
            {mobileView === 'map' ? 'Show List' : 'Show Map'}
          </button>
        </div>
      )}
    </div>
  )
}

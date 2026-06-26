'use client'

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import type { Temple } from '@/components/mandir/TempleDetailModal'

const IndiaMandirMap = dynamic(() => import('@/components/IndiaMandirMap'), { ssr: false })
const TempleDetailModal = dynamic(() => import('@/components/mandir/TempleDetailModal'), { ssr: false })

interface Mandir {
  id: string; name: string; city: string; state: string; deity: string
  lat: number; lng: number; timing: string; specialPuja: string
  rating: number; category: string; distance: number
  local_name: string; deity_type: string; categories: string[]
  district?: string; coordinates: { latitude: number; longitude: number }
  darshan_timings: string; best_time_to_visit: string; significance: string
  special_events: string[]; nearest_airport?: string; nearest_railway?: string
  pilgrimage_circuits: string[]; architecture_style?: string
  open_year_round?: boolean; deity_description?: string; history_and_legend?: string
  travel_tips?: string[]
}

export default function MandirFinderPage() {
  const [tab, setTab] = useState<'map' | 'nearby'>('map')
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mandirs, setMandirs] = useState<Mandir[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Mandir | null>(null)
  const [userLat, setUserLat] = useState(20.5937)
  const [userLng, setUserLng] = useState(78.9629)
  const [popupTemple, setPopupTemple] = useState<Mandir | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude) },
      () => {}
    )
  }, [])

  useEffect(() => {
    if (tab === 'nearby') {
      if (!mapInstanceRef.current) {
        initMap()
      } else {
        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize()
        }, 200)
      }
    }
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mapInstanceRef.current && userLat !== 20.5937 && userLng !== 78.9629) {
      mapInstanceRef.current.setView([userLat, userLng], 8)
      fetchNearby()
    }
  }, [userLat, userLng]) // eslint-disable-line react-hooks/exhaustive-deps

  async function initMap() {
    if (mapInstanceRef.current || !mapRef.current) return
    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')
    const map = L.map(mapRef.current).setView([userLat, userLng], 6)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
    }).addTo(map)
    mapInstanceRef.current = map
    fetchNearby()
  }

  async function fetchNearby() {
    setLoading(true)
    try {
      const res = await fetch(`/api/mandir?lat=${userLat}&lng=${userLng}${query ? `&q=${query}` : ''}`)
      const data = await res.json()
      if (data.success) {
        setMandirs(data.data)
        updateMarkers(data.data)
        if (data.data.length > 0) setViewMode('list')
      }
    } catch { toast.error('Failed to load') }
    setLoading(false)
  }

  function updateMarkers(data: Mandir[]) {
    if (!mapInstanceRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet')
    markersRef.current.forEach(m => m.remove())
    markersRef.current = data.map(m => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#C67D53;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' 1">temple_hindu</span></div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      })
      return L.marker([m.lat, m.lng], { icon }).addTo(mapInstanceRef.current).on('click', () => {
        setSelected(m)
        mapInstanceRef.current?.flyTo([m.lat, m.lng], 13)
      })
    })
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--warm-sand)] bg-white">
        {([['map', 'map', 'India Map'], ['nearby', 'near_me', 'Near Me']] as const).map(([t, icon, label]) => (
          <button key={t} onClick={() => setTab(t as 'map' | 'nearby')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all border-b-2 ${tab === t ? 'border-[var(--terracotta)] text-[var(--terracotta)]' : 'border-transparent text-[var(--warm-charcoal)]/50 hover:text-[var(--warm-charcoal)]'}`}>
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* India SVG Map Tab */}
      <div className={`flex-1 overflow-hidden ${tab === 'map' ? 'flex' : 'hidden'}`}>
        <IndiaMandirMap />
      </div>

      {/* Near Me Tab */}
      <div className={`flex-1 overflow-hidden flex flex-col ${tab === 'nearby' ? 'flex' : 'hidden'}`}>
        <div className="p-3 bg-white border-b border-[var(--warm-sand)] flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchNearby()}
            placeholder="Search near me..." className="flex-1 px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)]" />
          <button onClick={fetchNearby} className="btn-divine px-4 py-2 text-sm">
            <span className="material-symbols-outlined text-[16px]">search</span>
          </button>
        </div>
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
          {/* List panel */}
          <div className={`lg:w-72 flex-shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r border-[var(--warm-sand)] flex-1 lg:flex-initial lg:max-h-none ${viewMode === 'list' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'}`}>
            {loading ? <div className="flex items-center justify-center h-24 text-[var(--warm-charcoal)]/40 text-sm">Loading...</div>
              : mandirs.length === 0
                ? <div className="p-4 text-sm text-[var(--warm-charcoal)]/40 text-center flex-1 flex items-center justify-center">Search to find nearby temples</div>
                : mandirs.map(m => (
                  <button key={m.id} onClick={() => { setSelected(m); mapInstanceRef.current?.flyTo([m.lat, m.lng], 13); setViewMode('map') }}
                    className={`w-full text-left p-3 border-b border-[var(--warm-sand)] hover:bg-[var(--warm-sand)] transition-all ${selected?.id === m.id ? 'bg-[var(--warm-sand)]' : ''}`}>
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[18px] flex-shrink-0 text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>temple_hindu</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--indigo-deep)] truncate">{m.name}</p>
                        <p className="text-xs text-[var(--warm-charcoal)]/60">{m.city}, {m.state}</p>
                        <p className="text-xs text-[var(--terracotta)]">{m.distance} km away</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setPopupTemple(m); setIsPopupOpen(true) }} className="flex-shrink-0 self-center text-[var(--warm-charcoal)]/30 hover:text-[var(--indigo-deep)] transition-colors p-1">
                        <span className="material-symbols-outlined text-[20px]">info</span>
                      </button>
                    </div>
                  </button>
                ))
            }
          </div>

          {/* Map panel */}
          <div className={`flex-1 relative ${viewMode === 'map' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'}`}>
            <div ref={mapRef} className="w-full h-full min-h-[300px] lg:min-h-none" />
            {selected && (
              <div className="absolute bottom-16 lg:bottom-4 right-4 left-4 lg:left-auto lg:w-72 bg-white rounded-2xl shadow-xl border border-[var(--warm-sand)] p-4 z-[1000]">
                <div className="flex items-start justify-between mb-2">
                  <div><p className="font-bold text-[var(--indigo-deep)] text-sm">{selected.name}</p><p className="text-xs text-[var(--warm-charcoal)]/60">{selected.city}, {selected.state}</p></div>
                  <button onClick={() => setSelected(null)}><span className="material-symbols-outlined text-[18px] text-[var(--warm-charcoal)]/40">close</span></button>
                </div>
                <p className="text-xs text-[var(--warm-charcoal)]/60 mb-3"><span className="font-medium">Timing:</span> {selected.timing}</p>
                <div className="flex gap-2">
                  <a href={`https://www.openstreetmap.org/directions?to=${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-[var(--indigo-deep)] text-white text-center flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[12px]">directions</span>Directions</a>
                  <button 
                    onClick={() => { setPopupTemple(selected); setIsPopupOpen(true) }}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-[var(--saffron)] hover:bg-[var(--saffron)]/90 text-white text-center flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px]">info</span>Details
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Floating toggle button on mobile for Near Me */}
          {mandirs.length > 0 && (
            <div className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
              <button
                onClick={() => setViewMode(prev => prev === 'map' ? 'list' : 'map')}
                className="bg-[var(--indigo-deep)] text-white px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-1.5 border border-white/20 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {viewMode === 'map' ? 'format_list_bulleted' : 'map'}
                </span>
                {viewMode === 'map' ? 'Show List' : 'Show Map'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Temple Detail Modal */}
      <TempleDetailModal
        temple={popupTemple as unknown as Temple}
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false)
          setTimeout(() => setPopupTemple(null), 400)
        }}
      />
    </div>
  )
}

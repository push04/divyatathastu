'use client'

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

const IndiaMandirMap = dynamic(() => import('@/components/IndiaMandirMap'), { ssr: false })

interface Mandir {
  id: string; name: string; city: string; state: string; deity: string
  lat: number; lng: number; timing: string; specialPuja: string
  rating: number; category: string; distance: number
}

export default function MandirFinderPage() {
  const [tab, setTab] = useState<'map' | 'nearby'>('map')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mandirs, setMandirs] = useState<Mandir[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Mandir | null>(null)
  const [userLat, setUserLat] = useState(20.5937)
  const [userLng, setUserLng] = useState(78.9629)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude) },
      () => {}
    )
    loadSaved()
  }, [])

  useEffect(() => {
    if (tab === 'nearby') initMap()
  }, [tab])

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

  async function loadSaved() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('saved_mandirs').select('google_place_id').eq('user_id', user.id)
    if (data) setSaved(new Set(data.map((s: any) => s.google_place_id)))
  }

  async function fetchNearby() {
    setLoading(true)
    try {
      const res = await fetch(`/api/mandir?lat=${userLat}&lng=${userLng}${query ? `&q=${query}` : ''}`)
      const data = await res.json()
      if (data.success) { setMandirs(data.data); updateMarkers(data.data) }
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
      return L.marker([m.lat, m.lng], { icon }).addTo(mapInstanceRef.current).on('click', () => setSelected(m))
    })
  }

  async function toggleSave(mandir: Mandir) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please login'); return }
    if (saved.has(mandir.id)) {
      await supabase.from('saved_mandirs').delete().eq('user_id', user.id).eq('google_place_id', mandir.id)
      setSaved(prev => { const s = new Set(prev); s.delete(mandir.id); return s })
      toast.success('Removed')
    } else {
      await supabase.from('saved_mandirs').insert({ user_id: user.id, google_place_id: mandir.id, mandir_name: mandir.name, city: mandir.city, state: mandir.state, lat: mandir.lat, lng: mandir.lng } as any)
      setSaved(prev => new Set([...prev, mandir.id]))
      toast.success('Saved!')
    }
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
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          <div className="lg:w-72 flex-shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r border-[var(--warm-sand)] max-h-48 lg:max-h-none">
            {loading ? <div className="flex items-center justify-center h-24 text-[var(--warm-charcoal)]/40 text-sm">Loading...</div>
              : mandirs.length === 0
                ? <div className="p-4 text-sm text-[var(--warm-charcoal)]/40 text-center">Search to find nearby temples</div>
                : mandirs.map(m => (
                  <button key={m.id} onClick={() => { setSelected(m); mapInstanceRef.current?.flyTo([m.lat, m.lng], 13) }}
                    className={`w-full text-left p-3 border-b border-[var(--warm-sand)] hover:bg-[var(--warm-sand)] transition-all ${selected?.id === m.id ? 'bg-[var(--warm-sand)]' : ''}`}>
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[18px] flex-shrink-0 text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>temple_hindu</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--indigo-deep)] truncate">{m.name}</p>
                        <p className="text-xs text-[var(--warm-charcoal)]/60">{m.city}, {m.state}</p>
                        <p className="text-xs text-[var(--terracotta)]">{m.distance} km away</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); toggleSave(m) }} className="flex-shrink-0">
                        <span className={`material-symbols-outlined text-[18px] ${saved.has(m.id) ? 'text-[var(--terracotta)]' : 'text-[var(--warm-charcoal)]/30'}`} style={{ fontVariationSettings: saved.has(m.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                      </button>
                    </div>
                  </button>
                ))
            }
          </div>
          <div className="flex-1 relative">
            <div ref={mapRef} className="w-full h-full" />
            {selected && (
              <div className="absolute bottom-4 right-4 w-72 bg-white rounded-2xl shadow-xl border border-[var(--warm-sand)] p-4 z-[1000]">
                <div className="flex items-start justify-between mb-2">
                  <div><p className="font-bold text-[var(--indigo-deep)] text-sm">{selected.name}</p><p className="text-xs text-[var(--warm-charcoal)]/60">{selected.city}, {selected.state}</p></div>
                  <button onClick={() => setSelected(null)}><span className="material-symbols-outlined text-[18px] text-[var(--warm-charcoal)]/40">close</span></button>
                </div>
                <p className="text-xs text-[var(--warm-charcoal)]/60 mb-3"><span className="font-medium">Timing:</span> {selected.timing}</p>
                <div className="flex gap-2">
                  <button onClick={() => toggleSave(selected)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${saved.has(selected.id) ? 'bg-[var(--terracotta)] text-white border-[var(--terracotta)]' : 'border-[var(--warm-sand)] hover:border-[var(--terracotta)] text-[var(--warm-charcoal)]'}`}>
                    {saved.has(selected.id) ? 'Saved' : 'Save'}
                  </button>
                  <a href={`https://www.openstreetmap.org/directions?to=${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-[var(--indigo-deep)] text-white text-center">Directions</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

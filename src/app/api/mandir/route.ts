import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'

interface Mandir {
  id: string; name: string; city: string; state: string; deity: string
  lat: number; lng: number; timing: string; specialPuja: string
  rating: number; category: string; distance: number
}

function getFamousMandirs(): Mandir[] {
  try {
    let jsonPath = join(process.cwd(), 'public/data/mandirs.json')
    if (!existsSync(jsonPath)) {
      jsonPath = join(process.cwd(), 'src/data/mandirs.json')
    }
    if (!existsSync(jsonPath)) {
      console.warn('[API/Mandir] mandirs.json not found')
      return []
    }
    const fileContent = readFileSync(jsonPath, 'utf8')
    const parsed = JSON.parse(fileContent)
    const temples = parsed.temples || []
    
    return temples.map((t: any) => ({
      id: t.id,
      name: t.name,
      city: t.city,
      state: t.state,
      deity: t.deity,
      lat: t.coordinates?.latitude || 0,
      lng: t.coordinates?.longitude || 0,
      timing: t.darshan_timings || '',
      specialPuja: t.special_events?.join(', ') || '',
      rating: 4.8,
      category: t.categories?.[0] || ''
    }))
  } catch (e) {
    console.error('Error loading mandirs.json:', e)
    return []
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') || '28.6139')
  const lng = parseFloat(searchParams.get('lng') || '77.2090')
  const deity = searchParams.get('deity') || ''
  const state = searchParams.get('state') || ''
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''

  let mandirs = getFamousMandirs()

  // Filter by deity
  if (deity) mandirs = mandirs.filter(m => m.deity.toLowerCase().includes(deity.toLowerCase()))
  if (state) mandirs = mandirs.filter(m => m.state.toLowerCase().includes(state.toLowerCase()))
  if (category) mandirs = mandirs.filter(m => m.category === category)
  if (query) mandirs = mandirs.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.city.toLowerCase().includes(query.toLowerCase()) ||
    m.state.toLowerCase().includes(query.toLowerCase()) ||
    m.deity.toLowerCase().includes(query.toLowerCase())
  )

  // Sort by distance from user location
  const withDistance = mandirs.map(m => {
    const R = 6371
    const dLat = (m.lat - lat) * Math.PI / 180
    const dLng = (m.lng - lng) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180) * Math.cos(m.lat*Math.PI/180) * Math.sin(dLng/2)**2
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return { ...m, distance: Math.round(distance) }
  }).sort((a, b) => a.distance - b.distance)

  return NextResponse.json({
    success: true,
    data: withDistance,
    total: withDistance.length,
  }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' }
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { getPanchangForDate } from '@/lib/noxatra/astrology'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') || '28.6139')
  const lng = parseFloat(searchParams.get('lng') || '77.2090')
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  try {
    const panchang = getPanchangForDate(date, lat, lng)
    return NextResponse.json({ success: true, data: panchang }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' }
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Panchang calculation failed' }, { status: 500 })
  }
}

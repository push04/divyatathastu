import { NextRequest, NextResponse } from 'next/server'

// Pure-JS Vedic panchang — no external dependencies, works on Vercel serverless
// Sun/Moon positions: Meeus low-precision (~1° accuracy, sufficient for tithi/nakshatra)
// Sunrise/sunset: NOAA algorithm, accurate to ~1 min for Indian latitudes

function jd(y: number, m: number, d: number): number {
  if (m <= 2) { y--; m += 12 }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5
}

function sunLon(J: number): number {
  const n = J - 2451545.0
  const L = ((280.460 + 0.9856474 * n) % 360 + 360) % 360
  const g = ((357.528 + 0.9856003 * n) % 360 + 360) % 360 * Math.PI / 180
  return ((L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) % 360 + 360) % 360
}

function moonLon(J: number): number {
  const T = (J - 2451545.0) / 36525
  const L  = ((218.3164477 + 481267.88123421 * T) % 360 + 360) % 360
  const D  = ((297.8501921 + 445267.1114034  * T) % 360 + 360) % 360 * Math.PI / 180
  const M  = ((357.5291092 +  35999.0502909  * T) % 360 + 360) % 360 * Math.PI / 180
  const Mm = ((134.9633964 + 477198.8675055  * T) % 360 + 360) % 360 * Math.PI / 180
  const F  = (( 93.2720950 + 483202.0175233  * T) % 360 + 360) % 360 * Math.PI / 180
  const lon = L
    + 6.2888 * Math.sin(Mm)
    + 1.2740 * Math.sin(2*D - Mm)
    + 0.6583 * Math.sin(2*D)
    + 0.2136 * Math.sin(2*Mm)
    - 0.1851 * Math.sin(M)
    - 0.1143 * Math.sin(2*F)
    + 0.0588 * Math.sin(2*D - 2*Mm)
    + 0.0572 * Math.sin(2*D - M - Mm)
    + 0.0533 * Math.sin(2*D + Mm)
    + 0.0458 * Math.sin(2*D - M)
    - 0.0409 * Math.sin(M - Mm)
    - 0.0347 * Math.sin(D)
  return ((lon % 360) + 360) % 360
}

function sunriseUTC(J: number, lat: number, lng: number, rise: boolean): number {
  const n = J - 2451545.0
  const L = ((280.460 + 0.9856474 * n) % 360 + 360) % 360
  const g = ((357.528 + 0.9856003 * n) % 360 + 360) % 360 * Math.PI / 180
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2*g)) * Math.PI / 180
  const eps = (23.439 - 0.0000004 * n) * Math.PI / 180
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda))
  const latR = lat * Math.PI / 180
  const cosH = (Math.cos(90.833 * Math.PI / 180) - Math.sin(latR) * Math.sin(decl)) / (Math.cos(latR) * Math.cos(decl))
  if (Math.abs(cosH) > 1) return rise ? 6 : 18
  const H = Math.acos(cosH) * 180 / Math.PI
  const B = (360 / 365) * (n + 81) * Math.PI / 180
  const eot = (9.87 * Math.sin(2*B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)) / 60
  return 12 - lng / 15 + eot + (rise ? -H : H) / 15
}

function fmt(h: number): string {
  const t = ((h % 24) + 24) % 24
  let hh = Math.floor(t), mm = Math.round((t - hh) * 60)
  if (mm >= 60) { mm = 0; hh++ }
  hh = hh % 24
  const ap = hh >= 12 ? 'PM' : 'AM'
  const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh
  return `${h12.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${ap}`
}

function parseH(t: string): number {
  const [tm, ap] = t.split(' ')
  const [h, m] = tm.split(':').map(Number)
  let hr = h + m / 60
  if (ap === 'PM' && h !== 12) hr += 12
  if (ap === 'AM' && h === 12) hr = m / 60
  return hr
}

const TITHIS = [
  'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami',
  'Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima',
  'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami',
  'Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Amavasya',
]
const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha',
  'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Moola','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha',
  'Purva Bhadrapada','Uttara Bhadrapada','Revati',
]
const YOGAS = [
  'Vishkamba','Preeti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti',
  'Shoola','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata',
  'Variyana','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti',
]
const KARANAS = ['Bava','Balava','Kaulava','Taitila','Garija','Vanija','Vishti','Shakuni','Chatushpada','Naga','Kimstughna']
const RASHIS  = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena']
const RAHU_SEG_MAP = [7, 1, 6, 4, 5, 3, 2] // Sun=8th, Mon=2nd, Tue=7th, Wed=5th, Thu=6th, Fri=4th, Sat=3rd (0-based)
function rahuKaalDynamic(srH: number, ssH: number, dow: number): string {
  const segment = (ssH - srH) / 8
  const start   = srH + RAHU_SEG_MAP[dow] * segment
  return `${fmt(start)} – ${fmt(start + segment)}`
}

function moonPhase(t: number): string {
  if (t === 14) return 'Purnima — Full Moon'
  if (t === 29) return 'Amavasya — New Moon'
  if (t < 14)  return `Shukla Paksha · ${TITHIS[t]}`
  return `Krishna Paksha · ${TITHIS[t % 15]}`
}

function festivals(tithiNum: number): { name: string; days: number }[] {
  const next = (target: number) => ((target - tithiNum + 30) % 30) || 30
  return [
    { name: 'Ekadashi',             days: Math.min(next(10), next(25)) },
    { name: 'Purnima (Full Moon)',   days: next(14) },
    { name: 'Amavasya (New Moon)',   days: next(29) },
  ].sort((a, b) => a.days - b.days)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat  = parseFloat(searchParams.get('lat')  || '28.6139')
  const lng  = parseFloat(searchParams.get('lng')  || '77.2090')
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const [y, m, d] = date.split('-').map(Number)
  const J = jd(y, m, d)

  // Lahiri ayanamsa (sidereal offset)
  const ayanamsa = 23.85 + (y - 2000) * 0.0139
  const sLon = ((sunLon(J)  - ayanamsa + 360) % 360)
  const mLon = ((moonLon(J) - ayanamsa + 360) % 360)

  const elongation  = ((mLon - sLon) + 360) % 360
  const tithiNum    = Math.floor(elongation / 12) % 30
  const nakshatraNum = Math.floor(mLon / (360 / 27)) % 27
  const yogaNum     = Math.floor(((sLon + mLon) % 360) / (360 / 27)) % 27
  const karanaNum   = Math.floor(elongation / 6) % 11

  const srUTC = sunriseUTC(J, lat, lng, true)
  const ssUTC = sunriseUTC(J, lat, lng, false)
  const srIST = fmt(srUTC + 5.5)
  const ssIST = fmt(ssUTC + 5.5)

  const srH   = parseH(srIST)
  const ssH   = parseH(ssIST)
  const noon  = (srH + ssH) / 2
  const dayDur = ssH - srH
  const muhuraDur = dayDur / 30 // half of 1/15th of day
  const abhijit = `${fmt(noon - muhuraDur)} – ${fmt(noon + muhuraDur)}`
  // Brahma Muhurta: 96–48 minutes before sunrise
  const brahma  = `${fmt(srH - 1.6)} – ${fmt(srH - 0.8)}`

  const dow = new Date(y, m - 1, d).getDay()

  return NextResponse.json({
    success: true,
    data: {
      date,
      tithi:          TITHIS[tithiNum],
      tithiNum,
      nakshatra:      NAKSHATRAS[nakshatraNum],
      nakshatraNum,
      yoga:           YOGAS[yogaNum],
      karana:         KARANAS[karanaNum],
      sunrise:        srIST,
      sunset:         ssIST,
      moonSign:       RASHIS[Math.floor(mLon / 30)],
      sunSign:        RASHIS[Math.floor(sLon / 30)],
      rahuKaal:       rahuKaalDynamic(srH, ssH, dow),
      abhijitMuhurat: abhijit,
      brahmaHour:     brahma,
      moonPhase:      moonPhase(tithiNum),
      festivals:      festivals(tithiNum),
    },
  }, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' } })
}

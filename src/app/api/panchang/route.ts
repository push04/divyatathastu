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
const RAHU_SEG_MAP = [7, 1, 6, 4, 5, 3, 2]

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

// ── Hora ──────────────────────────────────────────────────────────────
// Chaldean order: Sun, Venus, Mercury, Moon, Saturn, Jupiter, Mars
const HORA_PLANETS = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars']
const HORA_PLANET_COLOR: Record<string, string> = {
  Sun: '#f59e0b', Venus: '#ec4899', Mercury: '#10b981',
  Moon: '#94a3b8', Saturn: '#6366f1', Jupiter: '#f97316', Mars: '#ef4444',
}
// First hora (from sunrise) is ruled by the day's planet:
// Sun=0, Mon=3, Tue=6, Wed=2, Thu=5, Fri=1, Sat=4
const HORA_DAY_START = [0, 3, 6, 2, 5, 1, 4]

function getHoras(srH: number, ssH: number, dow: number) {
  const dayDur = ssH - srH
  const nightDur = 24 - dayDur
  const dayHoraDur  = dayDur  / 12
  const nightHoraDur = nightDur / 12
  const startIdx = HORA_DAY_START[dow]
  const horas: { planet: string; color: string; start: string; end: string; startH: number; endH: number; isDay: boolean }[] = []
  for (let i = 0; i < 12; i++) {
    const planet = HORA_PLANETS[(startIdx + i) % 7]
    const startH = srH + i * dayHoraDur
    horas.push({ planet, color: HORA_PLANET_COLOR[planet], start: fmt(startH), end: fmt(startH + dayHoraDur), startH, endH: startH + dayHoraDur, isDay: true })
  }
  for (let i = 0; i < 12; i++) {
    const planet = HORA_PLANETS[(startIdx + 12 + i) % 7]
    const startH = ssH + i * nightHoraDur
    horas.push({ planet, color: HORA_PLANET_COLOR[planet], start: fmt(startH), end: fmt(startH + nightHoraDur), startH, endH: startH + nightHoraDur, isDay: false })
  }
  return horas
}

// ── Choghadiya ────────────────────────────────────────────────────────
const DAY_CHOG = [
  ['Udveg','Char','Labh','Amrit','Kaal','Shubh','Rog','Udveg'],   // Sun
  ['Amrit','Kaal','Shubh','Rog','Udveg','Char','Labh','Amrit'],   // Mon
  ['Rog','Udveg','Char','Labh','Amrit','Kaal','Shubh','Rog'],     // Tue
  ['Labh','Amrit','Kaal','Shubh','Rog','Udveg','Char','Labh'],    // Wed
  ['Shubh','Rog','Udveg','Char','Labh','Amrit','Kaal','Shubh'],   // Thu
  ['Char','Labh','Amrit','Kaal','Shubh','Rog','Udveg','Char'],    // Fri
  ['Kaal','Shubh','Rog','Udveg','Char','Labh','Amrit','Kaal'],    // Sat
]
const NIGHT_CHOG = [
  ['Shubh','Amrit','Char','Rog','Kaal','Labh','Udveg','Shubh'],   // Sun
  ['Char','Rog','Kaal','Labh','Udveg','Shubh','Amrit','Char'],    // Mon
  ['Kaal','Labh','Udveg','Shubh','Amrit','Char','Rog','Kaal'],    // Tue
  ['Udveg','Shubh','Amrit','Char','Rog','Kaal','Labh','Udveg'],   // Wed
  ['Amrit','Char','Rog','Kaal','Labh','Udveg','Shubh','Amrit'],   // Thu
  ['Labh','Udveg','Shubh','Amrit','Char','Rog','Kaal','Labh'],    // Fri
  ['Rog','Kaal','Labh','Udveg','Shubh','Amrit','Char','Rog'],     // Sat
]
const CHOG_QUALITY: Record<string, string> = {
  Amrit: 'excellent', Shubh: 'good', Labh: 'good', Char: 'neutral',
  Udveg: 'bad', Rog: 'bad', Kaal: 'bad',
}
const CHOG_COLOR: Record<string, string> = {
  Amrit: '#10b981', Shubh: '#3b82f6', Labh: '#22c55e', Char: '#f59e0b',
  Udveg: '#ef4444', Rog: '#dc2626', Kaal: '#6b7280',
}

function getChoghadiya(srH: number, ssH: number, dow: number) {
  const dayDur = ssH - srH
  const nightDur = 24 - dayDur
  const dayChogDur   = dayDur   / 8
  const nightChogDur = nightDur / 8
  const day = DAY_CHOG[dow].map((name, i) => {
    const startH = srH + i * dayChogDur
    return { name, quality: CHOG_QUALITY[name], color: CHOG_COLOR[name], start: fmt(startH), end: fmt(startH + dayChogDur), startH, endH: startH + dayChogDur, period: 'day' as const }
  })
  const night = NIGHT_CHOG[dow].map((name, i) => {
    const startH = ssH + i * nightChogDur
    return { name, quality: CHOG_QUALITY[name], color: CHOG_COLOR[name], start: fmt(startH), end: fmt(startH + nightChogDur), startH, endH: startH + nightChogDur, period: 'night' as const }
  })
  return [...day, ...night]
}

// ── Do Ghati Muhurt ───────────────────────────────────────────────────
// Per drikpanchang: the day (sunrise→sunset) is divided into 30 equal Ghati.
// 1 Do Ghati = 2 Ghati = day_duration / 15  → 15 windows per day, 15 per night.
// Window durations vary by location & season (different sunrise/sunset = different sizes).
// Traditional 5-Kala grouping: 3 Do Ghati per Kala (Pratah, Sangava, Madhyahna, Aparahna, Sayahna).
const DAY_KALAS  = ['Pratah', 'Sangava', 'Madhyahna', 'Aparahna', 'Sayahna']
const NIGHT_KALAS = ['Pradosh', 'Nishitha Mukha', 'Nishitha', 'Nishitha Anta', 'Usha']

// Per drikpanchang: each of the 30 classical Do Ghati muhurat (Rudra, Ahi, Mitra…) has a
// fixed presiding Nakshatra — the same 15+15 sequence every day, only the clock times shift
// with sunrise/sunset. This is distinct from the Moon's nakshatra for the day shown elsewhere.
const DAY_GHATI_NAKSHATRAS = [
  'Ardra', 'Ashlesha', 'Anuradha', 'Magha', 'Dhanishtha', 'Purva Ashadha', 'Uttara Ashadha',
  'Abhijit', 'Rohini', 'Jyeshtha', 'Vishakha', 'Mula', 'Shatabhisha', 'Uttara Phalguni', 'Purva Phalguni',
]
const NIGHT_GHATI_NAKSHATRAS = [
  'Ardra', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati', 'Ashwini', 'Bharani', 'Krittika',
  'Rohini', 'Mrigashira', 'Punarvasu', 'Pushya', 'Shravana', 'Hasta', 'Chitra', 'Swati',
]

function getDoGhatiMuhurt(srH: number, ssH: number) {
  const dayDur    = ssH - srH
  const nightDur  = 24 - dayDur
  const dgDay     = dayDur   / 15   // duration of one Do Ghati in daytime hours
  const dgNight   = nightDur / 15   // duration of one Do Ghati in nighttime hours

  const windows: {
    name: string; kala: string; period: 'day' | 'night'; nakshatra: string
    start: string; end: string; startH: number; endH: number; index: number
  }[] = []

  for (let i = 0; i < 15; i++) {
    const startH = srH + i * dgDay
    windows.push({
      name:      `Do Ghati ${i + 1}`,
      kala:      DAY_KALAS[Math.floor(i / 3)],
      period:    'day',
      nakshatra: DAY_GHATI_NAKSHATRAS[i],
      start:     fmt(startH),
      end:       fmt(startH + dgDay),
      startH,
      endH:      startH + dgDay,
      index:     i + 1,
    })
  }

  for (let i = 0; i < 15; i++) {
    const startH = ssH + i * dgNight
    windows.push({
      name:      `Do Ghati ${i + 1}`,
      kala:      NIGHT_KALAS[Math.floor(i / 3)],
      period:    'night',
      nakshatra: NIGHT_GHATI_NAKSHATRAS[i],
      start:     fmt(startH),
      end:       fmt(startH + dgNight),
      startH,
      endH:      startH + dgNight,
      index:     i + 1,
    })
  }

  return windows
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat  = parseFloat(searchParams.get('lat')  || '28.6139')
  const lng  = parseFloat(searchParams.get('lng')  || '77.2090')
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const [y, m, d] = date.split('-').map(Number)
  const J = jd(y, m, d)

  const ayanamsa = 23.85 + (y - 2000) * 0.0139
  const sLon = ((sunLon(J)  - ayanamsa + 360) % 360)
  const mLon = ((moonLon(J) - ayanamsa + 360) % 360)

  const elongation   = ((mLon - sLon) + 360) % 360
  const tithiNum     = Math.floor(elongation / 12) % 30
  const nakshatraNum = Math.floor(mLon / (360 / 27)) % 27
  const yogaNum      = Math.floor(((sLon + mLon) % 360) / (360 / 27)) % 27
  const karanaNum    = Math.floor(elongation / 6) % 11

  const srUTC = sunriseUTC(J, lat, lng, true)
  const ssUTC = sunriseUTC(J, lat, lng, false)
  const srIST = fmt(srUTC + 5.5)
  const ssIST = fmt(ssUTC + 5.5)

  const srH    = parseH(srIST)
  const ssH    = parseH(ssIST)
  const noon   = (srH + ssH) / 2
  const dayDur = ssH - srH
  const muhuraDur = dayDur / 30
  const abhijit   = `${fmt(noon - muhuraDur)} – ${fmt(noon + muhuraDur)}`
  const brahma    = `${fmt(srH - 1.6)} – ${fmt(srH - 0.8)}`

  const dow = new Date(y, m - 1, d).getDay()

  const choghadiya    = getChoghadiya(srH, ssH, dow)
  const doGhatiMuhurt = getDoGhatiMuhurt(srH, ssH)

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
      hora:           getHoras(srH, ssH, dow),
      choghadiya,
      doGhatiMuhurt,
    },
  }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' } })
}

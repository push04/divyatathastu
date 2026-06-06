import { createRequire } from 'module'
const _require = createRequire(import.meta.url)
// Force CJS entry point — Turbopack picks ESM otherwise, which crashes in production
const Astronomy = _require('astronomy-engine') as typeof import('astronomy-engine')

// ── Ayanamsa & Node helpers ──────────────────────────────────────────────────

/** Dynamic Lahiri (Chitrapaksha) ayanamsa from Julian Date TT.
 *  Reference: J2000.0 (JD 2451545.0) = 23.85°; rate ~50.3 arcsec/yr */
function getLahiriAyanamsa(jd: number): number {
  return 23.85 + (jd - 2451545.0) * (50.3 / 3600) / 365.25
}

/** Mean ascending lunar node (Rahu) in sidereal longitude.
 *  IAU formula. Ketu = Rahu + 180°. Rahu is always retrograde. */
function getMeanLunarNodes(jd: number, ayanamsa: number): { rahuLon: number; ketuLon: number } {
  const T = (jd - 2451545.0) / 36525
  const rahuTrop = ((125.0445479 - 1934.1362608 * T) % 360 + 360) % 360
  const rahuSid  = ((rahuTrop - ayanamsa) % 360 + 360) % 360
  return { rahuLon: rahuSid, ketuLon: (rahuSid + 180) % 360 }
}

/** UTC offset in hours for a given timezone + local date/time string.
 *  Returns positive for zones ahead of UTC (e.g. IST = +5.5). Falls back to IST. */
function getTimezoneOffsetHours(timezone: string, dateStr: string, timeStr: string): number {
  try {
    const [y, mo, d] = dateStr.split('-').map(Number)
    const [h, m]     = timeStr.split(':').map(Number)
    const utcDate = new Date(Date.UTC(y, mo - 1, d, h, m))
    const tzStr   = utcDate.toLocaleString('en-CA', {
      timeZone: timezone, year: 'numeric', month: '2-digit',
      day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    })
    const [datePart, timePart = '00:00'] = tzStr.replace(', ', ',').split(',')
    const [ty, tm, td] = datePart.split('-').map(Number)
    const [th, tmi]    = timePart.trim().split(':').map(Number)
    const tzDate = new Date(Date.UTC(ty, tm - 1, td, th, tmi))
    return (tzDate.getTime() - utcDate.getTime()) / 3600000
  } catch {
    return 5.5 // fallback to IST
  }
}

/** Parse 'HH:MM AM/PM' string to decimal hours */
function parseTimeStr(t: string): number {
  const [tm, ap] = t.trim().split(' ')
  const [h, m]   = tm.split(':').map(Number)
  let hr = h + m / 60
  if (ap?.toUpperCase() === 'PM' && h !== 12) hr += 12
  if (ap?.toUpperCase() === 'AM' && h === 12) hr = m / 60
  return hr
}

/** Format decimal hours to 'HH:MM AM/PM' */
function fmtHours(h: number): string {
  const t  = ((h % 24) + 24) % 24
  let hh   = Math.floor(t), mm = Math.round((t - hh) * 60)
  if (mm >= 60) { mm = 0; hh++ }
  hh = hh % 24
  const ap  = hh >= 12 ? 'PM' : 'AM'
  const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh
  return `${h12.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${ap}`
}

const RAHU_SEG_IDX = [7, 1, 6, 4, 5, 3, 2] // Sun=8th, Mon=2nd, Tue=7th... (0-based from sunrise)

export interface BirthData {
  date: string       // YYYY-MM-DD
  time: string       // HH:MM
  lat: number
  lng: number
  timezone: string   // e.g. Asia/Kolkata
}

export interface PlanetPosition {
  name: string
  rashi: string
  rashiNum: number
  degree: number
  nakshatra: string
  nakshatraNum: number
  pada: number
  retrograde: boolean
  house: number
}

export interface KundliData {
  ascendant: string
  ascendantDegree: number
  moonSign: string
  sunSign: string
  nakshatra: string
  nakshatraPada: number
  planets: PlanetPosition[]
  houses: number[]   // degree of cusp for each house
  dashaLord: string
  currentDasha: string
  currentAntardasha: string
}

const RASHIS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
const RASHIS_HI = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुंभ','मीन']
const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha',
  'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Moola','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha',
  'Purva Bhadrapada','Uttara Bhadrapada','Revati'
]
const NAKSHATRA_LORDS = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury']

const DASHA_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17
}

export function calculateKundli(birth: BirthData): KundliData {
  const [y, m, d] = birth.date.split('-').map(Number)
  const [hr, mn] = birth.time.split(':').map(Number)

  // Convert local time to UT using the birth timezone (not hardcoded IST)
  const tzOffset = getTimezoneOffsetHours(birth.timezone ?? 'Asia/Kolkata', birth.date, birth.time)
  const utHour = hr + mn / 60 - tzOffset
  const astroDate = new Astronomy.AstroTime(new Date(Date.UTC(y, m - 1, d, Math.floor(utHour), Math.round((utHour % 1) * 60))))

  const observer = new Astronomy.Observer(birth.lat, birth.lng, 0)

  // Compute planetary positions
  const bodies: Astronomy.Body[] = [
    Astronomy.Body.Sun, Astronomy.Body.Moon, Astronomy.Body.Mercury,
    Astronomy.Body.Venus, Astronomy.Body.Mars, Astronomy.Body.Jupiter,
    Astronomy.Body.Saturn
  ]

  const bodyNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu']

  const planets: PlanetPosition[] = []
  let moonLon = 0

  // astroDate.tt is days from J2000.0; getLahiriAyanamsa expects full JD (add 2451545)
  const jd = astroDate.tt + 2451545.0
  const ayanamsa = getLahiriAyanamsa(jd)

  for (const body of bodies) {
    try {
      const equatorial = Astronomy.Equator(body, astroDate, observer, false, true)
      const ecliptic = Astronomy.Ecliptic(equatorial.vec)
      const lon = ((ecliptic.elon - ayanamsa) % 360 + 360) % 360
      if (body === Astronomy.Body.Moon) moonLon = lon

      const rashiNum = Math.floor(lon / 30)
      const degree = lon % 30
      const nakshatraNum = Math.floor(lon / (360 / 27))
      const pada = Math.floor((lon % (360 / 27)) / (360 / 108)) + 1

      planets.push({
        name: body.toString().replace('Body.', ''),
        rashi: RASHIS[rashiNum],
        rashiNum,
        degree: Math.round(degree * 100) / 100,
        nakshatra: NAKSHATRAS[nakshatraNum],
        nakshatraNum,
        pada,
        retrograde: false, // simplified — retrograde calc needs multi-day comparison
        house: 0, // set after ascendant calc
      })
    } catch {
      // body calc failed, skip
    }
  }

  // Ascendant (Lagna)
  let ascDegree = 0
  try {
    const sidereal = Astronomy.SiderealTime(astroDate)
    const ramc = (sidereal * 15 + birth.lng) % 360
    const obliquity = 23.4397
    const latRad = birth.lat * Math.PI / 180
    const ramcRad = ramc * Math.PI / 180
    const oblRad = obliquity * Math.PI / 180
    const ascRad = Math.atan2(Math.cos(ramcRad), -(Math.sin(ramcRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad)))
    ascDegree = ((ascRad * 180 / Math.PI + 360 - ayanamsa) % 360 + 360) % 360
  } catch {
    ascDegree = 0
  }

  const ascRashiNum = Math.floor(ascDegree / 30)

  // Assign houses to planets
  planets.forEach(p => {
    p.house = ((p.rashiNum - ascRashiNum + 12) % 12) + 1
  })

  // Rahu/Ketu — mean lunar nodes (IAU formula). NOT Moon±180°, which is wrong.
  const { rahuLon, ketuLon } = getMeanLunarNodes(jd, ayanamsa)
  {
    const rahuRashi = Math.floor(rahuLon / 30)
    const ketuRashi = Math.floor(ketuLon / 30)
    planets.push({
      name: 'Rahu', rashi: RASHIS[rahuRashi], rashiNum: rahuRashi,
      degree: rahuLon % 30, nakshatra: NAKSHATRAS[Math.floor(rahuLon / (360/27))],
      nakshatraNum: Math.floor(rahuLon / (360/27)), pada: 1, retrograde: true,
      house: ((rahuRashi - ascRashiNum + 12) % 12) + 1
    })
    planets.push({
      name: 'Ketu', rashi: RASHIS[ketuRashi], rashiNum: ketuRashi,
      degree: ketuLon % 30, nakshatra: NAKSHATRAS[Math.floor(ketuLon / (360/27))],
      nakshatraNum: Math.floor(ketuLon / (360/27)), pada: 1, retrograde: true,
      house: ((ketuRashi - ascRashiNum + 12) % 12) + 1
    })
  }

  // Moon nakshatra for dasha
  const moonNakshatraNum = Math.floor(moonLon / (360 / 27))
  const moonNakshatra = NAKSHATRAS[moonNakshatraNum]
  const dashaLord = NAKSHATRA_LORDS[moonNakshatraNum]
  const { currentDasha, currentAntardasha } = calculateCurrentDasha(
    birth.date, moonLon, moonNakshatraNum, dashaLord
  )

  // House cusps (equal house system)
  const houses = Array.from({ length: 12 }, (_, i) => (ascDegree + i * 30) % 360)

  return {
    ascendant: RASHIS[ascRashiNum],
    ascendantDegree: Math.round(ascDegree * 100) / 100,
    moonSign: RASHIS[Math.floor(moonLon / 30)],
    sunSign: RASHIS[planets.find(p => p.name === 'Sun')?.rashiNum ?? 0],
    nakshatra: moonNakshatra,
    nakshatraPada: planets.find(p => p.name === 'Moon')?.pada ?? 1,
    planets,
    houses,
    dashaLord,
    currentDasha,
    currentAntardasha,
  }
}

function calculateCurrentDasha(dob: string, moonLon: number, moonNakNum: number, dashaLord: string) {
  const dashaOrder = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury']
  const lordIdx = dashaOrder.indexOf(dashaLord)

  // Fraction of nakshatra elapsed
  const nakshatraSpan = 360 / 27
  const posInNak = moonLon % nakshatraSpan
  const fractionElapsed = posInNak / nakshatraSpan
  const totalYears = DASHA_YEARS[dashaLord]
  const yearsElapsed = fractionElapsed * totalYears

  const dobDate = new Date(dob)
  const dashaStart = new Date(dobDate.getTime() - yearsElapsed * 365.25 * 86400000)
  const now = new Date()

  let elapsed = (now.getTime() - dashaStart.getTime()) / (365.25 * 86400000)
  let currentLordIdx = lordIdx

  while (elapsed > DASHA_YEARS[dashaOrder[currentLordIdx % 9]]) {
    elapsed -= DASHA_YEARS[dashaOrder[currentLordIdx % 9]]
    currentLordIdx++
  }

  const currentDasha = dashaOrder[currentLordIdx % 9]

  // Antardasha within current dasha
  const antarOrder = dashaOrder.slice(currentLordIdx % 9).concat(dashaOrder.slice(0, currentLordIdx % 9))
  const totalDashaYears = DASHA_YEARS[currentDasha]
  let antarElapsed = elapsed
  let antarIdx = 0
  for (const ant of antarOrder) {
    const antarDuration = (DASHA_YEARS[ant] / 120) * totalDashaYears
    if (antarElapsed <= antarDuration) break
    antarElapsed -= antarDuration
    antarIdx++
  }
  const currentAntardasha = antarOrder[antarIdx] || currentDasha

  return { currentDasha, currentAntardasha }
}

export function getPanchangForDate(date: string, lat: number, lng: number) {
  const [y, m, d] = date.split('-').map(Number)
  const astroDate = new Astronomy.AstroTime(new Date(Date.UTC(y, m - 1, d, 0, 0, 0)))
  const observer = new Astronomy.Observer(lat, lng, 0)

  let sunrise = '06:00 AM', sunset = '07:00 PM'
  try {
    const sr = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, astroDate, 1)
    const ss = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, astroDate, 1)
    if (sr) sunrise = formatTime(sr.date)
    if (ss) sunset = formatTime(ss.date)
  } catch {}

  // Moon longitude for tithi/nakshatra
  let moonLon = 0, sunLon = 0
  try {
    const moonEq = Astronomy.Equator(Astronomy.Body.Moon, astroDate, observer, false, true)
    const moonEcl = Astronomy.Ecliptic(moonEq.vec)
    const sunEq = Astronomy.Equator(Astronomy.Body.Sun, astroDate, observer, false, true)
    const sunEcl = Astronomy.Ecliptic(sunEq.vec)
    const panchangAyanamsa = getLahiriAyanamsa(astroDate.tt + 2451545.0)
    moonLon = ((moonEcl.elon - panchangAyanamsa + 360) % 360)
    sunLon = ((sunEcl.elon - panchangAyanamsa + 360) % 360)
  } catch {}

  const tithiNum = Math.floor(((moonLon - sunLon + 360) % 360) / 12)
  const TITHIS = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami',
    'Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima/Amavasya']

  const nakshatraNum = Math.floor(moonLon / (360 / 27))
  const YOGAS = ['Vishkamba','Preeti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti',
    'Shoola','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata',
    'Variyana','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti']
  const yogaNum = Math.floor((moonLon + sunLon) / (360 / 27)) % 27
  const KARANAS = ['Bava','Balava','Kaulava','Taitila','Garija','Vanija','Vishti','Shakuni','Chatushpada','Naga','Kimstughna']
  const karanaNum = Math.floor(((moonLon - sunLon + 360) % 360) / 6) % 11

  // Dynamic Rahu Kaal, Abhijit Muhurat, Brahma Muhurta from actual sunrise/sunset
  const dow    = new Date(date).getDay()
  const srH    = parseTimeStr(sunrise)
  const ssH    = parseTimeStr(sunset)
  const dayDur = ssH - srH
  const seg    = dayDur / 8
  const rahuStart = srH + RAHU_SEG_IDX[dow] * seg
  const noon      = (srH + ssH) / 2
  const mDur      = dayDur / 30  // half of 1/15th of day for Abhijit

  return {
    date,
    tithi: TITHIS[tithiNum % 15],
    tithiNum: tithiNum % 30,
    nakshatra: NAKSHATRAS[nakshatraNum],
    nakshatraNum,
    yoga: YOGAS[yogaNum],
    karana: KARANAS[karanaNum],
    sunrise,
    sunset,
    moonSign: RASHIS[Math.floor(moonLon / 30)],
    sunSign: RASHIS[Math.floor(sunLon / 30)],
    rahuKaal:       `${fmtHours(rahuStart)} – ${fmtHours(rahuStart + seg)}`,
    abhijitMuhurat: `${fmtHours(noon - mDur)} – ${fmtHours(noon + mDur)}`,
    brahmaHour:     `${fmtHours(srH - 1.6)} – ${fmtHours(srH - 0.8)}`,
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
  })
}

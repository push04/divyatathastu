import Astronomy from 'astronomy-engine'

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

  // Convert local time to UT (subtract IST offset 5:30 for India, approximate)
  const utHour = hr + mn / 60 - 5.5
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

  for (const body of bodies) {
    try {
      const equatorial = Astronomy.Equator(body, astroDate, observer, true, true)
      const ecliptic = Astronomy.Ecliptic(equatorial.vec)
      // Apply ayanamsa (Lahiri ~23.85 degrees for 2025)
      const ayanamsa = 23.85
      let lon = ((ecliptic.elon - ayanamsa) % 360 + 360) % 360
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
    const ayanamsa = 23.85
    ascDegree = ((ascRad * 180 / Math.PI + 360 - ayanamsa) % 360 + 360) % 360
  } catch {
    ascDegree = 0
  }

  const ascRashiNum = Math.floor(ascDegree / 30)

  // Assign houses to planets
  planets.forEach(p => {
    p.house = ((p.rashiNum - ascRashiNum + 12) % 12) + 1
  })

  // Rahu/Ketu (mean nodes — Rahu opposite Ketu)
  const moonPlanet = planets.find(p => p.name === 'Moon')
  if (moonPlanet) {
    const rahuLon = (moonLon + 180) % 360
    const ketuLon = moonLon
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
    const moonEq = Astronomy.Equator(Astronomy.Body.Moon, astroDate, observer, true, true)
    const moonEcl = Astronomy.Ecliptic(moonEq.vec)
    const sunEq = Astronomy.Equator(Astronomy.Body.Sun, astroDate, observer, true, true)
    const sunEcl = Astronomy.Ecliptic(sunEq.vec)
    const ayanamsa = 23.85
    moonLon = ((moonEcl.elon - ayanamsa + 360) % 360)
    sunLon = ((sunEcl.elon - ayanamsa + 360) % 360)
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
    rahuKaal: getRahuKaal(new Date(date).getDay()),
    abhijitMuhurat: '11:48 AM - 12:36 PM',
    brahmaHour: '04:30 AM - 06:00 AM',
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
  })
}

function getRahuKaal(day: number): string {
  const slots = ['09:00-10:30','07:30-09:00','12:00-13:30','10:30-12:00','07:30-09:00','10:30-12:00','15:00-16:30']
  return slots[day] || '08:00-09:30'
}

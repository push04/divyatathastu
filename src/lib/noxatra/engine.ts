import { calculateKundli, BirthData } from './astrology'
import { calculateNumerology, calculateMobileNumber } from './numerology'
import { calculateChakras } from './chakra'
import { calculatePrakriti } from './prakriti'
import { calculateYantraColour } from './yantra'
import { calculateMantraGuidance } from './mantra'
import type { ReportType } from '@/types/database.types'

export interface FamilyMemberData {
  id: string
  full_name: string
  date_of_birth: string
  time_of_birth: string | null
  place_of_birth: string
  birth_latitude: number | null
  birth_longitude: number | null
  birth_timezone: string | null
  gender: string | null
  mobile_number: string | null
}

export async function generateReportData(
  member: FamilyMemberData,
  reportType: ReportType,
  vastu?: { homeDirection: string; sleepDirection: string }
): Promise<Record<string, unknown>> {
  const lat = member.birth_latitude ?? 28.6139
  const lng = member.birth_longitude ?? 77.2090
  const time = member.time_of_birth ?? '12:00'

  const birthData: BirthData = {
    date: member.date_of_birth,
    time,
    lat,
    lng,
    timezone: member.birth_timezone ?? 'Asia/Kolkata',
  }

  let kundli
  try {
    kundli = calculateKundli(birthData)
  } catch {
    kundli = getFallbackKundli(member.date_of_birth)
  }

  switch (reportType) {
    case 'astrology':
      return {
        member: { name: member.full_name, dob: member.date_of_birth, pob: member.place_of_birth },
        kundli,
        analysis: getAstrologyAnalysis(kundli),
      }

    case 'numerology': {
      const num = calculateNumerology(member.full_name, member.date_of_birth)
      return { member: { name: member.full_name, dob: member.date_of_birth }, numerology: num }
    }

    case 'mobile_number': {
      if (!member.mobile_number) return { error: 'No mobile number provided' }
      const num = calculateNumerology(member.full_name, member.date_of_birth)
      const mobile = calculateMobileNumber(member.mobile_number, num.lifePathNumber)
      return { member: { name: member.full_name }, mobile, lifePath: num.lifePathNumber }
    }

    case 'shakti_chakra': {
      const chakras = calculateChakras(kundli.nakshatra, kundli.planets)
      return {
        member: { name: member.full_name, nakshatra: kundli.nakshatra },
        chakras,
        overallBalance: Math.round(chakras.reduce((s, c) => s + c.level, 0) / chakras.length),
      }
    }

    case 'prakriti': {
      const birthDate = new Date(member.date_of_birth)
      const month = birthDate.getMonth()
      const season = month >= 3 && month <= 5 ? 'summer' : month >= 6 && month <= 8 ? 'monsoon' : 'winter'
      const prakriti = calculatePrakriti(kundli.nakshatra, season)
      return { member: { name: member.full_name }, prakriti }
    }

    case 'yantra_colour': {
      const yantra = calculateYantraColour(kundli.moonSign, kundli.ascendant, kundli.nakshatra)
      return { member: { name: member.full_name }, yantra }
    }

    case 'mantra_chanting':
    case 'mantra_writing': {
      const mantras = calculateMantraGuidance(kundli.dashaLord, kundli.nakshatra, kundli.ascendant, kundli.moonSign, kundli.nakshatraPada)
      return { member: { name: member.full_name }, mantras, type: reportType }
    }

    case 'astro_vastu': {
      const vastuData = generateVastuAnalysis(kundli, vastu)
      return { member: { name: member.full_name }, vastu: vastuData, kundli: { ascendant: kundli.ascendant, moonSign: kundli.moonSign } }
    }

    case 'psychology': {
      const psych = generatePsychologyReport(kundli)
      return { member: { name: member.full_name, gender: member.gender }, psychology: psych }
    }

    case 'dmit': {
      const dmit = generateDmitReport(kundli, member.date_of_birth)
      return { member: { name: member.full_name }, dmit }
    }

    case 'colour_therapy': {
      const colours = generateColourTherapy(kundli)
      return { member: { name: member.full_name }, colourTherapy: colours }
    }

    case 'child_development': {
      const dob = new Date(member.date_of_birth)
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 86400000))
      if (age >= 18) return { error: 'Child development report only for members under 18' }
      const child = generateChildDevelopmentReport(kundli, age, member.gender)
      return { member: { name: member.full_name, age, gender: member.gender }, childDevelopment: child }
    }

    case 'full_tathastu': {
      const vastuInput = vastu
      const [numerology, chakras, prakriti, yantra, mantras, psychology, vastuResult, dmit, colours] = await Promise.all([
        Promise.resolve(calculateNumerology(member.full_name, member.date_of_birth)),
        Promise.resolve(calculateChakras(kundli.nakshatra, kundli.planets)),
        Promise.resolve(calculatePrakriti(kundli.nakshatra)),
        Promise.resolve(calculateYantraColour(kundli.moonSign, kundli.ascendant, kundli.nakshatra)),
        Promise.resolve(calculateMantraGuidance(kundli.dashaLord, kundli.nakshatra, kundli.ascendant, kundli.moonSign, kundli.nakshatraPada)),
        Promise.resolve(generatePsychologyReport(kundli)),
        Promise.resolve(generateVastuAnalysis(kundli, vastuInput)),
        Promise.resolve(generateDmitReport(kundli, member.date_of_birth)),
        Promise.resolve(generateColourTherapy(kundli)),
      ])
      return {
        member,
        kundli,
        numerology,
        chakras,
        prakriti,
        yantra,
        mantras,
        psychology,
        vastuAnalysis: vastuResult,
        dmit,
        colourTherapy: colours,
        annualPrediction: generateAnnualPrediction(kundli),
        muhurta: generateMuhurtaGuide(kundli, numerology),
        remediesSummary: generateRemediesSummary(kundli, numerology),
      }
    }

    default:
      return { error: `Unknown report type: ${reportType}` }
  }
}

// Pure date-math fallback — used when astronomy-engine fails (edge dates, memory constraints, etc.)
// Positions are approximate (~1-2° accuracy), sufficient for all non-astronomy report types.
function getFallbackKundli(dob: string): ReturnType<typeof calculateKundli> {
  const RASHIS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
  const NAKSHATRAS = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha',
    'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
    'Moola','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati']
  const NAKSHATRA_LORDS = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
    'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
    'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury']
  const DASHA_ORDER = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury']
  const DASHA_YEARS: Record<string, number> = {Ketu:7,Venus:20,Sun:6,Moon:10,Mars:7,Rahu:18,Jupiter:16,Saturn:19,Mercury:17}

  // Days since J2000.0 (Jan 1.5 2000 UT)
  const [y, mo, d] = dob.split('-').map(Number)
  const j2000 = (Date.UTC(y, mo-1, d) - Date.UTC(2000, 0, 1)) / 86400000

  // Lahiri ayanamsa ≈ 23.85° + 0.0137°/yr since J2000
  const ayanamsa = 23.85 + (j2000 / 365.25) * 0.0137

  // Mean Sun sidereal longitude
  const sunSid = ((280.46 + 0.9856474 * j2000 - ayanamsa) % 360 + 360) % 360
  // Mean Moon sidereal longitude (13.176°/day from epoch)
  const moonSid = ((218.316 + 13.176396 * j2000 - ayanamsa) % 360 + 360) % 360
  // Mean Rahu (retrograde ~0.053°/day)
  const rahuSid = ((125.0445 - 0.0529539 * j2000 - ayanamsa) % 360 + 360) % 360
  const ketuSid = (rahuSid + 180) % 360

  const moonNakNum   = Math.floor(moonSid / (360/27)) % 27
  const moonPada     = Math.floor((moonSid % (360/27)) / (360/108)) + 1
  const dashaLord    = NAKSHATRA_LORDS[moonNakNum]
  const lordIdx      = DASHA_ORDER.indexOf(dashaLord)

  // Approximate current dasha from elapsed time since dasha start
  const nakshatraSpan = 360 / 27
  const fracElapsed   = (moonSid % nakshatraSpan) / nakshatraSpan
  const dashaStartYr  = y - fracElapsed * DASHA_YEARS[dashaLord]
  let elapsed = y + (mo-1)/12 + d/365 - dashaStartYr
  let cidx = lordIdx
  while (elapsed > DASHA_YEARS[DASHA_ORDER[cidx % 9]]) {
    elapsed -= DASHA_YEARS[DASHA_ORDER[cidx % 9]]
    cidx++
  }
  const currentDasha      = DASHA_ORDER[cidx % 9]
  const currentAntardasha = DASHA_ORDER[(cidx + 1) % 9]

  // Approximate other planets from mean orbital periods
  const toSid = (lon: number) => ((lon - ayanamsa) % 360 + 360) % 360
  const planetLons: Record<string, number> = {
    Mercury: toSid((280.46 + 1.6021302 * j2000) % 360),
    Venus:   toSid((212.28  + 1.6021302 * j2000 / 1.625) % 360),
    Mars:    toSid((355.45  + 0.5240208 * j2000) % 360),
    Jupiter: toSid((34.35   + 0.0831294 * j2000) % 360),
    Saturn:  toSid((50.08   + 0.0334597 * j2000) % 360),
  }

  const sunRashiNum = Math.floor(sunSid / 30) % 12
  const makePlanet = (name: string, lon: number, retro = false) => {
    const rashiNum = Math.floor(lon / 30) % 12
    const nakNum   = Math.floor(lon / (360/27)) % 27
    return {
      name, rashi: RASHIS[rashiNum], rashiNum,
      degree: Math.round((lon % 30) * 100) / 100,
      nakshatra: NAKSHATRAS[nakNum], nakshatraNum: nakNum,
      pada: Math.floor((lon % (360/27)) / (360/108)) + 1,
      retrograde: retro,
      house: ((rashiNum - sunRashiNum + 12) % 12) + 1,
    }
  }

  const planets = [
    makePlanet('Sun',     sunSid),
    makePlanet('Moon',    moonSid),
    ...Object.entries(planetLons).map(([n, l]) => makePlanet(n, l)),
    makePlanet('Rahu',    rahuSid, true),
    makePlanet('Ketu',    ketuSid, true),
  ]

  return {
    ascendant: RASHIS[sunRashiNum],
    ascendantDegree: Math.round((sunSid % 30) * 100) / 100,
    moonSign:  RASHIS[Math.floor(moonSid / 30) % 12],
    sunSign:   RASHIS[sunRashiNum],
    nakshatra: NAKSHATRAS[moonNakNum],
    nakshatraPada: moonPada,
    planets,
    houses: Array.from({ length: 12 }, (_, i) => (sunSid + i * 30) % 360),
    dashaLord,
    currentDasha,
    currentAntardasha,
  }
}

function getAstrologyAnalysis(kundli: ReturnType<typeof calculateKundli>) {
  return {
    summary: `With ${kundli.ascendant} Lagna and ${kundli.moonSign} Moon sign, the native has a unique combination of energies. The birth Nakshatra is ${kundli.nakshatra}, which gives specific qualities and tendencies.`,
    currentPhase: `Currently running ${kundli.currentDasha} Mahadasha with ${kundli.currentAntardasha} Antardasha. This period highlights themes of ${getDashaThemes(kundli.currentDasha)}. The ${kundli.currentAntardasha} Antardasha within this Mahadasha amplifies ${getDashaThemes(kundli.currentAntardasha)}.`,
    nakshatraProfile: getNakshatraProfile(kundli.nakshatra),
    career: getCareerFromChart(kundli),
    marriage: getMarriageFromChart(kundli),
    health: getHealthFromChart(kundli),
    finance: getFinanceFromChart(kundli),
    yogas: detectYogas(kundli),
    houseThemes: getHouseThemes(kundli),
    remedies: getGeneralRemedies(kundli),
  }
}

function getNakshatraProfile(nakshatra: string): string {
  const profiles: Record<string, string> = {
    Ashwini: 'Ashwini natives are swift, healing, and pioneering. Governed by the Ashwini Kumars (divine physicians), you have natural healing abilities and a love of speed and innovation. Your initiating energy makes you a trailblazer who launches projects with great enthusiasm.',
    Bharani: 'Bharani nakshatra carries the energy of Yama (lord of dharma and death). You deal with themes of transformation, sexuality, creativity, and strong will. You are deeply creative and have the capacity to hold great responsibility.',
    Krittika: 'Ruled by Agni (fire), Krittika natives are sharp, precise, and purifying. You have a strong sense of right and wrong, cutting through illusion like a flame. Your determination and critical thinking are your greatest assets.',
    Rohini: 'Rohini is the most beloved nakshatra of the Moon. You are fertile, creative, sensually aware, and artistic. Ruled by Brahma, you have the power to create beauty in any domain. Material comfort and aesthetic refinement are natural to you.',
    Mrigashira: 'Mrigashira, the searching star, makes you ever-curious and seekin. Like a deer, you are gentle, restless, and on a perpetual quest for something finer. Ruled by Mars with Soma energy, you have a poetic, romantic nature combined with quick intelligence.',
    Ardra: 'Ardra, the stormy star of Rudra, brings intensity, emotional depth, and transformation. You experience life deeply and are capable of profound grief and profound joy. Your trials forge extraordinary resilience and inner power.',
    Punarvasu: 'Punarvasu means "return of the light." You are naturally optimistic, wise, and spiritually inclined. Ruled by Jupiter and Aditi (goddess of infinity), you have a philosophical mind and the ability to bounce back from hardship.',
    Pushya: 'Pushya is the most auspicious nakshatra, ruled by Saturn and the deity Brihaspati (Jupiter). You are nurturing, protective, and spiritually giving. You have a natural wisdom about caring for others and community.',
    Ashlesha: 'Ashlesha is the serpent star, associated with kundalini energy, deep psychology, and penetrating intelligence. You can see through facades and have strong healing or harming potential — your intensity must be channeled wisely.',
    Magha: 'Magha, the ancestral star, is ruled by the Pitrs (ancestors). You carry strong lineage karma and have natural authority, leadership, and pride. Royal qualities, ambition, and a strong sense of tradition define you.',
    'Purva Phalguni': 'Purva Phalguni is the star of rest and pleasure, governed by Bhaga. You are affectionate, creative, and enjoy the finer things in life. This nakshatra favors partnerships, artistic pursuits, and sensual pleasures.',
    'Uttara Phalguni': 'Uttara Phalguni is the star of patronage, ruled by Aryaman. You are generous, noble, and have strong leadership combined with warmth. You thrive in partnership and have genuine care for your community.',
    Hasta: 'Hasta, the star of skilled hands, is ruled by the Sun and deity Savitru. You have extraordinary manual dexterity, healing hands, and a quick, witty mind. Humor and practicality are your gifts.',
    Chitra: 'Chitra, the brilliant star of Vishwakarma (cosmic architect), makes you deeply aesthetic, creative, and drawn to design and beauty. You have a jewel-like quality that draws attention, and your sense of form is exceptional.',
    Swati: 'Swati, the independent star, is governed by Vayu (wind). Like a lone blade of grass bending in a storm, you are adaptable, diplomatic, and truly free-spirited. Commerce, music, and the arts suit your temperament.',
    Vishakha: 'Vishakha, the star of purpose, is ruled by Jupiter and Indra-Agni. You have immense determination, the ability to focus on long-term goals, and transformative power. You are a seeker of peak experiences.',
    Anuradha: 'Anuradha is the star of devotion and friendship, ruled by Saturn and Mitra. You have an extraordinary capacity for deep, loyal bonds and can inspire groups with your genuine warmth and organizational ability.',
    Jyeshtha: 'Jyeshtha, the eldest star of Indra, grants authority, seniority, and the ability to handle power. You have natural leadership and are drawn to positions of responsibility. Your protective instincts are strong.',
    Moola: 'Moola, the root star, governed by Nirrti and Ketu, strips away the non-essential. You are drawn to extremes and have the power to go to the very core of any matter. Spiritual depth and destructive-reconstructive power define you.',
    'Purva Ashadha': 'Purva Ashadha, the invincible star of Apah (water goddess), makes you vigorous, persuasive, and unstoppable once committed. You have strong opinions and the gift of inspiring others through your conviction.',
    'Uttara Ashadha': 'Uttara Ashadha, the universal star of Vishvadevas, blesses you with patience, integrity, and the ability to achieve lasting victories. Your success comes through righteousness and genuine contribution.',
    Shravana: 'Shravana, the listening star of Vishnu, gives you extraordinary powers of receptivity, learning, and communication. You hear what others miss and have a gift for connecting people and preserving wisdom.',
    Dhanishtha: 'Dhanishtha, the wealthy star of the eight Vasus, bestows material abundance, musical talent, and community leadership. You have natural charisma and the ability to create prosperity around you.',
    Shatabhisha: 'Shatabhisha, the healing star of Varuna, makes you a solitary mystic, healer, and truth-seeker. You have strong intuition, healing abilities, and a philosophical nature that seeks universal laws.',
    'Purva Bhadrapada': 'Purva Bhadrapada, ruled by Jupiter and Aja Ekapada, is the fierce, passionate star of transformation. You are intense, idealistic, and capable of tremendous inner fire for a cause you believe in.',
    'Uttara Bhadrapada': 'Uttara Bhadrapada, the deep star of Ahirbudhnya, gives you profound wisdom, depth of feeling, and spiritual power. You carry great patience and the serpentine kundalini force for awakening.',
    Revati: 'Revati, the final nakshatra of Pushan, blesses you with a gentle, nourishing, and protective nature. You are a guardian of others, deeply spiritual, and have a luminous inner world that others find healing.',
  }
  return profiles[nakshatra] || `${nakshatra} nakshatra grants unique qualities of perception, purpose, and spiritual direction that shape your fundamental nature and karmic path.`
}

function detectYogas(kundli: ReturnType<typeof calculateKundli>) {
  const yogas: Array<{ name: string; description: string }> = []
  const planets = kundli.planets || []

  const getPlanet = (name: string) => planets.find(p => p.name === name)
  const jupiter = getPlanet('Jupiter')
  const moon = getPlanet('Moon')
  const sun = getPlanet('Sun')
  const mercury = getPlanet('Mercury')
  const venus = getPlanet('Venus')
  const mars = getPlanet('Mars')
  const saturn = getPlanet('Saturn')

  // Gaj Kesari Yoga: Jupiter in 1, 4, 7, or 10 from Moon
  if (jupiter && moon) {
    const diff = Math.abs(jupiter.house - moon.house)
    if ([1, 4, 7, 10].includes(diff) || [0, 3, 6, 9].includes(diff)) {
      yogas.push({ name: 'Gaj Kesari Yoga', description: 'Jupiter in a kendra from Moon — bestows wisdom, fame, prosperity, and noble character. This yoga elevates the native to positions of respect and ensures long-lasting reputation.' })
    }
  }

  // Budha-Aditya Yoga: Sun and Mercury conjunct
  if (sun && mercury && sun.house === mercury.house) {
    yogas.push({ name: 'Budha-Aditya Yoga', description: 'Sun and Mercury in the same house — grants sharp intellect, communication skills, recognition in education or business, and a brilliant analytical mind.' })
  }

  // Chandra-Mangal Yoga: Moon and Mars conjunct or in 7th from each other
  if (moon && mars && (moon.house === mars.house || Math.abs(moon.house - mars.house) === 6)) {
    yogas.push({ name: 'Chandra-Mangal Yoga', description: 'Moon and Mars in combination — creates financial acumen, entrepreneurial spirit, and strong drive. The native earns through initiative and has a bold, action-oriented emotional nature.' })
  }

  // Lakshmi Yoga: Venus in own sign or exaltation in kendra/trikona from ascendant
  if (venus && [1, 4, 5, 7, 9, 10].includes(venus.house)) {
    const venusExalted = venus.rashi === 'Pisces'
    const venusOwn = ['Taurus', 'Libra'].includes(venus.rashi)
    if (venusExalted || venusOwn) {
      yogas.push({ name: 'Lakshmi Yoga', description: 'Venus strongly placed in a key house — bestows material abundance, artistic talent, beautiful relationships, and a life of refinement and prosperity.' })
    }
  }

  // Shasha Yoga: Saturn in own sign or exaltation in kendra
  if (saturn && [1, 4, 7, 10].includes(saturn.house)) {
    const saturnOwn = ['Capricorn', 'Aquarius'].includes(saturn.rashi)
    const saturnExalted = saturn.rashi === 'Libra'
    if (saturnOwn || saturnExalted) {
      yogas.push({ name: 'Shasha Yoga (Panch Mahapurusha)', description: 'Saturn strongly placed in a kendra in own or exalted sign — grants exceptional discipline, organizational mastery, longevity, and the ability to achieve through sustained effort.' })
    }
  }

  // Ruchaka Yoga: Mars in own/exalt in kendra
  if (mars && [1, 4, 7, 10].includes(mars.house)) {
    const marsOwn = ['Aries', 'Scorpio'].includes(mars.rashi)
    const marsExalted = mars.rashi === 'Capricorn'
    if (marsOwn || marsExalted) {
      yogas.push({ name: 'Ruchaka Yoga (Panch Mahapurusha)', description: 'Mars powerfully placed — blesses with extraordinary physical strength, courage, leadership in military or competitive fields, and a pioneering spirit that overcomes all obstacles.' })
    }
  }

  // Hamsa Yoga: Jupiter in own/exalt in kendra
  if (jupiter && [1, 4, 7, 10].includes(jupiter.house)) {
    const jupOwn = ['Sagittarius', 'Pisces'].includes(jupiter.rashi)
    const jupExalted = jupiter.rashi === 'Cancer'
    if (jupOwn || jupExalted) {
      yogas.push({ name: 'Hamsa Yoga (Panch Mahapurusha)', description: 'Jupiter magnificently placed — bestows wisdom, spirituality, higher education success, ethical leadership, and a life path aligned with dharma and higher truth.' })
    }
  }

  // Dharma-Karma Adhipati Yoga: lords of 9th and 10th in conjunction
  if (yogas.length === 0) {
    // Generic positive yoga based on benefics in trines
    const benefics = [jupiter, venus, mercury].filter(Boolean)
    const beneficsInTrines = benefics.filter(p => p && [1, 5, 9].includes(p.house))
    if (beneficsInTrines.length >= 2) {
      yogas.push({ name: 'Dharma Yoga', description: `Multiple benefic planets in trines (houses 1, 5, 9) create a dharmic pattern supporting spiritual growth, good fortune, and meaningful life purpose.` })
    }
  }

  return yogas.slice(0, 4)
}

function getHouseThemes(kundli: ReturnType<typeof calculateKundli>): Array<{ house: string; insight: string }> {
  const planets = kundli.planets || []
  const themes: Array<{ house: string; insight: string }> = []
  const houseOccupants: Record<number, string[]> = {}

  planets.forEach(p => {
    if (!houseOccupants[p.house]) houseOccupants[p.house] = []
    houseOccupants[p.house].push(p.name)
  })

  const HOUSE_MEANINGS: Record<number, string> = {
    1: 'Self, personality, health & appearance',
    2: 'Wealth, family, speech & values',
    3: 'Siblings, courage, communication & short journeys',
    4: 'Mother, home, happiness & vehicles',
    5: 'Intelligence, children, creativity & past merit',
    6: 'Enemies, health challenges, service & debt',
    7: 'Marriage, partnerships, public image & business',
    8: 'Longevity, transformation, occult & inheritance',
    9: 'Fortune, dharma, father, spirituality & long journeys',
    10: 'Career, status, government, authority & public life',
    11: 'Gains, elder siblings, aspirations & social network',
    12: 'Moksha, foreign lands, losses, spirituality & isolation',
  }

  const PLANET_HOUSE_EFFECTS: Record<string, Record<number, string>> = {
    Sun: { 1: 'strong vitality and leadership', 5: 'creative intelligence', 9: 'spiritual authority', 10: 'career prominence' },
    Moon: { 1: 'emotional sensitivity', 4: 'domestic happiness', 7: 'emotionally connected partnerships', 10: 'career fluctuations' },
    Jupiter: { 1: 'wisdom and generosity', 5: 'exceptional intelligence', 9: 'profound spirituality', 11: 'abundant gains' },
    Venus: { 1: 'natural charm', 4: 'beautiful home', 7: 'romantic fulfillment', 11: 'financial gains through creativity' },
    Mars: { 1: 'courage and drive', 3: 'bold communication', 10: 'ambitious career', 8: 'interest in the occult' },
    Saturn: { 7: 'delayed but stable marriage', 10: 'career built through hard work', 3: 'disciplined communication' },
    Mercury: { 1: 'analytical intelligence', 3: 'excellent communication', 7: 'intellectual partnerships' },
    Rahu: { 1: 'unusual personality', 7: 'unconventional partnerships', 10: 'sudden career rise', 11: 'extraordinary gains' },
    Ketu: { 1: 'mystical nature', 5: 'past-life creative gifts', 9: 'deep spiritual seeking', 12: 'moksha path' },
  }

  for (const [houseStr, occupants] of Object.entries(houseOccupants)) {
    const house = parseInt(houseStr)
    if (occupants.length > 0) {
      const effects = occupants.map(p => PLANET_HOUSE_EFFECTS[p]?.[house]).filter(Boolean)
      const insight = effects.length > 0
        ? `${occupants.join(', ')} here brings ${effects.join(' and ')} (${HOUSE_MEANINGS[house]})`
        : `${occupants.join(', ')} activates the themes of ${HOUSE_MEANINGS[house]}`
      themes.push({ house: `House ${house}`, insight })
    }
  }

  return themes.slice(0, 8)
}

function getDashaThemes(lord: string): string {
  const themes: Record<string, string> = {
    Sun: 'authority, self-expression, and career advancement',
    Moon: 'emotions, family, travel, and inner growth',
    Mars: 'action, property, courage, and new beginnings',
    Rahu: 'transformation, foreign connections, technology, and sudden changes',
    Jupiter: 'wisdom, expansion, marriage, children, and spiritual growth',
    Saturn: 'discipline, karma, delays, and long-term building',
    Mercury: 'communication, business, education, and short travels',
    Ketu: 'spirituality, detachment, past karma, and inner searching',
    Venus: 'relationships, luxury, art, and material comforts',
  }
  return themes[lord] || 'personal growth and transformation'
}

function getCareerFromChart(kundli: any): string {
  const signCareer: Record<string, string> = {
    Aries: 'military, police, surgery, sports, engineering',
    Taurus: 'banking, agriculture, arts, luxury goods, hospitality',
    Gemini: 'media, communications, teaching, writing, IT',
    Cancer: 'nursing, real estate, food, psychology, government',
    Leo: 'politics, entertainment, management, jewelry, medicine',
    Virgo: 'accounting, analysis, health, service, research',
    Libra: 'law, diplomacy, design, media, fashion',
    Scorpio: 'research, occult, investigation, insurance, surgery',
    Sagittarius: 'teaching, religion, law, travel, sports',
    Capricorn: 'administration, government, engineering, mining, real estate',
    Aquarius: 'technology, social work, innovation, aviation, research',
    Pisces: 'spirituality, healing, arts, media, charitable work',
  }
  return `Based on your ${kundli.ascendant} ascendant, favorable career fields include: ${signCareer[kundli.ascendant] || 'varied professional paths'}.`
}

function getMarriageFromChart(kundli: any): string {
  return `The 7th house from your ${kundli.ascendant} Lagna indicates marriage partnerships. The current ${kundli.currentDasha} Dasha period ${['Sun','Mars','Ketu'].includes(kundli.currentDasha) ? 'suggests focusing on inner development before major relationship commitments' : 'is generally favorable for deepening relationships and marriage'}.`
}

function getHealthFromChart(kundli: any): string {
  const signs: Record<string, string> = {
    Aries: 'Head, brain, and eyes need attention', Taurus: 'Throat, neck, and thyroid',
    Gemini: 'Lungs, shoulders, and nervous system', Cancer: 'Stomach and digestive system',
    Leo: 'Heart and spine', Virgo: 'Intestines and digestion', Libra: 'Kidneys and lower back',
    Scorpio: 'Reproductive and elimination systems', Sagittarius: 'Liver, hips, and thighs',
    Capricorn: 'Knees, bones, and joints', Aquarius: 'Ankles and circulatory system',
    Pisces: 'Feet and lymphatic system',
  }
  return `${signs[kundli.ascendant] || 'General health awareness'} requires special attention for your chart. Maintain regular routine and avoid overexertion during Mars or Saturn periods.`
}

function getFinanceFromChart(kundli: any): string {
  const favorable = ['Venus','Jupiter','Mercury'].includes(kundli.currentDasha)
  return favorable
    ? `The current ${kundli.currentDasha} Dasha is generally favorable for financial growth and prosperity. Investment in ${kundli.currentDasha === 'Venus' ? 'luxury, beauty, or real estate' : kundli.currentDasha === 'Jupiter' ? 'education, gold, or long-term instruments' : 'business, communication, or technology'} can yield good returns.`
    : `The current ${kundli.currentDasha} Dasha requires careful financial planning. Avoid risky investments and focus on saving and debt reduction.`
}

function getGeneralRemedies(kundli: any): string[] {
  const remedies: Record<string, string[]> = {
    Sun: ['Offer water to Sun daily at sunrise', 'Wear Ruby or Red Garnet', 'Chant Aditya Hridayam', 'Donate wheat on Sundays'],
    Moon: ['Chant Om Namah Shivaya 108 times daily', 'Wear Pearl', 'Offer milk to Shivalinga on Mondays', 'Keep fast on Mondays'],
    Mars: ['Chant Hanuman Chalisa daily', 'Donate red lentils on Tuesdays', 'Wear Red Coral', 'Visit Hanuman temple on Tuesdays'],
    Rahu: ['Chant Rahu beej mantra', 'Donate blue cloth on Saturdays', 'Feed stray dogs', 'Wear Hessonite Garnet'],
    Jupiter: ['Chant Guru beej mantra', 'Donate yellow items on Thursdays', 'Wear Yellow Sapphire', 'Respect teachers and elders'],
    Saturn: ['Chant Shani beej mantra', 'Light sesame oil lamp on Saturdays', 'Donate black sesame', 'Wear Blue Sapphire'],
    Mercury: ['Chant Budha beej mantra', 'Donate green vegetables on Wednesdays', 'Wear Emerald', 'Feed parrots'],
    Ketu: ['Chant Ganesha mantra daily', 'Donate mixed grains on Tuesdays', 'Wear Cat Eye', 'Meditate regularly'],
    Venus: ['Chant Lakshmi mantra', 'Donate white items on Fridays', 'Wear Diamond or White Sapphire', 'Offer white flowers to Goddess Lakshmi'],
  }
  return remedies[kundli.dashaLord] || ['Regular meditation', 'Charitable giving', 'Maintain honesty in all dealings']
}

function generateVastuAnalysis(kundli: any, vastu?: { homeDirection: string; sleepDirection: string }) {
  const DIRECTION_PLANET: Record<string, string> = {
    North: 'Mercury', NE: 'Jupiter', East: 'Sun', SE: 'Venus',
    South: 'Mars', SW: 'Rahu', West: 'Saturn', NW: 'Moon',
  }
  const lordPlanet = kundli.dashaLord
  const powerDirections = Object.entries(DIRECTION_PLANET)
    .filter(([, planet]) => planet === lordPlanet)
    .map(([dir]) => dir)

  return {
    currentDashaLord: lordPlanet,
    powerDirections: powerDirections.length ? powerDirections : ['East', 'North'],
    entrance: getEntranceRecommendation(kundli.ascendant),
    bedroom: getBedroomDirection(kundli.moonSign),
    studyRoom: getStudyDirection(kundli),
    kitchen: 'South-East (Agni corner) is ideal for kitchen placement',
    prayerRoom: getPrayerDirection(kundli.dashaLord),
    colors: getVastuColors(kundli.ascendant),
    plants: getVastuPlants(lordPlanet),
    remedies: getVastuRemedies(kundli),
  }
}

function getEntranceRecommendation(ascendant: string): string {
  const map: Record<string, string> = {
    Aries: 'East or North entrance is most favorable', Taurus: 'North or East entrance brings prosperity',
    Gemini: 'North entrance supports communication and growth', Cancer: 'North-East entrance for spiritual and financial growth',
    Leo: 'East entrance for fame and authority', Virgo: 'North entrance for health and wealth',
    Libra: 'East or North entrance for balanced energy', Scorpio: 'North-West entrance for transformation',
    Sagittarius: 'North-East entrance for wisdom and expansion', Capricorn: 'West or South entrance for stability',
    Aquarius: 'West entrance for innovation and technology', Pisces: 'North-East entrance for spiritual depth',
  }
  return map[ascendant] || 'East or North entrance is generally favorable'
}

function getBedroomDirection(moonSign: string): string {
  const map: Record<string, string> = {
    Cancer: 'South-West bedroom with head pointing South',
    Scorpio: 'South bedroom, avoid North direction while sleeping',
    Pisces: 'South-West bedroom for emotional stability',
    default: 'South-West bedroom with head pointing South or East for best sleep quality',
  }
  return map[moonSign] || map.default
}

function getStudyDirection(kundli: any): string {
  return `For ${kundli.ascendant} Lagna, the ideal study direction is East or North-East. Place the desk so you face East while studying. Keep a Saraswati idol or image in the North-East corner of the study room.`
}

function getPrayerDirection(lord: string): string {
  const map: Record<string, string> = {
    Sun: 'East-facing prayer room with gold/saffron decor', Moon: 'North-West prayer room with white/silver decor',
    Jupiter: 'North-East prayer room with yellow/gold decor', Venus: 'South-East prayer room with white/pink decor',
    default: 'North-East corner of the house is ideal for the prayer room',
  }
  return map[lord] || map.default
}

function getVastuColors(ascendant: string): Record<string, string> {
  const map: Record<string, Record<string, string>> = {
    Aries: { livingRoom: 'Warm white or cream', bedroom: 'Light pink or peach', study: 'Light yellow' },
    Leo: { livingRoom: 'Golden yellow or warm white', bedroom: 'Orange or peach', study: 'Golden' },
    Sagittarius: { livingRoom: 'Light yellow or cream', bedroom: 'Blue-green', study: 'Yellow' },
    Taurus: { livingRoom: 'Light green or white', bedroom: 'Pink or cream', study: 'Light blue' },
    Libra: { livingRoom: 'White or light blue', bedroom: 'Pink or rose', study: 'White' },
    default: { livingRoom: 'Neutral warm tones', bedroom: 'Soft earth tones', study: 'Light and bright' },
  }
  return map[ascendant] || map.default
}

function getVastuPlants(planet: string): string[] {
  const map: Record<string, string[]> = {
    Jupiter: ['Banana tree', 'Ashwagandha', 'Turmeric plant', 'Money plant'],
    Venus: ['Rose', 'Jasmine', 'Mogra', 'White lotus'],
    Mercury: ['Tulsi (must have)', 'Money plant', 'Lucky bamboo', 'Green plants'],
    Moon: ['Chameli', 'Lily', 'White orchid'],
    default: ['Tulsi', 'Money plant', 'Lucky bamboo', 'Peace lily'],
  }
  return map[planet] || map.default
}

function getVastuRemedies(kundli: any): string[] {
  return [
    'Place a Vastu Pyramid in the South-West corner of your home',
    `Install a ${kundli.dashaLord === 'Sun' ? 'Surya Yantra' : kundli.dashaLord === 'Jupiter' ? 'Guru Yantra' : 'Navgraha Yantra'} in the North-East prayer room`,
    'Ensure no mirrors in the bedroom or facing the entrance door',
    'Keep the North-East corner clean and clutter-free',
    'Use salt water in a bowl in South-West corner to absorb negative energy — change weekly',
    'Hang wind chimes in the North or North-West for positive energy flow',
  ]
}

function generatePsychologyReport(kundli: any) {
  const moonPersonalities: Record<string, object> = {
    Aries: { type: 'Warrior', traits: ['Courageous', 'Impulsive', 'Pioneering', 'Independent'], stress: 'frustration when blocked', relationship: 'passionate but need space', growth: 'patience and listening' },
    Taurus: { type: 'Builder', traits: ['Reliable', 'Patient', 'Sensual', 'Stubborn'], stress: 'forced change', relationship: 'loyal and possessive', growth: 'flexibility and release' },
    Gemini: { type: 'Communicator', traits: ['Curious', 'Adaptable', 'Witty', 'Restless'], stress: 'boredom and routine', relationship: 'stimulating but scattered', growth: 'depth and commitment' },
    Cancer: { type: 'Nurturer', traits: ['Sensitive', 'Protective', 'Intuitive', 'Moody'], stress: 'emotional insecurity', relationship: 'deeply caring and clingy', growth: 'emotional independence' },
    Leo: { type: 'Performer', traits: ['Creative', 'Dramatic', 'Generous', 'Prideful'], stress: 'being ignored', relationship: 'warm and demanding recognition', growth: 'humility and service' },
    Virgo: { type: 'Analyst', traits: ['Precise', 'Helpful', 'Critical', 'Perfectionist'], stress: 'chaos and criticism', relationship: 'devoted but critical', growth: 'self-compassion' },
    Libra: { type: 'Diplomat', traits: ['Harmonious', 'Indecisive', 'Charming', 'Idealistic'], stress: 'conflict and injustice', relationship: 'romantic but codependent', growth: 'decisive independence' },
    Scorpio: { type: 'Transformer', traits: ['Intense', 'Secretive', 'Powerful', 'Suspicious'], stress: 'betrayal and powerlessness', relationship: 'deeply bonded and jealous', growth: 'trust and vulnerability' },
    Sagittarius: { type: 'Explorer', traits: ['Optimistic', 'Freedom-loving', 'Philosophical', 'Blunt'], stress: 'confinement and rules', relationship: 'adventurous but commitment-averse', growth: 'depth and rootedness' },
    Capricorn: { type: 'Executive', traits: ['Disciplined', 'Ambitious', 'Reserved', 'Pessimistic'], stress: 'failure and incompetence', relationship: 'loyal but emotionally distant', growth: 'vulnerability and play' },
    Aquarius: { type: 'Innovator', traits: ['Independent', 'Humanitarian', 'Eccentric', 'Detached'], stress: 'conformity and small-mindedness', relationship: 'friendly but emotionally unavailable', growth: 'emotional intimacy' },
    Pisces: { type: 'Mystic', traits: ['Compassionate', 'Dreamy', 'Sensitive', 'Escapist'], stress: 'harshness and boundaries', relationship: 'deeply empathic and self-sacrificing', growth: 'boundaries and reality' },
  }

  const moonPsych = moonPersonalities[kundli.moonSign] || moonPersonalities.Libra as any

  return {
    moonPersonalityType: moonPsych.type,
    coreTrait: moonPsych.traits,
    emotionalPatterns: `As a ${kundli.moonSign} Moon native, your emotional world is defined by ${(moonPsych.traits as string[]).slice(0, 2).join(' and ')}. You seek ${moonPsych.type === 'Nurturer' ? 'security and belonging' : 'achievement and recognition'}.`,
    stressTriggers: `Primary stress triggers: ${moonPsych.stress}. When under stress, you tend to ${getStressBehavior(kundli.moonSign)}.`,
    relationshipStyle: `In relationships: ${moonPsych.relationship}`,
    growthEdge: `Your greatest growth opportunity: ${moonPsych.growth}`,
    cognitiveStyle: getCognitiveStyle(kundli.ascendant),
    emotionalIntelligence: getEQProfile(kundli.moonSign),
    careerPersonality: getCareerPersonality(kundli.ascendant, kundli.moonSign),
    shadowWork: getShadowWork(kundli.moonSign),
  }
}

function getStressBehavior(moonSign: string): string {
  const map: Record<string, string> = {
    Aries: 'act impulsively or become aggressive', Taurus: 'become stubborn and comfort-seek',
    Gemini: 'overthink and become anxious', Cancer: 'withdraw and become defensive',
    Leo: 'seek external validation intensely', Virgo: 'become hyper-critical and anxious',
    Libra: 'people-please and avoid conflict', Scorpio: 'become controlling or secretive',
    Sagittarius: 'escape through activity or travel', Capricorn: 'overwork and become cold',
    Aquarius: 'detach and intellectualize emotions', Pisces: 'escape into fantasy or isolation',
  }
  return map[moonSign] || 'seek solitude for rebalancing'
}

function getCognitiveStyle(ascendant: string): string {
  const map: Record<string, string> = {
    Aries: 'Quick, decisive, action-oriented thinking. You prefer to act first and analyze later.',
    Taurus: 'Methodical and practical. You process information slowly but thoroughly.',
    Gemini: 'Multi-faceted, quick, and versatile. You excel at synthesizing diverse information.',
    Cancer: 'Intuitive and memory-based. You rely heavily on gut feelings and past experiences.',
    Leo: 'Creative and big-picture. You think in narratives and love dramatic presentations.',
    Virgo: 'Analytical and detail-oriented. You naturally spot errors and seek improvement.',
    Libra: 'Balanced and comparative. You see multiple sides and excel at mediation.',
    Scorpio: 'Deep, penetrating, and investigative. You sense hidden layers others miss.',
    Sagittarius: 'Expansive and philosophical. You connect dots across vast domains.',
    Capricorn: 'Strategic and systematic. You think long-term and plan methodically.',
    Aquarius: 'Innovative and unconventional. You challenge assumptions and think futuristically.',
    Pisces: 'Holistic and intuitive. You absorb the emotional atmosphere of situations.',
  }
  return map[ascendant] || 'Balanced and adaptive cognitive style.'
}

function getEQProfile(moonSign: string): object {
  const high = ['Cancer', 'Pisces', 'Libra', 'Taurus'].includes(moonSign)
  return {
    selfAwareness: high ? 'High' : 'Developing',
    empathy: ['Cancer', 'Pisces', 'Libra'].includes(moonSign) ? 'High' : 'Moderate',
    emotionalRegulation: ['Capricorn', 'Aquarius', 'Virgo'].includes(moonSign) ? 'High' : 'Developing',
    socialSkills: ['Leo', 'Libra', 'Gemini', 'Sagittarius'].includes(moonSign) ? 'High' : 'Moderate',
    motivation: ['Aries', 'Capricorn', 'Leo', 'Scorpio'].includes(moonSign) ? 'High' : 'Moderate',
  }
}

function getCareerPersonality(ascendant: string, moonSign: string): string {
  return `With ${ascendant} Ascendant and ${moonSign} Moon, you thrive in environments that offer ${['Leo', 'Aries', 'Sagittarius'].includes(ascendant) ? 'leadership, visibility, and creative freedom' : ['Virgo', 'Capricorn', 'Taurus'].includes(ascendant) ? 'structure, mastery, and practical application' : 'collaboration, harmony, and meaningful contribution'}.`
}

function getShadowWork(moonSign: string): string[] {
  const map: Record<string, string[]> = {
    Aries: ['Work with anger and impatience', 'Practice finishing what you start', 'Develop compassion for vulnerability'],
    Taurus: ['Examine attachment and possessiveness', 'Practice flexibility', 'Explore your relationship with change'],
    Gemini: ['Develop focused attention', 'Explore your relationship with commitment', 'Practice presence over information-gathering'],
    Cancer: ['Work with emotional dependency', 'Examine your caretaking patterns', 'Develop healthy boundaries'],
    Leo: ['Examine your need for approval', 'Practice giving without recognition', 'Work with wounded pride'],
    Virgo: ['Explore your relationship with perfectionism', 'Practice self-compassion', 'Work with criticism patterns'],
    Libra: ['Examine people-pleasing', 'Develop decisive self-expression', 'Work with conflict avoidance'],
    Scorpio: ['Examine control patterns', 'Practice vulnerability and trust', 'Work with jealousy and obsession'],
    Sagittarius: ['Explore commitment and roots', 'Practice follow-through', 'Work with dogmatism'],
    Capricorn: ['Examine workaholism', 'Practice emotional vulnerability', 'Work with pessimism'],
    Aquarius: ['Explore emotional intimacy', 'Practice being present with feelings', 'Work with detachment'],
    Pisces: ['Develop clear boundaries', 'Practice being in reality', 'Work with escapism and martyrdom'],
  }
  return map[moonSign] || ['Explore your core patterns', 'Practice self-awareness', 'Seek balance']
}

function generateDmitReport(kundli: any, dob: string) {
  const NAKSHATRA_INTEL: Record<string, Record<string, number>> = {
    'Ashwini': { linguistic: 60, logical: 70, spatial: 65, kinesthetic: 80, musical: 50, interpersonal: 65, intrapersonal: 60, naturalistic: 75 },
    'Rohini': { linguistic: 75, logical: 60, spatial: 70, kinesthetic: 55, musical: 80, interpersonal: 85, intrapersonal: 65, naturalistic: 60 },
    'Ardra': { linguistic: 80, logical: 85, spatial: 65, kinesthetic: 50, musical: 55, interpersonal: 60, intrapersonal: 75, naturalistic: 50 },
    'Pushya': { linguistic: 70, logical: 65, spatial: 60, kinesthetic: 60, musical: 65, interpersonal: 80, intrapersonal: 80, naturalistic: 70 },
    'Magha': { linguistic: 75, logical: 70, spatial: 80, kinesthetic: 75, musical: 65, interpersonal: 70, intrapersonal: 65, naturalistic: 60 },
    'Chitra': { linguistic: 65, logical: 75, spatial: 90, kinesthetic: 70, musical: 60, interpersonal: 65, intrapersonal: 55, naturalistic: 55 },
    'Vishakha': { linguistic: 80, logical: 75, spatial: 60, kinesthetic: 65, musical: 60, interpersonal: 80, intrapersonal: 70, naturalistic: 55 },
    'Shravana': { linguistic: 85, logical: 70, spatial: 65, kinesthetic: 55, musical: 80, interpersonal: 75, intrapersonal: 75, naturalistic: 60 },
  }

  const seed = Object.keys(NAKSHATRA_INTEL).indexOf(kundli.nakshatra)
  const base = NAKSHATRA_INTEL[kundli.nakshatra] || {
    linguistic: 50 + seed % 40, logical: 55 + seed % 35, spatial: 45 + seed % 45,
    kinesthetic: 60 + seed % 30, musical: 50 + seed % 40, interpersonal: 55 + seed % 35,
    intrapersonal: 60 + seed % 30, naturalistic: 50 + seed % 35,
  }

  const intelligences = Object.entries(base).map(([type, score]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1) + ' Intelligence',
    score,
    strength: score >= 75 ? 'Strong' : score >= 55 ? 'Moderate' : 'Developing',
    careers: getIntelligenceCareers(type),
    learningTips: getLearningTips(type),
  })).sort((a, b) => b.score - a.score)

  const dominant = intelligences.slice(0, 3)

  return {
    dominantIntelligences: dominant,
    allIntelligences: intelligences,
    learningStyle: getLearningStyle(dominant[0].type),
    recommendedStreams: getRecommendedStreams(dominant),
    careerAlignment: getCareerAlignment(dominant),
    studyTechniques: getStudyTechniques(dominant[0].type),
    parentingAdvice: getParentingAdvice(dominant),
  }
}

function getIntelligenceCareers(type: string): string[] {
  const map: Record<string, string[]> = {
    linguistic: ['Writer', 'Lawyer', 'Teacher', 'Journalist', 'Poet', 'Public speaker'],
    logical: ['Engineer', 'Scientist', 'Mathematician', 'Doctor', 'Programmer', 'Philosopher'],
    spatial: ['Architect', 'Artist', 'Pilot', 'Surgeon', 'Designer', 'Photographer'],
    kinesthetic: ['Athlete', 'Dancer', 'Actor', 'Surgeon', 'Mechanic', 'Builder'],
    musical: ['Musician', 'Composer', 'Singer', 'Sound engineer', 'Music teacher'],
    interpersonal: ['Counselor', 'Teacher', 'Salesperson', 'Manager', 'Politician', 'HR professional'],
    intrapersonal: ['Psychologist', 'Philosopher', 'Researcher', 'Writer', 'Spiritual teacher'],
    naturalistic: ['Biologist', 'Farmer', 'Chef', 'Environmentalist', 'Veterinarian', 'Botanist'],
  }
  return map[type] || []
}

function getLearningTips(type: string): string[] {
  const map: Record<string, string[]> = {
    linguistic: ['Reading aloud', 'Storytelling', 'Word games', 'Debate', 'Creative writing'],
    logical: ['Problem sets', 'Strategy games', 'Scientific experiments', 'Puzzles', 'Pattern finding'],
    spatial: ['Mind maps', 'Diagrams', 'Videos', 'Art projects', 'Model building'],
    kinesthetic: ['Hands-on projects', 'Field trips', 'Role-play', 'Building', 'Movement breaks'],
    musical: ['Study with music', 'Songs as mnemonics', 'Rhythmic patterns', 'Music breaks'],
    interpersonal: ['Group study', 'Teaching others', 'Discussions', 'Collaborative projects'],
    intrapersonal: ['Journaling', 'Self-paced study', 'Meditation', 'Independent projects'],
    naturalistic: ['Nature observation', 'Gardening projects', 'Wildlife study', 'Classification tasks'],
  }
  return map[type] || []
}

function getLearningStyle(dominantType: string): string {
  if (dominantType.includes('Linguistic')) return 'Verbal-Auditory Learner: Excels with reading, writing, and listening'
  if (dominantType.includes('Logical')) return 'Logical-Mathematical Learner: Excels with reasoning, systems, and problem-solving'
  if (dominantType.includes('Spatial')) return 'Visual-Spatial Learner: Excels with imagery, diagrams, and visualization'
  if (dominantType.includes('Kinesthetic')) return 'Kinesthetic Learner: Excels with hands-on, movement, and doing'
  return 'Multi-modal Learner: Adapts to various learning formats'
}

function getRecommendedStreams(dominant: Array<{ type: string }>) {
  const types = dominant.map(d => d.type.toLowerCase())
  if (types.some(t => t.includes('logical') || t.includes('spatial'))) return ['Science (PCM)', 'Engineering', 'Technology', 'Medicine']
  if (types.some(t => t.includes('linguistic') || t.includes('interpersonal'))) return ['Arts & Humanities', 'Law', 'Commerce', 'Social Sciences']
  return ['Commerce', 'Arts', 'Applied Sciences', 'Vocational courses']
}

function getCareerAlignment(dominant: Array<{ type: string; careers: string[] }>) {
  return dominant.flatMap(d => d.careers).slice(0, 8)
}

function getStudyTechniques(dominantType: string): string[] {
  return getLearningTips(dominantType.split(' ')[0].toLowerCase()) || ['Spaced repetition', 'Active recall', 'Mind mapping']
}

function getParentingAdvice(dominant: Array<{ type: string }>): string[] {
  const types = dominant.map(d => d.type.toLowerCase())
  const advice = [
    'Celebrate your child\'s unique strengths rather than comparing with siblings',
    `Provide ${types[0].includes('kinesthetic') ? 'hands-on activities and movement opportunities' : types[0].includes('musical') ? 'music lessons and creative expression' : 'books, puzzles, and intellectual stimulation'}`,
    'Allow exploration of multiple activities before specializing',
    'Avoid over-scheduling — creative downtime is essential for this profile',
    'Create a study environment that matches their learning style',
  ]
  return advice
}

function generateChildDevelopmentReport(kundli: any, age: number, gender: string | null) {
  const stages = age < 3 ? 'Infant' : age < 7 ? 'Early Childhood' : age < 12 ? 'Middle Childhood' : 'Adolescence'
  const intel = generateDmitReport(kundli, new Date(Date.now() - age * 365.25 * 86400000).toISOString().split('T')[0])
  return {
    stage: stages,
    age,
    gender,
    dominantIntelligences: intel.dominantIntelligences,
    learningStyle: intel.learningStyle,
    parentingAdvice: intel.parentingAdvice,
    studyTechniques: intel.studyTechniques,
    milestones: getAgeMilestones(age),
    recommendedActivities: getRecommendedActivities(kundli.nakshatra, age),
    cautionAreas: getDevelopmentCautions(kundli.moonSign),
  }
}

function getAgeMilestones(age: number): string[] {
  if (age < 3) return ['Language development through songs and stories', 'Sensory play and exploration', 'Building emotional bonds', 'Motor skill development']
  if (age < 7) return ['Phonics and early reading', 'Basic numeracy concepts', 'Social play and sharing', 'Creative expression through art']
  if (age < 12) return ['Academic foundation building', 'Team sports and collaboration', 'Logical reasoning development', 'Developing study habits']
  return ['Identity formation', 'Critical thinking skills', 'Career interest exploration', 'Emotional intelligence development']
}

function getRecommendedActivities(nakshatra: string, age: number): string[] {
  const baseActivities = age < 7
    ? ['Music and movement', 'Storytelling', 'Nature walks', 'Creative arts']
    : age < 12
    ? ['Chess and strategy games', 'Reading programs', 'Sports training', 'Science experiments']
    : ['Debate and public speaking', 'Coding or music', 'Community service', 'Leadership programs']
  return baseActivities
}

function getDevelopmentCautions(moonSign: string): string[] {
  const map: Record<string, string[]> = {
    Aries: ['May rush through tasks — teach patience', 'Encourage finishing projects'],
    Taurus: ['May resist change — introduce variety gently', 'Avoid over-indulgence in comfort habits'],
    Gemini: ['May scatter focus — use structured routines', 'Channel curiosity into depth'],
    Cancer: ['May be overly sensitive — build emotional resilience', 'Encourage independence'],
    Leo: ['May need constant validation — build intrinsic motivation', 'Teach humility'],
    Virgo: ['May be perfectionistic — celebrate effort not just results', 'Reduce anxiety around mistakes'],
    default: ['Balance structured and free play', 'Foster both independence and cooperation'],
  }
  return map[moonSign] || map.default
}

function generateColourTherapy(kundli: any) {
  return {
    sunSign: kundli.sunSign,
    moonSign: kundli.moonSign,
    ascendant: kundli.ascendant,
    healingColors: {
      physical: getPhysicalHealingColors(kundli.ascendant),
      emotional: getEmotionalHealingColors(kundli.moonSign),
      mental: getMentalHealingColors(kundli.ascendant),
      spiritual: getSpiritualColors(kundli.nakshatra),
    },
    colorMeditation: getColorMeditation(kundli.moonSign),
    chromotherapy: getChromotherapy(kundli.ascendant),
    interiorDesign: getInteriorColors(kundli.ascendant),
    clothing: getClothingColors(kundli),
    avoid: getColorsToAvoid(kundli.ascendant),
  }
}

function getPhysicalHealingColors(ascendant: string): string[] {
  const map: Record<string, string[]> = {
    Aries: ['Orange', 'Red', 'Gold'], Taurus: ['Green', 'Pink', 'Earth tones'],
    Gemini: ['Yellow', 'Light blue'], Cancer: ['Silver', 'White', 'Sea green'],
    Leo: ['Gold', 'Orange', 'Yellow'], Virgo: ['Green', 'Navy blue', 'Grey'],
    Libra: ['Pink', 'Light blue', 'White'], Scorpio: ['Dark red', 'Maroon', 'Black'],
    Sagittarius: ['Purple', 'Indigo', 'Gold'], Capricorn: ['Dark green', 'Brown', 'Black'],
    Aquarius: ['Electric blue', 'Violet', 'Silver'], Pisces: ['Sea green', 'Turquoise', 'Violet'],
  }
  return map[ascendant] || ['White', 'Gold']
}

function getEmotionalHealingColors(moonSign: string): string[] {
  const map: Record<string, string[]> = {
    Cancer: ['Silver', 'White', 'Light blue'], Scorpio: ['Dark teal', 'Maroon'],
    Pisces: ['Turquoise', 'Violet'], Aries: ['Coral', 'Peach'],
    default: ['Soft pink', 'Light lavender', 'Warm white'],
  }
  return map[moonSign] || map.default
}

function getMentalHealingColors(ascendant: string): string[] {
  return ['Light yellow', 'White', 'Pale blue']
}

function getSpiritualColors(nakshatra: string): string[] {
  return ['Violet', 'Indigo', 'White', 'Gold', 'Saffron']
}

function getColorMeditation(moonSign: string): string {
  return `For ${moonSign} Moon energy: Practice the Golden Light meditation daily. Visualize a warm golden light entering through the crown chakra, washing through every cell, dissolving tension and worry. Hold this visualization for 10 minutes. This colour vibration is particularly healing for your emotional body.`
}

function getChromotherapy(ascendant: string): object {
  return {
    sessions: 'Recommend 3x weekly colour light therapy sessions',
    primaryColor: getPhysicalHealingColors(ascendant)[0],
    duration: '20-30 minutes per session',
    method: 'Coloured light bulb, coloured solarized water, or visualization',
    waterSolarization: `Fill a glass bottle in the color ${getPhysicalHealingColors(ascendant)[0].toLowerCase()} and leave in sunlight for 4-6 hours. Drink this solarized water throughout the day.`,
  }
}

function getInteriorColors(ascendant: string): object {
  const colors = getPhysicalHealingColors(ascendant)
  return {
    livingRoom: colors[0] + ' accents with neutral walls',
    bedroom: 'Soft and muted version of ' + colors[1],
    study: 'White or light yellow for concentration',
    bathroom: 'Sea green or light blue for cleansing energy',
    entrance: colors[0] + ' or warm gold for welcoming energy',
  }
}

function getClothingColors(kundli: any): object {
  const weekly: Record<string, string> = {
    Sunday: 'Red, orange, or gold', Monday: 'White, cream, or silver',
    Tuesday: 'Red or orange', Wednesday: 'Green or grey',
    Thursday: 'Yellow or orange', Friday: 'White, pink, or cream',
    Saturday: 'Dark blue, black, or purple',
  }
  return {
    powerColor: getPhysicalHealingColors(kundli.ascendant)[0],
    avoidColors: getColorsToAvoid(kundli.ascendant),
    weeklySchedule: weekly,
    forImportantMeetings: getPhysicalHealingColors(kundli.ascendant)[0] + ' — amplifies your natural authority',
    forHealingDays: getEmotionalHealingColors(kundli.moonSign)[0] + ' — soothes emotional body',
  }
}

function getColorsToAvoid(ascendant: string): string[] {
  const map: Record<string, string[]> = {
    Aries: ['Dark grey', 'Muddy brown'], Taurus: ['Dark grey', 'Black for long use'],
    Gemini: ['Dark maroon'], Cancer: ['Dark black for constant use', 'Dark red'],
    Leo: ['Blue-grey', 'Dark navy'], Virgo: ['Red for excess', 'Bright orange'],
    Libra: ['Dark brown', 'Muddy tones'], Scorpio: ['Pale yellow', 'White for excess'],
    Sagittarius: ['Dark brown', 'Muddy green'], Capricorn: ['Bright orange', 'Pink'],
    Aquarius: ['Dull brown', 'Old gold'], Pisces: ['Dark red', 'Harsh black'],
  }
  return map[ascendant] || ['Dull and muddy tones']
}

function generateAnnualPrediction(kundli: any) {
  const currentYear = new Date().getFullYear()
  const seed = kundli.dashaLord?.length || 4

  const MONTHLY_THEMES: Record<string, Array<{ theme: string; guidance: string; focus: string }>> = {
    Sun: [
      { theme: 'Authority & Visibility', guidance: 'Career matters take center stage. Seek recognition and step into leadership roles. Avoid ego conflicts.', focus: 'Career advancement' },
      { theme: 'Inner Consolidation', guidance: 'Review and refine your goals. Health and heart need attention. Connect with father or authority figures.', focus: 'Self-reflection' },
      { theme: 'Creative Fire', guidance: 'Express yourself boldly. Romance, children, and creative projects flourish with solar energy.', focus: 'Creativity & joy' },
      { theme: 'Strategic Action', guidance: 'Take bold career moves. Your natural authority is at peak. Negotiations favor you.', focus: 'Career peak' },
      { theme: 'Relationships & Recognition', guidance: 'Public image improves. Partnerships with influential people are favored.', focus: 'Partnerships' },
      { theme: 'Service & Health', guidance: 'Focus on well-being and service to others. Avoid overworking. Digestive health needs care.', focus: 'Health' },
      { theme: 'Balance & Diplomacy', guidance: 'Relationship matters call for fairness and patience. Legal matters may arise.', focus: 'Balance' },
      { theme: 'Transformation', guidance: 'Deep changes are occurring below the surface. Trust the process of letting go.', focus: 'Inner work' },
      { theme: 'Expansion & Fortune', guidance: 'Travel and higher learning bring breakthroughs. Spiritual practices deepen.', focus: 'Growth' },
      { theme: 'Career Peak', guidance: 'Your most powerful month for career and public recognition. Make your mark.', focus: 'Achievement' },
      { theme: 'Social Gains', guidance: 'Networks and friendships bring unexpected opportunities. Group endeavors succeed.', focus: 'Community' },
      { theme: 'Spiritual Retreat', guidance: 'Rest, reflect, and prepare for a new cycle. Foreign connections may be significant.', focus: 'Completion' },
    ],
    Moon: [
      { theme: 'Emotional Renewal', guidance: 'New cycles begin emotionally. Family connections are highlighted. Trust your instincts.', focus: 'Family & home' },
      { theme: 'Nurturing & Care', guidance: 'Invest in home and family. Mother or maternal figures are significant. Emotional healing occurs.', focus: 'Nourishment' },
      { theme: 'Communication & Siblings', guidance: 'Short journeys and sibling interactions bring important messages. Write, speak, and share.', focus: 'Communication' },
      { theme: 'Home & Security', guidance: 'Domestic life improves. Real estate matters may be favorable. Create your sanctuary.', focus: 'Home life' },
      { theme: 'Creative Expression', guidance: 'Your emotional nature fuels creativity. Children bring joy. Romance is tender and meaningful.', focus: 'Creativity' },
      { theme: 'Daily Routines', guidance: 'Focus on health rituals and service. Emotional fluctuations require mindful routines.', focus: 'Wellness' },
      { theme: 'Relationship Depth', guidance: 'Emotional intimacy in relationships deepens. Be open to vulnerability and connection.', focus: 'Intimacy' },
      { theme: 'Emotional Transformation', guidance: 'Past patterns surface for healing. Therapy, shadow work, or spiritual practices help.', focus: 'Healing' },
      { theme: 'Spiritual Journeys', guidance: 'Pilgrimages, retreats, or teacher connections bring profound emotional peace.', focus: 'Spirituality' },
      { theme: 'Public Emotional Life', guidance: 'Your emotional authenticity draws others to you. Career and public recognition through empathy.', focus: 'Public life' },
      { theme: 'Community Bonds', guidance: 'Deep connections with like-minded souls flourish. Group emotional work is powerful.', focus: 'Community' },
      { theme: 'Inner Reflection', guidance: 'Rest and dream. Your subconscious holds keys to the coming cycle. Journal and meditate.', focus: 'Dreams' },
    ],
  }

  const DASHA_MONTHLY_THEMES = MONTHLY_THEMES[kundli.currentDasha] || MONTHLY_THEMES.Sun
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const quarters = months.map((month, i) => ({
    period: `${month} ${currentYear}`,
    theme: DASHA_MONTHLY_THEMES[i].theme,
    guidance: DASHA_MONTHLY_THEMES[i].guidance,
    focus: DASHA_MONTHLY_THEMES[i].focus,
  }))

  const FAVORABLE_BY_DASHA: Record<string, string[]> = {
    Sun: ['Jan 14-Feb 13', 'Apr 14-May 14', 'Jul 17-Aug 16'],
    Moon: ['Feb 13-Mar 14', 'May 15-Jun 14', 'Aug 17-Sep 16'],
    Mars: ['Mar 14-Apr 13', 'Jun 15-Jul 16', 'Sep 17-Oct 16'],
    Mercury: ['Apr 13-May 14', 'Jul 17-Aug 16', 'Oct 17-Nov 15'],
    Jupiter: ['May 14-Jun 14', 'Aug 17-Sep 16', 'Nov 16-Dec 15'],
    Venus: ['Jun 15-Jul 16', 'Sep 17-Oct 16', 'Dec 16-Jan 14'],
    Saturn: ['Jul 17-Aug 16', 'Oct 17-Nov 15', 'Jan 14-Feb 12'],
    Rahu: ['Aug 17-Sep 16', 'Nov 16-Dec 15', 'Feb 13-Mar 13'],
    Ketu: ['Sep 17-Oct 16', 'Dec 16-Jan 14', 'Mar 14-Apr 13'],
  }

  return {
    year: currentYear,
    overallTheme: `${currentYear} runs under the ${kundli.currentDasha} Mahadasha with ${kundli.currentAntardasha} Antardasha. This is a ${getPlanetTheme(kundli.currentDasha)} year. The interplay of these two planetary energies shapes every major life area. ${getAnnualAdvice(kundli.currentDasha)}`,
    quarters,
    favorable: FAVORABLE_BY_DASHA[kundli.currentDasha] || ['Mar 20-Apr 10', 'Jul 1-20', 'Nov 1-20'],
    cautious: ['Eclipse periods', 'Saturn retrograde', 'Mercury retrograde'],
  }
}

function getAnnualAdvice(dashaLord: string): string {
  const map: Record<string, string> = {
    Sun: 'Career, authority, and self-expression are your primary themes. Step forward with confidence and take ownership of your direction.',
    Moon: 'Emotional intelligence and family bonds are your compass this year. Honor your inner world and the people closest to you.',
    Mars: 'Action, courage, and initiative are your superpowers. Channel your energy into meaningful ventures and avoid unnecessary conflicts.',
    Mercury: 'Communication, learning, and business intelligence lead the way. This is an excellent year for education, writing, and trade.',
    Jupiter: 'Expansion, wisdom, and dharmic living are your highest calling. Seek teachers, study sacred texts, and invest in growth.',
    Venus: 'Beauty, relationships, and creative work bloom. Love, art, and material refinement come naturally to you this year.',
    Saturn: 'Discipline, karmic resolution, and sustained effort bring lasting results. What you build this year will endure for decades.',
    Rahu: 'Innovation, disruption, and unconventional paths bring extraordinary opportunities. Stay grounded amid rapid change.',
    Ketu: 'Spiritual depth, surrender, and inner liberation are available. Let go of what has run its course and trust the wisdom of non-attachment.',
  }
  return map[dashaLord] || 'Focus on aligning with your dharmic path and trusting the cosmic timing of your evolution.'
}

function getPlanetTheme(planet: string): string {
  const map: Record<string, string> = {
    Jupiter: 'highly expansive and growth-oriented',
    Venus: 'favorable for relationships, creativity, and comfort',
    Mercury: 'excellent for business, communication, and education',
    Sun: 'powerful for career advancement and recognition',
    Moon: 'emotionally significant with focus on family',
    Mars: 'action-packed with opportunities for courage',
    Saturn: 'disciplined karmic clearing and long-term building',
    Rahu: 'transformative with unexpected opportunities',
    Ketu: 'deeply spiritual with inner searching',
  }
  return map[planet] || 'significant for personal growth'
}

function generateRemediesSummary(kundli: any, numerology: any) {
  const DASHA_BEEJ: Record<string, string> = {
    Sun: 'Om Hraam Hreem Hraum Sah Suryaya Namah',
    Moon: 'Om Shraam Shreem Shraum Sah Chandraya Namah',
    Mars: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah',
    Mercury: 'Om Braam Breem Braum Sah Budhaya Namah',
    Jupiter: 'Om Graam Greem Graum Sah Gurave Namah',
    Venus: 'Om Draam Dreem Draum Sah Shukraya Namah',
    Saturn: 'Om Praam Preem Praum Sah Shanaischaraya Namah',
    Rahu: 'Om Bhraam Bhreem Bhraum Sah Rahave Namah',
    Ketu: 'Om Sraam Sreem Sraum Sah Ketave Namah',
  }

  const DEITY_BY_PLANET: Record<string, { deity: string; mantra: string }> = {
    Sun: { deity: 'Lord Surya / Lord Ram', mantra: 'Aditya Hridayam — 108 times at sunrise' },
    Moon: { deity: 'Lord Shiva / Goddess Durga', mantra: 'Om Namah Shivaya — 108 times on Mondays' },
    Mars: { deity: 'Lord Hanuman / Lord Kartikeya', mantra: 'Hanuman Chalisa — daily on Tuesdays' },
    Mercury: { deity: 'Lord Vishnu / Goddess Saraswati', mantra: 'Om Namo Bhagavate Vasudevaya — 108 times' },
    Jupiter: { deity: 'Lord Vishnu / Lord Dakshinamurthy', mantra: 'Om Guruve Namah / Guru Stotram on Thursdays' },
    Venus: { deity: 'Goddess Lakshmi / Goddess Parvati', mantra: 'Om Shreem Mahalakshmiyei Namah on Fridays' },
    Saturn: { deity: 'Lord Shani / Lord Bhairava', mantra: 'Om Praam Preem Praum Sah Shanaischaraya Namah on Saturdays' },
    Rahu: { deity: 'Goddess Durga / Lord Bhairava', mantra: 'Rahu Kavach / Durga Chalisa on Saturdays' },
    Ketu: { deity: 'Lord Ganesha / Lord Bhairava', mantra: 'Om Gam Ganapataye Namah — 108 times daily' },
  }

  const GEMSTONE_BY_PLANET: Record<string, { stone: string; substitute: string; purpose: string; weight: string; metal: string; day: string }> = {
    Sun: { stone: 'Ruby (Manik)', substitute: 'Red Garnet or Red Spinel', purpose: 'Career advancement, vitality, and father relationship', weight: 'Minimum 3 carats in gold', metal: 'Gold', day: 'Sunday sunrise' },
    Moon: { stone: 'Natural Pearl (Moti)', substitute: 'Moonstone or White Coral', purpose: 'Emotional stability, mind clarity, and mother relationship', weight: 'Minimum 4 carats in silver', metal: 'Silver', day: 'Monday morning' },
    Mars: { stone: 'Red Coral (Moonga)', substitute: 'Bloodstone or Carnelian', purpose: 'Courage, property, and health', weight: 'Minimum 5 carats in copper or gold', metal: 'Copper or Gold', day: 'Tuesday morning' },
    Mercury: { stone: 'Emerald (Panna)', substitute: 'Green Tourmaline or Peridot', purpose: 'Intelligence, communication, and business', weight: 'Minimum 3 carats in gold', metal: 'Gold', day: 'Wednesday morning' },
    Jupiter: { stone: 'Yellow Sapphire (Pukhraj)', substitute: 'Yellow Topaz or Citrine', purpose: 'Wisdom, marriage, children, and fortune', weight: 'Minimum 3 carats in gold', metal: 'Gold', day: 'Thursday morning' },
    Venus: { stone: 'Diamond (Heera)', substitute: 'White Sapphire or White Zircon', purpose: 'Luxury, love, arts, and material comforts', weight: 'Minimum 0.5 carats in white gold or platinum', metal: 'White Gold or Platinum', day: 'Friday morning' },
    Saturn: { stone: 'Blue Sapphire (Neelam)', substitute: 'Amethyst or Blue Spinel', purpose: 'Discipline, longevity, and karmic resolution', weight: 'Minimum 3 carats in silver or gold', metal: 'Silver or Gold', day: 'Saturday morning' },
    Rahu: { stone: 'Hessonite (Gomed)', substitute: 'Zircon or Agate', purpose: 'Overcoming obstacles, confusion, and foreign connections', weight: 'Minimum 5 carats in silver', metal: 'Silver', day: 'Saturday evening' },
    Ketu: { stone: "Cat's Eye (Lehsunia)", substitute: 'Tourmaline or Apatite', purpose: 'Spiritual liberation, intuition, and past karma healing', weight: 'Minimum 3 carats in silver', metal: 'Silver', day: 'Tuesday morning' },
  }

  const planet = kundli.dashaLord || 'Jupiter'
  const deity = DEITY_BY_PLANET[planet] || DEITY_BY_PLANET.Jupiter
  const gemstone = GEMSTONE_BY_PLANET[planet] || GEMSTONE_BY_PLANET.Jupiter

  return {
    dailyPractices: [
      'Morning Surya Namaskar — 12 rounds at sunrise',
      `Chant: "${DASHA_BEEJ[planet] || DASHA_BEEJ.Jupiter}" — 108 times`,
      `Worship ${deity.deity}: ${deity.mantra}`,
      'Pranayama — 5 minutes Anulom Vilom + 5 minutes Kapalbhati',
      'Gratitude journaling — 3 blessings before sleep',
      'Evening meditation — 20 minutes with mala',
    ],
    weeklyPractices: [
      `Visit temple on ${getAuspiciousDay(planet)} — offer specific items to the deity`,
      `Fast (upvas) on ${getAuspiciousDay(planet)} — recommended for karmic clearing`,
      'Donate food or essentials to the needy every week',
      'Oil lamp (diya) with sesame or ghee — light at dusk daily',
      `Recite ${planet === 'Saturn' || planet === 'Rahu' ? 'Shani Stotra' : planet === 'Jupiter' ? 'Guru Stotram' : 'Navgraha Stotra'} on the respective day`,
    ],
    gemstones: [
      {
        stone: gemstone.stone,
        purpose: gemstone.purpose,
        weight: gemstone.weight,
        metal: gemstone.metal,
        wearingDay: gemstone.day,
      },
      {
        stone: gemstone.substitute,
        purpose: `Budget substitute for ${gemstone.stone}`,
        weight: 'Same weight as primary gemstone',
        metal: gemstone.metal,
        wearingDay: gemstone.day,
      },
    ],
    yantras: [
      `${planet} Yantra — energize and install in the North-East prayer room`,
      'Navgraha Yantra — for general planetary harmony',
      `Sri Yantra — for overall prosperity and spiritual protection`,
    ],
    luckyNumbers: numerology.luckyNumbers.slice(0, 3),
    luckyDays: numerology.luckyDays,
    annualPooja: `${planet === 'Saturn' || planet === 'Rahu' || planet === 'Ketu' ? 'Navgraha Shanti Pooja and Mahamrityunjaya Havan' : `${planet} Graha Shanti Pooja`} is strongly recommended. Perform on a ${getAuspiciousDay(planet)} during shukla paksha (waxing moon). Invite a learned Brahmin or conduct through a reliable temple.`,
    dietRecommendations: getDietByPlanet(planet),
    charityItems: getCharityByPlanet(planet),
  }
}

function getDietByPlanet(planet: string): string[] {
  const map: Record<string, string[]> = {
    Sun: ['Eat wheat and jaggery on Sundays', 'Include saffron milk', 'Avoid salty foods on Sundays', 'Eat before sunset'],
    Moon: ['Include milk and rice on Mondays', 'Eat cooling foods — cucumber, coconut', 'Avoid spicy foods on Mondays', 'Stay well-hydrated'],
    Mars: ['Include red lentils on Tuesdays', 'Eat iron-rich foods — spinach, beets', 'Reduce fried and spicy foods', 'Fast on Tuesdays if possible'],
    Mercury: ['Include green vegetables on Wednesdays', 'Eat light, easily digestible meals', 'Include sesame seeds', 'Avoid heavy meats'],
    Jupiter: ['Include turmeric in food daily', 'Eat yellow items on Thursdays — chana dal, banana', 'Include ghee in diet', 'Donate sweets before eating'],
    Venus: ['Include white foods — curd, milk, rice on Fridays', 'Avoid black items on Fridays', 'Include sour foods', 'Offer food to women before eating'],
    Saturn: ['Include black sesame in diet on Saturdays', 'Eat iron-rich foods', 'Include mustard oil in cooking', 'Donate black items before eating'],
    Rahu: ['Include barley and raw onion periodically', 'Avoid non-vegetarian on Saturday', 'Feed crows on Saturdays', 'Include garlic moderately'],
    Ketu: ['Include sesame and turmeric', 'Eat light sattvic meals', 'Avoid non-vegetarian on Tuesdays', 'Include roots and tubers'],
  }
  return map[planet] || map.Jupiter
}

function getCharityByPlanet(planet: string): string[] {
  const map: Record<string, string[]> = {
    Sun: ['Wheat, copper, ruby-colored cloth on Sundays', 'Donate to father figures, government workers'],
    Moon: ['Rice, white cloth, silver, milk on Mondays', 'Donate to mothers, women, elderly'],
    Mars: ['Red lentils, red cloth, copper on Tuesdays', 'Donate to soldiers, sportspeople'],
    Mercury: ['Green vegetables, books, emerald-colored cloth on Wednesdays', 'Donate to students, teachers'],
    Jupiter: ['Yellow items, books, chana dal on Thursdays', 'Donate to Brahmins, teachers, temples'],
    Venus: ['White cloth, sugar, curd, silver on Fridays', 'Donate to women, artists, newlyweds'],
    Saturn: ['Black sesame, oil, iron, blue-black cloth on Saturdays', 'Donate to laborers, poor, disabled'],
    Rahu: ['Blue cloth, coconut, sesame on Saturdays', 'Feed dogs and crows'],
    Ketu: ['Mixed grains, brown cloth, blanket on Tuesdays', 'Donate to monks and spiritual seekers'],
  }
  return map[planet] || map.Jupiter
}

function getAuspiciousDay(planet: string): string {
  const map: Record<string, string> = {
    Sun: 'Sunday', Moon: 'Monday', Mars: 'Tuesday', Mercury: 'Wednesday',
    Jupiter: 'Thursday', Venus: 'Friday', Saturn: 'Saturday', Rahu: 'Saturday', Ketu: 'Tuesday',
  }
  return map[planet] || 'Monday'
}

function generateMuhurtaGuide(kundli: any, numerology: any) {
  const lagna = kundli.ascendant
  const moonSign = kundli.moonSign
  const dasha = kundli.currentDasha
  const lp = numerology.lifePathNumber

  // Days of the week (0 = Sunday)
  const WEEKDAY_PLANET = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
  const PLANET_WEEKDAY: Record<string, string> = {
    Sun: 'Sunday', Moon: 'Monday', Mars: 'Tuesday', Mercury: 'Wednesday',
    Jupiter: 'Thursday', Venus: 'Friday', Saturn: 'Saturday', Rahu: 'Saturday', Ketu: 'Tuesday',
  }

  // Lagna lord mapping
  const LAGNA_LORD: Record<string, string> = {
    Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
    Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
    Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
  }

  // Benefic and malefic planets by lagna
  const BENEFICS_BY_LAGNA: Record<string, string[]> = {
    Aries: ['Jupiter', 'Sun'], Taurus: ['Saturn', 'Mercury', 'Venus'],
    Gemini: ['Venus', 'Saturn'], Cancer: ['Jupiter', 'Mars'],
    Leo: ['Mars', 'Jupiter', 'Sun'], Virgo: ['Venus', 'Mercury'],
    Libra: ['Saturn', 'Mercury', 'Venus'], Scorpio: ['Jupiter', 'Moon'],
    Sagittarius: ['Sun', 'Mars'], Capricorn: ['Venus', 'Mercury', 'Saturn'],
    Aquarius: ['Venus', 'Saturn'], Pisces: ['Moon', 'Mars', 'Jupiter'],
  }

  const lagnaLord = LAGNA_LORD[lagna] || 'Jupiter'
  const benefics = BENEFICS_BY_LAGNA[lagna] || ['Jupiter', 'Venus']
  const luckyDays = [...new Set([PLANET_WEEKDAY[lagnaLord], PLANET_WEEKDAY[benefics[0]], PLANET_WEEKDAY[benefics[1] || benefics[0]]])]

  const MALEFIC_DAYS_BY_LAGNA: Record<string, string[]> = {
    Aries: ['Saturday', 'Wednesday'], Taurus: ['Tuesday', 'Sunday'],
    Gemini: ['Tuesday', 'Thursday'], Cancer: ['Saturn', 'Mercury'].map(p => PLANET_WEEKDAY[p]),
    Leo: ['Wednesday', 'Saturday'], Virgo: ['Tuesday', 'Thursday'],
    Libra: ['Tuesday', 'Sunday'], Scorpio: ['Wednesday', 'Friday'],
    Sagittarius: ['Saturday', 'Friday'], Capricorn: ['Tuesday', 'Monday'],
    Aquarius: ['Sunday', 'Thursday'], Pisces: ['Saturday', 'Wednesday'],
  }
  const unluckyDays = MALEFIC_DAYS_BY_LAGNA[lagna] || ['Tuesday', 'Saturday']

  // Lucky time of day by lagna lord
  const LUCKY_TIME: Record<string, string> = {
    Sun: '6 AM – 9 AM (Brahma Muhurta + Sunrise)', Moon: '5 AM – 7 AM or 8 PM – 10 PM',
    Mars: '6 AM – 8 AM or 4 PM – 6 PM', Mercury: '8 AM – 11 AM',
    Jupiter: '7 AM – 9 AM or 5 PM – 7 PM', Venus: '6 AM – 8 AM or 7 PM – 9 PM',
    Saturn: '8 AM – 10 AM or 6 PM – 8 PM',
  }

  // Unlucky time (Rahu Kaal) varies by weekday
  const RAHU_KAAL: Record<string, string> = {
    Sunday: '4:30 PM – 6:00 PM', Monday: '7:30 AM – 9:00 AM',
    Tuesday: '3:00 PM – 4:30 PM', Wednesday: '12:00 PM – 1:30 PM',
    Thursday: '1:30 PM – 3:00 PM', Friday: '10:30 AM – 12:00 PM',
    Saturday: '9:00 AM – 10:30 AM',
  }

  // Muhurta recommendations by life domain
  const EDUCATION_TIMING: Record<string, string> = {
    Aries: 'Wednesday mornings, Mercury hora, during Pushya or Hasta nakshatra',
    Taurus: 'Wednesday or Friday mornings, Mercury or Venus hora',
    Gemini: 'Wednesday, Jupiter hora (Thursdays), Shravana or Punarvasu nakshatra',
    Cancer: 'Thursday mornings, Jupiter hora, Pushya nakshatra is ideal',
    Leo: 'Sunday or Thursday, Sun or Jupiter hora, Uttara Phalguni nakshatra',
    Virgo: 'Wednesday mornings, Mercury hora, Hasta or Ashwini nakshatra',
    Libra: 'Wednesday or Thursday, Mercury or Jupiter hora',
    Scorpio: 'Thursday mornings, Jupiter hora, Anuradha or Jyeshtha nakshatra',
    Sagittarius: 'Thursday mornings, Jupiter hora, Purva Ashadha or Shravana nakshatra',
    Capricorn: 'Wednesday or Saturday mornings, Mercury hora',
    Aquarius: 'Wednesday or Saturday, Mercury or Saturn hora',
    Pisces: 'Thursday mornings, Jupiter hora, Revati or Uttara Bhadrapada nakshatra',
  }

  const MARRIAGE_TIMING: Record<string, string> = {
    Aries: 'Venus hora on Fridays, avoid Tuesdays. Best months: Vaishakh, Jyeshtha, Magha',
    Taurus: 'Venus hora on Fridays or Saturdays. Best months: Phalgun, Vaishakh',
    Gemini: 'Venus or Mercury hora on Wednesdays or Fridays. Avoid Saturdays',
    Cancer: 'Jupiter hora on Thursdays. Best months: Magha, Vaishakh, Phalguna',
    Leo: 'Jupiter or Sun hora. Avoid Saturn days. Best months: Kartik, Agrahayan',
    Virgo: 'Venus or Mercury hora on Wednesdays or Fridays',
    Libra: 'Venus hora on Fridays. Best months: Vaishakh, Jyeshtha, Phalguna',
    Scorpio: 'Jupiter hora on Thursdays. Avoid Tuesdays for ceremonies',
    Sagittarius: 'Jupiter hora on Thursdays. Best months: Magha, Phalguna, Vaishakh',
    Capricorn: 'Venus hora on Fridays or Saturdays',
    Aquarius: 'Venus hora on Fridays. Best months: Vaishakh, Jyeshtha',
    Pisces: 'Jupiter hora on Thursdays. Best months: Magha, Phalguna',
  }

  const INVESTMENT_TIMING: Record<string, string> = {
    Aries: 'Sundays (Sun hora) or Tuesdays (Mars hora). Avoid during Mars retrograde',
    Taurus: 'Fridays (Venus hora) or Saturdays (Saturn hora) for long-term investments',
    Gemini: 'Wednesdays (Mercury hora) for stocks and trading. Thursdays for long-term',
    Cancer: 'Mondays (Moon hora) for real estate. Thursdays for funds',
    Leo: 'Sundays (Sun hora) for equity. Thursdays (Jupiter hora) for gold',
    Virgo: 'Wednesdays (Mercury hora) for markets. Saturdays for property',
    Libra: 'Fridays (Venus hora) for luxury assets. Saturdays for long-term',
    Scorpio: 'Tuesdays (Mars hora) or Saturdays for speculative investments',
    Sagittarius: 'Thursdays (Jupiter hora) for all investments. Gold on Sundays',
    Capricorn: 'Saturdays (Saturn hora) for property. Wednesdays for business',
    Aquarius: 'Saturdays for long-term. Wednesdays for tech stocks',
    Pisces: 'Thursdays (Jupiter hora) for mutual funds. Fridays for art/luxury',
  }

  const HEALTH_TIMING: Record<string, string> = {
    Aries: 'Start health regimens on Tuesdays (Mars rules). Best fasting day: Tuesday',
    Taurus: 'Start health routines on Fridays. Gentle Venus-ruled practices',
    Gemini: 'Wednesdays for beginning new health habits. Breathing exercises are key',
    Cancer: 'Mondays for starting health routines. Moon-ruled cooling practices',
    Leo: 'Sundays for beginning health regimens. Heart health is primary focus',
    Virgo: 'Wednesdays and Saturdays for health routines. Digestive health focus',
    Libra: 'Fridays for gentle health practices. Kidney care is essential',
    Scorpio: 'Tuesdays for intense health practices. Deep detox protocols',
    Sagittarius: 'Thursdays for yoga and spiritual health. Liver care essential',
    Capricorn: 'Saturdays for discipline-based health routines. Bone and joint care',
    Aquarius: 'Saturdays for health. Circulatory system needs attention',
    Pisces: 'Thursdays for health. Feet and lymphatic system need regular care',
  }

  const TRAVEL_TIMING: Record<string, string> = {
    Aries: 'Tuesdays for short journeys. Thursdays for long and spiritual travel',
    Taurus: 'Fridays or Wednesdays for leisure. Saturdays for business travel',
    Gemini: 'Wednesdays are highly favorable. Thursdays for long journeys',
    Cancer: 'Mondays for short travel. Thursdays for pilgrimages',
    Leo: 'Sundays and Thursdays are favorable for all travel',
    Virgo: 'Wednesdays and Thursdays for travel. Avoid Saturdays',
    Libra: 'Fridays and Wednesdays. Best direction: East or North',
    Scorpio: 'Tuesdays for business. Thursdays for spiritual journeys',
    Sagittarius: 'Thursdays are ideal. Jupiter favors long-distance travel',
    Capricorn: 'Saturdays for business travel. Thursdays for pilgrimage',
    Aquarius: 'Saturdays and Wednesdays. Long journeys favored',
    Pisces: 'Thursdays and Mondays. Sea/river pilgrimages are auspicious',
  }

  const CAREER_TIMING: Record<string, string> = {
    Aries: 'Sundays and Tuesdays. New ventures: Mars hora on Tuesday morning',
    Taurus: 'Fridays and Saturdays. Career meetings: Venus hora',
    Gemini: 'Wednesdays for launches. Thursdays for presentations',
    Cancer: 'Mondays and Thursdays. New projects: Jupiter hora',
    Leo: 'Sundays and Thursdays. Promotions: Sun hora',
    Virgo: 'Wednesdays and Thursdays. Detail work and analysis best on Wednesdays',
    Libra: 'Fridays and Saturdays. Negotiations: Venus hora',
    Scorpio: 'Tuesdays and Thursdays. Transformative career moves: Mars hora',
    Sagittarius: 'Thursdays and Sundays. Expansion: Jupiter hora',
    Capricorn: 'Saturdays and Wednesdays. Long-term planning: Saturn hora',
    Aquarius: 'Saturdays and Thursdays. Innovation: Saturn or Jupiter hora',
    Pisces: 'Thursdays and Mondays. Spiritual career: Jupiter hora',
  }

  // Hora (planetary hour) chart — first hora of each day
  const HORA_ORDER: Record<string, string[]> = {
    Sunday: ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'],
    Monday: ['Moon', 'Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury'],
    Tuesday: ['Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter'],
    Wednesday: ['Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus'],
    Thursday: ['Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Saturn'],
    Friday: ['Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars', 'Sun'],
    Saturday: ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'],
  }

  // Key life moments timing
  const SPECIAL_DATES: Record<string, string[]> = {
    mostFavorable: [
      `Thursdays during ${moonSign} Moon transit — peak personal power`,
      `${luckyDays[0]}s during Shukla Paksha (waxing moon, 1st–14th lunar day)`,
      'Pushya Nakshatra day — universally auspicious for all beginnings',
      'Akshaya Tritiya (3rd day of Vaishakh Shukla) — eternal auspiciousness',
      'Guru Pushya Yoga (Pushya nakshatra on Thursday) — most powerful for wealth',
    ],
    avoidDays: [
      `${unluckyDays[0]}s during Rahu Kaal`,
      'Amavasya (New Moon) for new beginnings — powerful but volatile',
      'Saturdays for weddings and major contracts (unless Saturn-ruled lagna)',
      'During your dasha lord\'s debilitation transit',
      'Ashtami (8th lunar day) and Chaturdashi (14th) for beginnings',
    ],
    eclipsePeriod: 'Avoid all major decisions 3 days before and after solar/lunar eclipses',
  }

  return {
    overview: `Your Muhurta (auspicious timing) guide is personalized to your ${lagna} Lagna, ${moonSign} Moon, and ${dasha} Mahadasha. The right timing amplifies your efforts many fold — acting in alignment with cosmic rhythms is one of the most powerful tools of Vedic wisdom.`,
    luckyDays,
    unluckyDays,
    luckyTime: LUCKY_TIME[lagnaLord] || LUCKY_TIME.Jupiter,
    unluckyTime: `Rahu Kaal — varies by day (see chart below). Especially avoid on ${unluckyDays[0]}`,
    rahuKaalChart: RAHU_KAAL,
    horaGuide: {
      description: 'Each day is divided into 24 planetary hours (Hora). The first hora of each day is ruled by the day\'s planet. Subsequent horas follow a fixed sequence. Always begin important work in a favorable hora.',
      firstHoraByDay: Object.fromEntries(Object.entries(HORA_ORDER).map(([day, planets]) => [day, `${planets[0]} hora — ${LUCKY_TIME[planets[0]] || '6–7 AM'}`])),
    },
    forEducation: EDUCATION_TIMING[lagna] || 'Thursday mornings in Jupiter hora are universally auspicious for education',
    forMarriage: MARRIAGE_TIMING[lagna] || 'Friday mornings during Venus hora, Shukla Paksha',
    forInvestment: INVESTMENT_TIMING[lagna] || 'Thursday or Friday mornings for long-term investments',
    forHealth: HEALTH_TIMING[lagna] || 'Begin health regimens on auspicious weekday of lagna lord',
    forTravel: TRAVEL_TIMING[lagna] || 'Thursday is universally favorable for long journeys',
    forCareer: CAREER_TIMING[lagna] || 'Thursday mornings for career initiatives, Jupiter hora',
    forPropertyPurchase: `${['Cancer','Taurus','Capricorn','Scorpio'].includes(lagna) ? 'Highly favorable' : 'Proceed with care'} for property. Best day: Saturday (Saturn blesses permanent structures). Avoid during Rahu/Ketu periods.`,
    forNameCeremony: 'Pushya Nakshatra or the nakshatra of the ${moonSign} Moon are ideal for naming ceremonies',
    specialDates: SPECIAL_DATES,
    personalLuckyNumbers: numerology.luckyNumbers,
    personalLuckyDays: numerology.luckyDays,
    lifePath: lp,
    currentYearNote: `Personal Year ${numerology.personalYearNumber}: ${numerology.personalYearNumber <= 3 ? 'First half of year favors new beginnings' : numerology.personalYearNumber <= 6 ? 'Mid-year is your peak action window' : 'Last quarter brings completion and harvest'}`,
  }
}

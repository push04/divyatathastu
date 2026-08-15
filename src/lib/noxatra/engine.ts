import { calculateKundli, rahuKaalChart, BirthData } from './astrology'
import { calculateNumerology, calculateMobileNumber } from './numerology'
import { calculateChakras } from './chakra'
import { calculatePrakriti } from './prakriti'
import { calculateYantraColour } from './yantra'
import { calculateMantraGuidance } from './mantra'
import { getMantraLekhnan } from './mantraLekhnan'
import { seekerSignature, mix, pick, one } from './personalise'
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
  gotra: string | null
}

export async function generateReportData(
  member: FamilyMemberData,
  reportType: ReportType,
  vastu?: { homeDirection: string; sleepDirection: string }
): Promise<Record<string, unknown>> {
  // Coordinates decide the ascendant and the house cusps. When they are missing
  // we still generate, but the report must say so rather than silently present a
  // Delhi chart as the seeker's own.
  const coordinatesEstimated = member.birth_latitude == null || member.birth_longitude == null
  const lat = member.birth_latitude ?? 28.6139
  const lng = member.birth_longitude ?? 77.2090
  // Guard: time must be a valid HH:MM string
  const rawTime = member.time_of_birth ?? '12:00'
  const timeEstimated = !rawTime || !/^\d{1,2}:\d{2}/.test(rawTime)
  const time = timeEstimated ? '12:00' : rawTime
  // Guard: DOB must be a valid YYYY-MM-DD string
  const dob = member.date_of_birth ?? '2000-01-01'

  const dataQuality = {
    coordinatesEstimated,
    timeEstimated,
    ...(coordinatesEstimated && {
      coordinatesNote: `Birth coordinates for ${member.place_of_birth || 'the stated birthplace'} were not on record, so the chart was cast for Delhi (28.61 N, 77.21 E). The ascendant, house cusps and every house-based reading below should be treated as provisional until exact coordinates are supplied.`,
    }),
    ...(timeEstimated && {
      timeNote: 'An exact birth time was not on record, so noon was used. The Moon sign and nakshatra remain broadly reliable, but the ascendant and all house placements may shift materially once the true time is known.',
    }),
  } as Record<string, unknown>

  const birthData: BirthData = {
    date: dob,
    time,
    lat,
    lng,
    timezone: member.birth_timezone ?? 'Asia/Kolkata',
  }

  let kundli
  let approximateEphemeris = false
  try {
    kundli = calculateKundli(birthData)
  } catch {
    // The fallback is pure date-math: ~1-2 degree accuracy, and it derives the
    // ascendant from the Sun rather than the true lagna. Anything built on it
    // must be labelled, not presented at the precision the PDF disclaimer claims.
    approximateEphemeris = true
    try {
      kundli = getFallbackKundli(dob)
    } catch {
      kundli = getFallbackKundli('2000-01-01')
    }
  }

  switch (reportType) {
    case 'astrology':
      return {
        member: { name: member.full_name, dob: member.date_of_birth, pob: member.place_of_birth },
        kundli,
        analysis: getAstrologyAnalysis(kundli),
        dataQuality: { ...dataQuality, approximateEphemeris },
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
      const chakras = calculateChakras(kundli.nakshatra, kundli.planets, {
        nakshatra: kundli.nakshatra,
        pada: kundli.nakshatraPada,
        ascendant: kundli.ascendant,
        moonSign: kundli.moonSign,
        dashaLord: kundli.dashaLord,
        dob: member.date_of_birth,
        name: member.full_name,
      })
      return {
        member: { name: member.full_name, nakshatra: kundli.nakshatra },
        chakras,
        overallBalance: Math.round(chakras.reduce((s, c) => s + c.level, 0) / chakras.length),
      }
    }

    case 'prakriti': {
      const prakriti = calculatePrakriti(kundli.nakshatra, getBirthSeason(member.date_of_birth), {
          ascendant: kundli.ascendant,
          dashaLord: kundli.dashaLord,
          moonSign: kundli.moonSign,
          dob: member.date_of_birth,
          name: member.full_name,
        })
      return { member: { name: member.full_name }, prakriti }
    }

    case 'yantra_colour': {
      const yantra = calculateYantraColour(kundli.moonSign, kundli.ascendant, kundli.nakshatra)
      return { member: { name: member.full_name }, yantra }
    }

    case 'mantra_chanting': {
      const mantras = calculateMantraGuidance(kundli.dashaLord, kundli.nakshatra, kundli.ascendant, kundli.moonSign, kundli.nakshatraPada, kundli.planets)
      return { member: { name: member.full_name }, mantras, type: reportType }
    }

    case 'mantra_writing': {
      // Lagna nakshatra: derived from ascendant absolute ecliptic degree
      const NAKSHATRAS_LIST = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
        'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta',
        'Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Moola','Purva Ashadha',
        'Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada',
        'Uttara Bhadrapada','Revati']
      const nakSpan = 360 / 27
      const lagnaNakIdx = Math.floor(kundli.ascendantDegree / nakSpan) % 27
      const lagnaNakshatra = NAKSHATRAS_LIST[lagnaNakIdx]
      const lagnaPada = Math.floor((kundli.ascendantDegree % nakSpan) / (nakSpan / 4)) + 1
      const mantraLekhnan = getMantraLekhnan(lagnaNakshatra, lagnaPada)
      return {
        member: {
          name: member.full_name,
          dob: member.date_of_birth,
          tob: member.time_of_birth,
          pob: member.place_of_birth,
          lagna: kundli.ascendant,
          nakshatra: lagnaNakshatra,
          pada: lagnaPada,
          gotra: member.gotra,
        },
        mantraLekhnan,
        type: 'mantra_writing',
      }
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
        Promise.resolve(calculateChakras(kundli.nakshatra, kundli.planets, {
          nakshatra: kundli.nakshatra,
          pada: kundli.nakshatraPada,
          ascendant: kundli.ascendant,
          moonSign: kundli.moonSign,
          dashaLord: kundli.dashaLord,
          dob: member.date_of_birth,
          name: member.full_name,
        })),
        // Pass the birth season here too - omitting it made the full report's
        // prakriti differ from the standalone prakriti report for the same person.
        Promise.resolve(calculatePrakriti(kundli.nakshatra, getBirthSeason(member.date_of_birth), {
          ascendant: kundli.ascendant,
          dashaLord: kundli.dashaLord,
          moonSign: kundli.moonSign,
          dob: member.date_of_birth,
          name: member.full_name,
        })),
        Promise.resolve(calculateYantraColour(kundli.moonSign, kundli.ascendant, kundli.nakshatra)),
        Promise.resolve(calculateMantraGuidance(kundli.dashaLord, kundli.nakshatra, kundli.ascendant, kundli.moonSign, kundli.nakshatraPada, kundli.planets)),
        Promise.resolve(generatePsychologyReport(kundli)),
        Promise.resolve(generateVastuAnalysis(kundli, vastuInput)),
        Promise.resolve(generateDmitReport(kundli, member.date_of_birth)),
        Promise.resolve(generateColourTherapy(kundli)),
      ])
      // Lagna nakshatra for Likhit Japa (mantra writing) section
      const NAKSHATRAS_LIST_ML = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
        'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta',
        'Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Moola','Purva Ashadha',
        'Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati']
      const nakSpan = 360 / 27
      const lagnaNakIdx = Math.floor(kundli.ascendantDegree / nakSpan) % 27
      const lagnaNakshatra = NAKSHATRAS_LIST_ML[lagnaNakIdx]
      const lagnaPada = Math.floor((kundli.ascendantDegree % nakSpan) / (nakSpan / 4)) + 1
      const mantraLekhnan = getMantraLekhnan(lagnaNakshatra, lagnaPada)
      return {
        member,
        kundli,
        dataQuality: { ...dataQuality, approximateEphemeris },
        numerology,
        chakras,
        prakriti,
        yantra,
        mantras,
        mantraLekhnan,
        lekhnanMember: {
          name: member.full_name,
          dob: member.date_of_birth,
          tob: member.time_of_birth,
          pob: member.place_of_birth,
          lagna: kundli.ascendant,
          nakshatra: lagnaNakshatra,
          pada: lagnaPada,
          gotra: (member as any).gotra,
        },
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

// Re-export as a safe wrapper that never throws - callers always get data or an error object
export async function generateReportDataSafe(
  member: FamilyMemberData,
  reportType: ReportType,
  vastu?: { homeDirection: string; sleepDirection: string }
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  try {
    const data = await generateReportData(member, reportType, vastu)
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) }
  }
}

// Pure date-math fallback - used when astronomy-engine fails (edge dates, memory constraints, etc.)
// Positions are approximate (~1-2° accuracy), sufficient for all non-astronomy report types.
// Mirrors the exaltation/own-sign table in astrology.ts. Kept local so the
// fallback stays self-contained pure date-math with no ephemeris dependency.
const FALLBACK_DIGNITY = (name: string, rashiNum: number): string => {
  const EX: Record<string, number> = {
    Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6, Rahu: 1, Ketu: 7,
  }
  const OWN: Record<string, number[]> = {
    Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5],
    Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10], Rahu: [10], Ketu: [7],
  }
  const ex = EX[name]
  if (ex !== undefined) {
    if (rashiNum === ex) return 'exalted'
    if (rashiNum === (ex + 6) % 12) return 'debilitated'
  }
  if (OWN[name]?.includes(rashiNum)) return 'own'
  return 'neutral'
}

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
      // The fallback has no reliable Sun-distance, so combustion is not claimed.
      // Dignity is sign-based and is safe to derive here.
      dignity: FALLBACK_DIGNITY(name, rashiNum),
      combust: false,
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
    // The fallback is pure date-math and has no place data. Leaving these NaN
    // rather than defaulting to Delhi keeps the muhurta guide on its documented
    // fixed table instead of printing confident times for a place we never had.
    birthLat: NaN,
    birthLng: NaN,
    ayanamsa: 0,
    nakshatraLord: dashaLord,
    birthDate: dob,
  }
}

function getBirthSeason(dob: string): string {
  const month = new Date(dob).getMonth()
  return month >= 3 && month <= 5 ? 'summer' : month >= 6 && month <= 8 ? 'monsoon' : 'winter'
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
    Ashlesha: 'Ashlesha is the serpent star, associated with kundalini energy, deep psychology, and penetrating intelligence. You can see through facades and have strong healing or harming potential - your intensity must be channeled wisely.',
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

  // Gaj Kesari Yoga: Jupiter in a kendra (1st, 4th, 7th or 10th) COUNTED FROM the
  // Moon. Counting is inclusive, so the house difference must be 0, 3, 6 or 9.
  if (jupiter && moon) {
    const houseFromMoon = ((jupiter.house - moon.house + 12) % 12) + 1
    if ([1, 4, 7, 10].includes(houseFromMoon)) {
      const ordinal = houseFromMoon === 1 ? '1st' : `${houseFromMoon}th`
      yogas.push({ name: 'Gaj Kesari Yoga', description: `Jupiter sits in the ${ordinal} house from your Moon - a kendra. This bestows wisdom, fame, prosperity, and noble character, elevating the native to positions of respect and ensuring a long-lasting reputation.` })
    }
  }

  // Budha-Aditya Yoga: Sun and Mercury conjunct
  if (sun && mercury && sun.house === mercury.house) {
    yogas.push({ name: 'Budha-Aditya Yoga', description: 'Sun and Mercury in the same house - grants sharp intellect, communication skills, recognition in education or business, and a brilliant analytical mind.' })
  }

  // Chandra-Mangal Yoga: Moon and Mars conjunct or in 7th from each other
  if (moon && mars && (moon.house === mars.house || Math.abs(moon.house - mars.house) === 6)) {
    yogas.push({ name: 'Chandra-Mangal Yoga', description: 'Moon and Mars in combination - creates financial acumen, entrepreneurial spirit, and strong drive. The native earns through initiative and has a bold, action-oriented emotional nature.' })
  }

  // Lakshmi Yoga: Venus in own sign or exaltation in kendra/trikona from ascendant
  if (venus && [1, 4, 5, 7, 9, 10].includes(venus.house)) {
    const venusExalted = venus.rashi === 'Pisces'
    const venusOwn = ['Taurus', 'Libra'].includes(venus.rashi)
    if (venusExalted || venusOwn) {
      yogas.push({ name: 'Lakshmi Yoga', description: 'Venus strongly placed in a key house - bestows material abundance, artistic talent, beautiful relationships, and a life of refinement and prosperity.' })
    }
  }

  // Shasha Yoga: Saturn in own sign or exaltation in kendra
  if (saturn && [1, 4, 7, 10].includes(saturn.house)) {
    const saturnOwn = ['Capricorn', 'Aquarius'].includes(saturn.rashi)
    const saturnExalted = saturn.rashi === 'Libra'
    if (saturnOwn || saturnExalted) {
      yogas.push({ name: 'Shasha Yoga (Panch Mahapurusha)', description: 'Saturn strongly placed in a kendra in own or exalted sign - grants exceptional discipline, organizational mastery, longevity, and the ability to achieve through sustained effort.' })
    }
  }

  // Ruchaka Yoga: Mars in own/exalt in kendra
  if (mars && [1, 4, 7, 10].includes(mars.house)) {
    const marsOwn = ['Aries', 'Scorpio'].includes(mars.rashi)
    const marsExalted = mars.rashi === 'Capricorn'
    if (marsOwn || marsExalted) {
      yogas.push({ name: 'Ruchaka Yoga (Panch Mahapurusha)', description: 'Mars powerfully placed - blesses with extraordinary physical strength, courage, leadership in military or competitive fields, and a pioneering spirit that overcomes all obstacles.' })
    }
  }

  // Hamsa Yoga: Jupiter in own/exalt in kendra
  if (jupiter && [1, 4, 7, 10].includes(jupiter.house)) {
    const jupOwn = ['Sagittarius', 'Pisces'].includes(jupiter.rashi)
    const jupExalted = jupiter.rashi === 'Cancer'
    if (jupOwn || jupExalted) {
      yogas.push({ name: 'Hamsa Yoga (Panch Mahapurusha)', description: 'Jupiter magnificently placed - bestows wisdom, spirituality, higher education success, ethical leadership, and a life path aligned with dharma and higher truth.' })
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

  // The seeker's own home and sleeping directions were being collected on the
  // form and then discarded, so two people with different homes received the
  // same Vastu reading. Assess what they actually reported.
  const assessment = vastu ? assessReportedVastu(kundli, vastu, powerDirections) : null

  return {
    currentDashaLord: lordPlanet,
    powerDirections: powerDirections.length ? powerDirections : ['East', 'North'],
    ...(assessment && { yourHome: assessment }),
    entrance: getEntranceRecommendation(kundli.ascendant),
    bedroom: getBedroomDirection(kundli.moonSign),
    studyRoom: getStudyDirection(kundli),
    kitchen: getKitchenDirection(kundli),
    prayerRoom: getPrayerDirection(kundli.dashaLord),
    colors: getVastuColors(kundli.ascendant),
    plants: getVastuPlants(lordPlanet, seekerSignature([
      kundli.ascendant, kundli.moonSign, kundli.nakshatra,
      kundli.nakshatraPada, lordPlanet,
    ])),
    remedies: getVastuRemedies(kundli),
  }
}

// Grades the seeker's reported house facing and sleeping direction against their
// own chart, rather than restating generic rules.
function assessReportedVastu(
  kundli: any,
  vastu: { homeDirection: string; sleepDirection: string },
  powerDirections: string[],
) {
  const norm = (d: string) => (d || '').trim()
  const home = norm(vastu.homeDirection)
  const sleep = norm(vastu.sleepDirection)

  const FAVOURABLE_FACING: Record<string, string[]> = {
    Aries: ['East', 'North'], Taurus: ['North', 'East'], Gemini: ['North', 'NE'],
    Cancer: ['NE', 'North'], Leo: ['East', 'NE'], Virgo: ['North', 'East'],
    Libra: ['East', 'North'], Scorpio: ['NW', 'North'], Sagittarius: ['NE', 'East'],
    Capricorn: ['West', 'South'], Aquarius: ['West', 'North'], Pisces: ['NE', 'East'],
  }
  const favoured = FAVOURABLE_FACING[kundli.ascendant] || ['East', 'North']

  const homeVerdict = !home
    ? 'No house facing was recorded, so this could not be assessed for your chart.'
    : favoured.some(f => f.toLowerCase() === home.toLowerCase())
    ? `Your ${home}-facing home is well matched to your ${kundli.ascendant} Lagna - this is one of the two most supportive facings for you, and no corrective is needed.`
    : powerDirections.some(d => d.toLowerCase() === home.toLowerCase())
    ? `Your ${home}-facing home is not a classical match for your ${kundli.ascendant} Lagna, but it is the direction of ${kundli.dashaLord}, your running dasha lord - so it works in your favour for the length of this period. Keep that sector especially clean and well-lit.`
    : `Your ${home}-facing home is not among the favourable facings for your ${kundli.ascendant} Lagna (which are ${favoured.join(' and ')}). This is correctable without moving: strengthen the ${favoured[0]} sector of the house with light, a water feature or a live plant, and keep the main entrance area uncluttered and brightly lit.`

  // Head-to-South is best for all; head-to-North is the one universally to avoid.
  const sleepVerdict = !sleep
    ? 'No sleeping direction was recorded, so this could not be assessed.'
    : /north/i.test(sleep) && !/north.?east|north.?west|ne\b|nw\b/i.test(sleep)
    ? `You reported sleeping with your head to the ${sleep}. This is the one orientation classical Vastu asks everyone to avoid, and with your ${kundli.moonSign} Moon it particularly disturbs rest. Turning the bed so the head points South or East is the single highest-value change you can make.`
    : /south/i.test(sleep)
    ? `Sleeping with your head to the ${sleep} is the strongest orientation in Vastu and suits your ${kundli.moonSign} Moon well. No change needed.`
    : /east/i.test(sleep)
    ? `Sleeping with your head to the ${sleep} is favourable, especially for study and concentration. With your ${kundli.moonSign} Moon this supports early waking.`
    : `You reported sleeping with your head to the ${sleep}. This is workable but not optimal - South or East would serve your ${kundli.moonSign} Moon better.`

  return {
    reportedHomeDirection: home || null,
    reportedSleepDirection: sleep || null,
    homeFacingVerdict: homeVerdict,
    sleepDirectionVerdict: sleepVerdict,
    favourableFacingsForYou: favoured,
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
    Aries: 'South or South-West bedroom with head pointing East - the East orientation cools an over-active Aries Moon',
    Taurus: 'South-West bedroom with head pointing South - the heaviest, most settling placement, which suits a Taurus Moon',
    Gemini: 'West or South bedroom with head pointing South - keep the room uncluttered, as a Gemini Moon sleeps poorly amid visual noise',
    Cancer: 'South-West bedroom with head pointing South - never sleep with the head to the North, which disturbs a Cancer Moon most of all',
    Leo: 'East or South bedroom with head pointing East - a Leo Moon rests best with morning light reaching the room',
    Virgo: 'South or West bedroom with head pointing South - a scrupulously clean, low-stimulus room matters more for a Virgo Moon than the direction itself',
    Libra: 'South-West or West bedroom with head pointing South-West - paired, symmetrical furnishing settles a Libra Moon',
    Scorpio: 'South bedroom with head pointing South, and avoid the North entirely while sleeping - a Scorpio Moon is the most sensitive to this fault',
    Sagittarius: 'East or South bedroom with head pointing East - avoid sleeping directly under a beam, which restricts a Sagittarius Moon',
    Capricorn: 'South-West or West bedroom with head pointing South - solid, closed storage under or near the bed suits a Capricorn Moon',
    Aquarius: 'West or South-West bedroom with head pointing South - keep electronics out of the room, as an Aquarius Moon over-stimulates easily',
    Pisces: 'South-West bedroom with head pointing South or East for emotional stability - avoid mirrors facing the bed, which most disturb a Pisces Moon',
  }
  return map[moonSign] || 'South-West bedroom with head pointing South or East for best sleep quality'
}

function getStudyDirection(kundli: any): string {
  // The direction to face while studying is taken from the 5th-house significator
  // (Jupiter) and the lagna element; the desk placement follows the lagna lord.
  const FIRE = ['Aries', 'Leo', 'Sagittarius']
  const EARTH = ['Taurus', 'Virgo', 'Capricorn']
  const AIR = ['Gemini', 'Libra', 'Aquarius']
  const facing = FIRE.includes(kundli.ascendant) ? 'East'
    : EARTH.includes(kundli.ascendant) ? 'North'
    : AIR.includes(kundli.ascendant) ? 'North-East'
    : 'East'
  const room = FIRE.includes(kundli.ascendant) ? 'East or North-East'
    : EARTH.includes(kundli.ascendant) ? 'North or North-East'
    : AIR.includes(kundli.ascendant) ? 'North-East or West'
    : 'North-East'
  const caution = FIRE.includes(kundli.ascendant)
    ? 'Keep the desk clear of clutter - a fiery lagna loses focus in visual noise.'
    : EARTH.includes(kundli.ascendant)
    ? 'Use a solid, heavy desk with closed storage - an earth lagna concentrates better with weight behind it.'
    : AIR.includes(kundli.ascendant)
    ? 'Keep a window in view but not directly ahead - an air lagna needs airflow without a distracting sightline.'
    : 'Avoid studying with your back to the door - a water lagna feels the exposure and cannot settle.'
  return `For your ${kundli.ascendant} Lagna, place the study in the ${room} sector and sit facing ${facing} while working. ${caution} Keep a Saraswati image in the North-East corner of the room, and a ${kundli.dashaLord === 'Mercury' ? 'green' : kundli.dashaLord === 'Jupiter' ? 'yellow' : 'white'} lamp on the desk for your running ${kundli.dashaLord} period.`
}

function getKitchenDirection(kundli: any): string {
  // South-East (Agni kona) is the classical rule for every chart; what changes by
  // chart is the cooking orientation and the corrective when SE is unavailable.
  const HOT = ['Sun', 'Mars', 'Ketu'].includes(kundli.dashaLord)
  return `South-East (Agni corner) is the ideal kitchen placement, with the cook facing East while at the stove. If South-East is not available, North-West is the accepted alternative - never place the kitchen in the North-East. ${
    HOT
      ? `Your running ${kundli.dashaLord} dasha already carries strong fire, so keep the kitchen well-ventilated, store water in the North-East of the kitchen, and avoid a red colour scheme in this room.`
      : `Your running ${kundli.dashaLord} dasha is not fire-dominant, so warm tones - terracotta, orange, or warm yellow - in the kitchen will strengthen the Agni element for you.`
  }`
}

// getPrayerDirection returns a full descriptive sentence, which cannot be
// interpolated mid-clause. This is the bare direction for that purpose.
const PRAYER_DIRECTION: Record<string, string> = {
  Sun: 'East', Moon: 'North-West', Mars: 'South-East', Mercury: 'North',
  Jupiter: 'North-East', Venus: 'South-East', Saturn: 'West',
  Rahu: 'South-West', Ketu: 'North-West',
}

function prayerDirectionOf(lord: string): string {
  return PRAYER_DIRECTION[lord] || 'North-East'
}

function getPrayerDirection(lord: string): string {
  const map: Record<string, string> = {
    Sun: 'East-facing prayer room with gold and saffron decor - offer arghya (water) to the rising Sun from this spot each morning',
    Moon: 'North-West prayer room with white and silver decor - keep a silver vessel of water on the altar and change it on Mondays',
    Mars: 'South or South-East prayer room with red and copper decor - a Hanuman image facing South is the strongest placement for you',
    Mercury: 'North prayer room with green and light decor - keep sacred texts on the altar, as Mercury is worshipped through study',
    Jupiter: 'North-East prayer room with yellow and gold decor - the classical Ishaan corner, and the single best placement of all',
    Venus: 'South-East prayer room with white and pink decor - fresh flowers and a lit ghee lamp daily are essential for you',
    Saturn: 'West prayer room with dark blue and iron accents - light a sesame-oil lamp here every Saturday evening without fail',
    Rahu: 'South-West prayer room, kept deliberately spare and dark-toned - a Durga or Bhairava image anchors this corner for you',
    Ketu: 'North-West or a separate quiet corner in brown and earth tones - a Ganesha image and complete silence suit Ketu worship',
  }
  return map[lord] || 'North-East corner of the house is ideal for the prayer room'
}

function getVastuColors(ascendant: string): Record<string, string> {
  const map: Record<string, Record<string, string>> = {
    Aries: { livingRoom: 'Warm white or cream', bedroom: 'Light pink or peach', study: 'Light yellow' },
    Taurus: { livingRoom: 'Light green or white', bedroom: 'Pink or cream', study: 'Light blue' },
    Gemini: { livingRoom: 'Pale green or off-white', bedroom: 'Soft mint or ivory', study: 'Light yellow or white' },
    Cancer: { livingRoom: 'Pearl white or pale cream', bedroom: 'Soft silver or pale blue', study: 'White with light wood' },
    Leo: { livingRoom: 'Golden yellow or warm white', bedroom: 'Orange or peach', study: 'Golden' },
    Virgo: { livingRoom: 'Off-white or pale sage', bedroom: 'Muted green or oatmeal', study: 'Crisp white' },
    Libra: { livingRoom: 'White or light blue', bedroom: 'Pink or rose', study: 'White' },
    Scorpio: { livingRoom: 'Warm cream with deep red accents', bedroom: 'Deep teal or muted maroon', study: 'Cool white or slate' },
    Sagittarius: { livingRoom: 'Light yellow or cream', bedroom: 'Blue-green', study: 'Yellow' },
    Capricorn: { livingRoom: 'Stone grey or warm beige', bedroom: 'Deep green or slate blue', study: 'Off-white with dark wood' },
    Aquarius: { livingRoom: 'Cool white or pale blue', bedroom: 'Periwinkle or soft grey', study: 'Electric blue accents on white' },
    Pisces: { livingRoom: 'Sea green or soft ivory', bedroom: 'Lavender or misty blue', study: 'Pale aqua or white' },
  }
  return map[ascendant] || { livingRoom: 'Neutral warm tones', bedroom: 'Soft earth tones', study: 'Light and bright' }
}

function getVastuPlants(planet: string, sig = 0): string[] {
  const map: Record<string, string[]> = {
    Sun: ['Red hibiscus (offer to Surya)', 'Sunflower', 'Bael tree', 'Marigold', 'Ruby-red bougainvillea', 'Ashoka tree'],
    Moon: ['Chameli', 'Lily', 'White orchid', 'Night-blooming jasmine', 'Moonflower', 'White champa'],
    Mars: ['Red hibiscus', 'Neem', 'Anantmool', 'Red rose', 'Khair', 'Red oleander'],
    Mercury: ['Tulsi (must have)', 'Money plant', 'Lucky bamboo', 'Green fern', 'Curry leaf', 'Mint'],
    Jupiter: ['Banana tree', 'Ashwagandha', 'Turmeric plant', 'Peepal (outdoors only)', 'Yellow champa', 'Mango sapling'],
    Venus: ['Rose', 'Jasmine', 'Mogra', 'White lotus', 'Gardenia', 'Parijat'],
    Saturn: ['Shami tree', 'Black tulsi', 'Sesame', 'Aloe vera', 'Jamun', 'Iron-wood sapling'],
    Rahu: ['Durva grass', 'Coconut palm', 'Snake plant', 'Chandan (sandalwood)', 'Areca palm', 'Vetiver'],
    Ketu: ['Ashwagandha', 'Brahmi', 'Kusha grass', 'Peace lily', 'Vetiver', 'Bel patra'],
  }
  const pool = map[planet] || ['Tulsi', 'Money plant', 'Lucky bamboo', 'Peace lily', 'Areca palm', 'Snake plant']
  return pick(pool, 4, mix(sig, 'plant'))
}

function getVastuRemedies(kundli: any): string[] {
  const YANTRA_BY_LORD: Record<string, string> = {
    Sun: 'Surya Yantra', Moon: 'Chandra Yantra', Mars: 'Mangal Yantra',
    Mercury: 'Budha Yantra', Jupiter: 'Guru Yantra', Venus: 'Shukra Yantra',
    Saturn: 'Shani Yantra', Rahu: 'Rahu Yantra', Ketu: 'Ketu Yantra',
  }
  // Each dasha lord owns a direction; that corner is the one this native must
  // treat as the working centre of the house for the length of the period.
  const LORD_DIRECTION: Record<string, string> = {
    Sun: 'East', Moon: 'North-West', Mars: 'South', Mercury: 'North',
    Jupiter: 'North-East', Venus: 'South-East', Saturn: 'West',
    Rahu: 'South-West', Ketu: 'North-West',
  }
  const lord = kundli.dashaLord
  const dir = LORD_DIRECTION[lord] || 'North-East'
  const HEAVY = ['Saturn', 'Rahu', 'Ketu'].includes(lord)

  // Which house the dasha lord actually occupies, and which grahas sit in the
  // dusthanas, are chart-specific and were previously ignored here - so two
  // seekers sharing a lagna, Moon and dasha lord got an identical vastu page.
  const planets = (kundli.planets || []) as Array<{ name: string; house: number; retrograde?: boolean }>
  const lordPlanet = planets.find(pl => pl.name === lord)
  const lordHouse = lordPlanet?.house ?? 0
  const HOUSE_ROOM: Record<number, string> = {
    1: 'the main entrance', 2: 'the kitchen and store', 3: 'the corridor and stairs',
    4: 'the living room', 5: 'the children\'s room or study', 6: 'the utility and service area',
    7: 'the master bedroom', 8: 'the bathroom and drains', 9: 'the prayer room',
    10: 'the work or office space', 11: 'the guest room', 12: 'the bedroom furthest from the entrance',
  }
  const room = HOUSE_ROOM[lordHouse] || 'the main living space'
  const afflicted = planets.filter(pl => [6, 8, 12].includes(pl.house)).map(pl => pl.name)

  return [
    `Install a ${YANTRA_BY_LORD[lord] || 'Navgraha Yantra'} in the ${prayerDirectionOf(lord)} prayer area - your ${lord} dasha makes this the single most effective installation for you now`,
    `Keep the ${dir} sector of your home - the direction ruled by your ${lord} dasha lord - clean, well-lit, and free of storage for the duration of this period`,
    HEAVY
      ? `Place an iron or dark stone object in the South-West and a bowl of rock salt in the ${dir} sector; replace the salt weekly while your ${lord} period runs`
      : `Place a Vastu Pyramid in the South-West corner and keep a live plant in the ${dir} sector to circulate your ${lord} energy`,
    // Mirror and Ishaan guidance is universal doctrine, so it is anchored to
    // this chart's own placements rather than printed as the same two lines.
    `Keep mirrors out of the bedroom and off any wall facing the entrance; with ${kundli.moonSign} on the Moon, reflected light in the sleeping area disturbs your rest more than most`,
    `Keep the North-East (Ishaan) corner clean, unstored and lit - for your ${kundli.ascendant} lagna, put the water source or the study there to draw on it`,
    VASTU_AMBIENCE[lord] || VASTU_AMBIENCE.Jupiter,
    `Your ${lord} dasha lord occupies the ${lordHouse}th house, which maps to ${room} - give that space the most attention this period, and keep it the best-maintained room in the house`,
    afflicted.length
      ? `${afflicted.join(', ')} ${afflicted.length > 1 ? 'sit' : 'sits'} in your dusthana houses, so keep the South-West and the drainage lines of the house scrupulously maintained - leaks and blockages there aggravate exactly those placements`
      : 'No graha occupies your 6th, 8th or 12th houses, which is unusually clean - ordinary vastu upkeep is enough for you, without special corrective measures',
  ]
}

// One line per graha, so this resolves nine ways rather than the two the old
// benefic/malefic split produced.
const VASTU_AMBIENCE: Record<string, string> = {
  Sun: 'Keep the East windows unobstructed and let first light into the main room - a Sun period is fed by direct morning light more than by any object',
  Moon: 'Keep a covered water vessel in the North-East and refresh it daily; a Moon period settles through still, clean water in the house',
  Mars: 'Hang a copper or brass bell at the South entrance and ring it once at dusk - a Mars period needs its heat discharged, not contained',
  Mercury: 'Keep a live green plant and your books together in the North; a Mercury period strengthens where study and greenery share a corner',
  Jupiter: 'Hang wind chimes in the North or North-West for positive energy flow, and keep the North-East open and uncluttered',
  Venus: 'Keep fresh flowers in the South-East and replace them before they wilt - a Venus period is diminished by anything decaying on display',
  Saturn: 'Avoid wind chimes and reflective decor while a Saturn period runs - they scatter energy this period needs kept still; keep the West heavy and plain',
  Rahu: 'Remove mirrors from the South-West and keep that corner weighted and dim - a Rahu period worsens where reflections multiply',
  Ketu: 'Keep the North-West spare and burn sandal or camphor there at dusk - a Ketu period asks for emptiness rather than additions',
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

  // What each Moon sign is actually seeking. This was a two-branch ternary, so
  // eleven of the twelve signs were told they seek "achievement and recognition".
  const SEEKS: Record<string, string> = {
    Aries: 'autonomy and a challenge worth winning',
    Taurus: 'security, comfort and things that do not change',
    Gemini: 'stimulation and someone to think aloud with',
    Cancer: 'security and belonging',
    Leo: 'recognition and the sense of being someone\'s favourite',
    Virgo: 'order, usefulness and work done properly',
    Libra: 'harmony and a partner to balance against',
    Scorpio: 'depth, loyalty and knowing where you truly stand',
    Sagittarius: 'freedom, meaning and room to move',
    Capricorn: 'achievement and recognition',
    Aquarius: 'independence and a cause larger than yourself',
    Pisces: 'union, beauty and relief from the world\'s hard edges',
  }

  // The Moon's own placement - its nakshatra, its house, and whatever sits with
  // it - is the most psychologically specific thing in the chart, and none of it
  // was being read. Two people sharing a Moon sign and lagna got identical text.
  const planets = (kundli.planets || []) as Array<{ name: string; house: number; rashiNum: number; retrograde?: boolean }>
  const moon = planets.find(pl => pl.name === 'Moon')
  const moonHouse = moon?.house ?? 0
  const withMoon = planets.filter(pl => pl.name !== 'Moon' && moon && pl.rashiNum === moon.rashiNum).map(pl => pl.name)

  const HOUSE_EMOTION: Record<number, string> = {
    1: 'your feelings are visible on you before you have decided to share them',
    2: 'your sense of security is tied to money and to the family you came from',
    3: 'you process by talking, and go quiet only when genuinely hurt',
    4: 'home and mother remain the emotional centre of gravity your whole life',
    5: 'you feel through creating, and through children or the things you make',
    6: 'you handle feeling by working; unprocessed emotion shows up in the body first',
    7: 'you know your own mood best by watching how you are with a partner',
    8: 'your emotional life runs underground - little of it reaches the surface',
    9: 'you need a belief or philosophy to hold the feeling in, or it has nowhere to go',
    10: 'your emotional state and your public standing are hard for you to separate',
    11: 'friendships and networks regulate you more than family does',
    12: 'you need solitude to feel at all, and crowds cost you more than they cost others',
  }

  const CONJUNCT: Record<string, string> = {
    Sun: 'The Sun sits with your Moon, so identity and emotion are fused - you take disagreement with your views as personal rejection.',
    Mars: 'Mars sits with your Moon, giving emotion a short fuse and a fast recovery; anger arrives before you have decided to be angry.',
    Mercury: 'Mercury sits with your Moon, so you analyse feelings as they happen - useful, but it can substitute explaining for actually feeling.',
    Jupiter: 'Jupiter sits with your Moon (Gajakesari-like), giving natural optimism and emotional generosity that others lean on.',
    Venus: 'Venus sits with your Moon, so beauty, comfort and affection are not luxuries for you - they are how you regulate.',
    Saturn: 'Saturn sits with your Moon, which weights the emotional life: you mature early, feel responsible for others, and struggle to ask for help.',
    Rahu: 'Rahu sits with your Moon, amplifying and distorting feeling - your reactions can be larger than the event that caused them.',
    Ketu: 'Ketu sits with your Moon, producing detachment from your own emotions; you observe them rather than inhabit them.',
  }

  const conjunctionNote = withMoon.length
    ? withMoon.map(n => CONJUNCT[n]).filter(Boolean).join(' ')
    : 'No graha sits with your Moon, so your emotional nature runs in its own sign-character without another planet colouring it.'

  // Saturn and Mars are the two grahas that most shape defensive behaviour, and
  // their houses vary independently of the Moon sign - so reading them lifts
  // this section off the sign-level ceiling it otherwise sits at.
  const saturn = planets.find(pl => pl.name === 'Saturn')
  const mars = planets.find(pl => pl.name === 'Mars')
  const SATURN_FEAR: Record<number, string> = {
    1: 'being seen as inadequate in your own person', 2: 'running out of money or being unable to provide',
    3: 'being outdone by a sibling or peer', 4: 'never having a home that feels secure',
    5: 'failing your children, or having none', 6: 'illness and the loss of your own capacity',
    7: 'being left, or being trapped in the wrong partnership', 8: 'sudden loss you did not see coming',
    9: 'discovering your beliefs were misplaced', 10: 'public failure and a damaged name',
    11: 'being outside the group that matters to you', 12: 'isolation, and what surfaces in it',
  }
  const MARS_DEFENCE: Record<number, string> = {
    1: 'you meet threat head-on and immediately', 2: 'you defend by tightening control over resources',
    3: 'you defend by arguing, and you argue to win', 4: 'you withdraw to home ground before you fight',
    5: 'you defend what you have made more fiercely than you defend yourself',
    6: 'you turn conflict into work and grind opponents down', 7: 'you provoke a partner into showing their hand',
    8: 'you go silent and wait, then act once and decisively', 9: 'you defend by appeal to principle',
    10: 'you defend your standing before you defend your feelings', 11: 'you gather allies before responding',
    12: 'you avoid open conflict and act indirectly, sometimes against your own interest',
  }
  const defenceProfile = [
    saturn?.house ? `Saturn in your ${saturn.house}th house sets the deepest fear: ${SATURN_FEAR[saturn.house]}.` : '',
    mars?.house ? `Mars in your ${mars.house}th house sets the defence: ${MARS_DEFENCE[mars.house]}.` : '',
  ].filter(Boolean).join(' ')

  return {
    moonPersonalityType: moonPsych.type,
    coreTrait: moonPsych.traits,
    emotionalPatterns: `As a ${kundli.moonSign} Moon native in ${kundli.nakshatra} nakshatra, your emotional world is defined by ${(moonPsych.traits as string[]).slice(0, 2).join(' and ')}. You seek ${SEEKS[kundli.moonSign] || 'achievement and recognition'}.`,
    moonPlacement: moonHouse
      ? `Your Moon occupies the ${moonHouse}th house, which means ${HOUSE_EMOTION[moonHouse] || 'your emotional life follows that house\'s affairs closely'}.`
      : undefined,
    moonConjunctions: conjunctionNote,
    ...(defenceProfile && { fearAndDefence: defenceProfile }),
    stressTriggers: `Primary stress triggers: ${moonPsych.stress}. When under stress, you tend to ${getStressBehavior(kundli.moonSign)}.`,
    relationshipStyle: `In relationships: ${moonPsych.relationship}`,
    growthEdge: `Your greatest growth opportunity: ${moonPsych.growth}`,
    cognitiveStyle: getCognitiveStyle(kundli.ascendant),
    emotionalIntelligence: getEQProfile(kundli.moonSign, kundli),
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

function getEQProfile(moonSign: string, kundli?: any): object {
  // Moon sign sets the baseline; the planets aspecting or joining the Moon and
  // the running dasha lord shift each facet, so two natives with the same Moon
  // sign do not receive an identical profile.
  const score: Record<string, number> = {
    selfAwareness: ['Cancer', 'Pisces', 'Libra', 'Taurus'].includes(moonSign) ? 2 : 1,
    empathy: ['Cancer', 'Pisces', 'Libra'].includes(moonSign) ? 2 : 1,
    emotionalRegulation: ['Capricorn', 'Aquarius', 'Virgo'].includes(moonSign) ? 2 : 0,
    socialSkills: ['Leo', 'Libra', 'Gemini', 'Sagittarius'].includes(moonSign) ? 2 : 1,
    motivation: ['Aries', 'Capricorn', 'Leo', 'Scorpio'].includes(moonSign) ? 2 : 1,
  }

  const planets = kundli?.planets || []
  const moon = planets.find((p: any) => p.name === 'Moon')
  if (moon) {
    for (const p of planets) {
      if (p.name === 'Moon' || p.house !== moon.house) continue
      // Planets conjunct the Moon colour the emotional body directly.
      if (p.name === 'Jupiter') { score.selfAwareness++; score.empathy++ }
      if (p.name === 'Saturn') { score.emotionalRegulation++; score.socialSkills-- }
      if (p.name === 'Mars') { score.motivation++; score.emotionalRegulation-- }
      if (p.name === 'Venus') { score.socialSkills++; score.empathy++ }
      if (p.name === 'Mercury') { score.selfAwareness++ }
      if (p.name === 'Sun') { score.motivation++ }
      if (p.name === 'Rahu' || p.name === 'Ketu') { score.emotionalRegulation--; score.selfAwareness++ }
    }
    // A Moon in a dusthana (6th, 8th, 12th) makes regulation harder to come by.
    if ([6, 8, 12].includes(moon.house)) score.emotionalRegulation--
    if ([1, 4, 7, 10].includes(moon.house)) score.socialSkills++
  }
  if (kundli?.dashaLord === 'Saturn' || kundli?.dashaLord === 'Ketu') score.emotionalRegulation++
  if (kundli?.dashaLord === 'Jupiter') score.selfAwareness++

  const label = (n: number) => n >= 3 ? 'Very High' : n === 2 ? 'High' : n === 1 ? 'Moderate' : 'Developing'
  return {
    selfAwareness: label(score.selfAwareness),
    empathy: label(score.empathy),
    emotionalRegulation: label(score.emotionalRegulation),
    socialSkills: label(score.socialSkills),
    motivation: label(score.motivation),
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

// Baseline aptitude profile for all 27 nakshatras. Every nakshatra is listed
// explicitly - there is no hash-derived filler, which produced arbitrary numbers
// presented to the seeker as an assessment.
const NAKSHATRA_INTEL: Record<string, Record<string, number>> = {
  'Ashwini':            { linguistic: 60, logical: 70, spatial: 65, kinesthetic: 80, musical: 50, interpersonal: 65, intrapersonal: 60, naturalistic: 75 },
  'Bharani':            { linguistic: 65, logical: 60, spatial: 70, kinesthetic: 75, musical: 70, interpersonal: 60, intrapersonal: 70, naturalistic: 65 },
  'Krittika':           { linguistic: 70, logical: 80, spatial: 70, kinesthetic: 70, musical: 55, interpersonal: 60, intrapersonal: 65, naturalistic: 60 },
  'Rohini':             { linguistic: 75, logical: 60, spatial: 70, kinesthetic: 55, musical: 80, interpersonal: 85, intrapersonal: 65, naturalistic: 60 },
  'Mrigashira':         { linguistic: 78, logical: 70, spatial: 68, kinesthetic: 62, musical: 75, interpersonal: 70, intrapersonal: 65, naturalistic: 72 },
  'Ardra':              { linguistic: 80, logical: 85, spatial: 65, kinesthetic: 50, musical: 55, interpersonal: 60, intrapersonal: 75, naturalistic: 50 },
  'Punarvasu':          { linguistic: 82, logical: 68, spatial: 60, kinesthetic: 58, musical: 70, interpersonal: 78, intrapersonal: 75, naturalistic: 68 },
  'Pushya':             { linguistic: 70, logical: 65, spatial: 60, kinesthetic: 60, musical: 65, interpersonal: 80, intrapersonal: 80, naturalistic: 70 },
  'Ashlesha':           { linguistic: 72, logical: 82, spatial: 62, kinesthetic: 55, musical: 58, interpersonal: 68, intrapersonal: 85, naturalistic: 65 },
  'Magha':              { linguistic: 75, logical: 70, spatial: 80, kinesthetic: 75, musical: 65, interpersonal: 70, intrapersonal: 65, naturalistic: 60 },
  'Purva Phalguni':     { linguistic: 72, logical: 58, spatial: 72, kinesthetic: 70, musical: 82, interpersonal: 80, intrapersonal: 60, naturalistic: 58 },
  'Uttara Phalguni':    { linguistic: 74, logical: 68, spatial: 65, kinesthetic: 68, musical: 65, interpersonal: 82, intrapersonal: 68, naturalistic: 62 },
  'Hasta':              { linguistic: 76, logical: 72, spatial: 82, kinesthetic: 88, musical: 68, interpersonal: 72, intrapersonal: 60, naturalistic: 65 },
  'Chitra':             { linguistic: 65, logical: 75, spatial: 90, kinesthetic: 70, musical: 60, interpersonal: 65, intrapersonal: 55, naturalistic: 55 },
  'Swati':              { linguistic: 78, logical: 72, spatial: 66, kinesthetic: 65, musical: 78, interpersonal: 75, intrapersonal: 70, naturalistic: 68 },
  'Vishakha':           { linguistic: 80, logical: 75, spatial: 60, kinesthetic: 65, musical: 60, interpersonal: 80, intrapersonal: 70, naturalistic: 55 },
  'Anuradha':           { linguistic: 70, logical: 72, spatial: 62, kinesthetic: 62, musical: 72, interpersonal: 88, intrapersonal: 75, naturalistic: 60 },
  'Jyeshtha':           { linguistic: 78, logical: 78, spatial: 65, kinesthetic: 68, musical: 62, interpersonal: 75, intrapersonal: 72, naturalistic: 55 },
  'Moola':              { linguistic: 72, logical: 80, spatial: 62, kinesthetic: 65, musical: 60, interpersonal: 58, intrapersonal: 85, naturalistic: 82 },
  'Purva Ashadha':      { linguistic: 85, logical: 68, spatial: 62, kinesthetic: 70, musical: 72, interpersonal: 78, intrapersonal: 65, naturalistic: 70 },
  'Uttara Ashadha':     { linguistic: 72, logical: 78, spatial: 68, kinesthetic: 75, musical: 60, interpersonal: 72, intrapersonal: 75, naturalistic: 65 },
  'Shravana':           { linguistic: 85, logical: 70, spatial: 65, kinesthetic: 55, musical: 80, interpersonal: 75, intrapersonal: 75, naturalistic: 60 },
  'Dhanishtha':         { linguistic: 70, logical: 72, spatial: 70, kinesthetic: 78, musical: 88, interpersonal: 78, intrapersonal: 60, naturalistic: 58 },
  'Shatabhisha':        { linguistic: 68, logical: 85, spatial: 72, kinesthetic: 55, musical: 62, interpersonal: 55, intrapersonal: 85, naturalistic: 80 },
  'Purva Bhadrapada':   { linguistic: 75, logical: 78, spatial: 65, kinesthetic: 70, musical: 62, interpersonal: 60, intrapersonal: 82, naturalistic: 60 },
  'Uttara Bhadrapada':  { linguistic: 72, logical: 72, spatial: 62, kinesthetic: 58, musical: 70, interpersonal: 68, intrapersonal: 88, naturalistic: 72 },
  'Revati':             { linguistic: 78, logical: 62, spatial: 70, kinesthetic: 60, musical: 82, interpersonal: 80, intrapersonal: 78, naturalistic: 85 },
}

// Planets sitting in the 4th (schooling), 5th (intellect / purva punya) and 9th
// (higher learning) houses modify the baseline aptitude. This is what separates
// two natives born under the same nakshatra but with different charts.
const PLANET_INTEL_BOOST: Record<string, string[]> = {
  Sun: ['intrapersonal', 'logical'],
  Moon: ['musical', 'interpersonal'],
  Mars: ['kinesthetic', 'spatial'],
  Mercury: ['linguistic', 'logical'],
  Jupiter: ['linguistic', 'intrapersonal'],
  Venus: ['musical', 'spatial'],
  Saturn: ['logical', 'naturalistic'],
  Rahu: ['spatial', 'logical'],
  Ketu: ['intrapersonal', 'naturalistic'],
}

function generateDmitReport(kundli: any, dob: string) {
  const base = { ...(NAKSHATRA_INTEL[kundli.nakshatra] || NAKSHATRA_INTEL['Pushya']) }

  // Learning houses: 4th, 5th and 9th from the ascendant.
  const LEARNING_HOUSES = [4, 5, 9]
  const influences: string[] = []
  for (const planet of (kundli.planets || [])) {
    if (!LEARNING_HOUSES.includes(planet.house)) continue
    const boosted = PLANET_INTEL_BOOST[planet.name]
    if (!boosted) continue
    // A benefic in a learning house lifts its faculties; a retrograde planet
    // turns the same energy inward, favouring the reflective faculties instead.
    const weight = planet.house === 5 ? 8 : planet.house === 9 ? 6 : 5
    for (const faculty of boosted) {
      base[faculty] = Math.min(95, Math.max(20, base[faculty] + (planet.retrograde ? Math.round(weight / 2) : weight)))
    }
    influences.push(`${planet.name} in the ${planet.house}th house strengthens ${boosted.join(' and ')} aptitude`)
  }

  // The birth weekday's ruling planet gives a small additional tilt, so siblings
  // born under the same nakshatra on different days do not score identically.
  const WEEKDAY_PLANET = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
  const birthDate = new Date(dob + 'T12:00:00Z')
  if (!isNaN(birthDate.getTime())) {
    const weekdayLord = WEEKDAY_PLANET[birthDate.getUTCDay()]
    for (const faculty of PLANET_INTEL_BOOST[weekdayLord] || []) {
      base[faculty] = Math.min(95, base[faculty] + 3)
    }
    influences.push(`Born on a ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][birthDate.getUTCDay()]}, ruled by ${weekdayLord} - a mild additional tilt toward ${(PLANET_INTEL_BOOST[weekdayLord] || []).join(' and ')} ability`)
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
    basis: `Baseline aptitude is read from your ${kundli.nakshatra} nakshatra, then adjusted for the planets occupying your 4th, 5th and 9th houses - the houses of schooling, innate intellect and higher learning.`,
    chartInfluences: influences,
    dominantIntelligences: dominant,
    allIntelligences: intelligences,
    learningStyle: getLearningStyle(dominant[0].type),
    recommendedStreams: getRecommendedStreams(dominant),
    careerAlignment: getCareerAlignment(dominant),
    studyTechniques: getStudyTechniques(dominant[0].type),
    parentingAdvice: getParentingAdvice(dominant, kundli),
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

function getRecommendedStreams(dominant: Array<{ type: string }>): string[] {
  // Streams are accumulated from each of the three dominant faculties rather than
  // collapsed into two broad buckets, so the combination itself carries meaning.
  const STREAM_BY_FACULTY: Record<string, string[]> = {
    linguistic: ['Arts & Humanities', 'Law', 'Journalism & Mass Communication', 'Literature & Languages'],
    logical: ['Science (PCM)', 'Engineering', 'Data Science & Analytics', 'Chartered Accountancy'],
    spatial: ['Architecture', 'Design (NID/NIFT)', 'Fine Arts', 'Surgery & Radiology'],
    kinesthetic: ['Sports Science & Physiotherapy', 'Performing Arts', 'Skilled trades & Vocational', 'Defence Services'],
    musical: ['Music & Performing Arts', 'Sound Engineering', 'Film & Media Production', 'Music Therapy'],
    interpersonal: ['Psychology & Counselling', 'Business Management', 'Hotel Management', 'Human Resources'],
    intrapersonal: ['Philosophy & Research', 'Clinical Psychology', 'Theology & Spiritual studies', 'Independent research'],
    naturalistic: ['Life Sciences & Biotechnology', 'Agriculture & Horticulture', 'Environmental Science', 'Veterinary Science'],
  }
  const streams: string[] = []
  dominant.forEach((d, rank) => {
    const key = d.type.split(' ')[0].toLowerCase()
    // The top faculty contributes more options than the second and third.
    streams.push(...(STREAM_BY_FACULTY[key] || []).slice(0, rank === 0 ? 3 : 2))
  })
  return [...new Set(streams)].slice(0, 6)
}

function getCareerAlignment(dominant: Array<{ type: string; careers: string[] }>) {
  return dominant.flatMap(d => d.careers).slice(0, 8)
}

function getStudyTechniques(dominantType: string): string[] {
  // getLearningTips returns [] for an unknown faculty, and [] is truthy - so the
  // fallback has to be checked on length, not on the value itself.
  const tips = getLearningTips(dominantType.split(' ')[0].toLowerCase())
  return tips.length ? tips : ['Spaced repetition', 'Active recall', 'Mind mapping']
}

function getParentingAdvice(dominant: Array<{ type: string }>, kundli?: any): string[] {
  const ADVICE_BY_FACULTY: Record<string, string> = {
    linguistic: 'Talk with them constantly and let them narrate their day - this child thinks by putting things into words, and goes quiet when not given the chance',
    logical: 'Answer "why" questions properly rather than deflecting them; this child loses respect for an explanation they can tell is incomplete',
    spatial: 'Give them space, materials and permission to make a mess - drawing, building and taking things apart is how this child processes, not a distraction from it',
    kinesthetic: 'Do not ask this child to sit still to learn. Movement breaks every twenty minutes will improve marks more than extra tuition will',
    musical: 'Start a formal instrument or vocal training early. Background music during study helps this child rather than distracting them',
    interpersonal: 'Let them study with friends and teach what they have learnt to someone else - isolation genuinely slows this child down',
    intrapersonal: 'Respect their need for solitude and do not read it as sulking. Give advance warning before social events rather than surprising them',
    naturalistic: 'Get them outdoors regularly and let them keep plants or an animal - this child regulates through contact with living things',
  }
  const primary = dominant[0]?.type.split(' ')[0].toLowerCase() || 'linguistic'
  const secondary = dominant[1]?.type.split(' ')[0].toLowerCase() || 'logical'

  // These three slots used to be fixed sentences repeated in every child's
  // report. They now name the child's own faculties and lagna.
  const sig = seekerSignature([primary, secondary, kundli?.ascendant, kundli?.moonSign, kundli?.nakshatra])
  const facultyName = (f: string) => f.charAt(0).toUpperCase() + f.slice(1)

  const COMPARISON_NOTE = [
    `Measure them against their own ${facultyName(primary)} baseline, not against a sibling with a different aptitude profile`,
    `Their ${facultyName(primary)} strength will not look like a sibling's - comparing the two teaches them to hide the one they have`,
    `Praise the ${facultyName(primary)} work specifically; unspecific comparison to other children is the fastest way to shut it down`,
  ]

  const BREADTH_NOTE = [
    `Let them sample widely before narrowing - the ${facultyName(secondary)} line is close enough behind ${facultyName(primary)} that an early lock-in would waste it`,
    `Hold specialisation until mid-teens: ${facultyName(primary)} and ${facultyName(secondary)} are close in this chart and either could lead`,
    `Keep at least one ${facultyName(secondary)} activity running alongside the ${facultyName(primary)} one, rather than choosing between them`,
  ]

  const ENV_BY_LAGNA: Record<string, string> = {
    Aries: 'Give them a study space they can move in - standing desk, floor cushion, room to pace',
    Taurus: 'Give them one fixed, comfortable, unchanging study corner; relocating them resets their concentration',
    Gemini: 'Vary the study location deliberately - this child concentrates worse in one unchanging spot',
    Cancer: 'Let them study within earshot of family rather than shut away in a separate room',
    Leo: 'Give them a study space they are proud to show - display their work on the wall',
    Virgo: 'Keep the desk spare and ordered; visual clutter costs this child real concentration',
    Libra: 'A calm, attractive, well-lit space matters more for this child than for most - ugliness distracts them',
    Scorpio: 'Give them a private, enclosed, uninterrupted space - being observed while working stalls them',
    Sagittarius: 'Let them study outdoors or by a window; enclosed rooms flatten this child',
    Capricorn: 'Fixed hours and a fixed desk - this child performs best on an unvaried schedule',
    Aquarius: 'Allow an unconventional setup if it works - do not enforce a standard desk arrangement',
    Pisces: 'Soft light, low noise and no harsh overhead lamp - this child is genuinely sensitive to the room',
  }

  const advice = [
    one(COMPARISON_NOTE, mix(sig, 'cmp')),
    ADVICE_BY_FACULTY[primary] || 'Provide books, puzzles, and varied intellectual stimulation',
    ADVICE_BY_FACULTY[secondary] || 'Allow exploration of multiple activities before specializing',
    one(BREADTH_NOTE, mix(sig, 'brd')),
    ENV_BY_LAGNA[kundli?.ascendant] || 'Create a study environment that matches their learning style',
  ]

  // The Moon shows how the child is soothed; the 5th lord shows how they learn.
  if (kundli?.moonSign) {
    const MOON_NOTE: Record<string, string> = {
      Aries: 'With an Aries Moon, this child settles through physical discharge - send them to run before asking them to talk about a difficult day',
      Taurus: 'With a Taurus Moon, this child settles through food, touch and unchanged routine - warn them well before any change of plan',
      Gemini: 'With a Gemini Moon, this child settles by talking it out - let them speak without being corrected mid-sentence',
      Cancer: 'With a Cancer Moon, this child settles through physical closeness and home - do not force independence too early',
      Leo: 'With a Leo Moon, this child settles when seen and praised specifically - generic praise reads as insincere to them',
      Virgo: 'With a Virgo Moon, this child settles when things are ordered and expectations are explicit - vagueness raises their anxiety',
      Libra: 'With a Libra Moon, this child settles when the household is peaceful - they absorb parental conflict more than they show',
      Scorpio: 'With a Scorpio Moon, this child settles only where they feel trusted with the truth - half-answers damage the bond quickly',
      Sagittarius: 'With a Sagittarius Moon, this child settles through freedom and movement - confinement reads as punishment even when it is not',
      Capricorn: 'With a Capricorn Moon, this child settles through competence - give them a real responsibility they can visibly succeed at',
      Aquarius: 'With an Aquarius Moon, this child settles when allowed to be different - pressure to conform is felt sharply here',
      Pisces: 'With a Pisces Moon, this child settles through quiet, art and imagination - harsh tones land far harder than intended',
    }
    if (MOON_NOTE[kundli.moonSign]) advice.push(MOON_NOTE[kundli.moonSign])
  }

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

  // Each nakshatra has a gana (temperament class) and a natural mode of activity.
  // These are added on top of the age-appropriate baseline.
  const NAKSHATRA_ACTIVITY: Record<string, string[]> = {
    Ashwini: ['Swimming or running - Ashwini needs speed', 'Simple first-aid and healing games'],
    Bharani: ['Clay modelling and gardening', 'Structured responsibility - caring for a pet or plant'],
    Krittika: ['Cooking alongside an adult', 'Precision crafts - origami, model building'],
    Rohini: ['Singing and classical dance', 'Gardening and growing things from seed'],
    Mrigashira: ['Treasure hunts and exploration games', 'Nature collecting - leaves, stones, insects'],
    Ardra: ['Rain and water play', 'Journalling or drawing feelings during hard moments'],
    Punarvasu: ['Storytelling and folk tales', 'Repeat-and-return games; travel to familiar places'],
    Pushya: ['Cooking and feeding others', 'Caring for younger children or animals'],
    Ashlesha: ['Puzzles and mystery stories', 'Yoga and breathing games to settle intensity'],
    Magha: ['Family history and ancestor stories', 'Traditional arts, drama, and leadership roles in play'],
    'Purva Phalguni': ['Dance, music, and dress-up play', 'Social games with close friends'],
    'Uttara Phalguni': ['Team sports with a fixed role', 'Charity and helping projects'],
    Hasta: ['Handicrafts, pottery, and knot-work', 'Sleight-of-hand, magic tricks, and instrument practice'],
    Chitra: ['Drawing, design, and photography', 'Building and architecture play'],
    Swati: ['Wind instruments and kite flying', 'Independent projects with no supervision'],
    Vishakha: ['Goal-based challenges with a visible finish line', 'Competitive but non-contact sports'],
    Anuradha: ['Group projects and club membership', 'Devotional singing and bhajan'],
    Jyeshtha: ['Leading a small group or team', 'Strategy games and protective role-play'],
    Moola: ['Digging, roots, and botany', 'Questions-about-everything sessions; philosophy for children'],
    'Purva Ashadha': ['Debate and persuasion games', 'Swimming and water sports'],
    'Uttara Ashadha': ['Long-form projects finished over weeks', 'Endurance activities - hiking, distance running'],
    Shravana: ['Listening games, audiobooks, and music', 'Learning languages and recitation'],
    Dhanishtha: ['Percussion, rhythm, and drumming', 'Group performance and community events'],
    Shatabhisha: ['Astronomy and star-gazing', 'Solo research projects and healing arts'],
    'Purva Bhadrapada': ['Intense physical outlets - martial arts', 'Philosophical stories and big questions'],
    'Uttara Bhadrapada': ['Deep-water swimming and stillness practice', 'Meditation and long quiet reading'],
    Revati: ['Animal care and gentle nurturing', 'Travel, maps, and journey stories'],
  }
  const specific = NAKSHATRA_ACTIVITY[nakshatra] || []
  return [...baseActivities, ...specific]
}

function getDevelopmentCautions(moonSign: string): string[] {
  const map: Record<string, string[]> = {
    Aries: ['May rush through tasks - teach patience', 'Encourage finishing projects before starting new ones'],
    Taurus: ['May resist change - introduce variety gently', 'Avoid over-indulgence in comfort habits and sweet foods'],
    Gemini: ['May scatter focus - use structured routines', 'Channel curiosity into depth rather than breadth'],
    Cancer: ['May be overly sensitive - build emotional resilience', 'Encourage independence and time away from home'],
    Leo: ['May need constant validation - build intrinsic motivation', 'Teach humility and how to share the spotlight'],
    Virgo: ['May be perfectionistic - celebrate effort not just results', 'Reduce anxiety around mistakes and marks'],
    Libra: ['May avoid conflict and agree too readily - teach how to state a preference', 'Guard against over-dependence on a single friendship'],
    Scorpio: ['May hold feelings in secret - build safe outlets for intensity', 'Watch for control in play; teach trust and fair turns'],
    Sagittarius: ['May be blunt without meaning harm - teach tact', 'Needs freedom, but also follow-through on commitments'],
    Capricorn: ['May be hard on themselves - separate worth from achievement', 'Guard against premature seriousness; protect playtime'],
    Aquarius: ['May detach when upset - teach naming feelings out loud', 'Values being different; ensure it does not become isolation'],
    Pisces: ['May absorb others\' moods - teach emotional boundaries', 'Guard against escapism; keep one grounded, structured routine'],
  }
  return map[moonSign] || ['Balance structured and free play', 'Foster both independence and cooperation']
}

function generateColourTherapy(kundli: any) {
  const cPada = kundli.nakshatraPada && kundli.nakshatraPada >= 1 && kundli.nakshatraPada <= 4
    ? kundli.nakshatraPada : 1
  const cLord = (kundli.planets || []).find((pl: any) => pl.name === kundli.dashaLord)
  const cLordHouse = cLord?.house ?? 0
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
    chromotherapy: getChromotherapy(kundli.ascendant, kundli.moonSign, kundli.dashaLord, kundli.nakshatra),
    howToWear: PADA_COLOUR_NOTE[cPada] || PADA_COLOUR_NOTE[1],
    timingNote: cLordHouse
      ? `Your ${kundli.dashaLord} dasha lord occupies the ${cLordHouse}th house, so apply colour therapy ${[6, 8, 12].includes(cLordHouse) ? 'daily without gaps - an afflicted lord loses the benefit of an interrupted course' : [1, 4, 7, 10].includes(cLordHouse) ? 'in short concentrated courses of two weeks, then rest a week' : 'on a steady alternate-day rhythm'}.`
      : undefined,
    interiorDesign: getInteriorColors(kundli.ascendant, kundli.moonSign),
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
    Aries: ['Coral', 'Peach', 'Soft rose'],
    Taurus: ['Sage green', 'Blush pink', 'Warm ivory'],
    Gemini: ['Pale yellow', 'Mint', 'Sky blue'],
    Cancer: ['Silver', 'White', 'Light blue'],
    Leo: ['Warm amber', 'Soft gold', 'Apricot'],
    Virgo: ['Soft moss', 'Oatmeal', 'Pale sage'],
    Libra: ['Rose quartz pink', 'Powder blue', 'Champagne'],
    Scorpio: ['Dark teal', 'Maroon', 'Deep plum'],
    Sagittarius: ['Warm saffron', 'Soft violet', 'Honey'],
    Capricorn: ['Slate blue', 'Warm grey', 'Deep forest'],
    Aquarius: ['Periwinkle', 'Pale aqua', 'Soft lilac'],
    Pisces: ['Turquoise', 'Violet', 'Seafoam'],
  }
  return map[moonSign] || ['Soft pink', 'Light lavender', 'Warm white']
}

// Mental clarity is governed by the lagna lord and by Mercury's sign-element,
// so the calming palette differs by the element of the ascendant.
function getMentalHealingColors(ascendant: string): string[] {
  const map: Record<string, string[]> = {
    Aries: ['Cool mint', 'Pale blue', 'White'],
    Taurus: ['Soft green', 'Cream', 'Pale gold'],
    Gemini: ['Pale yellow', 'White', 'Light grey'],
    Cancer: ['Pearl white', 'Silver', 'Pale aqua'],
    Leo: ['Warm ivory', 'Light gold', 'Soft orange'],
    Virgo: ['Crisp white', 'Pale green', 'Light navy'],
    Libra: ['Powder blue', 'Ivory', 'Pale rose'],
    Scorpio: ['Deep indigo', 'Charcoal', 'Cool white'],
    Sagittarius: ['Light yellow', 'Warm white', 'Soft violet'],
    Capricorn: ['Stone grey', 'Deep green', 'Off white'],
    Aquarius: ['Electric blue', 'Silver', 'Cool violet'],
    Pisces: ['Sea green', 'Lavender', 'Misty blue'],
  }
  return map[ascendant] || ['Light yellow', 'White', 'Pale blue']
}

// Each nakshatra has a presiding deity whose traditional colour is used for
// upasana (devotional practice) - this is the native's own spiritual palette.
function getSpiritualColors(nakshatra: string): string[] {
  const map: Record<string, string[]> = {
    Ashwini: ['Blood red', 'Saffron', 'White'],
    Bharani: ['Deep red', 'Black', 'Crimson'],
    Krittika: ['Fire orange', 'White', 'Gold'],
    Rohini: ['Pearl white', 'Rose', 'Soft gold'],
    Mrigashira: ['Silver grey', 'Pale green', 'White'],
    Ardra: ['Storm grey', 'Deep green', 'Indigo'],
    Punarvasu: ['Golden yellow', 'Lead grey', 'Saffron'],
    Pushya: ['Deep red', 'Golden yellow', 'White'],
    Ashlesha: ['Black', 'Deep red', 'Dark green'],
    Magha: ['Ivory', 'Deep maroon', 'Gold'],
    'Purva Phalguni': ['Pale brown', 'Rose pink', 'Cream'],
    'Uttara Phalguni': ['Bright blue', 'Saffron', 'White'],
    Hasta: ['Deep green', 'Gold', 'Cream'],
    Chitra: ['Black', 'Pearl white', 'Iridescent'],
    Swati: ['Black', 'Pale blue', 'Silver'],
    Vishakha: ['Golden yellow', 'Deep red', 'Saffron'],
    Anuradha: ['Reddish brown', 'Deep gold', 'White'],
    Jyeshtha: ['Cream', 'Deep red', 'Royal blue'],
    Moola: ['Brownish yellow', 'Deep red', 'Ochre'],
    'Purva Ashadha': ['Black', 'Deep blue', 'White'],
    'Uttara Ashadha': ['Copper', 'Deep gold', 'Saffron'],
    Shravana: ['Pale blue', 'White', 'Saffron'],
    Dhanishtha: ['Silver grey', 'Deep red', 'Gold'],
    Shatabhisha: ['Blue green', 'Turquoise', 'Deep indigo'],
    'Purva Bhadrapada': ['Silver grey', 'Deep violet', 'Black'],
    'Uttara Bhadrapada': ['Purple', 'Deep indigo', 'Sea blue'],
    Revati: ['Brown', 'Cream', 'Soft gold'],
  }
  return map[nakshatra] || ['Violet', 'Indigo', 'White', 'Gold', 'Saffron']
}

function getColorMeditation(moonSign: string): string {
  const colour = getEmotionalHealingColors(moonSign)[0]
  const ELEMENT_PRACTICE: Record<string, string> = {
    Aries: 'Draw the light down from the crown to the base of the spine, cooling the head as it descends - fire Moons need the heat moved downward.',
    Leo: 'Draw the light down from the crown to the base of the spine, cooling the head as it descends - fire Moons need the heat moved downward.',
    Sagittarius: 'Draw the light down from the crown to the base of the spine, cooling the head as it descends - fire Moons need the heat moved downward.',
    Taurus: 'Let the light pool in the belly and settle like warm earth. Earth Moons steady fastest when the light is held low and still rather than moved.',
    Virgo: 'Let the light pool in the belly and settle like warm earth. Earth Moons steady fastest when the light is held low and still rather than moved.',
    Capricorn: 'Let the light pool in the belly and settle like warm earth. Earth Moons steady fastest when the light is held low and still rather than moved.',
    Gemini: 'Move the light with the breath - in on the inhale, held at the heart on the exhale. Air Moons need the light anchored to breath or the mind wanders.',
    Libra: 'Move the light with the breath - in on the inhale, held at the heart on the exhale. Air Moons need the light anchored to breath or the mind wanders.',
    Aquarius: 'Move the light with the breath - in on the inhale, held at the heart on the exhale. Air Moons need the light anchored to breath or the mind wanders.',
    Cancer: 'Let the light wash through in slow waves rather than a steady beam. Water Moons absorb colour through rhythm, not concentration.',
    Scorpio: 'Let the light wash through in slow waves rather than a steady beam. Water Moons absorb colour through rhythm, not concentration.',
    Pisces: 'Let the light wash through in slow waves rather than a steady beam. Water Moons absorb colour through rhythm, not concentration.',
  }
  const practice = ELEMENT_PRACTICE[moonSign] || 'Hold the light steady at the heart centre and let it expand outward with each exhale.'
  return `For your ${moonSign} Moon, meditate on ${colour.toLowerCase()} rather than generic white light. Sit quietly, visualise that colour entering through the crown, and let it dissolve tension as it moves. ${practice} Hold the visualisation for 10 minutes, ideally at the same hour each day.`
}

function getChromotherapy(ascendant: string, moonSign: string, dashaLord: string, nakshatra?: string): object {
  const primary = getPhysicalHealingColors(ascendant)[0]
  // Chronic, slow-moving planets need longer and less frequent exposure; fast,
  // hot planets need shorter and more frequent sessions.
  const SLOW = ['Saturn', 'Rahu', 'Ketu']
  const HOT = ['Sun', 'Mars']
  const sessions = SLOW.includes(dashaLord)
    ? `2x weekly, longer sessions - your ${dashaLord} period responds to sustained, patient exposure rather than frequency`
    : HOT.includes(dashaLord)
    ? `4x weekly, shorter sessions - your ${dashaLord} period runs hot, so brief and frequent exposure prevents overstimulation`
    : `3x weekly sessions - your ${dashaLord} period responds well to a steady, moderate rhythm`
  // Duration and method resolve per graha rather than through a slow/hot/other
  // split, which gave every seeker one of only three prescriptions.
  const DURATION: Record<string, string> = {
    Sun: '12-15 minutes per session, never at midday',
    Moon: '20-25 minutes per session, after sunset',
    Mars: '10-12 minutes per session, kept deliberately short',
    Mercury: '18-22 minutes per session, best mid-morning',
    Jupiter: '25-30 minutes per session',
    Venus: '22-28 minutes per session, unhurried',
    Saturn: '35-40 minutes per session, twice weekly',
    Rahu: '30-35 minutes per session, at a fixed hour',
    Ketu: '30-40 minutes per session, in silence',
  }
  const METHOD: Record<string, string> = {
    Sun: 'Coloured solarized water and visualization - avoid direct coloured lamps, which aggravate an already hot period',
    Moon: 'Coloured light reflected off water, or a coloured cloth over the lamp - indirect light suits a Moon period',
    Mars: 'Coloured solarized water only - a Mars period is worsened by direct lamp exposure',
    Mercury: 'Coloured light bulb while reading or writing, so the colour accompanies mental work',
    Jupiter: 'Coloured light bulb, coloured solarized water, or visualization',
    Venus: 'Coloured light lamp with the colour also worn as clothing - a Venus period absorbs colour through the skin',
    Saturn: 'Coloured light lamp with prolonged exposure, supported by wearing the colour close to the skin',
    Rahu: 'Coloured light lamp at a fixed daily hour - a Rahu period needs the regularity more than the intensity',
    Ketu: 'Coloured light in a darkened room with no other stimulus - a Ketu period responds to isolation of the colour',
  }
  const duration = DURATION[dashaLord] || DURATION.Jupiter
  return {
    sessions,
    primaryColor: primary,
    secondaryColor: getEmotionalHealingColors(moonSign)[0],
    duration,
    method: METHOD[dashaLord] || METHOD.Jupiter,
    nakshatraTint: nakshatra
      ? `Your ${nakshatra} nakshatra tints the prescription toward ${getSpiritualColors(nakshatra)[0]} - use it for the closing minutes of each session, after the primary colour.`
      : undefined,
    waterSolarization: `Fill a ${primary.toLowerCase()} glass bottle with water and leave it in sunlight for 4-6 hours${SLOW.includes(dashaLord) ? ', ideally on a Saturday' : HOT.includes(dashaLord) ? ', ideally before 9 AM to avoid harsh midday sun' : ''}. Drink this solarized water throughout the day.`,
  }
}

function getInteriorColors(ascendant: string, moonSign: string): object {
  const colors = getPhysicalHealingColors(ascendant)
  const mental = getMentalHealingColors(ascendant)
  const emotional = getEmotionalHealingColors(moonSign)
  return {
    livingRoom: colors[0] + ' accents with neutral walls',
    bedroom: `Soft, muted ${(emotional[0] || colors[1]).toLowerCase()} - keyed to your ${moonSign} Moon, which governs sleep and emotional recovery`,
    study: `${mental[0]} with ${(mental[1] || 'white').toLowerCase()} trim - your ${ascendant} Lagna concentrates best in this range`,
    bathroom: `${(emotional[emotional.length - 1] || 'Sea green').toLowerCase()} for cleansing energy`,
    entrance: colors[0] + ' or warm gold for welcoming energy',
  }
}

function getClothingColors(kundli: any): object {
  // The weekday-to-planet rulership is universal, but which of those days matter
  // most is not: the lagna lord's day and the running dasha lord's day are the
  // native's own power days, and are annotated as such.
  const DAY_PLANET: Record<string, string> = {
    Sunday: 'Sun', Monday: 'Moon', Tuesday: 'Mars', Wednesday: 'Mercury',
    Thursday: 'Jupiter', Friday: 'Venus', Saturday: 'Saturn',
  }
  const BASE_COLORS: Record<string, string> = {
    Sunday: 'Red, orange, or gold', Monday: 'White, cream, or silver',
    Tuesday: 'Red or orange', Wednesday: 'Green or grey',
    Thursday: 'Yellow or orange', Friday: 'White, pink, or cream',
    Saturday: 'Dark blue, black, or purple',
  }
  const LAGNA_LORD: Record<string, string> = {
    Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
    Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
    Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
  }
  const lagnaLord = LAGNA_LORD[kundli.ascendant]
  const dashaLord = kundli.dashaLord

  // Which shade of the weekday colour suits the native is set by the Moon sign's
  // element - previously every seeker read the same base colour for a given day
  // unless it happened to be their lagna or dasha lord's day.
  const ELEMENT_OF: Record<string, string> = {
    Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
    Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
    Gemini: 'air', Libra: 'air', Aquarius: 'air',
    Cancer: 'water', Scorpio: 'water', Pisces: 'water',
  }
  const SHADE: Record<string, string> = {
    fire: 'in its deeper, more saturated shade',
    earth: 'in its muted, matte shade',
    air: 'in its lighter, brighter shade',
    water: 'in its softer, cooler shade',
  }
  const shade = SHADE[ELEMENT_OF[kundli.moonSign]] || SHADE.earth

  const weekly: Record<string, string> = {}
  for (const [day, base] of Object.entries(BASE_COLORS)) {
    const planet = DAY_PLANET[day]
    const notes: string[] = []
    if (planet === lagnaLord) notes.push(`your ${kundli.ascendant} Lagna lord's day - strongest for you`)
    if (planet === dashaLord) notes.push(`your running ${dashaLord} dasha lord's day - wear this colour without fail`)
    const withShade = `${base} ${shade}`
    weekly[day] = notes.length ? `${withShade} (${notes.join('; ')})` : withShade
  }

  return {
    powerColor: getPhysicalHealingColors(kundli.ascendant)[0],
    avoidColors: getColorsToAvoid(kundli.ascendant),
    weeklySchedule: weekly,
    forImportantMeetings: getPhysicalHealingColors(kundli.ascendant)[0] + ' - amplifies your natural authority',
    forHealingDays: getEmotionalHealingColors(kundli.moonSign)[0] + ' - soothes emotional body',
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

export function generateAnnualPrediction(kundli: any) {
  const currentYear = new Date().getFullYear()

  // Each dasha lord's 12 entries are ordered by HOUSE (1st..12th), not by calendar
  // month. Which house a given month lands on depends on the native's own Moon
  // sign - see the Gochara mapping below.
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
    Mars: [
      { theme: 'Ignition & Initiative', guidance: 'Energy surges at the start of the year. Launch what you have been postponing, but temper haste with planning. Physical training pays off now.', focus: 'New ventures' },
      { theme: 'Property & Land', guidance: 'Real estate, vehicles, and tangible assets come into focus. Verify documents carefully - Mars rewards diligence and punishes shortcuts.', focus: 'Assets' },
      { theme: 'Courage Under Pressure', guidance: 'Confrontations may arise with siblings, neighbours, or competitors. Stand firm on principle but avoid needless escalation.', focus: 'Assertion' },
      { theme: 'Home Front Repairs', guidance: 'Domestic matters need decisive action - repairs, boundaries, or a difficult family conversation. Address heat in the household directly.', focus: 'Home & family' },
      { theme: 'Competitive Edge', guidance: 'Sports, examinations, and contests favour you strongly. Your drive is at peak - channel it into a single decisive goal rather than many.', focus: 'Competition' },
      { theme: 'Health & Discipline', guidance: 'Mars governs blood, muscles, and inflammation. Guard against injury, overtraining, and accidents. A disciplined routine prevents a forced rest.', focus: 'Physical health' },
      { theme: 'Negotiation & Rivalry', guidance: 'Partnerships are tested by strong opinions. Legal or contractual friction is possible - let a cool head, not pride, decide your response.', focus: 'Partnerships' },
      { theme: 'Deep Excavation', guidance: 'Hidden matters surface - debts, joint finances, or buried resentment. Mars in the depths gives the strength to face what you have avoided.', focus: 'Transformation' },
      { theme: 'Purposeful Movement', guidance: 'Travel, training, and higher pursuits accelerate. A teacher or mentor challenges you productively. Physical pilgrimage is especially favoured.', focus: 'Expansion' },
      { theme: 'Command & Execution', guidance: 'Your most decisive career month. Take charge of a stalled project. Authority is earned now through visible action, not words.', focus: 'Career' },
      { theme: 'Allies & Gains', guidance: 'Brothers, colleagues, and networks deliver concrete gains. Collective effort multiplies what solo effort cannot reach this month.', focus: 'Gains' },
      { theme: 'Rest the Weapon', guidance: 'Deliberately slow down. Mars burns out when it never rests. Retreat, recover, and plan the next campaign quietly.', focus: 'Recovery' },
    ],
    Mercury: [
      { theme: 'Ideas & Planning', guidance: 'The year opens with mental clarity. Map your plans on paper, sign up for the course, and start the writing project now.', focus: 'Planning' },
      { theme: 'Speech & Wealth', guidance: 'Your words directly affect your income this month. Negotiations, pitches, and pricing conversations go well when prepared.', focus: 'Income' },
      { theme: 'Peak Communication', guidance: 'Mercury\'s own domain - writing, teaching, media, and short journeys flourish. Siblings and neighbours bring useful information.', focus: 'Communication' },
      { theme: 'Documents & Property', guidance: 'Paperwork, agreements, and home-related contracts need attention. Read every clause - errors made now are expensive to undo.', focus: 'Contracts' },
      { theme: 'Learning & Cleverness', guidance: 'Studies, exams, and creative problem-solving are strongly supported. Children\'s education is highlighted. Speculation is tempting but unwise.', focus: 'Education' },
      { theme: 'Systems & Service', guidance: 'Streamline your routines, tools, and workflows. Small efficiencies compound. Nervous system and skin need care under Mercury strain.', focus: 'Efficiency' },
      { theme: 'Deals & Alliances', guidance: 'Business partnerships and client relationships advance. Put every understanding in writing - verbal agreements sour under Mercury.', focus: 'Business' },
      { theme: 'Research & Secrets', guidance: 'Investigation, audits, and hidden knowledge occupy you. Excellent for research, forensic work, and settling old accounts.', focus: 'Investigation' },
      { theme: 'Teaching & Travel', guidance: 'Publishing, higher study, and long journeys open up. Your ideas find a wider audience. Consider mentoring or being mentored.', focus: 'Publishing' },
      { theme: 'Professional Recognition', guidance: 'Your analytical ability gets noticed at work. A role involving communication, data, or coordination may be offered.', focus: 'Career' },
      { theme: 'Networks & Trade', guidance: 'Commerce, referrals, and social connections generate income. Your address book is your greatest asset this month.', focus: 'Trade' },
      { theme: 'Quiet Study', guidance: 'Withdraw and consolidate. Organise records, close loops, and study privately. Overthinking is the risk - write it down and set it aside.', focus: 'Consolidation' },
    ],
    Jupiter: [
      { theme: 'Expansion Begins', guidance: 'The year opens with optimism and enlarged vision. Set ambitious but dharmic goals - Jupiter rewards intention aligned with principle.', focus: 'Vision' },
      { theme: 'Wealth & Family Values', guidance: 'Family finances and inherited values come into focus. Savings grow. Generosity now returns multiplied later.', focus: 'Prosperity' },
      { theme: 'Teaching & Counsel', guidance: 'You become the advisor others seek. Share knowledge freely. Short journeys for study or satsang are fruitful.', focus: 'Guidance' },
      { theme: 'Home & Blessing', guidance: 'Domestic happiness deepens. Property, mother, and household harmony are favoured. A ceremony or housewarming is well-timed.', focus: 'Home' },
      { theme: 'Children & Creation', guidance: 'The strongest month for children, fertility, creative work, and past-life merit ripening. Teaching and mentoring bring joy.', focus: 'Children & creativity' },
      { theme: 'Service & Restraint', guidance: 'Jupiter expands whatever it touches - including weight, debt, and commitments. Practise moderation and serve without seeking credit.', focus: 'Moderation' },
      { theme: 'Marriage & Partnership', guidance: 'Highly favourable for marriage, engagement, and partnership agreements. Existing bonds deepen through shared philosophy.', focus: 'Marriage' },
      { theme: 'Grace in Difficulty', guidance: 'Hidden support appears during challenges. Insurance, inheritance, or unexpected help may arrive. Occult study deepens.', focus: 'Protection' },
      { theme: 'Dharma & Pilgrimage', guidance: 'Jupiter\'s own domain - the peak spiritual month. Pilgrimage, guru contact, higher study, and father\'s blessing are all activated.', focus: 'Spirituality' },
      { theme: 'Ethical Authority', guidance: 'Career rises through integrity and reputation rather than aggression. You may be asked to lead or advise in a formal capacity.', focus: 'Career' },
      { theme: 'Abundant Gains', guidance: 'The most financially rewarding month. Elder siblings, mentors, and communities deliver opportunities. Say yes to the right invitation.', focus: 'Gains' },
      { theme: 'Liberation & Charity', guidance: 'Give generously and release what has outgrown you. Foreign connections, retreats, and moksha-oriented practice are favoured.', focus: 'Release' },
    ],
    Venus: [
      { theme: 'Beauty & Renewal', guidance: 'The year opens with attention to appearance, style, and self-worth. Invest in how you present yourself - it opens doors this year.', focus: 'Self-presentation' },
      { theme: 'Comfort & Resources', guidance: 'Income from creative or aesthetic work grows. Family finances improve. Indulgence is the risk - budget for pleasure deliberately.', focus: 'Wealth' },
      { theme: 'Charm & Connection', guidance: 'Your social magnetism is high. Networking, short trips, and warm conversation open unexpected opportunities.', focus: 'Social life' },
      { theme: 'Home Beautification', guidance: 'Decorate, renovate, or move. A beautiful home directly feeds your wellbeing now. Vehicle purchases are favoured.', focus: 'Home & comfort' },
      { theme: 'Romance & Art', guidance: 'The peak month for love, courtship, and artistic creation. Existing relationships regain sweetness. Creative work finds an audience.', focus: 'Love & creativity' },
      { theme: 'Balance & Wellbeing', guidance: 'Attend to kidneys, skin, and sugar balance. Venus imbalance shows as over-indulgence - restore harmony through routine, not restriction.', focus: 'Health' },
      { theme: 'Union & Agreement', guidance: 'Venus\'s own domain of partnership. Marriage, business alliance, and reconciliation are all strongly supported this month.', focus: 'Partnership' },
      { theme: 'Intimacy & Shared Wealth', guidance: 'Joint finances, dowry, or a partner\'s resources come into play. Emotional and financial intimacy require honest conversation.', focus: 'Shared resources' },
      { theme: 'Refined Learning', guidance: 'Study of art, music, design, or philosophy expands you. Travel to beautiful or sacred places is deeply restorative.', focus: 'Culture' },
      { theme: 'Public Charm', guidance: 'Career advances through diplomacy, taste, and relationships rather than force. Client-facing and creative roles are favoured.', focus: 'Career' },
      { theme: 'Luxury & Fulfilment', guidance: 'Desires materialise. Gains through women, art, or luxury markets. A long-held wish may finally be granted.', focus: 'Fulfilment' },
      { theme: 'Sacred Beauty', guidance: 'Turn pleasure toward devotion. Bhakti, music, and offering beauty to the divine transform Venus energy into lasting peace.', focus: 'Devotion' },
    ],
    Saturn: [
      { theme: 'Sober Foundations', guidance: 'The year opens with realism, not excitement. Assess honestly what is working. What you build slowly this year will outlast everything rushed.', focus: 'Assessment' },
      { theme: 'Earned Resources', guidance: 'Money comes through sustained labour, not luck. Reduce debt, cut waste, and build reserves. Frugality now is freedom later.', focus: 'Financial discipline' },
      { theme: 'Persistent Effort', guidance: 'Progress feels slow but is real. Keep showing up on the days you least want to - Saturn measures consistency, not intensity.', focus: 'Perseverance' },
      { theme: 'Structure at Home', guidance: 'Domestic responsibilities increase, possibly involving elders or property maintenance. Duty performed willingly lightens the load.', focus: 'Responsibility' },
      { theme: 'Delayed Reward', guidance: 'Creative work and children\'s matters require patience. What is delayed is not denied - Saturn withholds only until the work is sound.', focus: 'Patience' },
      { theme: 'Service & Endurance', guidance: 'Saturn\'s strongest domain - hard work, service, and overcoming enemies. Chronic health matters respond well to disciplined routine now.', focus: 'Discipline' },
      { theme: 'Commitment Tested', guidance: 'Relationships face a test of seriousness. Bonds built on real commitment strengthen; superficial ones dissolve. Both outcomes are useful.', focus: 'Commitment' },
      { theme: 'Karmic Reckoning', guidance: 'Old debts - financial, relational, or karmic - come due. Face them squarely. Saturn always accepts honest repayment.', focus: 'Karma' },
      { theme: 'Hard-Won Wisdom', guidance: 'Philosophy learnt through hardship, not books. A demanding teacher or a difficult journey delivers permanent understanding.', focus: 'Maturity' },
      { theme: 'Structural Authority', guidance: 'Saturn\'s peak career month. Long service is recognised. Promotions come with weight and responsibility - accept both together.', focus: 'Career' },
      { theme: 'Slow Accumulation', guidance: 'Gains arrive from long-term holdings, elder colleagues, and institutional connections. Patience finally pays a visible dividend.', focus: 'Long-term gains' },
      { theme: 'Solitude & Release', guidance: 'Withdraw, simplify, and let go of obligations that no longer serve. Saturn ends the year by asking what you can live without.', focus: 'Simplification' },
    ],
    Rahu: [
      { theme: 'Sudden Departure', guidance: 'The year opens with an unexpected turn. Rahu breaks patterns - what disrupts you now is clearing space for something unfamiliar and larger.', focus: 'Disruption' },
      { theme: 'Unconventional Income', guidance: 'Money arrives through non-traditional channels - technology, foreign clients, or a route no one else is taking. Verify every source.', focus: 'New income' },
      { theme: 'Bold Communication', guidance: 'Your message reaches further than expected. Digital platforms and media amplify you. Guard against exaggeration and half-truths.', focus: 'Visibility' },
      { theme: 'Restless Roots', guidance: 'Home may feel confining, or a relocation appears. Foreign residence and unconventional living arrangements are activated.', focus: 'Relocation' },
      { theme: 'Risk & Speculation', guidance: 'Strong pull toward gambling, speculation, and shortcuts. The gains are real but so are the losses - cap your exposure in advance.', focus: 'Calculated risk' },
      { theme: 'Obstacles Overcome', guidance: 'Rahu excels here - competitors, litigation, and chronic problems yield to your unconventional approach. Mysterious health issues need proper diagnosis.', focus: 'Overcoming' },
      { theme: 'Unusual Alliances', guidance: 'Partnerships with foreigners or people outside your usual circle prove significant. Conventional expectations do not apply this month.', focus: 'Alliances' },
      { theme: 'Hidden Currents', guidance: 'Occult, research, and buried matters surface. Sudden gains or losses are possible. Trust verified facts over compelling stories.', focus: 'The hidden' },
      { theme: 'Foreign Horizons', guidance: 'Overseas travel, visas, and cross-border study open. An unorthodox teacher or philosophy reshapes your worldview.', focus: 'Foreign lands' },
      { theme: 'Meteoric Rise', guidance: 'Rahu\'s strongest career month - sudden elevation, visibility, or a role no one predicted. Stay grounded; the rise is faster than the foundation.', focus: 'Career leap' },
      { theme: 'Extraordinary Gains', guidance: 'Rahu\'s best house. Networks, technology, and large-scale opportunities deliver disproportionate returns. Take the meeting.', focus: 'Windfall' },
      { theme: 'Dissolve the Illusion', guidance: 'Rest, retreat, and examine what you chased all year. Separate genuine desire from borrowed ambition before the next cycle begins.', focus: 'Clarity' },
    ],
    Ketu: [
      { theme: 'Quiet Beginning', guidance: 'The year opens inwardly rather than outwardly. Identity loosens its grip. Do not force direction - let it clarify.', focus: 'Inner start' },
      { theme: 'Detachment from Possessions', guidance: 'Interest in accumulation fades. Simplify finances and belongings. What you release now, you will not miss.', focus: 'Simplification' },
      { theme: 'Fewer, Truer Words', guidance: 'You speak less and mean more. Some relationships with siblings or neighbours quietly recede - allow it without drama.', focus: 'Discernment' },
      { theme: 'Restless Dwelling', guidance: 'Home feels temporary. You may withdraw from family activity. Create one quiet corner for practice - it anchors the whole year.', focus: 'Sanctuary' },
      { theme: 'Past-Life Talents', guidance: 'Skills surface that you never formally learnt. Ketu returns what you mastered before. Trust the ability that arrives unearned.', focus: 'Innate gifts' },
      { theme: 'Healing the Chronic', guidance: 'Ketu is strong here - long-standing problems and enemies dissolve. Alternative and energetic healing work unusually well now.', focus: 'Healing' },
      { theme: 'Space in Relationship', guidance: 'Partners need room, or you do. This is not rejection but recalibration. Enforced closeness backfires this month.', focus: 'Space' },
      { theme: 'The Deep Dive', guidance: 'Ketu\'s natural terrain - occult study, meditation on impermanence, and profound psychological insight. Research goes to the root.', focus: 'Depth' },
      { theme: 'Grace Without Effort', guidance: 'Spiritual progress accelerates without striving. A teacher may appear or dissolve. Pilgrimage to a remote place is deeply potent.', focus: 'Spiritual grace' },
      { theme: 'Indifference to Status', guidance: 'Career recognition may come but move you little. Work done without attachment to reward produces your best output now.', focus: 'Detached action' },
      { theme: 'Unsought Support', guidance: 'Help arrives from people you did not ask. Gains come sideways rather than through pursuit. Receive gracefully.', focus: 'Unexpected support' },
      { theme: 'Moksha & Surrender', guidance: 'Ketu\'s highest month. Retreat, silence, and surrender bring genuine peace. Charity given anonymously carries the greatest merit.', focus: 'Liberation' },
    ],
  }

  const DASHA_MONTHLY_THEMES = MONTHLY_THEMES[kundli.currentDasha] || MONTHLY_THEMES.Sun
  const ANTARDASHA_THEMES = MONTHLY_THEMES[kundli.currentAntardasha] || MONTHLY_THEMES.Sun

  const RASHIS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio',
    'Sagittarius','Capricorn','Aquarius','Pisces']

  // Gochara (transit) frame: the Sun enters a new sidereal sign around the middle
  // of each Gregorian month - Capricorn ~14 Jan, Aquarius ~13 Feb, and so on. Each
  // calendar month is therefore dominated by one sidereal solar sign.
  const SOLAR_MONTHS = [
    { label: 'Jan 14 - Feb 12', rashi: 9  }, { label: 'Feb 13 - Mar 13', rashi: 10 },
    { label: 'Mar 14 - Apr 12', rashi: 11 }, { label: 'Apr 13 - May 13', rashi: 0  },
    { label: 'May 14 - Jun 14', rashi: 1  }, { label: 'Jun 15 - Jul 15', rashi: 2  },
    { label: 'Jul 16 - Aug 16', rashi: 3  }, { label: 'Aug 17 - Sep 16', rashi: 4  },
    { label: 'Sep 17 - Oct 16', rashi: 5  }, { label: 'Oct 17 - Nov 15', rashi: 6  },
    { label: 'Nov 16 - Dec 15', rashi: 7  }, { label: 'Dec 16 - Jan 13', rashi: 8  },
  ]
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  // Classical Chandra-rashi gochara: houses are counted from the natal Moon sign,
  // so the same calendar month falls on a different house for every Moon sign.
  const moonRashiIdx = Math.max(0, RASHIS.indexOf(kundli.moonSign))
  const houseFromMoon = (rashi: number) => ((rashi - moonRashiIdx + 12) % 12) + 1

  // Sun's gochara result by house from Moon (Brihat Samhita): auspicious only in
  // the 3rd, 6th, 10th and 11th; the 8th and 12th are the most testing.
  const SUN_GOCHARA_STRONG = [3, 6, 10, 11]
  const SUN_GOCHARA_WEAK = [4, 8, 12]

  // Where the native's own grahas actually sit. A solar transit over a natal
  // graha is read differently from an empty sign - classical gochara accounts
  // for this, and ignoring it meant two people with the same Moon sign and
  // dasha lord received a byte-identical twelve-month forecast.
  const natalBySign = new Map<number, string[]>()
  for (const pl of (kundli.planets || []) as Array<{ name: string; rashiNum: number }>) {
    if (typeof pl.rashiNum !== 'number') continue
    const list = natalBySign.get(pl.rashiNum) || []
    list.push(pl.name)
    natalBySign.set(pl.rashiNum, list)
  }

  const CONJUNCTION_NOTE: Record<string, string> = {
    Sun: 'the Sun crosses your natal Sun this month - a birthday-cycle reset for vitality and standing',
    Moon: 'the Sun crosses your natal Moon - emotional matters surface more visibly than usual',
    Mars: 'the Sun crosses your natal Mars - energy and irritability both run high; channel it physically',
    Mercury: 'the Sun crosses your natal Mercury - a sharp month for speech, study and negotiation',
    Jupiter: 'the Sun crosses your natal Jupiter - the most fortunate transit window of your year',
    Venus: 'the Sun crosses your natal Venus - relationships, comfort and money matters brighten',
    Saturn: 'the Sun crosses your natal Saturn - the heaviest month of the year; reduce commitments deliberately',
    Rahu: 'the Sun crosses your natal Rahu - expect the unexpected; avoid irreversible decisions',
    Ketu: 'the Sun crosses your natal Ketu - detachment and doubt rise; a good month for retreat, a poor one for launches',
  }

  const quarters = months.map((month, i) => {
    const rashi = SOLAR_MONTHS[i].rashi
    const house = houseFromMoon(rashi)
    const primary = DASHA_MONTHLY_THEMES[house - 1]
    const secondary = ANTARDASHA_THEMES[house - 1]
    const occupants = natalBySign.get(rashi) || []
    // A natal malefic under transit downgrades an otherwise strong month, and a
    // natal benefic lifts a testing one - so strength is chart-specific too.
    const benefics = occupants.filter(o => ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(o))
    const malefics = occupants.filter(o => ['Saturn', 'Mars', 'Rahu', 'Ketu'].includes(o))
    let strength = SUN_GOCHARA_STRONG.includes(house) ? 'strong'
      : SUN_GOCHARA_WEAK.includes(house) ? 'testing' : 'moderate'
    if (strength === 'strong' && malefics.length && !benefics.length) strength = 'moderate'
    else if (strength === 'testing' && benefics.length && !malefics.length) strength = 'moderate'

    const natalNote = occupants.length
      ? `In your chart ${RASHIS[rashi]} holds ${occupants.join(', ')}, so ${CONJUNCTION_NOTE[occupants[0]] || 'this transit activates that placement directly'}.`
      : `${RASHIS[rashi]} is empty in your chart, so this month runs on the house theme alone without a natal graha amplifying it.`

    return {
      period: `${month} ${currentYear}`,
      solarPeriod: SOLAR_MONTHS[i].label,
      transitSign: RASHIS[rashi],
      houseFromMoon: house,
      strength,
      theme: primary.theme,
      guidance: primary.guidance,
      focus: primary.focus,
      natalNote,
      // The antardasha lord colours the same house differently - this is what
      // separates two natives sharing a mahadasha but not an antardasha.
      antardashaNote: kundli.currentAntardasha === kundli.currentDasha
        ? `${kundli.currentDasha} rules both the mahadasha and antardasha this month, so the theme runs at full, undiluted strength.`
        : `${kundli.currentAntardasha} antardasha overlays this month: ${secondary.guidance}`,
    }
  })

  const favorable = SOLAR_MONTHS
    .map((m, i) => ({ ...m, i, house: houseFromMoon(m.rashi) }))
    .filter(m => SUN_GOCHARA_STRONG.includes(m.house))
    .map(m => `${m.label} (Sun in ${RASHIS[m.rashi]} - ${m.house}th from your ${kundli.moonSign} Moon)`)

  const cautious = SOLAR_MONTHS
    .map((m, i) => ({ ...m, i, house: houseFromMoon(m.rashi) }))
    .filter(m => SUN_GOCHARA_WEAK.includes(m.house))
    .map(m => `${m.label} (Sun in ${RASHIS[m.rashi]} - ${m.house}th from your ${kundli.moonSign} Moon)`)

  // Eclipses fall on the nodal axis, so they matter most to the two signs the
  // native's own Rahu/Ketu occupy.
  const rahu = (kundli.planets || []).find((p: any) => p.name === 'Rahu')
  const ketu = (kundli.planets || []).find((p: any) => p.name === 'Ketu')
  if (rahu && ketu) {
    cautious.push(`Eclipses falling in ${rahu.rashi} or ${ketu.rashi} - your natal Rahu-Ketu axis - affect you more sharply than most`)
  }
  cautious.push(`Retrograde phases of ${kundli.currentDasha}${kundli.currentAntardasha !== kundli.currentDasha ? ` and ${kundli.currentAntardasha}` : ''}, your ruling dasha planet${kundli.currentAntardasha !== kundli.currentDasha ? 's' : ''} this year`)

  return {
    year: currentYear,
    overallTheme: `${currentYear} runs under the ${kundli.currentDasha} Mahadasha with ${kundli.currentAntardasha} Antardasha. This is a ${getPlanetTheme(kundli.currentDasha)} year. The interplay of these two planetary energies shapes every major life area. ${getAnnualAdvice(kundli.currentDasha)}`,
    gocharaBasis: `Monthly themes are counted from your ${kundli.moonSign} Moon (Chandra rashi). The transiting Sun moves through one sign each solar month, activating a different house of your chart every month.`,
    quarters,
    favorable: favorable.length ? favorable : ['No classically strong Sun-gochara window this year - rely on your lucky weekdays and hora instead'],
    cautious,
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

// The pada of the janma nakshatra sets the navamsa, and with it the moment a
// stone should first be put on. Two seekers identical but for their pada were
// otherwise receiving the same gemstone and colour pages.
const PADA_ACTIVATION: Record<number, string> = {
  1: 'Your 1st pada falls in a movable navamsa, so first wear it in the hour after sunrise, at the start of a lunar fortnight.',
  2: 'Your 2nd pada falls in a fixed navamsa, so first wear it at midday and then do not remove it for forty days.',
  3: 'Your 3rd pada falls in a dual navamsa, so first wear it in the late afternoon, and re-energise it every six months.',
  4: 'Your 4th pada falls at the close of the nakshatra, so first wear it at dusk on the day the Moon enters your janma nakshatra.',
}

const PADA_COLOUR_NOTE: Record<number, string> = {
  1: 'Being in the 1st pada, keep the colour closest to your head - a cap, a scarf, or the upper garment.',
  2: 'Being in the 2nd pada, the colour works best worn at the throat or on the chest.',
  3: 'Being in the 3rd pada, carry the colour rather than wear it - a cloth in the pocket, or the case of something you hold.',
  4: 'Being in the 4th pada, the colour is most effective below the waist, or in the room you sleep in rather than on the body.',
}

const STOTRA_BY_PLANET: Record<string, string> = {
  Sun: 'Aditya Hridayam', Moon: 'Chandra Kavach or Shiva Panchakshara Stotra',
  Mars: 'Hanuman Chalisa or Mangal Stotra', Mercury: 'Budha Stotra or Saraswati Vandana',
  Jupiter: 'Guru Stotram', Venus: 'Shukra Stotra or Kanakadhara Stotram',
  Saturn: 'Shani Stotra', Rahu: 'Rahu Kavach or Durga Chalisa',
  Ketu: 'Ketu Stotra or Ganesha Atharvashirsha',
}

export function generateRemediesSummary(kundli: any, numerology: any) {
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
    Sun: { deity: 'Lord Surya / Lord Ram', mantra: 'Aditya Hridayam - 108 times at sunrise' },
    Moon: { deity: 'Lord Shiva / Goddess Durga', mantra: 'Om Namah Shivaya - 108 times on Mondays' },
    Mars: { deity: 'Lord Hanuman / Lord Kartikeya', mantra: 'Hanuman Chalisa - daily on Tuesdays' },
    Mercury: { deity: 'Lord Vishnu / Goddess Saraswati', mantra: 'Om Namo Bhagavate Vasudevaya - 108 times' },
    Jupiter: { deity: 'Lord Vishnu / Lord Dakshinamurthy', mantra: 'Om Guruve Namah / Guru Stotram on Thursdays' },
    Venus: { deity: 'Goddess Lakshmi / Goddess Parvati', mantra: 'Om Shreem Mahalakshmiyei Namah on Fridays' },
    Saturn: { deity: 'Lord Shani / Lord Bhairava', mantra: 'Om Praam Preem Praum Sah Shanaischaraya Namah on Saturdays' },
    Rahu: { deity: 'Goddess Durga / Lord Bhairava', mantra: 'Rahu Kavach / Durga Chalisa on Saturdays' },
    Ketu: { deity: 'Lord Ganesha / Lord Bhairava', mantra: 'Om Gam Ganapataye Namah - 108 times daily' },
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

  // Everything below is keyed to this seeker's chart. The counts, timings and
  // supporting practices used to be fixed lines printed into every report; they
  // now derive from the dasha lord, lagna, Moon sign and life-path number.
  const sig = seekerSignature([
    planet, kundli.ascendant, kundli.moonSign, kundli.nakshatra,
    kundli.nakshatraPada, kundli.currentDasha, numerology.lifePathNumber,
    // Planetary houses are the part of the chart that actually distinguishes
    // two seekers sharing a lagna, Moon and dasha lord.
    ...(kundli.planets || []).map((pl: any) => `${pl.name}${pl.house}${pl.retrograde ? 'R' : ''}`),
  ])
  const day = getAuspiciousDay(planet)
  const lifePath = Number(numerology.lifePathNumber) || 9

  // Japa count scales with the dasha lord's own mahadasha years - the traditional
  // proportion - rather than a flat 108 for everyone.
  const DASHA_YEARS: Record<string, number> = {
    Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
    Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
  }
  const japaCount = (DASHA_YEARS[planet] ?? 16) * 6   // 36 - 120, a multiple of the lord's years

  // Surya Namaskar rounds: tied to the life-path number, floored at a workable 7
  const namaskarRounds = Math.max(7, ((lifePath * 3) % 18) + 3)

  const PRANAYAMA_BY_ELEMENT: Record<string, string> = {
    Aries: 'Bhastrika 3 min + Anulom Vilom 7 min - fire lagna needs the channel opened before it is stoked',
    Leo: 'Sheetali 5 min + Anulom Vilom 5 min - cooling first, for a fire lagna that runs hot',
    Sagittarius: 'Kapalbhati 3 min + Bhramari 5 min - discharge, then settle',
    Taurus: 'Anulom Vilom 10 min - steady earth lagna responds to unbroken rhythm',
    Virgo: 'Anulom Vilom 6 min + Bhramari 4 min - quiets an analytical mind',
    Capricorn: 'Ujjayi 5 min + Anulom Vilom 5 min - warmth for a cold, dry constitution',
    Gemini: 'Bhramari 6 min + Anulom Vilom 4 min - air lagna needs the mind stilled, not stimulated',
    Libra: 'Anulom Vilom 5 min + Sheetali 3 min - restores balance after social output',
    Aquarius: 'Kapalbhati 4 min + Bhramari 6 min - grounds a scattered nervous system',
    Cancer: 'Bhramari 8 min - water lagna settles fastest through sound',
    Scorpio: 'Kapalbhati 5 min + Ujjayi 5 min - moves stagnant emotional heat',
    Pisces: 'Anulom Vilom 8 min + Ujjayi 2 min - clears the fog without agitating',
  }

  const EVENING_BY_MOON: Record<string, string> = {
    Aries: 'Evening stillness - 12 minutes, seated, eyes closed, no mala',
    Taurus: 'Evening meditation - 25 minutes with a rudraksha mala',
    Gemini: 'Evening meditation - 15 minutes, focus on the breath count',
    Cancer: 'Evening meditation - 20 minutes by water or with a water bowl before you',
    Leo: 'Evening meditation - 18 minutes facing a lit lamp',
    Virgo: 'Evening meditation - 15 minutes, body scan before mantra',
    Libra: 'Evening meditation - 20 minutes, paired breathing then silence',
    Scorpio: 'Evening meditation - 30 minutes, the longest sitting your chart supports',
    Sagittarius: 'Evening meditation - 15 minutes after a short walk',
    Capricorn: 'Evening meditation - 22 minutes at a fixed hour, unvaried',
    Aquarius: 'Evening meditation - 20 minutes, Trataka on a candle first',
    Pisces: 'Evening meditation - 25 minutes with Yoga Nidra twice weekly',
  }

  const REFLECTION_BY_LIFEPATH: Record<number, string> = {
    1: 'Before sleep, name one thing you led well and one place you overrode someone',
    2: 'Before sleep, name three moments of ease you allowed rather than arranged',
    3: 'Before sleep, write three lines - unedited - on what moved you today',
    4: 'Before sleep, log the day honestly: what held, what slipped',
    5: 'Before sleep, name three blessings and one commitment you kept',
    6: 'Before sleep, name three people you carried and one thing you let yourself receive',
    7: 'Before sleep, sit five minutes with one question rather than answering it',
    8: 'Before sleep, separate what you achieved from what you accumulated',
    9: 'Before sleep, name three blessings and release one grievance by name',
    11: 'Before sleep, record any intuition that arrived unbidden, without judging it',
    22: 'Before sleep, measure the day against the long build, not the day itself',
  }

  const CHARITY_CADENCE: Record<string, string> = {
    Sun: 'Donate wheat or jaggery to a temple kitchen on Sundays',
    Moon: 'Donate milk or rice to a mother-and-child cause on Mondays',
    Mars: 'Donate red lentils or blood, if eligible, on Tuesdays',
    Mercury: 'Sponsor a student\'s books or stationery each month',
    Jupiter: 'Donate to a teacher, library or temple school on Thursdays',
    Venus: 'Donate white cloth, curd or sugar to women in need on Fridays',
    Saturn: 'Feed labourers or the elderly on Saturdays - the strongest remedy in your chart',
    Rahu: 'Feed stray dogs and crows on Saturdays, without being seen doing it',
    Ketu: 'Feed or clothe renunciates and the homeless on Tuesdays',
  }

  const LAMP_BY_PLANET: Record<string, string> = {
    Sun: 'Ghee lamp at sunrise, facing East',
    Moon: 'Ghee lamp with a white wick after moonrise',
    Mars: 'Sesame-oil lamp at dusk before a Hanuman image',
    Mercury: 'Ghee lamp at dusk with a green cloth beneath',
    Jupiter: 'Ghee lamp at dusk, facing North-East',
    Venus: 'Ghee lamp with camphor at dusk, facing South-East',
    Saturn: 'Mustard-oil lamp under a peepal tree at dusk on Saturdays',
    Rahu: 'Mustard-oil lamp at dusk, placed outside the threshold',
    Ketu: 'Sesame-oil lamp at dusk before a Ganesha image',
  }

  return {
    dailyPractices: [
      `Morning Surya Namaskar - ${namaskarRounds} rounds at sunrise`,
      `Chant: "${DASHA_BEEJ[planet] || DASHA_BEEJ.Jupiter}" - ${japaCount} times`,
      `Worship ${deity.deity}: ${deity.mantra}`,
      `Pranayama - ${PRANAYAMA_BY_ELEMENT[kundli.ascendant] || PRANAYAMA_BY_ELEMENT.Taurus}`,
      REFLECTION_BY_LIFEPATH[lifePath] || REFLECTION_BY_LIFEPATH[9],
      EVENING_BY_MOON[kundli.moonSign] || EVENING_BY_MOON.Taurus,
    ],
    weeklyPractices: [
      `Visit temple on ${day} - offer specific items to the deity`,
      `Fast (upvas) on ${day} - recommended for karmic clearing`,
      CHARITY_CADENCE[planet] || CHARITY_CADENCE.Jupiter,
      LAMP_BY_PLANET[planet] || LAMP_BY_PLANET.Jupiter,
      `Recite ${STOTRA_BY_PLANET[planet] || 'Navgraha Stotra'} on ${day}`,
      (() => {
        const lp = (kundli.planets || []).find((pl: any) => pl.name === planet)
        const h = lp?.house ?? 0
        const HOUSE_PRACTICE: Record<number, string> = {
          1: 'Serve food to someone in person once a week - your dasha lord sits in the 1st, so remedies done with your own hands count double',
          2: 'Set aside a fixed sum each week before spending anything - your dasha lord is in the 2nd, the house of accumulation',
          3: 'Call or visit a sibling or close peer weekly - your dasha lord occupies the 3rd',
          4: 'Touch your mother\'s feet, or send something to her, once a week - your dasha lord is in the 4th',
          5: 'Spend unhurried time weekly with a child, or on something you create - your dasha lord is in the 5th',
          6: 'Do one act of unpaid service weekly - with the dasha lord in the 6th, service is your strongest remedy',
          7: 'Do one thing weekly purely for your partner\'s benefit - your dasha lord occupies the 7th',
          8: 'Keep a weekly hour of complete solitude and silence - your dasha lord is in the 8th, which needs depth not activity',
          9: 'Visit a temple or teacher weekly - with the dasha lord in the 9th this is the most effective single act in your chart',
          10: 'Do one piece of work weekly that nobody will credit you for - your dasha lord is in the 10th and needs the ego cooled',
          11: 'Give something to a friend or group each week without being asked - your dasha lord sits in the 11th',
          12: 'Give anonymously each week, and keep a weekly fast if health allows - your dasha lord is in the 12th, the house of release',
        }
        return HOUSE_PRACTICE[h] || 'Keep one fixed weekly act of charity, unvaried, for the length of this period'
      })(),
    ],
    gemstones: (() => {
      // Carat weight, finger and timing were previously fixed per graha, so the
      // whole gemstone page was one of nine. A gemstone prescription properly
      // depends on how strong the graha actually is in THIS chart - its house,
      // whether it is retrograde, and the nakshatra pada it occupies - so those
      // now drive the weight, the finger and the caution note.
      const lord = (kundli.planets || []).find((pl: any) => pl.name === planet)
      const house = lord?.house ?? 0
      const retro = !!lord?.retrograde
      const pada = kundli.nakshatraPada && kundli.nakshatraPada >= 1 && kundli.nakshatraPada <= 4
        ? kundli.nakshatraPada : 1

      // Dusthana or retrograde placement = a weaker graha = a heavier stone
      const weak = [6, 8, 12].includes(house) || retro
      const strong = [1, 4, 7, 10, 5, 9].includes(house)
      const baseCt = parseFloat((gemstone.weight.match(/([\d.]+)/) || [])[1] || '3')
      const carats = weak ? Math.round((baseCt + 2) * 10) / 10
        : strong ? baseCt
        : Math.round((baseCt + 1) * 10) / 10

      const FINGER: Record<string, string> = {
        Sun: 'ring finger', Moon: 'little finger', Mars: 'ring finger',
        Mercury: 'little finger', Jupiter: 'index finger', Venus: 'middle finger',
        Saturn: 'middle finger', Rahu: 'middle finger', Ketu: 'ring finger',
      }
      const finger = FINGER[planet] || 'ring finger'

      const strengthNote = weak
        ? `Your ${planet} sits in the ${house}th house${retro ? ' and is retrograde' : ''}, so it needs the extra weight to register - do not economise below this.`
        : strong
        ? `Your ${planet} is already well placed in the ${house}th house, so the minimum weight is sufficient; a heavier stone would overdrive it.`
        : `Your ${planet} is moderately placed in the ${house}th house, so a slightly heavier stone than the textbook minimum is advisable.`

      return [
        {
          stone: gemstone.stone,
          purpose: gemstone.purpose,
          weight: `${carats} carats or more, set in ${gemstone.metal.toLowerCase()}`,
          metal: gemstone.metal,
          wearingDay: `${gemstone.day}, worn on the ${finger} of the right hand`,
          note: strengthNote,
        },
        {
          stone: gemstone.substitute,
          purpose: `Budget substitute for ${gemstone.stone}`,
          weight: `${Math.round((carats + 1.5) * 10) / 10} carats - an uparatna must be set heavier than the primary to carry the same effect`,
          metal: gemstone.metal,
          wearingDay: `${gemstone.day}, worn on the ${finger} of the right hand`,
          note: `Energise it on a ${gemstone.day.split(' ')[0]} in the hora of ${planet} before first wearing. ${PADA_ACTIVATION[pada] || PADA_ACTIVATION[1]}`,
        },
      ]
    })(),
    yantras: (() => {
      // The second and third yantras used to be the same two for everyone. They
      // are now chosen from the lagna and the Moon sign, so the set differs.
      const LAGNA_YANTRA: Record<string, string> = {
        Aries: 'Mangal Yantra - for the Mars-ruled lagna, install facing South',
        Taurus: 'Shukra Yantra - steadies the Venus-ruled lagna, install facing South-East',
        Gemini: 'Budh Yantra - sharpens the Mercury-ruled lagna, install facing North',
        Cancer: 'Chandra Yantra - settles the Moon-ruled lagna, install facing North-West',
        Leo: 'Surya Yantra - strengthens the Sun-ruled lagna, install facing East',
        Virgo: 'Budh Yantra - orders the Mercury-ruled lagna, install facing North',
        Libra: 'Shukra Yantra - balances the Venus-ruled lagna, install facing South-East',
        Scorpio: 'Mangal Yantra - tempers the Mars-ruled lagna, install facing South',
        Sagittarius: 'Guru Yantra - expands the Jupiter-ruled lagna, install facing North-East',
        Capricorn: 'Shani Yantra - disciplines the Saturn-ruled lagna, install facing West',
        Aquarius: 'Shani Yantra - stabilises the Saturn-ruled lagna, install facing West',
        Pisces: 'Guru Yantra - deepens the Jupiter-ruled lagna, install facing North-East',
      }
      const MOON_YANTRA: Record<string, string> = {
        Aries: 'Baglamukhi Yantra - for decisive action and victory over opposition',
        Taurus: 'Sri Yantra - for prosperity and material stability',
        Gemini: 'Saraswati Yantra - for clear speech, study and correspondence',
        Cancer: 'Chandra Yantra - for emotional steadiness and restful sleep',
        Leo: 'Surya Yantra - for recognition, authority and vitality',
        Virgo: 'Saraswati Yantra - for discernment and precise work',
        Libra: 'Sri Yantra - for harmony in partnership and beauty in the home',
        Scorpio: 'Mahamrityunjaya Yantra - for protection and deep healing',
        Sagittarius: 'Guru Yantra - for guidance, teaching and right counsel',
        Capricorn: 'Kuber Yantra - for accumulation and long-term security',
        Aquarius: 'Ganesh Yantra - for removing obstacles from unconventional paths',
        Pisces: 'Mahamrityunjaya Yantra - for spiritual protection and release',
      }
      // A fourth entry drawn from the janma nakshatra's own gana, so the yantra
      // set is not fully determined by lagna and Moon sign alone.
      const GANA_YANTRA: Record<string, string> = {
        deva: 'Gayatri Yantra - install in the East and face it at sunrise; suits your deva-gana nakshatra',
        manushya: 'Navgraha Yantra - for general planetary harmony across all nine grahas; suits your manushya-gana nakshatra',
        rakshasa: 'Mahamrityunjaya Yantra - for protection and the clearing of obstruction; suits your rakshasa-gana nakshatra',
      }
      const GANA_OF: Record<string, string> = {
        Ashwini: 'deva', Bharani: 'manushya', Krittika: 'rakshasa', Rohini: 'manushya',
        Mrigashira: 'deva', Ardra: 'manushya', Punarvasu: 'deva', Pushya: 'deva',
        Ashlesha: 'rakshasa', Magha: 'rakshasa', 'Purva Phalguni': 'manushya',
        'Uttara Phalguni': 'manushya', Hasta: 'deva', Chitra: 'rakshasa', Swati: 'deva',
        Vishakha: 'rakshasa', Anuradha: 'deva', Jyeshtha: 'rakshasa', Moola: 'rakshasa',
        'Purva Ashadha': 'manushya', 'Uttara Ashadha': 'manushya', Shravana: 'deva',
        Dhanishtha: 'rakshasa', Shatabhisha: 'rakshasa', 'Purva Bhadrapada': 'manushya',
        'Uttara Bhadrapada': 'manushya', Revati: 'deva',
      }
      const set = [
        `${planet} Yantra - energize and install in the ${prayerDirectionOf(planet)} corner of your prayer space`,
        LAGNA_YANTRA[kundli.ascendant] || 'Navgraha Yantra - for general planetary harmony',
        MOON_YANTRA[kundli.moonSign] || 'Sri Yantra - for overall prosperity and spiritual protection',
        GANA_YANTRA[GANA_OF[kundli.nakshatra] || 'manushya'],
      ]
      // De-duplicate when lagna and Moon lord coincide, and keep three entries
      const seen = new Set<string>()
      const out = set.filter(y => {
        const key = y.split(' - ')[0]
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      if (out.length < 3) out.push(one([
        'Navgraha Yantra - for general planetary harmony across all nine grahas',
        'Sri Yantra - for overall prosperity and spiritual protection',
        'Ganesh Yantra - installed at the threshold, for obstacle-free beginnings',
      ], sig))
      return out
    })(),
    luckyNumbers: numerology.luckyNumbers.slice(0, 3),
    luckyDays: numerology.luckyDays,
    annualPooja: `${planet === 'Saturn' || planet === 'Rahu' || planet === 'Ketu' ? 'Navgraha Shanti Pooja and Mahamrityunjaya Havan' : `${planet} Graha Shanti Pooja`} is strongly recommended. Perform on a ${getAuspiciousDay(planet)} during shukla paksha (waxing moon). Invite a learned Brahmin or conduct through a reliable temple.`,
    dietRecommendations: getDietPlan(planet, kundli, sig),
    charityItems: getCharityPlan(planet, kundli, lifePath, sig),
  }
}

// Diet and charity used to key on the dasha lord alone - nine possible outputs,
// so in a base of 400 seekers roughly 50 people received a byte-identical page.
// They now draw on the dasha lord, the Moon sign (what the body craves), the
// lagna (constitution) and the life-path number, selecting from pools.
const DIET_BY_PLANET: Record<string, string[]> = {
  Sun: ['Eat wheat and jaggery on Sundays', 'Include saffron milk', 'Avoid salty foods on Sundays', 'Eat before sunset', 'Take honey with warm water at sunrise', 'Avoid heavy food after dark'],
  Moon: ['Include milk and rice on Mondays', 'Eat cooling foods - cucumber, coconut', 'Avoid spicy foods on Mondays', 'Stay well-hydrated', 'Take buttermilk at midday', 'Avoid eating alone when you can help it'],
  Mars: ['Include red lentils on Tuesdays', 'Eat iron-rich foods - spinach, beets', 'Reduce fried and spicy foods', 'Fast on Tuesdays if possible', 'Avoid red meat during Mangal periods', 'Take pomegranate regularly'],
  Mercury: ['Include green vegetables on Wednesdays', 'Eat light, easily digestible meals', 'Include sesame seeds', 'Avoid heavy meats', 'Take mint or tulsi tea daily', 'Keep meal times regular rather than large'],
  Jupiter: ['Include turmeric in food daily', 'Eat yellow items on Thursdays - chana dal, banana', 'Include ghee in diet', 'Donate sweets before eating', 'Take saffron with milk on Thursdays', 'Avoid overeating - your appetite exceeds your need'],
  Venus: ['Include white foods - curd, milk, rice on Fridays', 'Avoid black items on Fridays', 'Include sour foods', 'Offer food to women before eating', 'Take rose or fennel infusions', 'Reduce refined sugar, which this period magnifies'],
  Saturn: ['Include black sesame in diet on Saturdays', 'Eat iron-rich foods', 'Include mustard oil in cooking', 'Donate black items before eating', 'Take warm, oily, grounding food - avoid raw and cold', 'Never skip meals during a Saturn period'],
  Rahu: ['Include barley and raw onion periodically', 'Avoid non-vegetarian on Saturday', 'Feed crows on Saturdays', 'Include garlic moderately', 'Avoid processed and packaged food entirely', 'Eat at fixed hours - irregularity feeds Rahu'],
  Ketu: ['Include sesame and turmeric', 'Eat light sattvic meals', 'Avoid non-vegetarian on Tuesdays', 'Include roots and tubers', 'Keep one weekly fast or light day', 'Avoid stimulants - coffee and strong tea unsettle a Ketu period'],
}

const DIET_BY_MOON: Record<string, string> = {
  Aries: 'With an Aries Moon your appetite runs hot and hurried - eat sitting down, and avoid chilli and vinegar',
  Taurus: 'With a Taurus Moon you eat for comfort - keep portions fixed rather than trusting appetite, and reduce dairy at night',
  Gemini: 'With a Gemini Moon you graze and skip - three settled meals will do more for you than any supplement',
  Cancer: 'With a Cancer Moon digestion follows mood - do not eat while upset, and favour warm, moist, simply cooked food',
  Leo: 'With a Leo Moon you run warm - reduce fried and sour foods, and take bitter greens regularly',
  Virgo: 'With a Virgo Moon digestion is sensitive and easily disturbed - keep food simple and avoid mixing many ingredients',
  Libra: 'With a Libra Moon you eat socially and irregularly - anchor at least one meal a day to a fixed hour',
  Scorpio: 'With a Scorpio Moon you tend to extremes - avoid both fasting binges and heavy late meals',
  Sagittarius: 'With a Sagittarius Moon portions run large - serve once and do not return to the pot',
  Capricorn: 'With a Capricorn Moon digestion is slow and cold - take ginger before meals and keep food warm',
  Aquarius: 'With an Aquarius Moon meals get forgotten in favour of work - set an alarm for lunch if you must',
  Pisces: 'With a Pisces Moon fluid retention and sluggish digestion are the risks - reduce salt and sugar, take warm water through the day',
}

const DIET_BY_LAGNA: Record<string, string> = {
  Aries: 'Your Aries lagna burns food quickly; eat more often rather than more at once',
  Taurus: 'Your Taurus lagna stores easily; keep the evening meal the lightest of the day',
  Gemini: 'Your Gemini lagna needs variety to stay interested in eating at all - rotate the menu weekly',
  Cancer: 'Your Cancer lagna holds water; reduce salt and take a warm drink before meals',
  Leo: 'Your Leo lagna runs hot; take cooling foods at midday when your fire peaks',
  Virgo: 'Your Virgo lagna has a precise, easily upset gut; introduce any new food singly',
  Libra: 'Your Libra lagna does best on balanced, moderate meals with no extremes of taste',
  Scorpio: 'Your Scorpio lagna processes intensely; avoid fermented and heavily preserved foods',
  Sagittarius: 'Your Sagittarius lagna has strong digestion but poor restraint; measure portions in advance',
  Capricorn: 'Your Capricorn lagna is dry and cold; add ghee or oil to every meal',
  Aquarius: 'Your Aquarius lagna runs on irregular fuel; a fixed breakfast steadies the whole day',
  Pisces: 'Your Pisces lagna absorbs slowly; favour cooked over raw and warm over cold',
}

function getDietPlan(planet: string, kundli: any, sig: number): string[] {
  const pool = DIET_BY_PLANET[planet] || DIET_BY_PLANET.Jupiter
  return [
    ...pick(pool, 4, mix(sig, 'diet')),
    DIET_BY_MOON[kundli.moonSign] || DIET_BY_MOON.Taurus,
    DIET_BY_LAGNA[kundli.ascendant] || DIET_BY_LAGNA.Taurus,
  ]
}

const CHARITY_BY_PLANET: Record<string, string[]> = {
  Sun: ['Wheat, copper, ruby-coloured cloth on Sundays', 'Donate to father figures, government workers', 'Sponsor a temple lamp for a month', 'Give jaggery to a school kitchen'],
  Moon: ['Rice, white cloth, silver, milk on Mondays', 'Donate to mothers, women, elderly', 'Fund a water cooler or drinking station', 'Give curd and rice to a hospital ward'],
  Mars: ['Red lentils, red cloth, copper on Tuesdays', 'Donate to soldiers, sportspeople', 'Give blood if eligible', 'Fund sports equipment for a local ground'],
  Mercury: ['Green vegetables, books, emerald-coloured cloth on Wednesdays', 'Donate to students, teachers', 'Sponsor a school fee for a child', 'Give stationery to a village school'],
  Jupiter: ['Yellow items, books, chana dal on Thursdays', 'Donate to Brahmins, teachers, temples', 'Fund a library shelf or scripture printing', 'Feed students on Thursdays'],
  Venus: ['White cloth, sugar, curd, silver on Fridays', 'Donate to women, artists, newlyweds', 'Sponsor an artist or musician', 'Give white flowers to a temple weekly'],
  Saturn: ['Black sesame, oil, iron, blue-black cloth on Saturdays', 'Donate to labourers, poor, disabled', 'Feed workers at a construction site', 'Fund footwear or blankets for the homeless'],
  Rahu: ['Blue cloth, coconut, sesame on Saturdays', 'Feed dogs and crows', 'Give anonymously, without being seen', 'Donate to those with no family to claim them'],
  Ketu: ['Mixed grains, brown cloth, blanket on Tuesdays', 'Donate to monks and spiritual seekers', 'Fund an ashram kitchen', 'Give to those who have renounced worldly life'],
}

const CHARITY_BY_LIFEPATH: Record<number, string> = {
  1: 'Give where you will not be thanked - your chart rewards unacknowledged giving most',
  2: 'Give jointly with your partner or family rather than alone',
  3: 'Fund something creative - an instrument, art materials, a performance',
  4: 'Give the same amount on the same day each month; consistency matters more than size here',
  5: 'Give while travelling, in places you pass through rather than only at home',
  6: 'Give to families and to the care of dependants - this is your natural channel',
  7: 'Fund study, retreat or scripture rather than material relief',
  8: 'Give a fixed percentage of income, decided in advance and not revisited',
  9: 'Give to the widest cause you can reach - your chart favours scale over proximity',
  11: 'Fund teaching and healing work rather than direct material aid',
  22: 'Fund something structural that outlasts you - a building, a well, an endowment',
}

function getCharityPlan(planet: string, kundli: any, lifePath: number, sig: number): string[] {
  const pool = CHARITY_BY_PLANET[planet] || CHARITY_BY_PLANET.Jupiter
  return [
    ...pick(pool, 3, mix(sig, 'char')),
    CHARITY_BY_LIFEPATH[lifePath] || CHARITY_BY_LIFEPATH[9],
    `Give on ${getAuspiciousDay(planet)}s, and before your own meal rather than after it`,
  ]
}

function getAuspiciousDay(planet: string): string {
  const map: Record<string, string> = {
    Sun: 'Sunday', Moon: 'Monday', Mars: 'Tuesday', Mercury: 'Wednesday',
    Jupiter: 'Thursday', Venus: 'Friday', Saturn: 'Saturday', Rahu: 'Saturday', Ketu: 'Tuesday',
  }
  return map[planet] || 'Monday'
}

// Guru Pushya and the Saturday rule were previously two-branch ternaries, so
// every seeker read one of two sentences. Both now resolve per lagna.
const GURU_PUSHYA_BY_LAGNA: Record<string, string> = {
  Aries: 'use it for launches and equipment purchases, not for lending money',
  Taurus: 'your strongest buying window of the year - gold, land and vehicles',
  Gemini: 'best spent on contracts, publishing and anything you sign your name to',
  Cancer: 'exceptionally strong for you, as Jupiter exalts in your lagna - use it for property and family matters',
  Leo: 'use it for career moves and approaching people in authority',
  Virgo: 'best for beginning study, treatment or any long discipline',
  Libra: 'use it for partnership agreements and anything requiring another party to say yes',
  Scorpio: 'strong for research, investment and quiet accumulation - avoid public launches',
  Sagittarius: 'exceptionally strong for you, as Jupiter rules your lagna - use it for teaching, travel and long-range plans',
  Capricorn: 'use it for structural commitments - hiring, building, long contracts',
  Aquarius: 'best for unconventional ventures and anything involving groups or networks',
  Pisces: 'exceptionally strong for you, as Jupiter rules your lagna - use it for spiritual undertakings and charitable giving',
}

const SATURDAY_BY_LAGNA: Record<string, string> = {
  Aries: 'Saturdays for weddings and major contracts - Saturn is a functional malefic for your lagna',
  Taurus: 'Saturdays are workable for you, as Saturn is a yogakaraka for Taurus - but still avoid Rahu Kaal',
  Gemini: 'Saturdays for property registration - Saturn brings delay to Gemini undertakings',
  Cancer: 'Saturdays for anything permanent - Saturn rules your 7th and 8th and undermines Cancer beginnings',
  Leo: 'Saturdays for new ventures - Saturn rules your 6th and 7th and works against Leo initiative',
  Virgo: 'Saturdays for health procedures and new employment',
  Libra: 'Saturdays are workable for you, as Saturn is a yogakaraka for Libra - but still avoid Rahu Kaal',
  Scorpio: 'Saturdays for financial commitments - Saturn rules your 3rd and 4th with mixed effect',
  Sagittarius: 'Saturdays for travel and teaching commitments',
  Capricorn: 'Saturdays are workable for you despite the general rule, as Saturn rules your lagna - but still avoid Rahu Kaal',
  Aquarius: 'Saturdays are workable for you despite the general rule, as Saturn rules your lagna - but still avoid Rahu Kaal',
  Pisces: 'Saturdays for weddings and anything requiring warmth - Saturn cools Pisces undertakings',
}

export function generateMuhurtaGuide(kundli: any, numerology: any) {
  const lagna = kundli.ascendant
  const moonSign = kundli.moonSign
  const dasha = kundli.currentDasha
  const lp = numerology.lifePathNumber
  const RASHI_AT = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio',
    'Sagittarius','Capricorn','Aquarius','Pisces']

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

  // The maraka/badhaka planet for each lagna - its hora is the one to avoid for
  // starting anything, regardless of which weekday it falls on.
  const DAY_HORA_TO_AVOID: Record<string, string> = {
    Aries: 'Saturn', Taurus: 'Mars', Gemini: 'Mars', Cancer: 'Saturn',
    Leo: 'Saturn', Virgo: 'Mars', Libra: 'Mars', Scorpio: 'Mercury',
    Sagittarius: 'Venus', Capricorn: 'Jupiter', Aquarius: 'Moon', Pisces: 'Mercury',
  }

  // Lucky time of day by lagna lord
  const LUCKY_TIME: Record<string, string> = {
    Sun: '6 AM - 9 AM (Brahma Muhurta + Sunrise)', Moon: '5 AM - 7 AM or 8 PM - 10 PM',
    Mars: '6 AM - 8 AM or 4 PM - 6 PM', Mercury: '8 AM - 11 AM',
    Jupiter: '7 AM - 9 AM or 5 PM - 7 PM', Venus: '6 AM - 8 AM or 7 PM - 9 PM',
    Saturn: '8 AM - 10 AM or 6 PM - 8 PM',
  }

  // Rahu Kaal is the eighth part of the day counted from sunrise, so it moves
  // with latitude and season. Computed from this seeker's own birth place
  // instead of the old fixed 6am-6pm table that every report shared.
  const RAHU_KAAL: Record<string, string> =
    Number.isFinite(kundli.birthLat) && Number.isFinite(kundli.birthLng)
      ? rahuKaalChart(kundli.birthLat, kundli.birthLng, kundli.birthDate)
      : {
          Sunday: '4:30 PM - 6:00 PM', Monday: '7:30 AM - 9:00 AM',
          Tuesday: '3:00 PM - 4:30 PM', Wednesday: '12:00 PM - 1:30 PM',
          Thursday: '1:30 PM - 3:00 PM', Friday: '10:30 AM - 12:00 PM',
          Saturday: '9:00 AM - 10:30 AM',
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

  // Hora (planetary hour) chart - first hora of each day
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
  const DEBILITATION: Record<string, string> = {
    Sun: 'Libra', Moon: 'Scorpio', Mars: 'Cancer', Mercury: 'Pisces',
    Jupiter: 'Capricorn', Venus: 'Virgo', Saturn: 'Aries',
    Rahu: 'Sagittarius', Ketu: 'Gemini',
  }
  const nakshatraLordDay = PLANET_WEEKDAY[LAGNA_LORD[lagna] || 'Jupiter']

  const SPECIAL_DATES: Record<string, string | string[]> = {
    mostFavorable: [
      `Days when the Moon transits your janma nakshatra ${kundli.nakshatra} - your monthly peak, occurring once every 27 days`,
      `${luckyDays[0]}s during Shukla Paksha (waxing moon, 1st-14th lunar day) - ${luckyDays[0]} is ruled by ${lagnaLord}, your ${lagna} Lagna lord`,
      `Days when the Moon transits ${moonSign}, ${RASHI_AT[(RASHI_AT.indexOf(moonSign) + 4) % 12]} or ${RASHI_AT[(RASHI_AT.indexOf(moonSign) + 8) % 12]} - the trine signs from your Moon`,
      `Pushya Nakshatra day - universally auspicious, and ${
        kundli.nakshatra === 'Pushya'
          ? 'doubly so for you, since Pushya is your own janma nakshatra'
          : `for you best used for ${['Cancer', 'Scorpio', 'Pisces'].includes(moonSign)
              ? 'property, vehicles and anything you intend to keep'
              : ['Taurus', 'Virgo', 'Capricorn'].includes(moonSign)
              ? 'signing, purchasing and long-term financial commitments'
              : ['Gemini', 'Libra', 'Aquarius'].includes(moonSign)
              ? 'contracts, negotiations and launching anything public'
              : 'new ventures, travel and anything requiring initiative'}`
      }`,
      `Guru Pushya Yoga (Pushya nakshatra falling on a Thursday) - ${GURU_PUSHYA_BY_LAGNA[lagna] || 'most powerful for wealth matters'}`,
    ],
    avoidDays: [
      `${unluckyDays[0]}s during Rahu Kaal (${RAHU_KAAL[unluckyDays[0]] || 'see chart'}) - your single worst recurring window`,
      `Days when the Moon transits ${RASHI_AT[(RASHI_AT.indexOf(moonSign) + 3) % 12]}, ${RASHI_AT[(RASHI_AT.indexOf(moonSign) + 5) % 12]} or ${RASHI_AT[(RASHI_AT.indexOf(moonSign) + 7) % 12]} - the 4th, 6th and 8th from your ${moonSign} Moon`,
      `While ${dasha} transits ${DEBILITATION[dasha] || 'its sign of debilitation'} - your dasha lord is at its weakest there`,
      SATURDAY_BY_LAGNA[lagna] || 'Saturdays for weddings and major contracts',
      `Amavasya (New Moon), Ashtami (8th lunar day) and Chaturdashi (14th) for new beginnings - ${
        ['Cancer', 'Taurus'].includes(moonSign)
          ? `with your ${moonSign} Moon exalted or at home, Amavasya hits you hardest of the three; keep it clear`
          : ['Scorpio', 'Capricorn', 'Aquarius'].includes(moonSign)
          ? `with your ${moonSign} Moon already under strain, treat Ashtami as the one to guard most carefully`
          : `for your ${moonSign} Moon, Chaturdashi is the one most likely to unsettle a launch`
      }`,
    ],
    eclipsePeriod: `Avoid all major decisions 3 days before and after solar/lunar eclipses${
      kundli.planets?.find((p: any) => p.name === 'Rahu')
        ? `, and treat eclipses falling in ${kundli.planets.find((p: any) => p.name === 'Rahu').rashi} or ${kundli.planets.find((p: any) => p.name === 'Ketu')?.rashi} - your natal nodal axis - as a full pause on new commitments`
        : ''
    }`,
  }

  return {
    overview: `Your Muhurta (auspicious timing) guide is personalized to your ${lagna} Lagna, ${moonSign} Moon, and ${dasha} Mahadasha. The right timing amplifies your efforts many fold - acting in alignment with cosmic rhythms is one of the most powerful tools of Vedic wisdom.`,
    luckyDays,
    unluckyDays,
    luckyTime: LUCKY_TIME[lagnaLord] || LUCKY_TIME.Jupiter,
    unluckyTime: `Rahu Kaal - varies by day (see chart below). Your worst window is ${unluckyDays[0]} ${RAHU_KAAL[unluckyDays[0]] || ''}, because ${unluckyDays[0]} is ruled by a malefic for your ${lagna} Lagna. Also avoid the ${DAY_HORA_TO_AVOID[lagna] || 'Saturn'} hora on any day for new undertakings.`,
    rahuKaalChart: RAHU_KAAL,
    horaGuide: {
      description: `Each day is divided into 24 planetary hours (Hora). The first hora of each day is ruled by the day's planet, and the rest follow the fixed Chaldean sequence. For you the hora to seek out is ${lagnaLord}'s - your ${lagna} Lagna lord - and the one to keep clear is ${DAY_HORA_TO_AVOID[lagna] || 'Saturn'}'s. ${
        benefics.includes(dasha)
          ? `Your running ${dasha} Mahadasha is benefic for this lagna, so its hora is a second good window each day.`
          : `Your running ${dasha} Mahadasha is not among this lagna's benefics, so avoid starting anything in the ${dasha} hora even on an otherwise good day.`
      }`,
      firstHoraByDay: Object.fromEntries(Object.entries(HORA_ORDER).map(([day, planets]) => [day, `${planets[0]} hora - ${LUCKY_TIME[planets[0]] || '6–7 AM'}`])),
    },
    forEducation: EDUCATION_TIMING[lagna] || 'Thursday mornings in Jupiter hora are universally auspicious for education',
    forMarriage: MARRIAGE_TIMING[lagna] || 'Friday mornings during Venus hora, Shukla Paksha',
    forInvestment: INVESTMENT_TIMING[lagna] || 'Thursday or Friday mornings for long-term investments',
    forHealth: HEALTH_TIMING[lagna] || 'Begin health regimens on auspicious weekday of lagna lord',
    forTravel: TRAVEL_TIMING[lagna] || 'Thursday is universally favorable for long journeys',
    forCareer: CAREER_TIMING[lagna] || 'Thursday mornings for career initiatives, Jupiter hora',
    forPropertyPurchase: `${
      ['Cancer','Taurus','Capricorn','Scorpio'].includes(lagna)
        ? `Your ${lagna} Lagna is naturally strong for property - fixed and water signs hold land well`
        : ['Aries','Leo','Sagittarius'].includes(lagna)
        ? `Your ${lagna} Lagna favours quick acquisition but poor retention - buy deliberately and avoid impulse purchases`
        : `Your ${lagna} Lagna is neutral for property - the timing matters more than the lagna here`
    }. Best day: Saturday during the ${['Cancer','Taurus','Capricorn','Scorpio'].includes(lagna) ? 'Saturn or Moon' : 'Saturn or Mars'} hora, since Saturn blesses permanent structures. ${
      ['Rahu','Ketu','Saturn'].includes(dasha)
        ? `Note that you are running a ${dasha} dasha - property acquired now tends to come with hidden complications, so verify title and encumbrance with unusual care.`
        : ['Venus','Jupiter','Moon'].includes(dasha)
        ? `Your running ${dasha} dasha is genuinely supportive of property acquisition - this is a good window.`
        : `Your running ${dasha} dasha is neutral for property; rely on muhurta rather than the dasha for timing.`
    }`,
    forNameCeremony: `Pushya Nakshatra, or the day the Moon transits your own ${kundli.nakshatra} nakshatra, are ideal for naming ceremonies. The name's first syllable is traditionally chosen from the pada of the child's own janma nakshatra.`,
    specialDates: SPECIAL_DATES,
    personalLuckyNumbers: numerology.luckyNumbers,
    personalLuckyDays: numerology.luckyDays,
    lifePath: lp,
    currentYearNote: `Personal Year ${numerology.personalYearNumber}: ${numerology.personalYearNumber <= 3 ? 'First half of year favors new beginnings' : numerology.personalYearNumber <= 6 ? 'Mid-year is your peak action window' : 'Last quarter brings completion and harvest'}`,
  }
}

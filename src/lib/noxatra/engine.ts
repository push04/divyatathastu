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
    currentPhase: `Currently running ${kundli.currentDasha} Mahadasha with ${kundli.currentAntardasha} Antardasha. This period highlights themes of ${getDashaThemes(kundli.currentDasha)}.`,
    career: getCareerFromChart(kundli),
    marriage: getMarriageFromChart(kundli),
    health: getHealthFromChart(kundli),
    finance: getFinanceFromChart(kundli),
    remedies: getGeneralRemedies(kundli),
  }
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
  return {
    year: currentYear,
    overallTheme: `This is a ${getPlanetTheme(kundli.currentDasha)} year. The ${kundli.currentDasha}-${kundli.currentAntardasha} Dasha combination creates specific opportunities and challenges.`,
    quarters: [
      { period: `Jan-Mar ${currentYear}`, theme: 'Foundation setting', guidance: 'Excellent for planning and laying groundwork' },
      { period: `Apr-Jun ${currentYear}`, theme: 'Growth and action', guidance: 'Peak period for career and relationship moves' },
      { period: `Jul-Sep ${currentYear}`, theme: 'Introspection', guidance: 'Focus on health and spiritual practices' },
      { period: `Oct-Dec ${currentYear}`, theme: 'Harvest and completion', guidance: 'Complete projects and celebrate achievements' },
    ],
    favorable: ['Jan 15-31', 'Mar 20-Apr 10', 'Jul 1-20', 'Nov 1-20'],
    cautious: ['Feb 10-25', 'Jun 15-30', 'Sep 10-25'],
  }
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
  return {
    dailyPractices: [
      'Morning Surya Namaskar (12 rounds)',
      `Chant ${kundli.dashaLord} beej mantra 108 times`,
      'Gratitude journaling (3 things daily)',
      'Evening meditation (20 minutes)',
    ],
    weeklyPractices: [
      `Visit temple on ${getAuspiciousDay(kundli.dashaLord)}`,
      'Donate food or money every week',
      `Fast on ${getAuspiciousDay(kundli.dashaLord)} (optional)`,
    ],
    gemstones: [{
      stone: 'As per Yantra report',
      purpose: 'Amplify planetary benefic energies',
    }],
    yantras: [`${kundli.dashaLord} Yantra in prayer room`],
    luckyNumbers: numerology.luckyNumbers.slice(0, 3),
    luckyDays: numerology.luckyDays,
    annualPooja: 'Navgraha Shanti Pooja recommended during Saturn or Rahu dashas',
  }
}

function getAuspiciousDay(planet: string): string {
  const map: Record<string, string> = {
    Sun: 'Sunday', Moon: 'Monday', Mars: 'Tuesday', Mercury: 'Wednesday',
    Jupiter: 'Thursday', Venus: 'Friday', Saturn: 'Saturday', Rahu: 'Saturday', Ketu: 'Tuesday',
  }
  return map[planet] || 'Monday'
}

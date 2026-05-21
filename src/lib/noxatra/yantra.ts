// Yantra & Colour Therapy — Planet → Yantra → Colour Mapping

const RASHI_RULING_PLANET: Record<string, string> = {
  'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
  'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars',
  'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter',
}

const PLANET_YANTRA: Record<string, {
  name: string; deity: string; mantra: string; metal: string; day: string; color: string;
  primaryColors: string[]; avoidColors: string[]; gemstone: string; direction: string
}> = {
  Sun: {
    name: 'Surya Yantra', deity: 'Lord Surya', mantra: 'Om Hraam Hreem Hraum Sah Suryaya Namah',
    metal: 'Gold', day: 'Sunday', color: '#F59E0B',
    primaryColors: ['Gold', 'Orange', 'Red', 'Copper'], avoidColors: ['Blue', 'Black'],
    gemstone: 'Ruby (Manik)', direction: 'East',
  },
  Moon: {
    name: 'Chandra Yantra', deity: 'Lord Chandra', mantra: 'Om Shraam Shreem Shraum Sah Chandraya Namah',
    metal: 'Silver', day: 'Monday', color: '#C0C0C0',
    primaryColors: ['White', 'Silver', 'Pearl', 'Cream'], avoidColors: ['Red', 'Dark colors'],
    gemstone: 'Pearl (Moti)', direction: 'North-West',
  },
  Mars: {
    name: 'Mangal Yantra', deity: 'Lord Mangal', mantra: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah',
    metal: 'Copper', day: 'Tuesday', color: '#DC2626',
    primaryColors: ['Red', 'Scarlet', 'Coral', 'Maroon'], avoidColors: ['Green', 'Yellow'],
    gemstone: 'Red Coral (Moonga)', direction: 'South',
  },
  Mercury: {
    name: 'Budha Yantra', deity: 'Lord Budha', mantra: 'Om Braam Breem Braum Sah Budhaya Namah',
    metal: 'Bronze', day: 'Wednesday', color: '#16A34A',
    primaryColors: ['Green', 'Emerald', 'Light green', 'Turquoise'], avoidColors: ['Red', 'Pink'],
    gemstone: 'Emerald (Panna)', direction: 'North',
  },
  Jupiter: {
    name: 'Guru Yantra', deity: 'Lord Brihaspati', mantra: 'Om Graam Greem Graum Sah Guruve Namah',
    metal: 'Gold', day: 'Thursday', color: '#CA8A04',
    primaryColors: ['Yellow', 'Gold', 'Light yellow', 'Cream'], avoidColors: ['Grey', 'Black'],
    gemstone: 'Yellow Sapphire (Pukhraj)', direction: 'North-East',
  },
  Venus: {
    name: 'Shukra Yantra', deity: 'Goddess Lakshmi', mantra: 'Om Draam Dreem Draum Sah Shukraya Namah',
    metal: 'Silver', day: 'Friday', color: '#F9A8D4',
    primaryColors: ['White', 'Pink', 'Light blue', 'Lavender'], avoidColors: ['Dark colors', 'Brown'],
    gemstone: 'Diamond / White Sapphire (Heera)', direction: 'South-East',
  },
  Saturn: {
    name: 'Shani Yantra', deity: 'Lord Shani', mantra: 'Om Praam Preem Praum Sah Shanaischaraya Namah',
    metal: 'Iron', day: 'Saturday', color: '#374151',
    primaryColors: ['Dark blue', 'Black', 'Indigo', 'Dark purple'], avoidColors: ['Red', 'Gold'],
    gemstone: 'Blue Sapphire (Neelam)', direction: 'West',
  },
  Rahu: {
    name: 'Rahu Yantra', deity: 'Lord Rahu', mantra: 'Om Bhraam Bhreem Bhraum Sah Rahave Namah',
    metal: 'Lead', day: 'Saturday', color: '#1E3A5F',
    primaryColors: ['Dark blue', 'Smoky grey', 'Ultraviolet'], avoidColors: ['Yellow', 'White'],
    gemstone: 'Hessonite Garnet (Gomed)', direction: 'South-West',
  },
  Ketu: {
    name: 'Ketu Yantra', deity: 'Lord Ketu', mantra: 'Om Sraam Sreem Sraum Sah Ketave Namah',
    metal: 'Iron', day: 'Tuesday', color: '#78350F',
    primaryColors: ['Brown', 'Olive', 'Smoky colors'], avoidColors: ['Bright colors', 'White'],
    gemstone: "Cat's Eye (Lehsunia)", direction: 'North-West',
  },
}

export function calculateYantraColour(moonSign: string, ascendant: string, nakshatra: string) {
  const rulingPlanet = RASHI_RULING_PLANET[moonSign] || 'Jupiter'
  const ascendantPlanet = RASHI_RULING_PLANET[ascendant] || 'Sun'

  const primaryYantra = PLANET_YANTRA[rulingPlanet]
  const secondaryYantra = PLANET_YANTRA[ascendantPlanet]

  return {
    primaryPlanet: rulingPlanet,
    primaryYantra: {
      ...primaryYantra,
      description: getYantraDescription(primaryYantra.name, rulingPlanet),
      benefits: getYantraBenefits(rulingPlanet),
      installationDay: primaryYantra.day,
      usage: 'Place in your prayer room or on your desk. Energise on ' + primaryYantra.day + ' morning.',
    },
    secondaryPlanet: ascendantPlanet,
    colourTherapy: {
      power: primaryYantra.primaryColors,
      avoid: primaryYantra.avoidColors,
      forHealth: getHealthColors(rulingPlanet),
      forWealth: getWealthColors(rulingPlanet),
      forRelationships: getRelationshipColors(rulingPlanet),
      forHome: getHomeColors(rulingPlanet),
      clothingGuidance: `Wear ${primaryYantra.primaryColors[0]} on ${primaryYantra.day} for maximum energy amplification.`,
    },
    gemstone: {
      primary: primaryYantra.gemstone,
      finger: getGemFinger(rulingPlanet),
      metal: primaryYantra.metal,
      weight: '3-5 carats recommended',
      day: `Wear first on a ${primaryYantra.day} during ${primaryYantra.day === 'Sunday' ? 'morning' : 'sunrise'} hora`,
    },
  }
}

function getYantraDescription(yantraName: string, planet: string): string {
  return `The ${yantraName} is a sacred geometric pattern containing the vibrational frequency of ${planet}. Meditating upon or keeping this yantra in your home harmonises the planetary energy, removes obstacles, and amplifies the positive qualities of ${planet} in your life.`
}

function getYantraBenefits(planet: string): string[] {
  const benefits: Record<string, string[]> = {
    Sun: ['Leadership and authority', 'Government favour', 'Fame and recognition', 'Health and vitality', 'Father relationship harmony'],
    Moon: ['Emotional stability', 'Mental peace', 'Mother relationship harmony', 'Creativity and intuition', 'Travel luck'],
    Mars: ['Courage and confidence', 'Property and real estate', 'Legal victory', 'Athletic performance', 'Sibling harmony'],
    Mercury: ['Intelligence and education', 'Business success', 'Communication skills', 'Financial acumen', 'Skin health'],
    Jupiter: ['Wisdom and spiritual growth', 'Children and fertility', 'Financial prosperity', 'Marriage harmony', 'Teacher blessings'],
    Venus: ['Marriage and relationships', 'Luxury and comforts', 'Artistic talents', 'Beauty and charm', 'Creative success'],
    Saturn: ['Career stability', 'Discipline and focus', 'Property gains', 'Longevity', 'Karma resolution'],
    Rahu: ['Foreign travel and success', 'Technology fields', 'Hidden knowledge', 'Material gains', 'Breaking patterns'],
    Ketu: ['Spiritual liberation', 'Occult knowledge', 'Intuition', 'Past karma resolution', 'Detachment'],
  }
  return benefits[planet] || []
}

function getHealthColors(planet: string): string[] {
  const map: Record<string, string[]> = {
    Sun: ['Gold', 'Saffron'], Moon: ['White', 'Silver'], Mars: ['Red', 'Orange'],
    Mercury: ['Green', 'Teal'], Jupiter: ['Yellow'], Venus: ['Pink', 'White'],
    Saturn: ['Blue', 'Violet'], Rahu: ['Grey'], Ketu: ['Brown'],
  }
  return map[planet] || ['White']
}

function getWealthColors(planet: string): string[] {
  const map: Record<string, string[]> = {
    Sun: ['Gold'], Moon: ['Silver', 'White'], Mars: ['Red', 'Copper'],
    Mercury: ['Green'], Jupiter: ['Yellow', 'Gold'], Venus: ['White', 'Gold'],
    Saturn: ['Blue', 'Black'], Rahu: ['Dark blue'], Ketu: ['Mixed'],
  }
  return map[planet] || ['Gold']
}

function getRelationshipColors(planet: string): string[] {
  const map: Record<string, string[]> = {
    Sun: ['Orange', 'Gold'], Moon: ['White', 'Cream'], Mars: ['Red', 'Pink'],
    Mercury: ['Green', 'Light blue'], Jupiter: ['Yellow', 'Gold'], Venus: ['Pink', 'Rose', 'White'],
    Saturn: ['Blue', 'Purple'], Rahu: ['Indigo'], Ketu: ['Saffron'],
  }
  return map[planet] || ['Pink', 'Rose']
}

function getHomeColors(planet: string): string[] {
  const map: Record<string, string[]> = {
    Sun: ['Warm yellow', 'Orange accents'], Moon: ['White walls', 'Silver accents'],
    Mars: ['Red accents', 'Warm tones'], Mercury: ['Green plants', 'Light wood'],
    Jupiter: ['Yellow', 'Light wood', 'Gold accents'], Venus: ['Pink', 'Cream', 'Pastel'],
    Saturn: ['Grey', 'Dark blue', 'Minimalist'], Rahu: ['Dark tones', 'Modern'], Ketu: ['Earth tones'],
  }
  return map[planet] || ['Neutral tones']
}

function getGemFinger(planet: string): string {
  const map: Record<string, string> = {
    Sun: 'Ring finger', Moon: 'Little finger', Mars: 'Ring finger',
    Mercury: 'Little finger', Jupiter: 'Index finger', Venus: 'Middle finger',
    Saturn: 'Middle finger', Rahu: 'Middle finger', Ketu: 'Ring finger',
  }
  return map[planet] || 'Index finger'
}

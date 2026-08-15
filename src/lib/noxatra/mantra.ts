// Mantra Science - Planet → Deity → Mantra mapping

import { seekerSignature, rotate } from './personalise'

const PLANET_MANTRA_DATA: Record<string, {
  beejMantra: string; planetMantra: string; deity: string; deityMantra: string;
  count: number[]; bestTime: string; bestDay: string; direction: string;
  mala: string; sitPosition: string; mahaMantra: string; likhitJapa: {
    mantra: string; count: number; pen: string; paper: string; inkColor: string
    posture: string; auspiciousDays: string[]
  }
}> = {
  Sun: {
    beejMantra: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः',
    planetMantra: 'ॐ सूर्याय नमः',
    deity: 'Lord Surya / Lord Rama',
    deityMantra: 'ॐ रामाय नमः',
    count: [108, 1008, 21],
    bestTime: 'Sunrise (Brahma Muhurta)',
    bestDay: 'Sunday',
    direction: 'East',
    mala: 'Rudraksha mala or copper mala',
    sitPosition: 'Face East, sit on red cloth',
    mahaMantra: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः | आदित्याय नमः',
    likhitJapa: {
      mantra: 'ॐ सूर्याय नमः',
      count: 108,
      pen: 'Red ink pen',
      paper: 'Yellow paper',
      inkColor: 'Red or saffron',
      posture: 'Sit facing East on a red mat',
      auspiciousDays: ['Sunday', 'Ekadashi', 'Purnima'],
    },
  },
  Moon: {
    beejMantra: 'ॐ श्रां श्रीं श्रौं सः चन्द्राय नमः',
    planetMantra: 'ॐ चन्द्राय नमः',
    deity: 'Lord Shiva / Goddess Parvati',
    deityMantra: 'ॐ नमः शिवाय',
    count: [108, 11],
    bestTime: 'Monday evening / Full moon night',
    bestDay: 'Monday',
    direction: 'North-West',
    mala: 'Pearl mala or white sandalwood mala',
    sitPosition: 'Face North-West, sit on white cloth',
    mahaMantra: 'ॐ श्रां श्रीं श्रौं सः चन्द्राय नमः',
    likhitJapa: {
      mantra: 'ॐ चन्द्राय नमः',
      count: 108,
      pen: 'Silver ink pen',
      paper: 'White paper',
      inkColor: 'White or silver',
      posture: 'Sit facing North on a white mat',
      auspiciousDays: ['Monday', 'Purnima', 'Ekadashi'],
    },
  },
  Mars: {
    beejMantra: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',
    planetMantra: 'ॐ मंगलाय नमः',
    deity: 'Lord Hanuman / Lord Kartikeya',
    deityMantra: 'ॐ हं हनुमते नमः',
    count: [108, 21],
    bestTime: 'Tuesday Sunrise',
    bestDay: 'Tuesday',
    direction: 'South',
    mala: 'Red sandalwood mala or coral mala',
    sitPosition: 'Face South, sit on red cloth',
    mahaMantra: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',
    likhitJapa: {
      mantra: 'ॐ मंगलाय नमः',
      count: 108,
      pen: 'Red pen',
      paper: 'Red paper',
      inkColor: 'Red',
      posture: 'Sit facing South on a red mat, Tuesday morning',
      auspiciousDays: ['Tuesday', 'Navratri days'],
    },
  },
  Mercury: {
    beejMantra: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः',
    planetMantra: 'ॐ बुधाय नमः',
    deity: 'Lord Vishnu / Goddess Saraswati',
    deityMantra: 'ॐ नमो भगवते वासुदेवाय',
    count: [108, 21],
    bestTime: 'Wednesday morning',
    bestDay: 'Wednesday',
    direction: 'North',
    mala: 'Green jade mala or emerald mala',
    sitPosition: 'Face North, sit on green cloth',
    mahaMantra: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः | ॐ ऐं सरस्वत्यै नमः',
    likhitJapa: {
      mantra: 'ॐ बुधाय नमः',
      count: 108,
      pen: 'Green ink pen',
      paper: 'Green or white paper',
      inkColor: 'Green',
      posture: 'Sit facing North on a green mat, Wednesday morning',
      auspiciousDays: ['Wednesday', 'Panchami', 'Chaturthi'],
    },
  },
  Jupiter: {
    beejMantra: 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः',
    planetMantra: 'ॐ गुरवे नमः',
    deity: 'Lord Vishnu / Lord Dattatreya',
    deityMantra: 'ॐ नमो भगवते वासुदेवाय | ॐ द्रां दत्तात्रेयाय नमः',
    count: [108, 16, 1008],
    bestTime: 'Thursday Sunrise',
    bestDay: 'Thursday',
    direction: 'North-East',
    mala: 'Yellow sapphire mala or sandalwood mala',
    sitPosition: 'Face North-East, sit on yellow cloth',
    mahaMantra: 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः',
    likhitJapa: {
      mantra: 'ॐ गुरवे नमः',
      count: 108,
      pen: 'Yellow or gold ink pen',
      paper: 'Yellow paper',
      inkColor: 'Yellow or golden',
      posture: 'Sit facing North-East on a yellow mat, Thursday morning',
      auspiciousDays: ['Thursday', 'Ekadashi', 'Purnima'],
    },
  },
  Venus: {
    beejMantra: 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः',
    planetMantra: 'ॐ शुक्राय नमः',
    deity: 'Goddess Lakshmi / Goddess Durga',
    deityMantra: 'ॐ श्रीं महालक्ष्म्यै नमः',
    count: [108, 21],
    bestTime: 'Friday morning',
    bestDay: 'Friday',
    direction: 'South-East',
    mala: 'White sandalwood mala or diamond/crystal mala',
    sitPosition: 'Face South-East, sit on white or pink cloth',
    mahaMantra: 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः | ॐ श्रीं ह्रीं श्रीं महालक्ष्म्यै नमः',
    likhitJapa: {
      mantra: 'ॐ शुक्राय नमः',
      count: 108,
      pen: 'White or pink ink pen',
      paper: 'White paper',
      inkColor: 'White, pink, or rose',
      posture: 'Sit facing East on a white mat, Friday morning',
      auspiciousDays: ['Friday', 'Purnima', 'Navratri'],
    },
  },
  Saturn: {
    beejMantra: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',
    planetMantra: 'ॐ शनैश्चराय नमः',
    deity: 'Lord Shani / Lord Bhairav',
    deityMantra: 'ॐ शं शनैश्चराय नमः',
    count: [108, 19, 23],
    bestTime: 'Saturday at sunset',
    bestDay: 'Saturday',
    direction: 'West',
    mala: 'Iron mala or black sesame mala',
    sitPosition: 'Face West, sit on black or dark blue cloth',
    mahaMantra: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',
    likhitJapa: {
      mantra: 'ॐ शनैश्चराय नमः',
      count: 108,
      pen: 'Black ink pen',
      paper: 'Blue or black paper',
      inkColor: 'Dark blue or black',
      posture: 'Sit facing West on a black mat, Saturday evening',
      auspiciousDays: ['Saturday', 'Amavasya', 'Shani Jayanti'],
    },
  },
  Rahu: {
    beejMantra: 'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः',
    planetMantra: 'ॐ राहवे नमः',
    deity: 'Goddess Durga / Lord Bhairav',
    deityMantra: 'ॐ दुं दुर्गायै नमः',
    count: [108, 18],
    bestTime: 'Saturday night or sunset',
    bestDay: 'Saturday',
    direction: 'South-West',
    mala: 'Black glass bead mala or Rahu mala',
    sitPosition: 'Face South-West, sit on dark cloth',
    mahaMantra: 'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः',
    likhitJapa: {
      mantra: 'ॐ राहवे नमः',
      count: 108,
      pen: 'Dark blue or black ink pen',
      paper: 'Dark blue paper',
      inkColor: 'Dark blue',
      posture: 'Sit facing South-West on a dark mat, Saturday night',
      auspiciousDays: ['Saturday', 'Rahu Kaal timing', 'Amavasya'],
    },
  },
  Ketu: {
    beejMantra: 'ॐ स्रां स्रीं स्रौं सः केतवे नमः',
    planetMantra: 'ॐ केतवे नमः',
    deity: 'Lord Ganesha / Lord Skanda',
    deityMantra: 'ॐ गं गणपतये नमः',
    count: [108, 7],
    bestTime: 'Tuesday or Saturday sunrise',
    bestDay: 'Tuesday',
    direction: 'North-West',
    mala: 'Cat eye mala or Ketu mala',
    sitPosition: 'Face North-West, sit on grey or mixed cloth',
    mahaMantra: 'ॐ स्रां स्रीं स्रौं सः केतवे नमः',
    likhitJapa: {
      mantra: 'ॐ केतवे नमः',
      count: 108,
      pen: 'Brown ink pen',
      paper: 'Brown or grey paper',
      inkColor: 'Brown',
      posture: 'Sit facing North on an earth-tone mat, Tuesday morning',
      auspiciousDays: ['Tuesday', 'Chaturdashi', 'Amavasya'],
    },
  },
}

// 27 Nakshatras × 4 Padas = 108 sacred syllables for Nama Akshara (birth sound)
// Used to derive the personal beej sound for mantra initiation
const NAKSHATRA_PADA_SYLLABLES: Record<string, [string, string, string, string]> = {
  'Ashwini':           ['Chu',  'Che',  'Cho',  'La'  ],
  'Bharani':           ['Li',   'Lu',   'Le',   'Lo'  ],
  'Krittika':          ['A',    'I',    'U',    'E'   ],
  'Rohini':            ['O',    'Va',   'Vi',   'Vu'  ],
  'Mrigashira':        ['Ve',   'Vo',   'Ka',   'Ki'  ],
  'Ardra':             ['Ku',   'Gha',  'Na',   'Chha'],
  'Punarvasu':         ['Ke',   'Ko',   'Ha',   'Hi'  ],
  'Pushya':            ['Hu',   'He',   'Ho',   'Da'  ],
  'Ashlesha':          ['Di',   'Du',   'De',   'Do'  ],
  'Magha':             ['Ma',   'Mi',   'Mu',   'Me'  ],
  'Purva Phalguni':    ['Mo',   'Ta',   'Ti',   'Tu'  ],
  'Uttara Phalguni':   ['Te',   'To',   'Pa',   'Pi'  ],
  'Hasta':             ['Pu',   'Sha',  'Na',   'Tha' ],
  'Chitra':            ['Pe',   'Po',   'Ra',   'Ri'  ],
  'Swati':             ['Ru',   'Re',   'Ro',   'Ta'  ],
  'Vishakha':          ['Ti',   'Tu',   'Te',   'To'  ],
  'Anuradha':          ['Na',   'Ni',   'Nu',   'Ne'  ],
  'Jyeshtha':          ['No',   'Ya',   'Yi',   'Yu'  ],
  'Moola':             ['Ye',   'Yo',   'Bha',  'Bhi' ],
  'Purva Ashadha':     ['Bhu',  'Dha',  'Bha',  'Dha' ],
  'Uttara Ashadha':    ['Be',   'Bo',   'Ja',   'Ji'  ],
  'Shravana':          ['Ju',   'Je',   'Jo',   'Gha' ],
  'Dhanishtha':        ['Ga',   'Gi',   'Gu',   'Ge'  ],
  'Shatabhisha':       ['Go',   'Sa',   'Si',   'Su'  ],
  'Purva Bhadrapada':  ['Se',   'So',   'Da',   'Di'  ],
  'Uttara Bhadrapada': ['Du',   'Tha',  'Jha',  'Da'  ],
  'Revati':            ['De',   'Do',   'Cha',  'Chi' ],
}

const NAKSHATRA_BEEJ: Record<string, string> = {
  'Ashwini': 'ॐ अश्विनी देव्यै नमः',
  'Bharani': 'ॐ यमाय नमः',
  'Krittika': 'ॐ अग्नये नमः',
  'Rohini': 'ॐ ब्राह्मणे नमः',
  'Mrigashira': 'ॐ चन्द्राय नमः',
  'Ardra': 'ॐ रुद्राय नमः',
  'Punarvasu': 'ॐ अदितये नमः',
  'Pushya': 'ॐ बृहस्पतये नमः',
  'Ashlesha': 'ॐ सर्पेभ्यो नमः',
  'Magha': 'ॐ पितृभ्यो नमः',
  'Purva Phalguni': 'ॐ भगाय नमः',
  'Uttara Phalguni': 'ॐ अर्यम्णे नमः',
  'Hasta': 'ॐ सवित्रे नमः',
  'Chitra': 'ॐ त्वष्ट्रे नमः',
  'Swati': 'ॐ वायवे नमः',
  'Vishakha': 'ॐ इन्द्राग्निभ्यां नमः',
  'Anuradha': 'ॐ मित्राय नमः',
  'Jyeshtha': 'ॐ इन्द्राय नमः',
  'Moola': 'ॐ निरृत्यै नमः',
  'Purva Ashadha': 'ॐ अपां पत्ये नमः',
  'Uttara Ashadha': 'ॐ विश्वेभ्यो देवेभ्यो नमः',
  'Shravana': 'ॐ विष्णवे नमः',
  'Dhanishtha': 'ॐ अष्टवसुभ्यो नमः',
  'Shatabhisha': 'ॐ वरुणाय नमः',
  'Purva Bhadrapada': 'ॐ अजैकपादाय नमः',
  'Uttara Bhadrapada': 'ॐ अहिर्बुध्न्याय नमः',
  'Revati': 'ॐ पूष्णे नमः',
}

// One entry per graha, so the ritual detail in a report resolves nine ways
// rather than collapsing into two or three buckets. Every field here is
// something a seeker actually reads as an instruction.
const GRAHA_RITE: Record<string, {
  purify: string; lamp: string; silence: number; cloth: string;
  wrap: string; offering: string; disposal: string; days: number; seat: string
}> = {
  Sun: {
    purify: 'plain cold water, then face the sun for a moment before sitting',
    lamp: 'ghee lamp with a single cotton wick', silence: 6,
    cloth: 'saffron or deep red cloth', wrap: 'red cloth, kept above floor level',
    offering: 'red flowers and a little jaggery', disposal: 'a sacred fire', days: 42, seat: 'a red mat',
  },
  Moon: {
    purify: 'water with a few drops of rose, and rinse the eyes',
    lamp: 'ghee lamp with a white wick', silence: 7,
    cloth: 'white or pale cloth', wrap: 'white or silk cloth, stored high and dry',
    offering: 'white flowers, rice and a little milk', disposal: 'flowing water', days: 40, seat: 'a white mat',
  },
  Mars: {
    purify: 'plain water, and wash the hands to the elbow',
    lamp: 'sesame oil lamp before a Hanuman image', silence: 4,
    cloth: 'red or ochre cloth', wrap: 'red cloth, tied with a cotton thread',
    offering: 'durva grass and red flowers', disposal: 'a sacred fire', days: 43, seat: 'a red mat',
  },
  Mercury: {
    purify: 'plain water, and rinse the mouth three times before speaking the mantra',
    lamp: 'ghee lamp set on a green cloth', silence: 8,
    cloth: 'green cloth', wrap: 'green cloth, kept with your books',
    offering: 'durva grass and whole moong', disposal: 'a river or sacred fire', days: 40, seat: 'a green mat',
  },
  Jupiter: {
    purify: 'plain water, and apply a little turmeric or sandal to the brow',
    lamp: 'ghee lamp facing North-East', silence: 9,
    cloth: 'yellow cloth', wrap: 'yellow cloth, kept in the North-East',
    offering: 'modak, yellow flowers and chana dal', disposal: 'a river or sacred fire', days: 40, seat: 'a yellow mat',
  },
  Venus: {
    purify: 'water with rose or sandal, unhurried',
    lamp: 'ghee lamp with camphor', silence: 10,
    cloth: 'white or pale pink cloth', wrap: 'white or silk cloth, stored high and dry',
    offering: 'modak, white flowers and a little sugar', disposal: 'flowing water', days: 40, seat: 'a white mat',
  },
  Saturn: {
    purify: 'cold water, washing the feet as well - a Saturn period asks for the fuller purification',
    lamp: 'mustard or sesame oil lamp', silence: 11,
    cloth: 'dark blue or black cloth', wrap: 'dark cloth, stored below eye level',
    offering: 'black sesame and blue flowers', disposal: 'a river, at dusk', days: 43, seat: 'a dark yellow or ochre mat',
  },
  Rahu: {
    purify: 'cold water, washing the feet, and keep silence until you are seated',
    lamp: 'mustard oil lamp placed outside the threshold', silence: 12,
    cloth: 'dark blue or grey cloth', wrap: 'dark cloth, stored out of sight',
    offering: 'coconut and dark blue flowers', disposal: 'a river, unobserved', days: 43, seat: 'a dark mat',
  },
  Ketu: {
    purify: 'cold water, and sit without speaking for a minute first',
    lamp: 'sesame oil lamp before a Ganesha image', silence: 13,
    cloth: 'grey, brown or mixed cloth', wrap: 'undyed cloth, stored plainly',
    offering: 'durva grass and sesame', disposal: 'a sacred fire', days: 48, seat: 'an earth-tone mat',
  },
}

export function calculateMantraGuidance(
  dashaLord: string,
  nakshatra: string,
  ascendant: string,
  moonSign: string,
  nakshatraPada?: number,
  planets?: Array<{ name: string; house: number; retrograde?: boolean }>,
) {
  const primaryData = PLANET_MANTRA_DATA[dashaLord] || PLANET_MANTRA_DATA.Jupiter
  const nakshatraBeej = NAKSHATRA_BEEJ[nakshatra] || 'ॐ नमः शिवाय'

  // A mala is 108 beads and that is fixed, but how many malas a graha's japa
  // asks for is not - remedial practice scales it to the graha's own mahadasha
  // proportion. The source table carries 108 for every graha, which made the
  // prescribed count identical in every report; it is scaled here instead.
  const MAHADASHA_YEARS: Record<string, number> = {
    Sun: 6, Moon: 10, Mars: 7, Mercury: 17, Jupiter: 16,
    Venus: 20, Saturn: 19, Rahu: 18, Ketu: 7,
  }
  // A weak or afflicted graha needs more japa than a strong one - the classical
  // proportion. Reading the lord's actual house also means two seekers with the
  // same dasha lord but different placements no longer get the same prescription.
  const lordPlanet = planets?.find(pl => pl.name === dashaLord)
  const lordHouse = lordPlanet?.house ?? 0
  const afflicted = [6, 8, 12].includes(lordHouse) || !!lordPlanet?.retrograde
  const wellPlaced = [1, 4, 5, 7, 9, 10].includes(lordHouse)
  const strengthMalas = afflicted ? 1 : wellPlaced ? -1 : 0

  const malas = Math.max(1, Math.round((MAHADASHA_YEARS[dashaLord] ?? 16) / 5) + strengthMalas)
  const dailyJapaCount = 108 * malas
  const likhitCount = 27 * malas   // a quarter-mala of writing per mala of japa
  const strengthNote = lordHouse
    ? afflicted
      ? `Your ${dashaLord} sits in the ${lordHouse}th house${lordPlanet?.retrograde ? ' and is retrograde' : ''}, so the count is raised to ${malas} mala${malas > 1 ? 's' : ''} daily - an afflicted lord needs more japa, not less.`
      : wellPlaced
        ? `Your ${dashaLord} is well placed in the ${lordHouse}th house, so ${malas} mala${malas > 1 ? 's' : ''} daily is sufficient to keep it engaged.`
        : `Your ${dashaLord} sits in the ${lordHouse}th house, giving a standard prescription of ${malas} mala${malas > 1 ? 's' : ''} daily.`
    : undefined

  const padaSyllables = NAKSHATRA_PADA_SYLLABLES[nakshatra]
  const padaIdx = nakshatraPada && nakshatraPada >= 1 && nakshatraPada <= 4 ? nakshatraPada - 1 : 0
  const namaAkshara = padaSyllables ? padaSyllables[padaIdx] : null

  const rite = GRAHA_RITE[dashaLord] || GRAHA_RITE.Jupiter

  return {
    namaAkshara,        // Personal birth syllable - used as start of Nama Japa
    nakshatra,
    nakshatraPada: nakshatraPada || 1,
    chanting: {
      primaryPlanet: dashaLord,
      beejMantra: primaryData.beejMantra,
      planetMantra: primaryData.planetMantra,
      deity: primaryData.deity,
      deityMantra: primaryData.deityMantra,
      nakshatraMantra: nakshatraBeej,
      mahaMantra: primaryData.mahaMantra,
      dailyCount: dailyJapaCount,
      dailyMalas: malas,
      ...(strengthNote && { countRationale: strengthNote }),
      weeklyCount: dailyJapaCount * 7,
      bestTime: primaryData.bestTime,
      bestDay: primaryData.bestDay,
      direction: primaryData.direction,
      mala: primaryData.mala,
      posture: primaryData.sitPosition,
      // The steps are fixed ritual order, but the substance of each - what is
      // purified with, which lamp, how many opening pranavas, how long the
      // closing silence runs - is set by the seeker's own chart rather than
      // printed identically in every report.
      sequence: [
        `Purify hands and face with ${rite.purify}`,
        `Light a ${rite.lamp}`,
        'Face ' + primaryData.direction,
        `Chant "OM" ${(nakshatraPada && nakshatraPada >= 1 && nakshatraPada <= 4 ? nakshatraPada : 1) + 2} times to purify the space`,
        'Chant the beej mantra: ' + primaryData.beejMantra,
        `Chant the planet mantra ${dailyJapaCount} times (${malas} mala${malas > 1 ? "s" : ""})`,
        `Conclude with the deity mantra of ${primaryData.deity}: ${primaryData.deityMantra}`,
        `Sit in silence for ${rite.silence} minutes`,
      ],
      ...(namaAkshara && {
        namaJapaGuidance: `Your Nama Akshara (birth syllable) is "${namaAkshara}". Any mantra or name beginning with this syllable resonates deeply with your soul energy. Consider taking initiation with a deity whose name starts with "${namaAkshara}".`,
      }),
    },
    likhitJapa: {
      ...primaryData.likhitJapa,
      count: likhitCount,
      nakshatraMantra: nakshatraBeej,
      instructions: [
        'Wake before sunrise on ' + primaryData.likhitJapa.auspiciousDays[0],
        `Bathe and wear clean ${rite.cloth}`,
        'Sit in ' + primaryData.likhitJapa.posture,
        'Use ' + primaryData.likhitJapa.pen + ' on ' + primaryData.likhitJapa.paper,
        `Write the mantra ${likhitCount} times in a dedicated notebook`,
        `Keep the notebook wrapped in ${rite.wrap} when not in use`,
        `Offer the written pages to ${rite.disposal} after ${rite.days} days`,
      ],
    },
    mangalacharana: personaliseMangalacharana(dashaLord, nakshatra, ascendant, moonSign, nakshatraPada),
  }
}

/** The Ganpati invocation is scripture and its wording is not ours to vary - the
 *  verses below are reproduced exactly as they stand. What *is* chosen per
 *  seeker is which invocation they are told to lead with, the order of the rest,
 *  and which of the 32 Dvātriṃśad forms is named as their own - the latter
 *  assigned from the janma nakshatra, which is how the form is traditionally
 *  allotted. Previously every seeker received this block byte-for-byte. */
function personaliseMangalacharana(
  dashaLord: string,
  nakshatra: string,
  ascendant: string,
  moonSign: string,
  nakshatraPada?: number,
) {
  const forms = GANPATI_MANTRAS.dvAtrIMSad.forms
  const NAK_ORDER = Object.keys(NAKSHATRA_BEEJ)
  const nakIdx = NAK_ORDER.indexOf(nakshatra)
  const pada = nakshatraPada && nakshatraPada >= 1 && nakshatraPada <= 4 ? nakshatraPada : 1

  // 27 nakshatras x 4 padas spread over the 32 forms - each pada of each
  // nakshatra lands on a specific form, as the Mudgala tradition allots them.
  const formIdx = nakIdx >= 0
    ? ((nakIdx * 4 + (pada - 1)) % forms.length)
    : 0
  const personalForm = forms[formIdx]

  const sig = seekerSignature([dashaLord, nakshatra, ascendant, moonSign, pada])
  const rite = GRAHA_RITE[dashaLord] || GRAHA_RITE.Jupiter

  // Lead invocation: matched to what the seeker's dasha lord most needs
  const LEAD_BY_LORD: Record<string, string> = {
    Sun: 'Maha Ganpati Mantra (Supreme Invocation)',
    Moon: 'Beej Mantra (Seed Mantra - Most Powerful)',
    Mars: 'Sankatanashana Ganesha Stotram (Destroyer of All Sorrows)',
    Mercury: 'Ganesh Gayatri Mantra (For Wisdom & Intellect)',
    Jupiter: 'Ganesh Gayatri Mantra (For Wisdom & Intellect)',
    Venus: 'Ashtavinayak Vandana (Eight Forms of Ganesha)',
    Saturn: 'Sankatanashana Ganesha Stotram (Destroyer of All Sorrows)',
    Rahu: 'Dvadasha Nama (12 Sacred Names of Ganesha)',
    Ketu: 'Vakratunda Shloka (Before Any Auspicious Work)',
  }
  const leadName = LEAD_BY_LORD[dashaLord] || 'Vakratunda Shloka (Before Any Auspicious Work)'
  const lead = GANPATI_MANTRAS.mantras.filter(m => m.name === leadName)
  const rest = rotate(GANPATI_MANTRAS.mantras.filter(m => m.name !== leadName), sig)

  return {
    ...GANPATI_MANTRAS,
    subtitle: `Auspicious Invocation - begin with the ${leadName.split(' (')[0]}, which your ${dashaLord} Mahadasha calls for, before any sadhana or before reading this report`,
    forYou: `Recite these before your ${dashaLord} japa. Your ${nakshatra} pada ${pada} lagna-nakshatra allots you ${personalForm.name}; invoke that form by name at the start.`,
    mantras: [...lead, ...rest],
    // The Ganesha likhit japa keeps its mantra and its ritual order, but the
    // day, count, seat and completion window are set from the seeker's chart
    // rather than repeated verbatim in every report.
    likhitJapa: (() => {
      const base = GANPATI_MANTRAS.likhitJapa
      const START_DAYS = ['Wednesday', 'Chaturthi', 'Sankashti Chaturthi', 'Ganesh Chaturthi',
        'Angarki Chaturthi', 'Shukla Chaturthi', 'the next Wednesday of Shukla Paksha',
        'Vinayaka Chaturthi']
      const startDay = START_DAYS[sig % START_DAYS.length]
      const rounds = 27 * (1 + (sig % 8))          // 27 up to 216, always whole quarter-malas
      const completionDays = [21, 40, 43, 48][(sig >> 3) % 4]
      // The seat, ink, paper and murti detail follow the seeker's dasha lord
      // through the same nine-way table the rest of the ritual uses, so this
      // block resolves nine ways rather than two.
      const INK: Record<string, { pen: string; paper: string; ink: string; murti: string }> = {
        Sun:     { pen: 'a red ink pen',            paper: 'yellow paper',        ink: 'Red or saffron',   murti: 'a brass or copper Ganesha' },
        Moon:    { pen: 'a silver or white ink pen', paper: 'pale yellow paper',  ink: 'Silver or white',  murti: 'a white marble or clay Ganesha' },
        Mars:    { pen: 'a red ink pen',            paper: 'saffron paper',       ink: 'Red',              murti: 'a sindoor-coated Ganesha' },
        Mercury: { pen: 'a green ink pen',          paper: 'white or green paper', ink: 'Green',           murti: 'a Ganesha image beside your books' },
        Jupiter: { pen: 'a gold or yellow ink pen', paper: 'yellow paper',        ink: 'Yellow or golden', murti: 'a turmeric-hued Ganesha' },
        Venus:   { pen: 'a white or rose ink pen',  paper: 'cream paper',         ink: 'White or rose',    murti: 'a white or crystal Ganesha' },
        Saturn:  { pen: 'a black ink pen',          paper: 'ochre paper',         ink: 'Black',            murti: 'a dark stone or iron Ganesha' },
        Rahu:    { pen: 'a dark blue ink pen',      paper: 'grey paper',          ink: 'Dark blue',        murti: 'a plain unadorned Ganesha' },
        Ketu:    { pen: 'a brown ink pen',          paper: 'earth-tone paper',    ink: 'Brown',            murti: 'a clay or terracotta Ganesha' },
      }
      const ink = INK[dashaLord] || INK.Jupiter
      const seat = rite.seat
      return {
        ...base,
        count: rounds,
        pen: ink.pen.replace(/^a /, ''),
        paper: ink.paper,
        inkColor: ink.ink,
        posture: `Sit facing East on ${seat}, ${startDay} morning`,
        auspiciousDays: rotate(base.auspiciousDays, sig),
        instructions: [
          `Wake before sunrise on ${startDay}`,
          `Bathe and wear fresh ${rite.cloth}`,
          `Place ${ink.murti} in front of you`,
          `Light a ${rite.lamp} and offer ${rite.offering}`,
          `Sit facing East on ${seat}`,
          `Use ${ink.pen} on ${ink.paper} (or a dedicated notebook)`,
          `Write "${base.mantra}" exactly ${rounds} times - one line at a time, mindfully`,
          `After writing, sit silently for ${rite.silence} minutes in gratitude`,
          `Keep the written pages and offer at a Ganesha temple after ${completionDays} days`,
        ],
      }
    })(),
    personalForm: {
      ...personalForm,
      why: `Of the 32 Dvātriṃśad forms, ${personalForm.name} (${personalForm.nameSanskrit}) is the one allotted to ${nakshatra} pada ${pada} - your janma nakshatra. Its quality, ${personalForm.quality.replace(/ · /g, ' and ')}, is the aspect of Ganesha to invoke by name before your own work.`,
    },
    dvAtrIMSad: {
      ...GANPATI_MANTRAS.dvAtrIMSad,
      // The seeker's own form leads the list of 32; the rest keep canonical order
      forms: [personalForm, ...forms.filter(f => f.no !== personalForm.no)],
    },
  }
}

// ─── Ganpati / Ganesha Mantras ───────────────────────────────────────────────
// These are Mangalacharana (auspicious opening) mantras recited before any
// spiritual work, sadhana, or report consultation. They are UNIVERSAL - all
// seekers are encouraged to chant these regardless of their personal chart.

export const GANPATI_MANTRAS = {
  title: 'श्री गणपति मंत्र - Mangalacharana',
  subtitle: 'Auspicious Invocation - Chant before beginning any sadhana or reading this report',
  mantras: [
    {
      name: 'Vakratunda Shloka (Before Any Auspicious Work)',
      sanskrit: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥',
      transliteration: 'Vakratuṇḍa Mahākāya Sūryakoṭi Samaprabha |\nNirvighnaṃ Kuru Me Deva Sarvakāryeṣu Sarvadā ||',
      meaning: 'O Lord Ganesha of curved trunk, mighty-bodied, with the brilliance of a million suns - please make all my works obstacle-free, always.',
      count: 11,
      bestTime: 'Any time - especially before starting this report',
    },
    {
      name: 'Beej Mantra (Seed Mantra - Most Powerful)',
      sanskrit: 'ॐ गं गणपतये नमः',
      transliteration: 'Om Gaṃ Gaṇapataye Namaḥ',
      meaning: 'I bow to Lord Ganesha, the remover of all obstacles, the lord of all beginnings.',
      count: 108,
      bestTime: 'Wednesday morning, or any morning at sunrise',
    },
    {
      name: 'Maha Ganpati Mantra (Supreme Invocation)',
      sanskrit: 'ॐ श्री महागणपतये नमः',
      transliteration: 'Om Shrī Mahāgaṇapataye Namaḥ',
      meaning: 'I bow to the great Lord Ganesha, the supreme remover of obstacles and granter of wisdom.',
      count: 108,
      bestTime: 'Chaturthi (4th lunar day), Ganesh Chaturthi festival',
    },
    {
      name: 'Ganesh Gayatri Mantra (For Wisdom & Intellect)',
      sanskrit: 'ॐ एकदन्ताय विद्महे\nवक्रतुण्डाय धीमहि ।\nतन्नो दन्तिः प्रचोदयात् ॥',
      transliteration: 'Om Ekadantāya Vidmahe\nVakratuṇḍāya Dhīmahi |\nTanno Dantiḥ Pracodayāt ||',
      meaning: 'We meditate on the one-tusked Lord Ganesha. May that elephant-faced one inspire and illuminate our intellect.',
      count: 108,
      bestTime: 'Early morning meditation, especially Wednesdays',
    },
    {
      name: 'Dvadasha Nama (12 Sacred Names of Ganesha)',
      sanskrit: 'सुमुख श्चैकदन्तश्च कपिलो गजकर्णकः ।\nलम्बोदरश्च विकटो विघ्ननाशो गणाधिपः ।।\nधूमकेतुर्गणाध्यक्षः फालचन्द्रो गजाननः ।\nद्वादशैतानि नामानि यः पठेच्छृणुयादपि ।।',
      transliteration: 'Sumukhaścaikadantaśca Kapilo Gajakarṇakaḥ |\nLambodaṛaśca Vikaṭo Vighnanāśo Gaṇādhipaḥ ||\nDhūmaketurgaṇādhyakṣaḥ Phālacandro Gajānanaḥ |\nDvādaśaitāni Nāmāni Yaḥ Paṭhecchr̥ṇuyādapi ||',
      meaning: 'Sumukha (pleasant-faced), Ekadanta (one-tusked), Kapila (tawny), Gajakarnaka (elephant-eared), Lambodara (pot-bellied), Vikata (huge-bodied), Vighnashana (obstacle-destroyer), Ganadhipa (lord of ganas), Dhumaketu (smoke-bannered), Ganadhyaksha (chief of ganas), Phalachandra (moon-crested), Gajanana (elephant-faced) - these twelve names, when read or heard, bestow supreme auspiciousness.',
      count: 1,
      bestTime: 'Morning prayers, before exams, interviews, or any new beginning',
    },
    {
      name: 'Sankatanashana Ganesha Stotram (Destroyer of All Sorrows)',
      sanskrit: 'नागानन गणाध्यक्ष सर्वसिद्धिप्रद प्रभो ।\nसर्वविघ्नहर देवेश सर्वसंकट भंजन ।।',
      transliteration: 'Nāgānana Gaṇādhyakṣa Sarvasiddhiprada Prabho |\nSarvavighnhara Deveśa Sarvasaṃkaṭa Bhaṃjana ||',
      meaning: 'O snake-faced Lord Ganesha, leader of all celestial beings, bestower of all achievements, O master of all! You remove all obstacles, O lord of all divine beings, and you break through all crises and sorrows.',
      count: 21,
      bestTime: 'Sankashti Chaturthi (every month), or times of difficulty',
    },
    {
      name: 'Ashtavinayak Vandana (Eight Forms of Ganesha)',
      sanskrit: 'मयूरेश्वर मोरेश्वर सिद्धिविनायक ।\nमहागणपति विघ्नेश्वर लेण्याद्री गिरिजात्मज ।।\nओझर सुप्रसिद्ध गिरिजापुत्र नमोस्तुते ।\nरांजणगाव महागणपति रक्ष माम् सर्वदा ।।',
      transliteration: 'Mayūreśvara Moreśvara Siddhivināyaka |\nMahāgaṇapati Vighneśvara Leṇyādrī Girijātmaja ||\nOjhara Suprasiddha Girijāputra Namostute |\nRāṃjaṇagāva Mahāgaṇapati Rakṣa Mām Sarvadā ||',
      meaning: 'Salutations to the eight forms of Ganesha - Mayureshwar, Siddhivinayak, Mahaganapati, Vighnahar, Girijatmaj, Vighneshwar, Ozhar, and Ranjangaon Mahaganapati. O son of Goddess Girija, protect me always.',
      count: 8,
      bestTime: 'Ashtavinayak Yatra pilgrimage days, Ganesh Chaturthi',
    },
  ],
  dvAtrIMSad: {
    title: 'द्वात्रिंशद् गणपति - 32 Divine Forms',
    subtitle: 'Dvātriṃśad Gaṇapati from Mudgala Purāṇa - invoke all 32 aspects of Lord Ganesha',
    forms: [
      { no: 1,  name: 'Bala Ganapati',           nameSanskrit: 'बाल गणपति',           mantra: 'ॐ बालाय गणपतये नमः',            quality: 'Innocence · New Beginnings' },
      { no: 2,  name: 'Taruna Ganapati',          nameSanskrit: 'तरुण गणपति',          mantra: 'ॐ तरुणाय गणपतये नमः',           quality: 'Youth · Vitality' },
      { no: 3,  name: 'Bhakti Ganapati',          nameSanskrit: 'भक्ति गणपति',         mantra: 'ॐ भक्त्याय गणपतये नमः',          quality: 'Devotion · Love' },
      { no: 4,  name: 'Vira Ganapati',            nameSanskrit: 'वीर गणपति',           mantra: 'ॐ वीराय गणपतये नमः',             quality: 'Courage · Victory' },
      { no: 5,  name: 'Shakti Ganapati',          nameSanskrit: 'शक्ति गणपति',         mantra: 'ॐ शक्तिसहिताय गणपतये नमः',      quality: 'Power · Divine Shakti' },
      { no: 6,  name: 'Dvija Ganapati',           nameSanskrit: 'द्विज गणपति',         mantra: 'ॐ द्विजाय गणपतये नमः',           quality: 'Knowledge · Vedas' },
      { no: 7,  name: 'Siddhi Ganapati',          nameSanskrit: 'सिद्धि गणपति',        mantra: 'ॐ सिद्धाय गणपतये नमः',           quality: 'Accomplishment · Siddhis' },
      { no: 8,  name: 'Ucchishta Ganapati',       nameSanskrit: 'उच्छिष्ट गणपति',      mantra: 'ॐ उच्छिष्टाय गणपतये नमः',       quality: 'Acceptance · Abundance' },
      { no: 9,  name: 'Vighna Ganapati',          nameSanskrit: 'विघ्न गणपति',         mantra: 'ॐ विघ्नाय गणपतये नमः',           quality: 'Obstacle Removal' },
      { no: 10, name: 'Kshipra Ganapati',         nameSanskrit: 'क्षिप्र गणपति',       mantra: 'ॐ क्षिप्राय गणपतये नमः',         quality: 'Swift Blessings' },
      { no: 11, name: 'Heramba Ganapati',         nameSanskrit: 'हेरम्ब गणपति',        mantra: 'ॐ हेरम्बाय गणपतये नमः',          quality: 'Five-headed Protector' },
      { no: 12, name: 'Lakshmi Ganapati',         nameSanskrit: 'लक्ष्मी गणपति',       mantra: 'ॐ लक्ष्मीसहिताय गणपतये नमः',    quality: 'Wealth · Prosperity' },
      { no: 13, name: 'Maha Ganapati',            nameSanskrit: 'महा गणपति',           mantra: 'ॐ महाय गणपतये नमः',              quality: 'Supreme Power' },
      { no: 14, name: 'Vijaya Ganapati',          nameSanskrit: 'विजय गणपति',          mantra: 'ॐ विजयाय गणपतये नमः',            quality: 'Victory · Success' },
      { no: 15, name: 'Nritya Ganapati',          nameSanskrit: 'नृत्य गणपति',         mantra: 'ॐ नृत्याय गणपतये नमः',           quality: 'Joy · Celebration' },
      { no: 16, name: 'Urdhva Ganapati',          nameSanskrit: 'ऊर्ध्व गणपति',        mantra: 'ॐ ऊर्ध्वाय गणपतये नमः',          quality: 'Spiritual Ascension' },
      { no: 17, name: 'Ekakshara Ganapati',       nameSanskrit: 'एकाक्षर गणपति',       mantra: 'ॐ एकाक्षराय गणपतये नमः',         quality: 'Primordial OM' },
      { no: 18, name: 'Vara Ganapati',            nameSanskrit: 'वर गणपति',            mantra: 'ॐ वराय गणपतये नमः',              quality: 'Wish Fulfillment' },
      { no: 19, name: 'Tryakshara Ganapati',      nameSanskrit: 'त्र्यक्षर गणपति',     mantra: 'ॐ त्र्यक्षराय गणपतये नमः',       quality: 'A-U-M · Cosmic Trinity' },
      { no: 20, name: 'Kshipra Prasada Ganapati', nameSanskrit: 'क्षिप्र प्रसाद गणपति', mantra: 'ॐ क्षिप्रप्रसादाय गणपतये नमः', quality: 'Instant Grace' },
      { no: 21, name: 'Haridra Ganapati',         nameSanskrit: 'हरिद्र गणपति',        mantra: 'ॐ हरिद्राय गणपतये नमः',          quality: 'Health · Purity' },
      { no: 22, name: 'Ekadanta Ganapati',        nameSanskrit: 'एकदन्त गणपति',        mantra: 'ॐ एकदन्ताय गणपतये नमः',          quality: 'Focus · Concentration' },
      { no: 23, name: 'Srushti Ganapati',         nameSanskrit: 'सृष्टि गणपति',        mantra: 'ॐ सृष्टिकर्त्रे गणपतये नमः',    quality: 'Creation · Manifestation' },
      { no: 24, name: 'Uddanda Ganapati',         nameSanskrit: 'उद्दण्ड गणपति',       mantra: 'ॐ उद्दण्डाय गणपतये नमः',         quality: 'Might · Justice' },
      { no: 25, name: 'Rinamochana Ganapati',     nameSanskrit: 'ऋणमोचन गणपति',        mantra: 'ॐ ऋणविमोचनाय गणपतये नमः',       quality: 'Karmic Debt Liberation' },
      { no: 26, name: 'Dhundhi Ganapati',         nameSanskrit: 'ढुण्ढि गणपति',        mantra: 'ॐ ढुण्ढये गणपतये नमः',           quality: 'Wisdom · Inner Search' },
      { no: 27, name: 'Dvimukha Ganapati',        nameSanskrit: 'द्विमुख गणपति',       mantra: 'ॐ द्विमुखाय गणपतये नमः',         quality: 'Balance · Dual Vision' },
      { no: 28, name: 'Trimukha Ganapati',        nameSanskrit: 'त्रिमुख गणपति',       mantra: 'ॐ त्रिमुखाय गणपतये नमः',         quality: 'Past · Present · Future' },
      { no: 29, name: 'Simha Ganapati',           nameSanskrit: 'सिंह गणपति',          mantra: 'ॐ सिंहाय गणपतये नमः',            quality: 'Fearlessness · Royalty' },
      { no: 30, name: 'Yoga Ganapati',            nameSanskrit: 'योग गणपति',           mantra: 'ॐ योगिने गणपतये नमः',            quality: 'Meditation · Liberation' },
      { no: 31, name: 'Durga Ganapati',           nameSanskrit: 'दुर्गा गणपति',        mantra: 'ॐ दुर्गाय गणपतये नमः',           quality: 'Invincibility · Protection' },
      { no: 32, name: 'Sankatahara Ganapati',     nameSanskrit: 'संकट हर गणपति',       mantra: 'ॐ संकटहराय गणपतये नमः',          quality: 'Hardship Removal' },
    ],
  },
  likhitJapa: {
    mantra: 'ॐ गं गणपतये नमः',
    count: 108,
    pen: 'Red ink pen',
    paper: 'Yellow or white paper',
    inkColor: 'Red or saffron',
    posture: 'Sit facing East on a yellow cloth, Wednesday morning',
    auspiciousDays: ['Wednesday', 'Chaturthi', 'Ganesh Chaturthi', 'Sankashti Chaturthi'],
    instructions: [
      'Wake before sunrise on Wednesday or Chaturthi',
      'Bathe and wear fresh yellow or white clothing',
      'Place a picture or idol of Lord Ganesha in front of you',
      'Light a ghee lamp and offer modak (sweet) or durva grass',
      'Sit facing East on a yellow mat or cloth',
      'Use red ink pen on yellow paper (or a dedicated notebook)',
      'Write "ॐ गं गणपतये नमः" exactly 108 times - one line at a time, mindfully',
      'After writing, sit silently for 5 minutes in gratitude',
      'Keep the written pages and offer at a Ganesha temple after 21 days',
    ],
  },
}

export { PLANET_MANTRA_DATA, NAKSHATRA_PADA_SYLLABLES, NAKSHATRA_BEEJ }

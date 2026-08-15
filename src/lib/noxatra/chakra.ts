// Shakti Chakra Analysis - Nakshatra → Chakra Mapping
//
// The canonical identity of each chakra (name, sanskrit, element, colour, seed
// syllable) is fixed - Muladhara is the Root Chakra and its element is Earth for
// every seeker, and printing otherwise would simply be false. Everything that is
// *advice* - which crystals, foods, asanas, affirmations and support mantras the
// seeker is told to use, in what order, and the guidance text framing them - is
// selected per seeker from their own chart. Renderers surface only the first one
// or two entries of each list, so the ordering here is what the seeker actually
// reads.

import { seekerSignature, mix, pick, one, rotate } from './personalise'

export interface ChakraData {
  name: string
  sanskrit: string
  element: string
  color: string
  seedSyllable: string
  level: number        // 0-100
  status: 'blocked' | 'underactive' | 'balanced' | 'overactive'
  priority: number     // 1 = needs the most attention
  guidance: string
  mantras: string[]
  crystals: string[]
  foods: string[]
  yoga: string[]
  affirmations: string[]
}

const NAKSHATRA_CHAKRA: Record<string, number> = {
  'Ashwini': 0, 'Bharani': 0, 'Krittika': 0,         // Root
  'Rohini': 1, 'Mrigashira': 1, 'Ardra': 1,           // Sacral
  'Punarvasu': 2, 'Pushya': 2, 'Ashlesha': 2,          // Solar Plexus
  'Magha': 3, 'Purva Phalguni': 3, 'Uttara Phalguni': 3, // Heart
  'Hasta': 4, 'Chitra': 4, 'Swati': 4,                // Throat
  'Vishakha': 5, 'Anuradha': 5, 'Jyeshtha': 5,         // Third Eye
  'Moola': 6, 'Purva Ashadha': 6, 'Uttara Ashadha': 6, // Crown
  'Shravana': 0, 'Dhanishtha': 1, 'Shatabhisha': 2,
  'Purva Bhadrapada': 3, 'Uttara Bhadrapada': 4, 'Revati': 5,
}

const NAKSHATRA_ORDER = Object.keys(NAKSHATRA_CHAKRA)

// Per Vedic astrology: each planet governs specific chakra centres
const PLANET_CHAKRA_MODIFIER: Record<string, number[]> = {
  'Sun':     [2],       // Solar Plexus - will, identity, fire principle
  'Moon':    [1, 3, 5], // Sacral + Heart + Third Eye - emotions, love, intuition
  'Mars':    [0, 2],    // Root + Solar Plexus - survival instincts, aggression
  'Mercury': [4],       // Throat - communication, expression
  'Jupiter': [5, 6],    // Third Eye + Crown - wisdom, spiritual expansion
  'Venus':   [1, 3],    // Sacral + Heart - pleasure, love, creativity
  'Saturn':  [0],       // Root - karma, discipline, foundations
  'Rahu':    [2, 5],    // Solar Plexus + Third Eye - obsession, illusion, ambition
  'Ketu':    [6, 0],    // Crown + Root - spiritual liberation, past karma
}

// Pools are deliberately larger than what any one seeker receives, so that the
// per-seeker selection below has room to differ between charts.
const CHAKRAS = [
  {
    name: 'Root Chakra', sanskrit: 'Muladhara', element: 'Earth', color: '#DC2626',
    seedSyllable: 'LAM',
    mantras: ['Om Bhur Bhuva Swaha', 'Gam Ganapataye Namaha', 'Om Prithivi Namaha',
      'Om Dharaya Namaha', 'Om Namo Narayanaya', 'Om Bhumi Devyai Namaha'],
    crystals: ['Red Jasper', 'Black Tourmaline', 'Hematite', 'Garnet', 'Smoky Quartz',
      'Bloodstone', 'Obsidian', 'Tiger Iron'],
    foods: ['Red apples', 'Pomegranate', 'Beets', 'Red peppers', 'Protein foods',
      'Root vegetables', 'Carrots', 'Red lentils', 'Ginger', 'Turmeric root'],
    yoga: ['Mountain Pose', 'Warrior I', 'Squat (Malasana)', "Child's Pose", 'Tree Pose',
      'Bridge Pose', 'Standing Forward Fold', 'Chair Pose'],
    affirmations: ['I am safe', 'I am grounded', 'I trust the process of life', 'I belong',
      'I am supported by the earth', 'My needs are always met', 'I stand firm in my own life'],
  },
  {
    name: 'Sacral Chakra', sanskrit: 'Svadhishthana', element: 'Water', color: '#EA580C',
    seedSyllable: 'VAM',
    mantras: ['Om Namo Bhagavate Vasudevaya', 'Om Varunaya Namaha', 'Om Chandraya Namaha',
      'Om Shukraya Namaha', 'Om Kleem Krishnaya Namaha', 'Om Apah Devataya Namaha'],
    crystals: ['Carnelian', 'Orange Calcite', 'Tiger Eye', 'Moonstone', 'Sunstone',
      'Amber', 'Peach Aventurine', 'Vanadinite'],
    foods: ['Oranges', 'Mangoes', 'Coconut', 'Almonds', 'Sweet potatoes',
      'Papaya', 'Melon', 'Honey', 'Cinnamon', 'Pumpkin seeds'],
    yoga: ['Goddess Pose', 'Hip circles', 'Butterfly Pose', 'Cobra', 'Pigeon Pose',
      'Bound Angle Pose', 'Lizard Pose', 'Reclined Twist'],
    affirmations: ['I embrace creativity', 'I honor my emotions', 'I am abundant',
      'Life is pleasurable', 'I allow myself to feel fully', 'I create with joy',
      'My emotions move through me freely'],
  },
  {
    name: 'Solar Plexus', sanskrit: 'Manipura', element: 'Fire', color: '#CA8A04',
    seedSyllable: 'RAM',
    mantras: ['Om Suryaya Namaha', 'Om Agni Devaya Namaha', 'Om Hreem Suryaya Namaha',
      'Aditya Hridayam', 'Om Tejase Namaha', 'Om Hraam Hreem Hraum Sah Suryaya Namaha'],
    crystals: ['Citrine', 'Yellow Topaz', 'Amber', 'Tiger Eye', 'Pyrite',
      'Golden Calcite', 'Yellow Jasper', 'Heliodor'],
    foods: ['Bananas', 'Corn', 'Ginger', 'Turmeric', 'Lentils', 'Oats',
      'Chamomile tea', 'Yellow peppers', 'Chickpeas', 'Fennel'],
    yoga: ['Boat Pose', 'Warrior III', 'Plank', 'Twisted Chair', 'Sun Salutation',
      'Bow Pose', 'Half Lord of the Fishes', 'Breath of Fire'],
    affirmations: ['I am confident', 'I am powerful', 'I trust myself', 'I am worthy',
      'I act with clear intent', 'My will is my own', 'I meet the world with strength'],
  },
  {
    name: 'Heart Chakra', sanskrit: 'Anahata', element: 'Air', color: '#16A34A',
    seedSyllable: 'YAM',
    mantras: ['Om Shri Krishnaya Namaha', 'Om Mani Padme Hum', 'Om Vayave Namaha',
      'Om Kleem Krishnaya Namaha', 'Om Shanti Shanti Shanti', 'Om Hreem Namaha'],
    crystals: ['Rose Quartz', 'Green Aventurine', 'Malachite', 'Emerald', 'Rhodonite',
      'Jade', 'Prehnite', 'Pink Tourmaline'],
    foods: ['Leafy greens', 'Broccoli', 'Green tea', 'Avocado', 'Basil',
      'Spinach', 'Peas', 'Lime', 'Zucchini', 'Coriander'],
    yoga: ['Camel Pose', 'Bridge Pose', 'Cow Face', 'Upward Dog', 'Heart Openers',
      'Sphinx Pose', 'Reverse Prayer', 'Supported Fish'],
    affirmations: ['I love unconditionally', 'I forgive myself', 'My heart is open',
      'I give and receive love', 'I am worthy of tenderness', 'I release old grief',
      'Compassion flows through me'],
  },
  {
    name: 'Throat Chakra', sanskrit: 'Vishuddha', element: 'Space', color: '#2563EB',
    seedSyllable: 'HAM',
    mantras: ['Om Saraswati Namaha', 'Om Aim Saraswatiye Namaha', 'Om Akashaya Namaha',
      'Om Budhaya Namaha', 'Om Vak Devyai Namaha', 'Om Aim Hreem Kleem'],
    crystals: ['Blue Lace Agate', 'Sodalite', 'Aquamarine', 'Turquoise', 'Celestite',
      'Angelite', 'Blue Kyanite', 'Chrysocolla'],
    foods: ['Blueberries', 'Figs', 'Apples', 'Pears', 'Coconut water', 'Herbal teas',
      'Lemon', 'Plums', 'Blackberries', 'Raw honey'],
    yoga: ['Fish Pose', 'Shoulder Stand', "Lion's Breath", 'Neck rolls', 'Plow Pose',
      'Camel Pose', 'Bridge with chin lock', 'Ujjayi breathing'],
    affirmations: ['I speak my truth', 'I communicate clearly', 'I am heard',
      'My voice matters', 'I express myself without fear', 'I listen as well as I speak',
      'My words carry my intent'],
  },
  {
    name: 'Third Eye Chakra', sanskrit: 'Ajna', element: 'Light', color: '#7C3AED',
    seedSyllable: 'OM',
    mantras: ['Om Namah Shivaya', 'Aum Shivoham', 'Om Gurave Namaha',
      'Om Aim Hreem Kleem Chamundaye', 'Gayatri Mantra', 'Om Trayambakam Yajamahe'],
    crystals: ['Amethyst', 'Lapis Lazuli', 'Labradorite', 'Fluorite', 'Azurite',
      'Iolite', 'Sapphire', 'Charoite'],
    foods: ['Purple grapes', 'Lavender', 'Dark chocolate', 'Walnuts', 'Goji berries',
      'Blackcurrant', 'Purple cabbage', 'Poppy seeds', 'Blue spirulina', 'Elderberry'],
    yoga: ["Child's Pose", 'Forward fold', 'Downward Dog', 'Eagle Pose', 'Meditation',
      'Dolphin Pose', 'Alternate Nostril Breathing', 'Trataka (candle gazing)'],
    affirmations: ['I trust my intuition', 'I see clearly', 'I am wise',
      'I am in tune with the universe', 'My inner sight is reliable',
      'I perceive beyond the obvious', 'Clarity comes to me easily'],
  },
  {
    name: 'Crown Chakra', sanskrit: 'Sahasrara', element: 'Consciousness', color: '#7C3AED',
    seedSyllable: 'AH',
    mantras: ['OM', 'So Hum', 'Aham Brahmasmi', 'Om Tat Sat',
      'Om Purnamadah Purnamidam', 'Sat Chit Ananda'],
    crystals: ['Clear Quartz', 'Selenite', 'Amethyst', 'Moonstone', 'Diamond',
      'Howlite', 'Lepidolite', 'White Agate'],
    foods: ['Fasting', 'Light foods', 'Mushrooms', 'Saffron', 'Pure water',
      'Sattvic grains', 'Fresh fruit', 'Herbal infusions', 'Tulsi tea', 'Ghee'],
    yoga: ['Headstand', 'Savasana', 'Lotus', 'Meditation', 'Pranayama',
      'Rabbit Pose', 'Seated silence', 'Yoga Nidra'],
    affirmations: ['I am one with all', 'I am divine', 'I trust the universe',
      'I am enlightened', 'I am connected to something larger', 'I surrender to grace',
      'Stillness is my natural state'],
  },
]

interface ChakraSeeker {
  nakshatra?: string
  pada?: number
  ascendant?: string
  moonSign?: string
  dashaLord?: string
  dob?: string
  name?: string
}

function getStatus(level: number): string {
  if (level < 30) return 'blocked'
  if (level < 50) return 'underactive'
  if (level <= 75) return 'balanced'
  return 'overactive'
}

/** How many remedy items a chakra earns. A chakra that needs work gets a fuller
 *  prescription; a balanced one gets a lighter maintenance note. */
function depthFor(status: string): { crystals: number; foods: number; yoga: number; affirm: number; mantras: number } {
  switch (status) {
    case 'blocked':     return { crystals: 4, foods: 5, yoga: 4, affirm: 4, mantras: 3 }
    case 'underactive': return { crystals: 3, foods: 4, yoga: 3, affirm: 3, mantras: 2 }
    case 'overactive':  return { crystals: 3, foods: 3, yoga: 3, affirm: 3, mantras: 2 }
    default:            return { crystals: 2, foods: 3, yoga: 2, affirm: 2, mantras: 2 }
  }
}

function guidanceFor(
  chakra: typeof CHAKRAS[number],
  level: number,
  status: string,
  isPrimary: boolean,
  drivers: string[],
  seed: number,
): string {
  const driverText = drivers.length
    ? `${drivers.join(' and ')} ${drivers.length > 1 ? 'act' : 'acts'} on this centre in your chart`
    : 'no major graha sits directly on this centre in your chart'

  const primaryNote = isPrimary
    ? ` This is your birth-nakshatra centre, so it sets the tone for the whole system.`
    : ''

  const openings: Record<string, string[]> = {
    blocked: [
      `${chakra.name} reads at ${level}% - the weakest kind of reading, and the one to start with.`,
      `At ${level}%, ${chakra.sanskrit} is closed enough that the centres above it cannot draw on it.`,
      `${chakra.sanskrit} is blocked at ${level}%; expect the ${chakra.element.toLowerCase()} qualities to feel unavailable.`,
    ],
    underactive: [
      `${chakra.name} sits at ${level}% - functioning, but with little reserve.`,
      `At ${level}%, ${chakra.sanskrit} is underactive: it works when called on and then depletes.`,
      `${chakra.sanskrit} reads ${level}%, low enough that its ${chakra.element.toLowerCase()} principle needs deliberate feeding.`,
    ],
    balanced: [
      `${chakra.name} is steady at ${level}% - maintain rather than force.`,
      `At ${level}%, ${chakra.sanskrit} is in balance; the work here is protection, not repair.`,
      `${chakra.sanskrit} holds at ${level}%, a workable level that rewards light, regular attention.`,
    ],
    overactive: [
      `${chakra.name} is running hot at ${level}% - the issue is regulation, not deficiency.`,
      `At ${level}%, ${chakra.sanskrit} is overactive and tends to crowd out the quieter centres.`,
      `${chakra.sanskrit} is at ${level}%; its ${chakra.element.toLowerCase()} quality is overexpressed and needs cooling.`,
    ],
  }

  return `${one(openings[status] || openings.balanced, seed)} Here ${driverText}.${primaryNote}`
}

export function calculateChakras(
  nakshatra: string,
  planets: Array<{ name: string; house: number }>,
  seeker: ChakraSeeker = {},
) {
  const primaryChakraIdx = NAKSHATRA_CHAKRA[nakshatra] ?? 3

  // Base levels seeded by nakshatra. indexOf returns 0 for Ashwini, which is a
  // legitimate index - the old `> 0` test silently pushed Ashwini onto the
  // unknown-nakshatra fallback seed.
  const nakshatraIdx = NAKSHATRA_ORDER.indexOf(nakshatra)
  const seed = nakshatraIdx >= 0 ? nakshatraIdx + 1 : 10

  const baseLevels = [0, 1, 2, 3, 4, 5, 6].map(i => {
    if (i === primaryChakraIdx) return 60 + (seed % 30)
    return 35 + ((seed * (i + 1)) % 45)
  })

  // Which grahas touch each centre - used for both the level and the guidance text
  const driversByChakra: string[][] = [[], [], [], [], [], [], []]

  planets.forEach(planet => {
    const affected = PLANET_CHAKRA_MODIFIER[planet.name]
    if (!affected) return
    const h = planet.house
    const strength =
      [1, 4, 7, 10].includes(h) ?  10 :   // Kendra - angular, powerful
      [5, 9].includes(h)         ?   8 :   // Trikona - auspicious, spiritual
      h === 11                   ?   5 :   // Upachaya - gains
      [2, 3].includes(h)         ?   2 :   // Mild
      [6, 8, 12].includes(h)     ?  -8 :   // Dusthana - challenging
                                      0
    affected.forEach(chakraIdx => {
      baseLevels[chakraIdx] = Math.min(95, Math.max(10, baseLevels[chakraIdx] + strength))
      driversByChakra[chakraIdx].push(`${planet.name} in the ${h}th house`)
    })
  })

  // One signature for this seeker, salted per chakra below so the seven centres
  // do not all rotate their catalogues in lockstep.
  const signature = seekerSignature([
    nakshatra, seeker.pada, seeker.ascendant, seeker.moonSign,
    seeker.dashaLord, seeker.dob, seeker.name,
    ...planets.map(p => `${p.name}${p.house}`),
  ])

  // Attention order: lowest level first, so `priority` reflects real need
  const byNeed = [...baseLevels.map((lvl, i) => ({ i, lvl }))].sort((a, b) => a.lvl - b.lvl)
  const priorityOf = new Map(byNeed.map((x, rank) => [x.i, rank + 1]))

  return CHAKRAS.map((chakra, i) => {
    const level = baseLevels[i]
    const status = getStatus(level) as ChakraData['status']
    const depth = depthFor(status)
    const s = mix(signature, i)
    const drivers = driversByChakra[i]

    return {
      name: chakra.name,
      sanskrit: chakra.sanskrit,
      element: chakra.element,
      color: chakra.color,
      seedSyllable: chakra.seedSyllable,
      level,
      status,
      priority: priorityOf.get(i) ?? 7,
      guidance: guidanceFor(chakra, level, status, i === primaryChakraIdx, drivers, mix(s, 'g')),
      // The seed syllable always leads - it is the chakra's own bija and is not
      // interchangeable - then a seeker-specific selection of support mantras.
      mantras: [chakra.seedSyllable, ...pick(chakra.mantras, depth.mantras, mix(s, 'm'))],
      crystals: pick(chakra.crystals, depth.crystals, mix(s, 'c')),
      foods: pick(chakra.foods, depth.foods, mix(s, 'f')),
      yoga: pick(chakra.yoga, depth.yoga, mix(s, 'y')),
      affirmations: rotate(pick(chakra.affirmations, depth.affirm, mix(s, 'a')), mix(s, 'a2')),
    }
  })
}

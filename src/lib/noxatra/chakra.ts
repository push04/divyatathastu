// Shakti Chakra Analysis — Nakshatra → Chakra Mapping

export interface ChakraData {
  name: string
  sanskrit: string
  element: string
  color: string
  level: number        // 0-100
  status: 'blocked' | 'underactive' | 'balanced' | 'overactive'
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

// Per Vedic astrology: each planet governs specific chakra centres
const PLANET_CHAKRA_MODIFIER: Record<string, number[]> = {
  'Sun':     [2],       // Solar Plexus — will, identity, fire principle
  'Moon':    [1, 3, 5], // Sacral + Heart + Third Eye — emotions, love, intuition
  'Mars':    [0, 2],    // Root + Solar Plexus — survival instincts, aggression
  'Mercury': [4],       // Throat — communication, expression
  'Jupiter': [5, 6],    // Third Eye + Crown — wisdom, spiritual expansion
  'Venus':   [1, 3],    // Sacral + Heart — pleasure, love, creativity
  'Saturn':  [0],       // Root — karma, discipline, foundations
  'Rahu':    [2, 5],    // Solar Plexus + Third Eye — obsession, illusion, ambition
  'Ketu':    [6, 0],    // Crown + Root — spiritual liberation, past karma
}

const CHAKRAS = [
  {
    name: 'Root Chakra', sanskrit: 'Muladhara', element: 'Earth', color: '#DC2626',
    mantras: ['LAM', 'Om Bhur Bhuva Swaha', 'Gam Ganapataye Namaha'],
    crystals: ['Red Jasper', 'Black Tourmaline', 'Hematite', 'Garnet'],
    foods: ['Red apples', 'Pomegranate', 'Beets', 'Red peppers', 'Protein foods'],
    yoga: ['Mountain Pose', 'Warrior I', 'Squat', 'Child\'s Pose', 'Tree Pose'],
    affirmations: ['I am safe', 'I am grounded', 'I trust the process of life', 'I belong'],
  },
  {
    name: 'Sacral Chakra', sanskrit: 'Svadhishthana', element: 'Water', color: '#EA580C',
    mantras: ['VAM', 'Om Namo Bhagavate Vasudevaya'],
    crystals: ['Carnelian', 'Orange Calcite', 'Tiger Eye', 'Moonstone'],
    foods: ['Oranges', 'Mangoes', 'Coconut', 'Almonds', 'Sweet potatoes'],
    yoga: ['Goddess Pose', 'Hip circles', 'Butterfly Pose', 'Cobra', 'Pigeon Pose'],
    affirmations: ['I embrace creativity', 'I honor my emotions', 'I am abundant', 'Life is pleasurable'],
  },
  {
    name: 'Solar Plexus', sanskrit: 'Manipura', element: 'Fire', color: '#CA8A04',
    mantras: ['RAM', 'Om Suryaya Namaha', 'Om Agni Devaya Namaha'],
    crystals: ['Citrine', 'Yellow Topaz', 'Amber', 'Tiger Eye'],
    foods: ['Bananas', 'Corn', 'Ginger', 'Turmeric', 'Lentils', 'Oats'],
    yoga: ['Boat Pose', 'Warrior III', 'Plank', 'Twisted Chair', 'Sun Salutation'],
    affirmations: ['I am confident', 'I am powerful', 'I trust myself', 'I am worthy'],
  },
  {
    name: 'Heart Chakra', sanskrit: 'Anahata', element: 'Air', color: '#16A34A',
    mantras: ['YAM', 'Om Shri Krishnaya Namaha', 'Om Mani Padme Hum'],
    crystals: ['Rose Quartz', 'Green Aventurine', 'Malachite', 'Emerald'],
    foods: ['Leafy greens', 'Broccoli', 'Green tea', 'Avocado', 'Basil'],
    yoga: ['Camel Pose', 'Bridge Pose', 'Cow Face', 'Upward Dog', 'Heart Openers'],
    affirmations: ['I love unconditionally', 'I forgive myself', 'My heart is open', 'I give and receive love'],
  },
  {
    name: 'Throat Chakra', sanskrit: 'Vishuddha', element: 'Space', color: '#2563EB',
    mantras: ['HAM', 'Om Saraswati Namaha', 'Om Aim Saraswatiye Namaha'],
    crystals: ['Blue Lace Agate', 'Sodalite', 'Aquamarine', 'Turquoise'],
    foods: ['Blueberries', 'Figs', 'Apples', 'Pears', 'Coconut water', 'Herbal teas'],
    yoga: ['Fish Pose', 'Shoulder Stand', 'Lion\'s Breath', 'Neck rolls', 'Plow Pose'],
    affirmations: ['I speak my truth', 'I communicate clearly', 'I am heard', 'My voice matters'],
  },
  {
    name: 'Third Eye Chakra', sanskrit: 'Ajna', element: 'Light', color: '#7C3AED',
    mantras: ['OM', 'Om Namah Shivaya', 'Aum Shivoham'],
    crystals: ['Amethyst', 'Lapis Lazuli', 'Labradorite', 'Fluorite'],
    foods: ['Purple grapes', 'Lavender', 'Dark chocolate', 'Walnuts', 'Goji berries'],
    yoga: ['Child\'s Pose', 'Forward fold', 'Downward Dog', 'Eagle Pose', 'Meditation'],
    affirmations: ['I trust my intuition', 'I see clearly', 'I am wise', 'I am in tune with the universe'],
  },
  {
    name: 'Crown Chakra', sanskrit: 'Sahasrara', element: 'Consciousness', color: '#7C3AED',
    mantras: ['AH', 'OM', 'So Hum', 'Aham Brahmasmi'],
    crystals: ['Clear Quartz', 'Selenite', 'Amethyst', 'Moonstone', 'Diamond'],
    foods: ['Fasting', 'Light foods', 'Mushrooms', 'Saffron', 'Pure water'],
    yoga: ['Headstand', 'Savasana', 'Lotus', 'Meditation', 'Pranayama'],
    affirmations: ['I am one with all', 'I am divine', 'I trust the universe', 'I am enlightened'],
  },
]

export function calculateChakras(nakshatra: string, planets: Array<{ name: string; house: number }>) {
  const primaryChakraIdx = NAKSHATRA_CHAKRA[nakshatra] ?? 3

  // Base levels — random variation seeded by nakshatra
  const nakshatraIdx = Object.keys(NAKSHATRA_CHAKRA).indexOf(nakshatra)
  const seed = nakshatraIdx > 0 ? nakshatraIdx : 10

  const baseLevels = [0, 1, 2, 3, 4, 5, 6].map(i => {
    if (i === primaryChakraIdx) return 60 + (seed % 30)
    return 35 + ((seed * (i + 1)) % 45)
  })

  // Planet modifiers — Kendra/Trikona = strength, Dusthana = debilitation
  planets.forEach(planet => {
    const affected = PLANET_CHAKRA_MODIFIER[planet.name]
    if (!affected) return
    const h = planet.house
    const strength =
      [1, 4, 7, 10].includes(h) ?  10 :   // Kendra — angular, powerful
      [5, 9].includes(h)         ?   8 :   // Trikona — auspicious, spiritual
      h === 11                   ?   5 :   // Upachaya — gains
      [2, 3].includes(h)         ?   2 :   // Mild
      [6, 8, 12].includes(h)     ?  -8 :   // Dusthana — challenging
                                      0
    affected.forEach(chakraIdx => {
      baseLevels[chakraIdx] = Math.min(95, Math.max(10, baseLevels[chakraIdx] + strength))
    })
  })

  return CHAKRAS.map((chakra, i) => ({
    ...chakra,
    level: baseLevels[i],
    status: getStatus(baseLevels[i]) as ChakraData['status'],
  }))
}

function getStatus(level: number): string {
  if (level < 30) return 'blocked'
  if (level < 50) return 'underactive'
  if (level <= 75) return 'balanced'
  return 'overactive'
}

// Ayurvedic Prakriti (Body Constitution) Analysis

const NAKSHATRA_DOSHA: Record<string, [number, number, number]> = {
  // [Vata%, Pitta%, Kapha%]
  'Ashwini': [60,30,10], 'Bharani': [30,60,10], 'Krittika': [20,70,10],
  'Rohini': [10,30,60], 'Mrigashira': [50,30,20], 'Ardra': [60,25,15],
  'Punarvasu': [40,20,40], 'Pushya': [20,30,50], 'Ashlesha': [50,35,15],
  'Magha': [30,50,20], 'Purva Phalguni': [20,50,30], 'Uttara Phalguni': [25,45,30],
  'Hasta': [40,35,25], 'Chitra': [35,50,15], 'Swati': [55,25,20],
  'Vishakha': [35,45,20], 'Anuradha': [30,40,30], 'Jyeshtha': [45,40,15],
  'Moola': [60,30,10], 'Purva Ashadha': [25,55,20], 'Uttara Ashadha': [20,50,30],
  'Shravana': [30,25,45], 'Dhanishtha': [40,40,20], 'Shatabhisha': [55,30,15],
  'Purva Bhadrapada': [50,35,15], 'Uttara Bhadrapada': [20,30,50], 'Revati': [35,25,40],
}

export function calculatePrakriti(nakshatra: string, birthSeason?: string) {
  const base = NAKSHATRA_DOSHA[nakshatra] ?? [33, 33, 34]
  let [vata, pitta, kapha] = base

  // Season modifier
  if (birthSeason === 'summer') { pitta += 10; vata -= 5; kapha -= 5 }
  else if (birthSeason === 'winter') { kapha += 10; vata += 5; pitta -= 15 }
  else if (birthSeason === 'monsoon') { vata += 10; pitta -= 5; kapha -= 5 }

  const total = vata + pitta + kapha
  vata = Math.round(vata / total * 100)
  pitta = Math.round(pitta / total * 100)
  kapha = 100 - vata - pitta

  const dominant = vata >= pitta && vata >= kapha ? 'Vata' : pitta >= kapha ? 'Pitta' : 'Kapha'
  const secondary = dominant === 'Vata'
    ? (pitta >= kapha ? 'Pitta' : 'Kapha')
    : dominant === 'Pitta'
      ? (vata >= kapha ? 'Vata' : 'Kapha')
      : (vata >= pitta ? 'Vata' : 'Pitta')

  return {
    vata, pitta, kapha,
    dominant, secondary,
    prakrtiLabel: `${dominant}-${secondary}`,
    description: getPrakritiDescription(dominant, secondary),
    diet: getDietRecommendations(dominant),
    yoga: getYogaRecommendations(dominant),
    herbs: getHerbs(dominant),
    dailyRoutine: getDinacharya(dominant),
    avoid: getAvoid(dominant),
    bestSeasons: getBestSeasons(dominant),
  }
}

function getPrakritiDescription(dom: string, sec: string): string {
  const desc: Record<string, string> = {
    'Vata': `As a ${dom}-${sec} type, you are governed by the elements of Space and Air. You tend to be creative, quick-thinking, enthusiastic, and flexible. When balanced, you bring inspiration and movement to everything you touch. When imbalanced, you may experience anxiety, restlessness, dryness, or irregular digestion. Your key is to cultivate warmth, routine, and grounding.`,
    'Pitta': `As a ${dom}-${sec} type, you are governed by Fire and Water. You are naturally sharp, intelligent, courageous, and goal-oriented. When balanced, you are a natural leader with clarity and focus. When imbalanced, you may experience inflammation, irritability, excessive heat, or perfectionism. Your key is to cultivate coolness, surrender, and compassion.`,
    'Kapha': `As a ${dom}-${sec} type, you are governed by Earth and Water. You are naturally stable, loving, patient, and enduring. When balanced, you bring strength, loyalty, and nurturing to all relationships. When imbalanced, you may experience weight gain, sluggishness, attachment, or depression. Your key is to cultivate movement, stimulation, and lightness.`,
  }
  return desc[dom] || 'Your constitution is uniquely balanced with qualities from all three doshas.'
}

function getDietRecommendations(dominant: string): Record<string, string[]> {
  const diet: Record<string, Record<string, string[]>> = {
    Vata: {
      favor: ['Warm, cooked foods', 'Ghee and oils', 'Sweet fruits', 'Root vegetables', 'Dairy', 'Grains', 'Warm soups'],
      reduce: ['Raw foods', 'Cold foods', 'Dry snacks', 'Caffeine', 'Legumes (excessive)', 'Carbonated drinks'],
      spices: ['Ginger', 'Cardamom', 'Cinnamon', 'Cumin', 'Fennel', 'Asafoetida'],
    },
    Pitta: {
      favor: ['Cool or room temperature foods', 'Sweet & bitter tastes', 'Milk', 'Ghee', 'Coconut', 'Cilantro', 'Cucumber'],
      reduce: ['Spicy food', 'Fried food', 'Fermented food', 'Alcohol', 'Red meat', 'Caffeine', 'Acidic foods'],
      spices: ['Coriander', 'Fennel', 'Turmeric', 'Cardamom', 'Mint', 'Saffron'],
    },
    Kapha: {
      favor: ['Light, dry, warm foods', 'Spicy and bitter tastes', 'Legumes', 'Vegetables', 'Light grains', 'Honey'],
      reduce: ['Heavy foods', 'Dairy', 'Cold foods', 'Sweets', 'Wheat', 'Red meat', 'Oily foods'],
      spices: ['Ginger', 'Black pepper', 'Mustard', 'Turmeric', 'Cayenne', 'Fenugreek'],
    },
  }
  return diet[dominant] || diet.Vata
}

function getYogaRecommendations(dominant: string): string[] {
  const yoga: Record<string, string[]> = {
    Vata: ['Yin Yoga', 'Restorative Yoga', 'Gentle Hatha', 'Slow Vinyasa', 'Yoga Nidra'],
    Pitta: ['Moon Salutation', 'Cooling Pranayama', 'Yin Yoga', 'Gentle twists', 'Sitali breath'],
    Kapha: ['Power Yoga', 'Vinyasa Flow', 'Surya Namaskar', 'Inversions', 'Kapalbhati'],
  }
  return yoga[dominant] || ['Hatha Yoga']
}

function getHerbs(dominant: string): string[] {
  const herbs: Record<string, string[]> = {
    Vata: ['Ashwagandha', 'Shatavari', 'Bala', 'Licorice', 'Triphala', 'Brahmi'],
    Pitta: ['Amalaki', 'Neem', 'Manjistha', 'Shatavari', 'Guduchi', 'Coriander'],
    Kapha: ['Trikatu', 'Guggulu', 'Punarnava', 'Tulsi', 'Ginger', 'Black pepper'],
  }
  return herbs[dominant] || []
}

function getDinacharya(dominant: string): string[] {
  const routine: Record<string, string[]> = {
    Vata: ['Wake by 6 AM', 'Self-massage with warm sesame oil daily', 'Regular meal times', 'Light evening walks', 'Bed by 10 PM', 'Avoid screen time after 9 PM'],
    Pitta: ['Wake by 5:30 AM', 'Cool morning shower', 'Meditation before work', 'Light lunch as main meal', 'Evening walk in nature', 'Bed by 10:30 PM'],
    Kapha: ['Wake by 5 AM (before sunrise)', 'Vigorous morning exercise', 'Light breakfast or skip', 'Main meal at noon', 'Stay active throughout day', 'Bed by 11 PM'],
  }
  return routine[dominant] || []
}

function getAvoid(dominant: string): string[] {
  const avoid: Record<string, string[]> = {
    Vata: ['Excessive travel', 'Irregular routines', 'Cold and windy weather', 'Stimulants', 'Rushing and multitasking'],
    Pitta: ['Overworking', 'Competition and conflict', 'Excessive heat', 'Skipping meals', 'Spicy and acidic foods'],
    Kapha: ['Daytime sleeping', 'Sedentary lifestyle', 'Cold and damp weather', 'Heavy and sweet foods', 'Excessive comfort-seeking'],
  }
  return avoid[dominant] || []
}

function getBestSeasons(dominant: string): string[] {
  const seasons: Record<string, string[]> = {
    Vata: ['Spring', 'Early Summer'],
    Pitta: ['Autumn', 'Winter'],
    Kapha: ['Summer', 'Late Spring'],
  }
  return seasons[dominant] || []
}

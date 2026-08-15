// Ayurvedic Prakriti (Body Constitution) Analysis
//
// Constitution was previously read from the janma nakshatra and birth season
// alone - 27 x 4 inputs, and every downstream list keyed on the dominant dosha
// only, so three people in ten shared an identical prakriti page. Classical
// Jyotisha-Ayurveda also reads the lagna (deha prakriti, the body's own sign)
// and the running dasha lord (vikriti, the current imbalance), so both are now
// taken into account, and the advice lists key on the dual constitution.

import { seekerSignature, mix, pick } from './personalise'

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

// Deha prakriti - the lagna sign's own dosha leaning
const LAGNA_DOSHA: Record<string, [number, number, number]> = {
  Aries: [10, 25, -5], Taurus: [-5, 0, 20], Gemini: [25, 0, -5],
  Cancer: [-5, 5, 20], Leo: [0, 25, -5], Virgo: [15, 5, 0],
  Libra: [20, 0, 0], Scorpio: [0, 20, 10], Sagittarius: [10, 20, -5],
  Capricorn: [20, -5, 5], Aquarius: [25, -5, 0], Pisces: [0, 5, 20],
}

// Vikriti - the running mahadasha lord tilts the present balance
const GRAHA_DOSHA: Record<string, [number, number, number]> = {
  Sun: [0, 20, -10], Moon: [0, -5, 15], Mars: [0, 25, -10],
  Mercury: [10, 0, 5], Jupiter: [-10, 0, 15], Venus: [-5, 0, 15],
  Saturn: [25, -10, 0], Rahu: [25, 0, -5], Ketu: [20, 5, -10],
}

export interface PrakritiContext {
  ascendant?: string
  dashaLord?: string
  moonSign?: string
  dob?: string
  name?: string
}

export function calculatePrakriti(
  nakshatra: string,
  birthSeason?: string,
  ctx: PrakritiContext = {},
) {
  const base = NAKSHATRA_DOSHA[nakshatra] ?? [33, 33, 34]
  let [vata, pitta, kapha] = base

  // Season modifier
  if (birthSeason === 'summer') { pitta += 10; vata -= 5; kapha -= 5 }
  else if (birthSeason === 'winter') { kapha += 10; vata += 5; pitta -= 15 }
  else if (birthSeason === 'monsoon') { vata += 10; pitta -= 5; kapha -= 5 }

  // Lagna (deha prakriti) and dasha lord (vikriti) modifiers
  const lagnaMod = ctx.ascendant ? LAGNA_DOSHA[ctx.ascendant] : undefined
  if (lagnaMod) { vata += lagnaMod[0]; pitta += lagnaMod[1]; kapha += lagnaMod[2] }
  const grahaMod = ctx.dashaLord ? GRAHA_DOSHA[ctx.dashaLord] : undefined
  if (grahaMod) { vata += grahaMod[0]; pitta += grahaMod[1]; kapha += grahaMod[2] }

  // Keep every dosha positive before normalising, so a strong modifier cannot
  // drive a percentage negative and hand the remainder to another dosha.
  vata = Math.max(5, vata); pitta = Math.max(5, pitta); kapha = Math.max(5, kapha)

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

  const sig = seekerSignature([
    nakshatra, birthSeason, ctx.ascendant, ctx.dashaLord,
    ctx.moonSign, ctx.dob, ctx.name, vata, pitta, kapha,
  ])
  const dual = `${dominant}-${secondary}`

  return {
    vata, pitta, kapha,
    dominant, secondary,
    prakrtiLabel: dual,
    description: getPrakritiDescription(dominant, secondary),
    diet: getDietRecommendations(dominant, sig),
    yoga: getYogaRecommendations(dual, dominant, sig),
    herbs: getHerbs(dual, dominant, sig),
    dailyRoutine: getDinacharya(dominant, secondary),
    avoid: getAvoid(dual, dominant, sig),
    bestSeasons: getBestSeasons(dominant),
    // Which dosha the current period is pushing out of balance - this is the
    // part that changes as the dasha changes, and it is chart-specific.
    currentImbalance: ctx.dashaLord
      ? `Your running ${ctx.dashaLord} mahadasha pushes ${grahaLean(ctx.dashaLord)}. Against a ${dual} baseline that means ${imbalanceNote(dual, ctx.dashaLord)}`
      : undefined,
  }
}

function grahaLean(lord: string): string {
  const m: Record<string, string> = {
    Sun: 'Pitta upward and Kapha down', Moon: 'Kapha upward', Mars: 'Pitta sharply upward',
    Mercury: 'Vata mildly upward', Jupiter: 'Kapha upward and Vata down',
    Venus: 'Kapha upward', Saturn: 'Vata strongly upward', Rahu: 'Vata upward and erratic',
    Ketu: 'Vata upward with sudden Pitta spikes',
  }
  return m[lord] || 'no single dosha decisively'
}

function imbalanceNote(dual: string, lord: string): string {
  const dominant = dual.split('-')[0]
  const raises = ['Saturn', 'Rahu', 'Ketu', 'Mercury'].includes(lord) ? 'Vata'
    : ['Sun', 'Mars'].includes(lord) ? 'Pitta' : 'Kapha'
  if (dominant === raises) {
    return `your dominant ${dominant} is being amplified rather than balanced - this is the period to be strictest with the routine below.`
  }
  if (dual.split('-')[1] === raises) {
    return `your secondary ${raises} is being pushed toward the front, so you may not recognise your own usual pattern during this period.`
  }
  return `${raises} is being raised against your ${dominant} grain, which usually shows up as fatigue before it shows up as symptoms.`
}

function getPrakritiDescription(dom: string, sec: string): string {
  const desc: Record<string, string> = {
    'Vata': `As a ${dom}-${sec} type, you are governed by the elements of Space and Air. You tend to be creative, quick-thinking, enthusiastic, and flexible. When balanced, you bring inspiration and movement to everything you touch. When imbalanced, you may experience anxiety, restlessness, dryness, or irregular digestion. Your key is to cultivate warmth, routine, and grounding.`,
    'Pitta': `As a ${dom}-${sec} type, you are governed by Fire and Water. You are naturally sharp, intelligent, courageous, and goal-oriented. When balanced, you are a natural leader with clarity and focus. When imbalanced, you may experience inflammation, irritability, excessive heat, or perfectionism. Your key is to cultivate coolness, surrender, and compassion.`,
    'Kapha': `As a ${dom}-${sec} type, you are governed by Earth and Water. You are naturally stable, loving, patient, and enduring. When balanced, you bring strength, loyalty, and nurturing to all relationships. When imbalanced, you may experience weight gain, sluggishness, attachment, or depression. Your key is to cultivate movement, stimulation, and lightness.`,
  }
  // The secondary dosha is what separates the six dual constitutions from each
  // other - a Vata-Pitta and a Vata-Kapha need materially different handling.
  const dual: Record<string, string> = {
    'Vata-Pitta': ' Your secondary Pitta adds heat and sharpness to Vata\'s mobility: you burn intensely and then crash. Autumn and early summer are your vulnerable seasons, and skipping meals harms you faster than it harms most people.',
    'Vata-Kapha': ' Your secondary Kapha gives Vata something to hold on to, but the two are both cold - you feel cold weather more than anyone, tend toward congestion alongside anxiety, and need warmth applied consistently rather than intensely.',
    'Pitta-Vata': ' Your secondary Vata makes Pitta\'s fire erratic rather than steady: strong drive punctuated by scattered periods. Regular meal times matter more for you than the contents of the meal.',
    'Pitta-Kapha': ' Your secondary Kapha gives Pitta real stamina - this is the most physically robust of the six combinations. The risk is not burnout but complacency, and inflammation that builds silently over years.',
    'Kapha-Vata': ' Your secondary Vata lightens Kapha\'s heaviness and adds creativity, but produces an irregular pattern: long stable stretches broken by restless ones. Movement is your medicine in both phases.',
    'Kapha-Pitta': ' Your secondary Pitta gives Kapha ambition and digestive strength - you can carry weight and workload others cannot. Watch for slow-building heat conditions: acidity, skin inflammation, and blood pressure.',
  }
  return (desc[dom] || 'Your constitution is uniquely balanced with qualities from all three doshas.')
    + (dual[`${dom}-${sec}`] || '')
}

function getDietRecommendations(dominant: string, sig: number): Record<string, string[]> {
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
  const d = diet[dominant] || diet.Vata
  // Pools are longer than what a seeker receives, so the selection differs
  return {
    favor: pick(d.favor, 5, mix(sig, 'favor')),
    reduce: pick(d.reduce, 4, mix(sig, 'reduce')),
    spices: pick(d.spices, 4, mix(sig, 'spice')),
  }
}

function getYogaRecommendations(dual: string, dominant: string, sig: number): string[] {
  const yoga: Record<string, string[]> = {
    'Vata-Pitta': ['Yin Yoga', 'Restorative Yoga', 'Gentle Hatha', 'Slow Vinyasa', 'Yoga Nidra', 'Sitali breath', 'Moon Salutation', 'Supported forward folds'],
    'Vata-Kapha': ['Gentle Hatha', 'Slow Vinyasa', 'Surya Namaskar at low intensity', 'Yoga Nidra', 'Standing balances', 'Ujjayi breath', 'Warming twists', 'Restorative Yoga'],
    'Pitta-Vata': ['Moon Salutation', 'Cooling Pranayama', 'Yin Yoga', 'Gentle twists', 'Sitali breath', 'Slow Vinyasa', 'Supported backbends', 'Yoga Nidra'],
    'Pitta-Kapha': ['Moon Salutation', 'Cooling Pranayama', 'Vinyasa Flow', 'Gentle twists', 'Sitali breath', 'Sustained standing poses', 'Inversions', 'Core work'],
    'Kapha-Vata': ['Power Yoga', 'Vinyasa Flow', 'Surya Namaskar', 'Inversions', 'Kapalbhati', 'Varied sequences', 'Standing balances', 'Bhastrika'],
    'Kapha-Pitta': ['Power Yoga', 'Vinyasa Flow', 'Surya Namaskar', 'Inversions', 'Kapalbhati', 'Cooling savasana', 'Twists', 'Sitali breath'],
  }
  const pool = yoga[dual] || yoga[`${dominant}-Vata`] || ['Hatha Yoga']
  return pick(pool, 5, mix(sig, 'yoga'))
}

function getHerbs(dual: string, dominant: string, sig: number): string[] {
  const herbs: Record<string, string[]> = {
    'Vata-Pitta': ['Ashwagandha', 'Shatavari', 'Brahmi', 'Licorice', 'Guduchi', 'Amalaki', 'Jatamansi', 'Triphala'],
    'Vata-Kapha': ['Ashwagandha', 'Bala', 'Triphala', 'Tulsi', 'Ginger', 'Pippali', 'Guggulu', 'Brahmi'],
    'Pitta-Vata': ['Amalaki', 'Shatavari', 'Guduchi', 'Brahmi', 'Coriander', 'Jatamansi', 'Licorice', 'Manjistha'],
    'Pitta-Kapha': ['Amalaki', 'Neem', 'Manjistha', 'Guduchi', 'Punarnava', 'Turmeric', 'Coriander', 'Tulsi'],
    'Kapha-Vata': ['Trikatu', 'Guggulu', 'Tulsi', 'Ginger', 'Ashwagandha', 'Pippali', 'Punarnava', 'Triphala'],
    'Kapha-Pitta': ['Trikatu', 'Guggulu', 'Punarnava', 'Tulsi', 'Neem', 'Turmeric', 'Manjistha', 'Black pepper'],
  }
  const pool = herbs[dual] || herbs[`${dominant}-Vata`] || []
  return pick(pool, 5, mix(sig, 'herb'))
}

// Keyed to the dual constitution, not the dominant dosha alone - a Vata-Pitta
// and a Vata-Kapha need materially different daily handling, and keying on the
// dominant alone gave both of them the same six lines.
function getDinacharya(dominant: string, secondary: string): string[] {
  const routine: Record<string, string[]> = {
    'Vata-Pitta': ['Wake by 6 AM', 'Self-massage with warm coconut or sunflower oil - sesame is too heating for your Pitta half', 'Never skip or delay a meal; you crash faster than other Vata types', 'Light evening walks, out of direct sun', 'Bed by 10 PM', 'Avoid screen time after 9 PM'],
    'Vata-Kapha': ['Wake by 6 AM', 'Self-massage with warm sesame or mustard oil - you need the heaviest, warmest oil of the six types', 'Regular meal times, all food served warm', 'Brisk evening walks to counter the shared coldness of both doshas', 'Bed by 10 PM', 'Keep the bedroom warm and dry rather than merely dark'],
    'Pitta-Vata': ['Wake by 5:30 AM', 'Cool morning shower, never cold', 'Meditation before work - this is non-negotiable for your combination', 'Fixed meal times matter more than what you eat', 'Evening walk in nature, away from crowds', 'Bed by 10:30 PM'],
    'Pitta-Kapha': ['Wake by 5:30 AM', 'Cool morning shower followed by vigorous exercise - you have the stamina for both', 'Light lunch as main meal', 'Sustained daily exertion; your robustness hides slow-building inflammation', 'Evening walk in nature', 'Bed by 10:30 PM'],
    'Kapha-Vata': ['Wake by 5 AM (before sunrise)', 'Vigorous but varied morning exercise - routine alone bores your Vata half into skipping it', 'Light breakfast or skip', 'Main meal at noon', 'Stay active throughout the day, changing the activity often', 'Bed by 11 PM'],
    'Kapha-Pitta': ['Wake by 5 AM (before sunrise)', 'Vigorous morning exercise, finishing before the day heats up', 'Light breakfast or skip', 'Main meal at noon, avoiding heavy oils and salt', 'Stay active throughout day', 'Bed by 11 PM'],
  }
  const FALLBACK: Record<string, string[]> = {
    Vata: ['Wake by 6 AM', 'Self-massage with warm sesame oil daily', 'Regular meal times', 'Light evening walks', 'Bed by 10 PM', 'Avoid screen time after 9 PM'],
    Pitta: ['Wake by 5:30 AM', 'Cool morning shower', 'Meditation before work', 'Light lunch as main meal', 'Evening walk in nature', 'Bed by 10:30 PM'],
    Kapha: ['Wake by 5 AM (before sunrise)', 'Vigorous morning exercise', 'Light breakfast or skip', 'Main meal at noon', 'Stay active throughout day', 'Bed by 11 PM'],
  }
  return routine[`${dominant}-${secondary}`] || FALLBACK[dominant] || []
}

function getAvoid(dual: string, dominant: string, sig: number): string[] {
  const avoid: Record<string, string[]> = {
    'Vata-Pitta': ['Excessive travel', 'Irregular routines', 'Stimulants', 'Rushing and multitasking', 'Skipping meals', 'Working through the night', 'Arguments taken personally'],
    'Vata-Kapha': ['Cold and windy weather', 'Irregular routines', 'Damp living spaces', 'Cold and raw food', 'Long periods of inactivity', 'Excessive travel', 'Sleeping in a cold room'],
    'Pitta-Vata': ['Overworking', 'Competition and conflict', 'Skipping meals', 'Excessive heat', 'Stimulants', 'Irregular sleep', 'Deadline-driven work without breaks'],
    'Pitta-Kapha': ['Overworking', 'Excessive heat', 'Spicy and acidic foods', 'Heavy oily food', 'Complacency once comfortable', 'Alcohol', 'Midday sun'],
    'Kapha-Vata': ['Daytime sleeping', 'Sedentary lifestyle', 'Cold and damp weather', 'Heavy and sweet foods', 'Unstructured days', 'Excessive comfort-seeking', 'Skipping exercise when the mood drops'],
    'Kapha-Pitta': ['Daytime sleeping', 'Sedentary lifestyle', 'Heavy and sweet foods', 'Excessive comfort-seeking', 'Rich food late at night', 'Salt', 'Ignoring slow-building symptoms'],
  }
  const pool = avoid[dual] || avoid[`${dominant}-Vata`] || []
  return pick(pool, 5, mix(sig, 'avoid'))
}

function getBestSeasons(dominant: string): string[] {
  const seasons: Record<string, string[]> = {
    Vata: ['Spring', 'Early Summer'],
    Pitta: ['Autumn', 'Winter'],
    Kapha: ['Summer', 'Late Spring'],
  }
  return seasons[dominant] || []
}

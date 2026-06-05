// Numerology Engine — Pythagorean + Chaldean
// Algorithms per services.md: component reduction method, master numbers 11/22/33

const CHALDEAN: Record<string, number> = {
  A:1,I:1,J:1,Q:1,Y:1, B:2,K:2,R:2,
  C:3,G:3,L:3,S:3, D:4,M:4,T:4,
  E:5,H:5,N:5,X:5, U:6,V:6,W:6,
  O:7,Z:7, F:8,P:8
}

const PYTHAGOREAN: Record<string, number> = {
  A:1,J:1,S:1, B:2,K:2,T:2, C:3,L:3,U:3,
  D:4,M:4,V:4, E:5,N:5,W:5, F:6,O:6,X:6,
  G:7,P:7,Y:7, H:8,Q:8,Z:8, I:9,R:9
}

// Preserve master numbers 11, 22, 33
function reduce(n: number, allowMaster = true): number {
  if (allowMaster && (n === 11 || n === 22 || n === 33)) return n
  if (n <= 9) return n
  const sum = String(n).split('').reduce((acc, d) => acc + parseInt(d), 0)
  return reduce(sum, allowMaster)
}

function nameValue(name: string, map: Record<string, number>): number {
  return name.toUpperCase().replace(/[^A-Z]/g, '').split('')
    .reduce((sum, ch) => sum + (map[ch] || 0), 0)
}

// Component method per services.md — correctly preserves master numbers
function calculateLifePath(dob: string): number {
  const [year, month, day] = dob.split('-').map(Number)
  const dayReduced   = reduce(day, true)
  const monthReduced = reduce(month, true)
  const yearSum = String(year).split('').reduce((a, b) => a + parseInt(b), 0)
  const yearReduced  = reduce(yearSum, true)
  return reduce(dayReduced + monthReduced + yearReduced, true)
}

// Exact mobile compatibility table per services.md
const MOBILE_COMPAT: Record<number, { compatible: number[]; neutral: number[]; challenging: number[] }> = {
  1: { compatible: [1,5,7], neutral: [2,4],   challenging: [3,6,8,9] },
  2: { compatible: [2,4,8], neutral: [1,3],   challenging: [5,6,7,9] },
  3: { compatible: [3,6,9], neutral: [1,2],   challenging: [4,5,7,8] },
  4: { compatible: [4,2,8], neutral: [6,7],   challenging: [1,3,5,9] },
  5: { compatible: [5,1,7], neutral: [3,9],   challenging: [2,4,6,8] },
  6: { compatible: [6,3,9], neutral: [2,4],   challenging: [1,5,7,8] },
  7: { compatible: [7,1,5], neutral: [4,6],   challenging: [2,3,8,9] },
  8: { compatible: [8,2,4], neutral: [6,9],   challenging: [1,3,5,7] },
  9: { compatible: [9,3,6], neutral: [5,8],   challenging: [1,2,4,7] },
  11: { compatible: [2,11,22], neutral: [1,3], challenging: [5,8,9] },
  22: { compatible: [4,8,22], neutral: [6,7],  challenging: [1,3,5] },
  33: { compatible: [3,6,33], neutral: [9,2],  challenging: [1,5,8] },
}

export function calculateNumerology(fullName: string, dob: string) {
  const [, month, day] = dob.split('-').map(Number)

  const lifePathNumber = calculateLifePath(dob)

  const nameUp = fullName.toUpperCase()
  const VOWELS_RE    = /[AEIOU]/g
  const CONSONANTS_RE = /[^AEIOU\s]/g

  const soulUrge    = reduce(nameValue(nameUp.replace(CONSONANTS_RE, ''), PYTHAGOREAN))
  const personality = reduce(nameValue(nameUp.replace(VOWELS_RE, ''), PYTHAGOREAN))
  const destiny     = reduce(nameValue(nameUp, PYTHAGOREAN))
  const chaldeanName = reduce(nameValue(nameUp, CHALDEAN))

  const birthdayNumber = reduce(day, false)

  const currentYear = new Date().getFullYear()
  const personalYear = reduce(
    reduce(day + month, false) + reduce(
      String(currentYear).split('').reduce((a,b)=>a+parseInt(b),0), false
    ), false
  )

  const maturity = reduce(lifePathNumber + destiny)

  const luckyNumbers = [...new Set(
    [lifePathNumber, destiny, soulUrge].map(n => [n, n + 9]).flat().filter(n => n <= 36)
  )].slice(0, 6)

  return {
    lifePathNumber,
    destinyNumber:     destiny,
    soulUrgeNumber:    soulUrge,
    personalityNumber: personality,
    maturityNumber:    maturity,
    birthdayNumber,
    personalYearNumber: personalYear,
    chaldeanNameNumber: chaldeanName,
    luckyNumbers,
    luckyColors:  getLuckyColors(lifePathNumber),
    luckyDays:    getLuckyDays(lifePathNumber),
    strengths:    getStrengths(lifePathNumber),
    challenges:   getChallenges(lifePathNumber),
    careerPaths:  getCareerPaths(destiny),
    compatibility: getLifePathCompatibility(lifePathNumber),
    karmaNumbers: getKarmaNumbers(fullName),
    interpretation: {
      lifePath:       interpretLifePath(lifePathNumber),
      lifePathTitle:  LIFE_PATH_TITLES[lifePathNumber] || 'The Seeker',
      destiny:        interpretDestiny(destiny),
      soulUrge:       interpretSoulUrge(soulUrge),
      personalYear:   interpretPersonalYear(personalYear),
      karmaLesson:    interpretKarmaLesson(getKarmaNumbers(fullName)),
    }
  }
}

const LIFE_PATH_TITLES: Record<number, string> = {
  1: 'The Leader', 2: 'The Peacemaker', 3: 'The Creator', 4: 'The Builder',
  5: 'The Freedom Seeker', 6: 'The Nurturer', 7: 'The Seeker', 8: 'The Achiever',
  9: 'The Humanitarian', 11: 'The Intuitive Visionary', 22: 'The Master Builder', 33: 'The Master Teacher',
}

function getKarmaNumbers(fullName: string): number[] {
  const counts: Record<number, number> = {}
  fullName.toUpperCase().replace(/[^A-Z]/g, '').split('').forEach(ch => {
    const v = PYTHAGOREAN[ch]
    if (v) counts[v] = (counts[v] || 0) + 1
  })
  const missing = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !counts[n])
  return missing.slice(0, 3)
}

function interpretPersonalYear(n: number): string {
  const map: Record<number, string> = {
    1: 'This is your new beginning year — a powerful time to initiate projects, rebrand yourself, and plant seeds for the next 9-year cycle. Leadership opportunities emerge. Act boldly on what you want to create.',
    2: 'A year of patience, partnership, and inner development. Relationships deepen and collaborations flourish. This is not a year to force outcomes — trust the divine timing and nurture existing connections.',
    3: 'Joy, creativity, and social expansion define this year. Express yourself freely — through art, writing, speaking, or celebration. Travel, romance, and new friendships enrich your world.',
    4: 'A foundation-building year requiring discipline and focus. The work you put in now creates structures that last for decades. Health, routines, and practical plans need your attention. Avoid shortcuts.',
    5: 'A year of change, freedom, and unexpected opportunities. Be flexible and embrace disruption — what leaves your life was meant to go. Travel, new skills, and bold moves are favored.',
    6: 'Home, family, and service call you this year. A 6 Personal Year asks you to be responsible and nurturing. Marriages, births, and property matters are highlighted. Beauty and harmony grow when you invest in them.',
    7: 'A deeply introspective year for inner work, spiritual practice, and self-discovery. Step back from the noise of the world. Study, meditation, and time alone will reveal profound insights.',
    8: 'Power, ambition, and material success are activated this year. Business ventures, financial decisions, and career moves pay off when approached strategically. This is a harvest year for past efforts.',
    9: 'A year of endings, completions, and release. Let go of what no longer serves. Forgiveness, charitable giving, and spiritual reflection prepare the ground for the new cycle beginning next year.',
    11: 'A master intuition year — your sixth sense is heightened. Spiritual downloads, synchronicities, and inspired insights guide your path. Share your visions with the world.',
    22: 'A master builder year — large-scale projects, institutional work, and world-impacting creations are supported. Ground your vision with disciplined action.',
  }
  return map[n] || 'A significant year of personal evolution and growth across all life areas.'
}

function interpretKarmaLesson(missingNumbers: number[]): string {
  if (missingNumbers.length === 0) return 'No major karmic lessons indicated — your name carries a balanced vibration across all nine numbers.'
  const LESSONS: Record<number, string> = {
    1: 'independence and self-reliance',
    2: 'cooperation and sensitivity to others',
    3: 'creative expression and joy',
    4: 'discipline and practical work ethic',
    5: 'embracing change and freedom',
    6: 'responsibility and unconditional love',
    7: 'trust in inner wisdom and spiritual depth',
    8: 'healthy relationship with power and abundance',
    9: 'compassion, forgiveness, and humanitarian service',
  }
  const lessons = missingNumbers.map(n => LESSONS[n]).filter(Boolean)
  return `Missing numbers in your name indicate karmic growth areas: ${lessons.join('; ')}. These are themes you are learning to integrate in this lifetime.`
}

function getLifePathCompatibility(n: number) {
  return MOBILE_COMPAT[n] || { compatible: [], neutral: [], challenging: [] }
}

function getLuckyColors(n: number): string[] {
  const map: Record<number, string[]> = {
    1:  ['Gold', 'Orange', 'Yellow'],
    2:  ['White', 'Silver', 'Cream'],
    3:  ['Yellow', 'Violet', 'Purple'],
    4:  ['Blue', 'Grey', 'Green'],
    5:  ['Silver', 'Light Grey', 'White'],
    6:  ['Pink', 'Blue', 'Rose'],
    7:  ['Light Yellow', 'White', 'Violet'],
    8:  ['Dark Blue', 'Black', 'Dark Grey'],
    9:  ['Red', 'Crimson', 'Rose'],
    11: ['White', 'Silver', 'Indigo'],
    22: ['Blue', 'Gold', 'Earth tones'],
    33: ['Yellow', 'Violet', 'Purple'],
  }
  return map[n] || ['Gold', 'White']
}

function getLuckyDays(n: number): string[] {
  const map: Record<number, string[]> = {
    1: ['Sunday', 'Monday'], 2: ['Monday', 'Friday'],
    3: ['Thursday', 'Friday'], 4: ['Sunday', 'Saturday'],
    5: ['Wednesday', 'Friday'], 6: ['Friday', 'Wednesday'],
    7: ['Monday', 'Sunday'], 8: ['Saturday', 'Sunday'],
    9: ['Tuesday', 'Thursday'], 11: ['Monday', 'Wednesday'],
    22: ['Saturday', 'Thursday'], 33: ['Thursday', 'Friday'],
  }
  return map[n] || ['Monday']
}

function getStrengths(n: number): string[] {
  const map: Record<number, string[]> = {
    1:  ['Natural leader', 'Independent', 'Ambitious', 'Innovative'],
    2:  ['Diplomatic', 'Cooperative', 'Sensitive', 'Peacemaker'],
    3:  ['Creative', 'Expressive', 'Optimistic', 'Communicative'],
    4:  ['Organized', 'Reliable', 'Disciplined', 'Hardworking'],
    5:  ['Adaptable', 'Adventurous', 'Versatile', 'Progressive'],
    6:  ['Nurturing', 'Responsible', 'Compassionate', 'Artistic'],
    7:  ['Analytical', 'Intuitive', 'Spiritual', 'Introspective'],
    8:  ['Ambitious', 'Executive', 'Practical', 'Goal-oriented'],
    9:  ['Humanitarian', 'Generous', 'Compassionate', 'Wise'],
    11: ['Intuitive', 'Inspiring', 'Visionary', 'Spiritual master'],
    22: ['Master builder', 'Practical visionary', 'Leader', 'Organizer'],
    33: ['Master teacher', 'Compassionate', 'Healing', 'Creative'],
  }
  return map[n] || ['Balanced', 'Adaptable']
}

function getChallenges(n: number): string[] {
  const map: Record<number, string[]> = {
    1:  ['Stubbornness', 'Selfishness', 'Arrogance'],
    2:  ['Over-sensitivity', 'Indecisiveness', 'Dependency'],
    3:  ['Scattered energy', 'Superficiality', 'Mood swings'],
    4:  ['Rigidity', 'Stubbornness', 'Resistance to change'],
    5:  ['Restlessness', 'Irresponsibility', 'Excess'],
    6:  ['Over-protectiveness', 'Martyrdom', 'Perfectionism'],
    7:  ['Isolation', 'Secretiveness', 'Aloofness'],
    8:  ['Materialism', 'Workaholism', 'Control issues'],
    9:  ['Impracticality', 'Emotional volatility', 'Self-righteousness'],
    11: ['Anxiety', 'Over-sensitivity', 'Unrealistic idealism'],
    22: ['Overwhelm', 'Megalomania', 'Over-ambition'],
    33: ['Self-sacrifice to excess', 'Unrealistic compassion', 'Overwhelm'],
  }
  return map[n] || ['Balance needed']
}

function getCareerPaths(destiny: number): string[] {
  const map: Record<number, string[]> = {
    1:  ['Entrepreneur', 'Executive', 'Politician', 'Inventor', 'Military'],
    2:  ['Counselor', 'Teacher', 'Diplomat', 'Healer', 'Social worker'],
    3:  ['Artist', 'Writer', 'Speaker', 'Entertainer', 'Designer'],
    4:  ['Engineer', 'Accountant', 'Architect', 'Manager', 'Builder'],
    5:  ['Marketing', 'Journalist', 'Travel', 'Sales', 'Researcher'],
    6:  ['Doctor', 'Nurse', 'Counselor', 'Teacher', 'Interior designer'],
    7:  ['Scientist', 'Philosopher', 'Priest', 'Researcher', 'Analyst'],
    8:  ['Banker', 'Investor', 'CEO', 'Real estate', 'Judge'],
    9:  ['Social worker', 'Artist', 'Healer', 'Spiritual teacher', 'Humanitarian'],
    11: ['Spiritual teacher', 'Counselor', 'Artist', 'Visionary', 'Inventor'],
    22: ['Architect', 'Engineer', 'Diplomat', 'Global leader', 'Visionary builder'],
    33: ['Healer', 'Teacher', 'Spiritual guide', 'Therapist', 'Social reformer'],
  }
  return map[destiny] || ['Varied paths']
}

function interpretLifePath(n: number): string {
  const map: Record<number, string> = {
    1:  'You are born to lead. Your life path is one of independence, innovation, and courage. You thrive when pioneering new ideas and must resist the tendency to dominate others. Leadership in business or public life is your calling.',
    2:  'Your soul seeks harmony and connection. You are a natural peacemaker, diplomat, and collaborator. Your greatest power lies in bringing people together and in your extraordinary sensitivity to others\' emotions.',
    3:  'Creativity and self-expression define your journey. You are here to inspire, entertain, and uplift others through art, communication, or performance. Joy and optimism are your gifts to the world.',
    4:  'You are the builder of foundations. Discipline, order, and hard work are your tools. You create lasting structures — in business, family, or society — that stand the test of time.',
    5:  'Freedom and adventure are your soul\'s call. You are here to experience the full spectrum of life through travel, change, and exploration. You thrive in dynamic environments.',
    6:  'Love, family, and responsibility are your calling. You are a natural caretaker, healer, and harmonizer. Your greatest fulfillment comes from serving those you love.',
    7:  'You walk the path of the seeker. Philosophy, spirituality, and inner wisdom are your gifts. Solitude and deep contemplation reveal your true nature.',
    8:  'Power, abundance, and achievement define your path. You are here to master the material world and use it in service of larger goals. Financial success and leadership come naturally.',
    9:  'Compassion and global consciousness are your mission. You are the humanitarian, the healer, the wisdom teacher. Your life expands when you give without expectation.',
    11: 'You carry master teacher energy. Your intuition is extraordinary and your potential for spiritual illumination is vast. The challenge is to ground your visions in practical action.',
    22: 'You are the master builder of the physical world. Your dreams are vast, your capacity to manifest them rare. You can transform society through visionary practical work.',
    33: 'You embody the master healer. With the creative power of 3 and the responsibility of 6 amplified, you are here to uplift humanity through unconditional love and inspired teaching.',
  }
  return map[n] || 'Your life path holds unique spiritual lessons that will unfold through lived experience.'
}

function interpretDestiny(n: number): string {
  const map: Record<number, string> = {
    1:  'Your destiny is to become a leader and pioneer in your field. You are meant to stand independently and forge new paths.',
    2:  'Your destiny is to bring people together and create harmony in all relationships. Cooperation is your highest calling.',
    3:  'Your destiny is to express yourself creatively and inspire others with your words, art, and optimistic spirit.',
    4:  'Your destiny is to build, organize, and create lasting systems. Reliability and hard work define your legacy.',
    5:  'Your destiny is to embrace freedom, adventure, and change — and to help others break free from limitations.',
    6:  'Your destiny is to serve, nurture, and heal. Family, community, and beauty are central to your purpose.',
    7:  'Your destiny is to seek truth and spiritual wisdom. Research, introspection, and spiritual practice define your path.',
    8:  'Your destiny is to achieve material success and use it to empower others. Abundance and authority are your birthright.',
    9:  'Your destiny is to serve humanity and leave the world better than you found it. Compassion is your greatest power.',
    11: 'Your destiny is to inspire and uplift others through your heightened intuition and spiritual insight.',
    22: 'Your destiny is to build something that impacts the world at scale — an institution, movement, or lasting creation.',
    33: 'Your destiny is to be a master of compassion and healing — a living embodiment of service and inspired creativity.',
  }
  return map[n] || 'Your destiny holds a unique spiritual mission that will reveal itself through service.'
}

function interpretSoulUrge(n: number): string {
  const map: Record<number, string> = {
    1:  'Deep within, you crave independence, recognition, and the freedom to forge your own path.',
    2:  'At your core, you deeply desire love, partnership, and peaceful harmony in all relationships.',
    3:  'Your soul yearns for creative expression, joy, and the freedom to communicate your inner world.',
    4:  'Your heart craves security, stability, and the satisfaction of building something that endures.',
    5:  'Your soul is driven by an insatiable hunger for freedom, new experiences, and variety.',
    6:  'At your deepest level, you long to love and be loved, to nurture a family, and to create beauty.',
    7:  'Your soul seeks solitude, truth, and the deeper mysteries of existence.',
    8:  'Your inner drive is for power, success, and the ability to make a lasting impact in the world.',
    9:  'Your soul yearns to give, to heal, and to be part of something greater than yourself.',
    11: 'Your soul yearns for spiritual perfection and to be a channel for divine inspiration.',
    22: 'Your soul is driven by a massive vision to create something that transforms the material world.',
    33: 'Your soul longs to love without limit and to heal the world through pure, unconditional compassion.',
  }
  return map[n] || 'Your soul carries a unique longing that drives your deepest choices and relationships.'
}

export function calculateMobileNumber(mobileNumber: string, lifePathNumber: number) {
  const digits = mobileNumber.replace(/\D/g, '').slice(-10)
  const sum = digits.split('').reduce((acc, d) => acc + parseInt(d), 0)
  const mobileVibration = reduce(sum, false)

  const table = MOBILE_COMPAT[lifePathNumber]
  const compatibility = table
    ? table.compatible.includes(mobileVibration) ? 'High'
      : table.neutral.includes(mobileVibration) ? 'Medium'
      : 'Low'
    : Math.abs(mobileVibration - lifePathNumber) <= 2 ? 'High'
      : Math.abs(mobileVibration - lifePathNumber) <= 4 ? 'Medium' : 'Low'

  const seed = (mobileVibration * 7 + lifePathNumber * 13) % 100
  const score = compatibility === 'High'   ? 80 + (seed % 16)
              : compatibility === 'Medium' ? 55 + (seed % 20)
              :                              25 + (seed % 25)

  return {
    mobileVibration,
    lifePathNumber,
    compatibility,
    compatibilityScore: score,
    sumOfDigits: sum,
    analysis: getMobileAnalysis(mobileVibration, lifePathNumber, compatibility),
    recommendation: compatibility === 'Low'
      ? `Consider changing to a number that reduces to ${lifePathNumber} — your Life Path vibration.`
      : 'Your mobile number vibration supports your life path energy.',
  }
}

function getMobileAnalysis(mobile: number, lifePath: number, compat: string): string {
  if (compat === 'High') {
    return `Excellent! Your mobile number (vibration ${mobile}) is in strong harmony with your Life Path ${lifePath}. This number amplifies your natural abilities, attracts opportunities aligned with your destiny, and supports your personal growth journey.`
  } else if (compat === 'Medium') {
    return `Your mobile number (vibration ${mobile}) has moderate compatibility with your Life Path ${lifePath}. While not perfectly aligned, the energies are not opposing. Regular use is fine, but important calls benefit from timing with your lucky days.`
  } else {
    return `Your mobile number (vibration ${mobile}) creates some resistance with your Life Path ${lifePath}. This may subtly create obstacles or missed connections. Consider changing to a number that reduces to ${lifePath} for significantly better energy alignment.`
  }
}

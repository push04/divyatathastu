// Traditional reference data for the daily digest.
//
// The digest used to be entirely LLM-written, which produced correct-sounding
// but generic text that could have been sent on any day of any year. Everything
// here is classical reference material keyed to the *actual* panchang computed
// for the day, so the email says something true and specific about today.

export interface NakshatraProfile {
  name: string
  devanagari: string
  deity: string
  symbol: string
  lord: string
  gana: 'Deva' | 'Manushya' | 'Rakshasa'
  favours: string
  avoid: string
}

export const NAKSHATRA_PROFILES: Record<string, NakshatraProfile> = {
  'Ashwini': { name: 'Ashwini', devanagari: 'अश्विनी', deity: 'Ashwini Kumaras, physicians of the gods', symbol: 'Horse\'s head', lord: 'Ketu', gana: 'Deva', favours: 'starting treatment, travel, buying vehicles, anything needing speed', avoid: 'matters needing patience or slow deliberation' },
  'Bharani': { name: 'Bharani', devanagari: 'भरणी', deity: 'Yama, lord of dharma and death', symbol: 'Yoni', lord: 'Venus', gana: 'Manushya', favours: 'endings, clearing debts, severing what is finished', avoid: 'weddings, housewarming, new beginnings' },
  'Krittika': { name: 'Krittika', devanagari: 'कृत्तिका', deity: 'Agni, the fire', symbol: 'Blade or flame', lord: 'Sun', gana: 'Rakshasa', favours: 'cutting away, honest confrontation, fire rituals, surgery', avoid: 'delicate negotiations and anything needing softness' },
  'Rohini': { name: 'Rohini', devanagari: 'रोहिणी', deity: 'Brahma, the creator', symbol: 'Ox cart', lord: 'Moon', gana: 'Manushya', favours: 'planting, buying land, marriage, anything meant to grow and last', avoid: 'destructive or severing actions' },
  'Mrigashira': { name: 'Mrigashira', devanagari: 'मृगशिरा', deity: 'Soma, the moon nectar', symbol: 'Deer\'s head', lord: 'Mars', gana: 'Deva', favours: 'searching, research, travel, choosing between options', avoid: 'finalising anything you have not yet examined' },
  'Ardra': { name: 'Ardra', devanagari: 'आर्द्रा', deity: 'Rudra, the storm', symbol: 'Teardrop', lord: 'Rahu', gana: 'Manushya', favours: 'demolition, hard truths, breaking a pattern', avoid: 'weddings, journeys, new ventures' },
  'Punarvasu': { name: 'Punarvasu', devanagari: 'पुनर्वसु', deity: 'Aditi, the boundless mother', symbol: 'Quiver of arrows', lord: 'Jupiter', gana: 'Deva', favours: 'returning, restarting, reconciliation, coming home', avoid: 'anything requiring permanent severance' },
  'Pushya': { name: 'Pushya', devanagari: 'पुष्य', deity: 'Brihaspati, guru of the gods', symbol: 'Cow\'s udder', lord: 'Saturn', gana: 'Deva', favours: 'almost everything - the most auspicious nakshatra of all, especially learning and worship', avoid: 'marriage alone, by long tradition' },
  'Ashlesha': { name: 'Ashlesha', devanagari: 'आश्लेषा', deity: 'the Nagas, serpent spirits', symbol: 'Coiled serpent', lord: 'Mercury', gana: 'Rakshasa', favours: 'strategy, mantra siddhi, seeing through deception', avoid: 'trusting new acquaintances, signing without reading' },
  'Magha': { name: 'Magha', devanagari: 'मघा', deity: 'the Pitris, the ancestors', symbol: 'Royal throne', lord: 'Ketu', gana: 'Rakshasa', favours: 'ancestral rites, honouring elders, claiming inherited responsibility', avoid: 'starting something that ignores what came before' },
  'Purva Phalguni': { name: 'Purva Phalguni', devanagari: 'पूर्व फाल्गुनी', deity: 'Bhaga, god of delight and fortune', symbol: 'Front legs of a bed', lord: 'Venus', gana: 'Manushya', favours: 'marriage, celebration, rest, the arts, pleasure taken well', avoid: 'austerity and heavy labour' },
  'Uttara Phalguni': { name: 'Uttara Phalguni', devanagari: 'उत्तर फाल्गुनी', deity: 'Aryaman, god of contracts and patronage', symbol: 'Back legs of a bed', lord: 'Sun', gana: 'Manushya', favours: 'marriage, contracts, alliances, formal agreements', avoid: 'informal or undocumented arrangements' },
  'Hasta': { name: 'Hasta', devanagari: 'हस्त', deity: 'Savitr, the vivifying Sun', symbol: 'Open hand', lord: 'Moon', gana: 'Deva', favours: 'craft, handwork, healing by touch, anything made with the hands', avoid: 'work you cannot personally oversee' },
  'Chitra': { name: 'Chitra', devanagari: 'चित्रा', deity: 'Tvashtar, the divine architect', symbol: 'Bright jewel', lord: 'Mars', gana: 'Rakshasa', favours: 'design, architecture, jewellery, anything where appearance matters', avoid: 'accepting surfaces at face value' },
  'Swati': { name: 'Swati', devanagari: 'स्वाति', deity: 'Vayu, the wind', symbol: 'Young shoot in wind', lord: 'Rahu', gana: 'Deva', favours: 'trade, negotiation, independence, learning to bend without breaking', avoid: 'rigidity and forcing an outcome' },
  'Vishakha': { name: 'Vishakha', devanagari: 'विशाखा', deity: 'Indra and Agni', symbol: 'Triumphal arch', lord: 'Jupiter', gana: 'Rakshasa', favours: 'goal-setting, final pushes, competitive effort', avoid: 'starting what you cannot finish' },
  'Anuradha': { name: 'Anuradha', devanagari: 'अनुराधा', deity: 'Mitra, god of friendship', symbol: 'Lotus', lord: 'Saturn', gana: 'Deva', favours: 'friendship, devotion, group work, travel among strangers', avoid: 'acting alone when you could act together' },
  'Jyeshtha': { name: 'Jyeshtha', devanagari: 'ज्येष्ठा', deity: 'Indra, king of the gods', symbol: 'Circular amulet', lord: 'Mercury', gana: 'Rakshasa', favours: 'protection, taking authority, defending others', avoid: 'arrogance, and new undertakings' },
  'Moola': { name: 'Moola', devanagari: 'मूल', deity: 'Nirriti, goddess of dissolution', symbol: 'Tied bunch of roots', lord: 'Ketu', gana: 'Rakshasa', favours: 'getting to the root, research, renunciation, medicine', avoid: 'marriage, housewarming, and lending money' },
  'Purva Ashadha': { name: 'Purva Ashadha', devanagari: 'पूर्वाषाढ़ा', deity: 'Apas, the waters', symbol: 'Winnowing basket', lord: 'Venus', gana: 'Manushya', favours: 'declaring intent, purification, water rites, building confidence', avoid: 'accepting defeat prematurely' },
  'Uttara Ashadha': { name: 'Uttara Ashadha', devanagari: 'उत्तराषाढ़ा', deity: 'the Vishvadevas, universal gods', symbol: 'Elephant tusk', lord: 'Sun', gana: 'Manushya', favours: 'undertakings meant to endure, leadership, lasting victory', avoid: 'shortcuts and quick wins' },
  'Shravana': { name: 'Shravana', devanagari: 'श्रवण', deity: 'Vishnu, the preserver', symbol: 'Ear', lord: 'Moon', gana: 'Deva', favours: 'listening, study, receiving teaching, learning by hearing', avoid: 'speaking more than you listen' },
  'Dhanishtha': { name: 'Dhanishtha', devanagari: 'धनिष्ठा', deity: 'the eight Vasus', symbol: 'Drum', lord: 'Mars', gana: 'Rakshasa', favours: 'music, rhythm, wealth-building, group celebration', avoid: 'matters of the heart, traditionally' },
  'Shatabhisha': { name: 'Shatabhisha', devanagari: 'शतभिषा', deity: 'Varuna, lord of cosmic waters and oaths', symbol: 'Empty circle', lord: 'Rahu', gana: 'Rakshasa', favours: 'healing, secrets, solitude, breaking an addiction', avoid: 'crowds and public declarations' },
  'Purva Bhadrapada': { name: 'Purva Bhadrapada', devanagari: 'पूर्व भाद्रपदा', deity: 'Aja Ekapada, the one-footed goat', symbol: 'Front of a funeral cot', lord: 'Jupiter', gana: 'Manushya', favours: 'austerity, deep ritual, facing mortality honestly', avoid: 'comfort-seeking and celebration' },
  'Uttara Bhadrapada': { name: 'Uttara Bhadrapada', devanagari: 'उत्तर भाद्रपदा', deity: 'Ahir Budhnya, serpent of the deep', symbol: 'Back of a funeral cot', lord: 'Saturn', gana: 'Manushya', favours: 'depth, patience, charity, quiet endurance', avoid: 'haste and shallow effort' },
  'Revati': { name: 'Revati', devanagari: 'रेवती', deity: 'Pushan, protector of travellers', symbol: 'Fish', lord: 'Mercury', gana: 'Deva', favours: 'journeys, completion, nourishing others, safe arrival', avoid: 'beginning what should have begun long ago' },
}

export const TITHI_MEANING: Record<string, string> = {
  'Pratipada': 'the first lunar day - for beginnings that need no fanfare',
  'Dwitiya': 'good for laying foundations and for building trust',
  'Tritiya': 'auspicious for most undertakings, especially artistic ones',
  'Chaturthi': 'ruled by Ganesha - for removing obstacles, not for launching',
  'Panchami': 'favourable for learning, medicine and wealth matters',
  'Shashthi': 'for strength and confrontation; avoid soft negotiations',
  'Saptami': 'excellent for travel and for beginning a course of study',
  'Ashtami': 'a testing tithi - avoid new ventures, good for sadhana',
  'Navami': 'fierce and Durga-ruled; act decisively or not at all',
  'Dashami': 'steady and virtuous - among the best for ordinary work',
  'Ekadashi': 'the fasting day - for restraint, japa and inner work',
  'Dwadashi': 'for charity, feeding others and breaking a fast well',
  'Trayodashi': 'favourable for friendship, romance and celebration',
  'Chaturdashi': 'intense; suited to fierce deities and to endings',
  'Purnima/Amavasya': 'full or new moon - the emotional extremes of the month, for ritual rather than routine',
}

export interface SanskritTerm {
  term: string
  devanagari: string
  literal: string
  meaning: string
  source: string
}

// Rotated by day so the digest teaches a new word each time it goes out.
export const SANSKRIT_TERMS: SanskritTerm[] = [
  { term: 'Ṛta', devanagari: 'ऋत', literal: 'that which is fitted together', meaning: 'The natural order that holds the cosmos, the seasons and moral life in one pattern. Dharma is the human share of it.', source: 'Ṛgveda' },
  { term: 'Śraddhā', devanagari: 'श्रद्धा', literal: 'to place (dhā) one\'s heart (śrat)', meaning: 'Not belief in a claim, but the willingness to place your heart somewhere long enough to find out. It is where practice begins, not where it ends.', source: 'Bhagavad Gītā 17.3' },
  { term: 'Abhyāsa', devanagari: 'अभ्यास', literal: 'to throw oneself toward, repeatedly', meaning: 'Sustained practice. Patanjali pairs it with vairāgya - effort and non-attachment together, because either one alone fails.', source: 'Yoga Sūtra 1.12' },
  { term: 'Vairāgya', devanagari: 'वैराग्य', literal: 'without colouring', meaning: 'Non-attachment: the mind no longer takes the colour of whatever it touches. It is clarity, not coldness.', source: 'Yoga Sūtra 1.15' },
  { term: 'Saṃskāra', devanagari: 'संस्कार', literal: 'well-made, put together', meaning: 'The groove an action leaves in the mind. Every repetition deepens it, which is why practice works and why habit binds.', source: 'Yoga Sūtra 1.18' },
  { term: 'Viveka', devanagari: 'विवेक', literal: 'separating apart', meaning: 'Discernment - the ability to tell the real from the merely convincing. The single faculty Vedanta asks you to develop first.', source: 'Vivekacūḍāmaṇi' },
  { term: 'Titikṣā', devanagari: 'तितिक्षा', literal: 'the wish to endure', meaning: 'Forbearance: bearing what cannot be changed without complaint and without being hardened by it.', source: 'Vivekacūḍāmaṇi 24' },
  { term: 'Ānanda', devanagari: 'आनन्द', literal: 'un-split delight', meaning: 'Not pleasure, which depends on an object, but the fullness that remains when nothing is added or taken away.', source: 'Taittirīya Upaniṣad' },
  { term: 'Ahiṃsā', devanagari: 'अहिंसा', literal: 'absence of the wish to harm', meaning: 'The first yama. Stated negatively on purpose - it asks you to remove an impulse rather than perform an act.', source: 'Yoga Sūtra 2.30' },
  { term: 'Santoṣa', devanagari: 'संतोष', literal: 'complete satisfaction', meaning: 'Contentment with what is at hand. Patanjali promises it yields unsurpassed happiness - the only niyama given so large a result.', source: 'Yoga Sūtra 2.42' },
  { term: 'Prāṇa', devanagari: 'प्राण', literal: 'forward-moving breath', meaning: 'The life-force carried on the breath. Prāṇāyāma is not breath-holding but the extension and steadying of this current.', source: 'Praśna Upaniṣad' },
  { term: 'Muhūrta', devanagari: 'मुहूर्त', literal: 'a moment', meaning: 'A unit of roughly 48 minutes - one thirtieth of a day. Choosing the right muhūrta is the practical heart of Vedic timing.', source: 'Muhūrta Cintāmaṇi' },
  { term: 'Gochara', devanagari: 'गोचर', literal: 'the movement of cattle, hence the field they range over', meaning: 'Planetary transit - where the grahas are moving now, read against where they stood at your birth.', source: 'Bṛhat Saṃhitā' },
  { term: 'Upāya', devanagari: 'उपाय', literal: 'a means of approach', meaning: 'A remedy. Classical jyotisha treats remedies as skilful means, not bribes - they change the person meeting the karma.', source: 'Bṛhat Parāśara Horā Śāstra' },
  { term: 'Sādhanā', devanagari: 'साधना', literal: 'the means of accomplishing', meaning: 'Disciplined practice aimed at a result. The word contains no promise of ease - only of method.', source: 'Tantric tradition' },
  { term: 'Kṣamā', devanagari: 'क्षमा', literal: 'the capacity to bear', meaning: 'Forgiveness understood as strength rather than concession - the earth itself is called Kṣamā for what it carries without protest.', source: 'Manusmṛti' },
]

/** Deterministic rotation so a given day always teaches the same term. */
export function termForDate(date: Date): SanskritTerm {
  const days = Math.floor(date.getTime() / 86_400_000)
  return SANSKRIT_TERMS[days % SANSKRIT_TERMS.length]
}

/**
 * Language configuration for MahaTathastu.
 *
 * `ready: true` languages have a full core dictionary. Anything else is listed
 * in the selector as coming soon rather than shipping a half-translated page.
 */

export type Lang = 'en' | 'hi' | 'gu' | 'mr' | 'ta' | 'bn' | 'te' | 'kn' | 'ml' | 'pa'

export interface LanguageMeta {
  code: Lang
  /** Name in the language itself - always how we present it to the user. */
  native: string
  /** English name, for the secondary line in the selector. */
  english: string
  ready: boolean
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', native: 'English',   english: 'English',   ready: true },
  { code: 'hi', native: 'हिन्दी',      english: 'Hindi',     ready: true },
  { code: 'gu', native: 'ગુજરાતી',    english: 'Gujarati',  ready: true },
  { code: 'mr', native: 'मराठी',      english: 'Marathi',   ready: true },
  { code: 'ta', native: 'தமிழ்',      english: 'Tamil',     ready: true },
  { code: 'bn', native: 'বাংলা',       english: 'Bengali',   ready: true },
  { code: 'te', native: 'తెలుగు',      english: 'Telugu',    ready: false },
  { code: 'kn', native: 'ಕನ್ನಡ',       english: 'Kannada',   ready: false },
  { code: 'ml', native: 'മലയാളം',    english: 'Malayalam', ready: false },
  { code: 'pa', native: 'ਪੰਜਾਬੀ',      english: 'Punjabi',   ready: false },
]

export const READY_LANGUAGES = LANGUAGES.filter(l => l.ready)
export const DEFAULT_LANG: Lang = 'en'
export const LANG_STORAGE_KEY = 'dt_lang'
/** Set once the user has answered the "use your local language?" prompt. */
export const LANG_PROMPT_KEY = 'dt_lang_prompted'

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && LANGUAGES.some(l => l.code === v)
}

export function langMeta(code: Lang): LanguageMeta {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0]
}

/**
 * Anchor points used to guess a visitor's regional language from coordinates.
 * Nearest anchor wins. This is deliberately a suggestion, never a silent switch -
 * India's linguistic map does not respect city boundaries and we always ask first.
 */
interface Anchor { lat: number; lng: number; lang: Lang; region: string }

const ANCHORS: Anchor[] = [
  // Hindi belt
  { lat: 28.6139, lng: 77.2090, lang: 'hi', region: 'Delhi' },
  { lat: 26.8467, lng: 80.9462, lang: 'hi', region: 'Uttar Pradesh' },
  { lat: 26.9124, lng: 75.7873, lang: 'hi', region: 'Rajasthan' },
  { lat: 25.5941, lng: 85.1376, lang: 'hi', region: 'Bihar' },
  { lat: 23.2599, lng: 77.4126, lang: 'hi', region: 'Madhya Pradesh' },
  { lat: 25.3176, lng: 82.9739, lang: 'hi', region: 'Varanasi' },
  { lat: 30.3165, lng: 78.0322, lang: 'hi', region: 'Uttarakhand' },
  { lat: 29.0588, lng: 76.0856, lang: 'hi', region: 'Haryana' },
  { lat: 23.2599, lng: 84.8700, lang: 'hi', region: 'Jharkhand' },
  { lat: 21.2514, lng: 81.6296, lang: 'hi', region: 'Chhattisgarh' },

  // Gujarati
  { lat: 23.0225, lng: 72.5714, lang: 'gu', region: 'Ahmedabad' },
  { lat: 21.1702, lng: 72.8311, lang: 'gu', region: 'Surat' },
  { lat: 22.3072, lng: 73.1812, lang: 'gu', region: 'Vadodara' },
  { lat: 22.4707, lng: 70.0577, lang: 'gu', region: 'Rajkot' },

  // Marathi
  { lat: 19.0760, lng: 72.8777, lang: 'mr', region: 'Mumbai' },
  { lat: 18.5204, lng: 73.8567, lang: 'mr', region: 'Pune' },
  { lat: 21.1458, lng: 79.0882, lang: 'mr', region: 'Nagpur' },
  { lat: 19.9975, lng: 73.7898, lang: 'mr', region: 'Nashik' },

  // Tamil
  { lat: 13.0827, lng: 80.2707, lang: 'ta', region: 'Chennai' },
  { lat: 11.0168, lng: 76.9558, lang: 'ta', region: 'Coimbatore' },
  { lat: 9.9252,  lng: 78.1198, lang: 'ta', region: 'Madurai' },

  // Bengali
  { lat: 22.5726, lng: 88.3639, lang: 'bn', region: 'Kolkata' },
  { lat: 23.6850, lng: 90.3563, lang: 'bn', region: 'Bengal' },
  { lat: 26.7271, lng: 88.3953, lang: 'bn', region: 'North Bengal' },

  // Not yet translated, but still worth recognising so we do not mis-suggest
  { lat: 17.3850, lng: 78.4867, lang: 'te', region: 'Hyderabad' },
  { lat: 16.5062, lng: 80.6480, lang: 'te', region: 'Andhra Pradesh' },
  { lat: 12.9716, lng: 77.5946, lang: 'kn', region: 'Bengaluru' },
  { lat: 15.3647, lng: 75.1240, lang: 'kn', region: 'Karnataka' },
  { lat: 9.9312,  lng: 76.2673, lang: 'ml', region: 'Kochi' },
  { lat: 8.5241,  lng: 76.9366, lang: 'ml', region: 'Thiruvananthapuram' },
  { lat: 31.6340, lng: 74.8723, lang: 'pa', region: 'Amritsar' },
  { lat: 30.7333, lng: 76.7794, lang: 'pa', region: 'Chandigarh' },
]

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export interface LangSuggestion {
  lang: Lang
  region: string
  /** False when the nearest anchor's language has no dictionary yet. */
  ready: boolean
}

/**
 * Best-guess regional language for a coordinate. Returns null when the visitor
 * is far outside our anchor set (roughly, outside the subcontinent) so we do not
 * suggest Hindi to someone in Toronto.
 */
export function suggestLanguageForCoords(lat: number, lng: number): LangSuggestion | null {
  let best: Anchor | null = null
  let bestDist = Infinity

  for (const a of ANCHORS) {
    const d = haversineKm(lat, lng, a.lat, a.lng)
    if (d < bestDist) {
      bestDist = d
      best = a
    }
  }

  if (!best || bestDist > 700) return null
  return { lang: best.lang, region: best.region, ready: langMeta(best.lang).ready }
}

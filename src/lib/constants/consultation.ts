/**
 * Single source of truth for consultation slots and pricing.
 *
 * Before this file existed, three places disagreed about what a consultation
 * costs: the admin panel wrote `price` onto slot rows, the booking API had
 * hardcoded ₹11,000 / ₹21,000 / ₹35,000 fallbacks, and the user-facing page
 * defaulted any slot with no DB row to ₹0 ("Complimentary"). A seeker could be
 * shown "Book Now - Complimentary" and then be charged ₹11,000 at Razorpay.
 *
 * Everything price-related now resolves through `resolveSlotPrice` below.
 */

export const PREDEFINED_SLOTS = [
  { start: '17:00', end: '17:45' },
  { start: '17:45', end: '18:30' },
  { start: '18:30', end: '19:15' },
  { start: '19:15', end: '20:00' },
  { start: '20:00', end: '20:45' },
  { start: '20:45', end: '21:30' },
  { start: '21:30', end: '22:15' },
  { start: '22:15', end: '23:00' },
] as const

/** Specializations a seeker can book. Order drives the filter chips. */
export const SPECIALIZATIONS = [
  'Astrology',
  'Numerology',
  'Vastu',
  'Astro Vastu',
  'Ayurveda',
  'Tarot',
  'Meditation',
] as const

export type Specialization = (typeof SPECIALIZATIONS)[number]

export const DEFAULT_SPECIALIZATION: Specialization = 'Astrology'

/** Key in the `settings` table holding the admin-editable price map. */
export const CONSULTATION_PRICING_KEY = 'consultation_pricing'

/**
 * Seed prices, used only when the admin has never saved a pricing config.
 * These match the values that used to be hardcoded in the booking route so
 * existing behaviour is preserved on first deploy.
 */
export const DEFAULT_CONSULTATION_PRICING: Record<string, number> = {
  Astrology: 11000,
  Numerology: 11000,
  Vastu: 21000,
  'Astro Vastu': 35000,
  Ayurveda: 11000,
  Tarot: 11000,
  Meditation: 11000,
}

export type ConsultationPricing = Record<string, number>

/**
 * Coerce a price-ish value to a number, or null if it does not represent one.
 *
 * Two traps this closes:
 *  - `Number('')` is 0, so a blank field would silently price something at ₹0.
 *    Blank/whitespace must be "no value", never "free".
 *  - Postgres `DECIMAL(10,2)` can arrive as the string "11000.00" depending on
 *    the driver. A plain `typeof x === 'number'` test would reject a perfectly
 *    valid price and fall through to the default, hiding an admin's override.
 */
export function toPrice(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return null
    const n = Number(trimmed)
    return Number.isFinite(n) && n >= 0 ? n : null
  }
  return null
}

/** Normalise whatever came out of the settings row into a usable price map. */
export function normalizePricing(raw: unknown): ConsultationPricing {
  const out: ConsultationPricing = { ...DEFAULT_CONSULTATION_PRICING }
  if (raw && typeof raw === 'object') {
    for (const spec of SPECIALIZATIONS) {
      // A configured 0 is meaningful (admin wants this specialization free);
      // only a genuinely absent/invalid value keeps the seed default.
      const n = toPrice((raw as Record<string, unknown>)[spec])
      if (n !== null) out[spec] = n
    }
  }
  return out
}

/**
 * The one function that decides what a slot costs.
 *
 * A slot row's own `price` wins when it is set - that is the admin overriding
 * a specific slot. `null`/`undefined` means "not overridden", and falls back to
 * the specialization default. Note the `??`: a stored price of 0 is an
 * intentional free slot and must NOT fall through to the default.
 */
export function resolveSlotPrice(
  slotPrice: number | string | null | undefined,
  specialization: string | null | undefined,
  pricing: ConsultationPricing
): number {
  const own = toPrice(slotPrice)
  if (own !== null) return own

  const spec = specialization || DEFAULT_SPECIALIZATION

  // 1. What the admin configured for this specialization.
  const configured = toPrice(pricing[spec])
  if (configured !== null) return configured

  // 2. The seed price for THIS specialization. Falling straight through to
  //    Astrology here would quietly bill a ₹21,000 Vastu session at ₹11,000
  //    whenever the configured map was incomplete.
  const seeded = toPrice(DEFAULT_CONSULTATION_PRICING[spec])
  if (seeded !== null) return seeded

  // 3. Genuinely unknown specialization. Never silently return 0 - a 0 the
  //    admin did not choose is exactly the bug this module exists to prevent.
  return DEFAULT_CONSULTATION_PRICING[DEFAULT_SPECIALIZATION]
}

export function isValidSpecialization(s: unknown): s is Specialization {
  return typeof s === 'string' && (SPECIALIZATIONS as readonly string[]).includes(s)
}

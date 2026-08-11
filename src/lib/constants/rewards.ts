/**
 * Reward programme constants — shared by the API routes and the UI so the
 * numbers a seeker is promised are the numbers the server actually applies.
 */

// ── Review reward ──────────────────────────────────────────────────────────
export const REVIEW_COUPON_PERCENT = 10
export const REVIEW_COUPON_VALID_DAYS = 90
export const REVIEW_MIN_BODY_LENGTH = 30

export const SUBJECT_TYPES = [
  'report',
  'service',
  'course',
  'consultation',
  'product',
  'ebook',
  'platform',
] as const

export type SubjectType = (typeof SUBJECT_TYPES)[number]

export const SUBJECT_TYPE_LABELS: Record<SubjectType, string> = {
  report: 'A Tathastu Report',
  service: 'A Divine Service',
  course: 'A Course',
  consultation: 'An Expert Consultation',
  product: 'A Shop Product',
  ebook: 'An Ebook',
  platform: 'MahaTathastu overall',
}

// ── Referral reward ────────────────────────────────────────────────────────
/** Completed referrals needed for one free full report. */
export const REFERRAL_MILESTONE = 10

export const REFERRAL_REWARD_LABEL = 'A free Full Tathastu Report for one family member'

/**
 * Coupon codes are read off screenshots and typed by hand, so the alphabet
 * excludes characters that look alike (0/O, 1/I/L).
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function makeCouponCode(prefix: string): string {
  let s = ''
  for (let i = 0; i < 6; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return `${prefix}${s}`
}

/** Build the shareable referral URL for a code. */
export function referralLink(code: string, appUrl?: string): string {
  const base = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://www.mahatathastu.com'
  return `${base.replace(/\/$/, '')}/register?ref=${encodeURIComponent(code)}`
}

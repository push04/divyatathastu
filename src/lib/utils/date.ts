/**
 * Cross-browser date helpers.
 *
 * NOTE ON SAFARI: `new Date(new Date().toLocaleString('en-US', { timeZone }))`
 * works in Chrome but returns `Invalid Date` in Safari, because Safari's Date
 * parser rejects the `M/D/YYYY, h:mm:ss AM/PM` string that toLocaleString emits.
 * Always build Dates from numeric components (which every engine parses the
 * same way) instead of parsing localized strings.
 */

/**
 * Returns a Date whose *local* getters (getFullYear, getMonth, getDate,
 * getHours, ...) reflect the current wall-clock time in the given IANA time
 * zone. Reliable in Safari, Chrome and Firefox.
 */
export function nowInTimeZone(timeZone: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  const p: Record<string, string> = {}
  for (const { type, value } of parts) p[type] = value

  // Some engines emit hour '24' for midnight — normalize to '00'.
  const hour = p.hour === '24' ? '00' : p.hour

  return new Date(+p.year, +p.month - 1, +p.day, +hour, +p.minute, +p.second)
}

/** Current wall-clock time in India Standard Time (Asia/Kolkata). */
export function nowInIST(): Date {
  return nowInTimeZone('Asia/Kolkata')
}

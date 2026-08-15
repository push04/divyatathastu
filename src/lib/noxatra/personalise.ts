// Deterministic per-seeker variation.
//
// Every helper here is a pure function of the seeker's chart. The same birth
// data must always produce the same report - regenerating a report must never
// hand the seeker different advice than the copy they already paid for - so
// nothing in this file may use Math.random(), Date.now() or any ambient state.
//
// The purpose is to stop catalogue sections (chakra remedies, daily practices,
// yantras, parenting advice) from emitting an identical block of text to every
// seeker. Instead each seeker gets a subset and an ordering drawn from their
// own chart determinants.

/** FNV-1a over the string form of the parts. Stable across runs and platforms. */
export function seekerSignature(parts: Array<string | number | null | undefined>): number {
  let h = 0x811c9dc5
  const s = parts.map(p => (p == null ? '~' : String(p))).join('|')
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    // 32-bit FNV prime multiply, kept in range with Math.imul
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** A second, decorrelated stream from the same signature - so two different
 *  catalogues keyed off one seeker do not rotate in lockstep. */
export function mix(seed: number, salt: string | number): number {
  return seekerSignature([seed, salt])
}

/** Left-rotate so a different element leads. Renderers commonly show only the
 *  first one or two entries, so rotation alone changes what the seeker sees. */
export function rotate<T>(arr: readonly T[], seed: number): T[] {
  if (arr.length <= 1) return [...arr]
  const n = seed % arr.length
  return [...arr.slice(n), ...arr.slice(0, n)]
}

/** Deterministic distinct subset of `count` items, order also seeded.
 *  Uses a seeded Fisher-Yates so the choice is spread across the whole pool
 *  rather than always favouring the head of the array. */
export function pick<T>(arr: readonly T[], count: number, seed: number): T[] {
  const a = [...arr]
  let s = (seed >>> 0) || 1
  // xorshift32 - small, fast, and adequate for spreading a catalogue choice
  const next = () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return s
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = next() % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, Math.min(count, a.length))
}

/** Pick exactly one item, deterministically. */
export function one<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length]
}

/** Weighted ordering: items the seeker needs most come first. `weightOf`
 *  returns a priority; ties are broken by the seeded rotation so equal-weight
 *  items still differ between seekers. */
export function rankBy<T>(arr: readonly T[], seed: number, weightOf: (item: T) => number): T[] {
  return rotate(arr, seed)
    .map((item, i) => ({ item, w: weightOf(item), i }))
    .sort((a, b) => b.w - a.w || a.i - b.i)
    .map(x => x.item)
}

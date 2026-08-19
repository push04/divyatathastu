/**
 * Supabase Storage image transformation.
 *
 * Every image in the app was rendered from the raw
 * `/storage/v1/object/public/...` URL, which serves the original the admin
 * uploaded - product photos were coming down at 1-2 MB each into cards a few
 * hundred pixels wide. `/shop` alone pulled 40 images totalling ~8 MB.
 *
 * Supabase serves resized/re-encoded variants from
 * `/storage/v1/render/image/public/...` with `width`/`quality` query params, so
 * the fix is a URL shape change rather than a component rewrite. Non-Supabase
 * hosts (Unsplash) are passed through untouched, and anything already pointing
 * at `/render/image/` is left alone so this is safe to apply twice.
 */

/** Widths that match how the images are actually displayed. */
export const IMG = {
  thumb: 96,    // cart rows, admin list thumbnails
  card: 480,    // product / gallery / blog cards in a grid
  hero: 1024,   // detail modals, lightbox, banners
  full: 1600,   // full-bleed hero art
} as const

interface Opts {
  width?: number
  /** 20-100. Supabase defaults to 80; 70 is visually indistinguishable here. */
  quality?: number
  /** `cover` (default) crops to the box, `contain` letterboxes. */
  resize?: 'cover' | 'contain' | 'fill'
}

/**
 * Returns a transformed URL when the input is a Supabase Storage public URL,
 * and the input unchanged otherwise. Never throws - a bad URL falls back to
 * being rendered as-is rather than breaking the page.
 */
export function optimizeImage(url: string | null | undefined, opts: Opts = {}): string | null {
  if (!url || typeof url !== 'string') return null
  // Already transformed, a data/blob URI, or an SVG (which gains nothing and
  // can be mangled by re-encoding).
  if (url.includes('/render/image/')) return url
  if (url.startsWith('data:') || url.startsWith('blob:')) return url
  if (/\.svg($|\?)/i.test(url)) return url
  if (!url.includes('/storage/v1/object/public/')) return url

  const { width = IMG.card, quality = 70, resize } = opts
  const base = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
  const qs = new URLSearchParams()
  if (width) qs.set('width', String(Math.round(width)))
  qs.set('quality', String(Math.max(20, Math.min(100, Math.round(quality)))))
  if (resize) qs.set('resize', resize)
  return `${base}${base.includes('?') ? '&' : '?'}${qs}`
}

/**
 * Builds a `srcset` so a phone does not download the desktop-sized variant.
 * Returns undefined for non-Supabase URLs, which is a valid srcset value to
 * spread into JSX.
 */
export function imageSrcSet(url: string | null | undefined, widths: number[] = [320, 480, 768, 1024]): string | undefined {
  if (!url || !url.includes('/storage/v1/object/public/')) return undefined
  return widths.map(w => `${optimizeImage(url, { width: w })} ${w}w`).join(', ')
}

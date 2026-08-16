'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

import Icon from '@/components/ui/Icon'

interface Slide {
  id: string
  title: string | null
  caption: string | null
  image_url: string
  alt_text: string | null
  credit: string | null
  width: number | null
  height: number | null
}

const AUTOPLAY_MS = 5000

export default function GalleryCarousel() {
  const supabase = createClient()
  const [slides, setSlides] = useState<Slide[]>([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchX = useRef<number | null>(null)
  const region = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    supabase
      .from('gallery_items')
      .select('id,title,caption,image_url,alt_text,credit,width,height')
      // Both switches must be on. `is_published` is also enforced by RLS, so an
      // unpublished row is not merely hidden here - it is not returned at all.
      .eq('is_published', true)
      .eq('in_carousel', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => { if (data?.length) setSlides(data as Slide[]) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const count = slides.length
  const go = useCallback((n: number) => {
    if (!count) return
    setIndex(((n % count) + count) % count)
  }, [count])
  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])

  // Autoplay. Paused on hover, on focus within, when the tab is hidden, and for
  // anyone who has asked for reduced motion.
  useEffect(() => {
    if (count < 2 || paused) return
    const reduced = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    timer.current = setInterval(() => setIndex(i => (i + 1) % count), AUTOPLAY_MS)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [count, paused])

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Keyboard control, but only while the carousel actually has focus - a global
  // arrow-key listener would hijack ordinary page scrolling.
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); next() }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
  }

  function onTouchStart(e: React.TouchEvent) { touchX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 45) (dx < 0 ? next : prev)()
    touchX.current = null
  }

  // The entire section is absent unless an admin has published images AND
  // marked them for the carousel.
  if (!count) return null

  return (
    <section className="py-16 bg-[var(--warm-sand)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest uppercase font-semibold mb-2 text-[var(--terracotta)]"
             style={{ fontFamily: 'var(--font-label)' }}>
            Moments
          </p>
          <h2 className="text-3xl font-bold text-[var(--indigo-deep)]"
              style={{ fontFamily: 'var(--font-display)' }}>
            From Our Gallery
          </h2>
        </div>

        <div
          ref={region}
          role="region"
          aria-roledescription="carousel"
          aria-label="Gallery highlights"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="relative rounded-2xl overflow-hidden shadow-lg bg-black/5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-300)]"
        >
          {/* Track. Translating a flex row keeps all slides in the DOM so the
              browser can decode the neighbours before they are shown. */}
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((s, i) => (
              <div
                key={s.id}
                className="relative w-full shrink-0 aspect-[16/9] sm:aspect-[21/9]"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={i !== index}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image_url}
                  alt={s.alt_text || s.title || ''}
                  width={s.width ?? undefined}
                  height={s.height ?? undefined}
                  className="w-full h-full object-cover"
                  // The first slide is above the fold once this section is in
                  // view; the rest can wait.
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                {(s.title || s.caption) && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-5 sm:p-7">
                    {s.title && (
                      <h3 className="text-white font-bold text-lg sm:text-2xl"
                          style={{ fontFamily: 'var(--font-display)' }}>
                        {s.title}
                      </h3>
                    )}
                    {s.caption && (
                      <p className="text-white/85 text-sm sm:text-base mt-1 max-w-2xl line-clamp-2">
                        {s.caption}
                      </p>
                    )}
                    {s.credit && (
                      <p className="text-white/60 text-[11px] mt-1.5">{s.credit}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Manual controls - only worth rendering with more than one slide */}
          {count > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-[var(--indigo-deep)] flex items-center justify-center shadow transition-colors"
              >
                <Icon name="chevron_left" size={22} />
              </button>
              <button
                onClick={next}
                aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-[var(--indigo-deep)] flex items-center justify-center shadow transition-colors"
              >
                <Icon name="chevron_right" size={22} />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => go(i)}
                    aria-label={`Go to image ${i + 1}`}
                    aria-current={i === index}
                    className={`rounded-full transition-all ${
                      i === index ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/55 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-7">
          <Link href="/gallery" className="btn-divine text-sm px-6 py-2.5 inline-flex items-center gap-2">
            <Icon name="photo_library" size={16} />
            View full gallery
          </Link>
        </div>
      </div>
    </section>
  )
}

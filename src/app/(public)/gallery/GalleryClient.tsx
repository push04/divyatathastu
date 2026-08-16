'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import Icon from '@/components/ui/Icon'

interface Item {
  id: string
  title: string | null
  caption: string | null
  category: string
  image_url: string
  alt_text: string | null
  credit: string | null
  taken_at: string | null
  width: number | null
  height: number | null
}

export default function GalleryClient() {
  const supabase = createClient()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('all')
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    supabase
      .from('gallery_items')
      .select('id,title,caption,category,image_url,alt_text,credit,taken_at,width,height')
      // RLS already restricts this to published rows; the filter is explicit so
      // the intent is readable from the query alone.
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data as Item[])
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Only offer filters for categories that actually have published images.
  const categories = useMemo(() => {
    const seen = new Map<string, number>()
    for (const i of items) seen.set(i.category, (seen.get(i.category) || 0) + 1)
    return [...seen.entries()].sort((a, b) => b[1] - a[1])
  }, [items])

  const shown = useMemo(
    () => (cat === 'all' ? items : items.filter(i => i.category === cat)),
    [items, cat]
  )

  const close = useCallback(() => setLightbox(null), [])
  const step = useCallback((d: number) => {
    setLightbox(cur => {
      if (cur === null || !shown.length) return cur
      return ((cur + d) % shown.length + shown.length) % shown.length
    })
  }, [shown.length])

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    // Stop the page behind the lightbox from scrolling with it open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [lightbox, close, step])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-black/5 animate-pulse" />
        ))}
      </div>
    )
  }

  // No published images means no gallery at all - not an empty grid.
  if (!items.length) {
    return (
      <div className="card-divine p-12 text-center">
        <Icon name="photo_library" size={44} className="text-[var(--text-muted)] mx-auto mb-3" />
        <p className="font-semibold text-[var(--indigo-deep)]">The gallery is being prepared</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Please check back shortly.
        </p>
      </div>
    )
  }

  const active = lightbox !== null ? shown[lightbox] : null

  return (
    <>
      {categories.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setCat('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              cat === 'all'
                ? 'bg-[var(--indigo-deep)] text-white'
                : 'bg-white text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-gray-50'
            }`}
          >
            All ({items.length})
          </button>
          {categories.map(([c, n]) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                cat === c
                  ? 'bg-[var(--indigo-deep)] text-white'
                  : 'bg-white text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-gray-50'
              }`}
            >
              {c} ({n})
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {shown.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setLightbox(i)}
            className="group relative aspect-square rounded-xl overflow-hidden bg-black/5 focus-visible:ring-2 focus-visible:ring-[var(--gold-300)] outline-none"
            aria-label={`Open ${item.title || 'image'} full size`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={item.alt_text || item.title || ''}
              width={item.width ?? undefined}
              height={item.height ?? undefined}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {(item.title || item.caption) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity text-left">
                {item.title && <p className="text-white text-sm font-semibold line-clamp-1">{item.title}</p>}
                {item.caption && <p className="text-white/80 text-xs line-clamp-1">{item.caption}</p>}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={active.title || 'Gallery image'}
        >
          <button
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
          >
            <Icon name="close" size={20} />
          </button>

          {shown.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); step(-1) }}
                aria-label="Previous image"
                className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              >
                <Icon name="chevron_left" size={24} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); step(1) }}
                aria-label="Next image"
                className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
              >
                <Icon name="chevron_right" size={24} />
              </button>
            </>
          )}

          <figure className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.image_url}
              alt={active.alt_text || active.title || ''}
              className="w-full max-h-[75vh] object-contain rounded-lg"
            />
            {(active.title || active.caption || active.credit || active.taken_at) && (
              <figcaption className="text-center mt-4">
                {active.title && <p className="text-white font-semibold text-lg">{active.title}</p>}
                {active.caption && <p className="text-white/80 text-sm mt-1">{active.caption}</p>}
                <p className="text-white/50 text-xs mt-2">
                  {[
                    active.credit,
                    active.taken_at
                      ? new Date(active.taken_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })
                      : null,
                    shown.length > 1 ? `${(lightbox ?? 0) + 1} of ${shown.length}` : null,
                  ].filter(Boolean).join('  ·  ')}
                </p>
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  )
}

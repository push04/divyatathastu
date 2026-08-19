'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import Icon from '@/components/ui/Icon'
import { optimizeImage, imageSrcSet, IMG } from '@/lib/utils/image'

interface Feature {
  id: string
  outlet: string
  logo_text: string | null
  logo_url: string | null
  logo_color: string
  headline: string
  excerpt: string | null
  category: string
  article_url: string | null
  published_on: string | null
}

interface Award {
  id: string
  title: string
  organisation: string | null
  year: string | null
  icon: string
}

export default function MediaClient() {
  const supabase = createClient()
  const [features, setFeatures] = useState<Feature[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('media_features')
        .select('id,outlet,logo_text,logo_url,logo_color,headline,excerpt,category,article_url,published_on')
        .eq('is_published', true)
        .order('display_order', { ascending: true })
        .order('published_on', { ascending: false, nullsFirst: false }),
      supabase.from('media_awards')
        .select('id,title,organisation,year,icon')
        .eq('is_published', true)
        .order('display_order', { ascending: true }),
    ]).then(([f, a]) => {
      if (f.data) setFeatures(f.data as Feature[])
      if (a.data) setAwards(a.data as Award[])
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-divine p-5 h-40 animate-pulse bg-black/5" />
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Featured coverage. Absent entirely until an admin publishes an entry -
          the page previously shipped six invented press articles. */}
      {features.length > 0 ? (
        <>
          <h2 className="text-2xl font-bold text-[var(--indigo-deep)] mb-6"
              style={{ fontFamily: 'var(--font-display)' }}>
            Featured Coverage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map(item => (
              <div key={item.id} className="card-divine p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={optimizeImage(item.logo_url, { width: IMG.thumb })!} loading="lazy" decoding="async" alt={item.outlet}
                           className="w-10 h-10 rounded-lg object-contain bg-white border border-[var(--border-subtle)]" />
                    ) : (
                      <div className={`w-10 h-10 rounded-lg ${item.logo_color} flex items-center justify-center text-white font-bold text-xs`}>
                        {item.logo_text || item.outlet.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-[var(--indigo-deep)]">{item.outlet}</p>
                      {item.published_on && (
                        <p className="text-xs text-[var(--text-muted)]">
                          {new Date(item.published_on).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs bg-[var(--warm-sand)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                </div>
                <h3 className="font-bold text-[var(--indigo-deep)] leading-snug text-base"
                    style={{ fontFamily: 'var(--font-display)' }}>
                  {item.headline}
                </h3>
                {item.excerpt && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.excerpt}</p>
                )}
                {item.article_url && (
                  <a href={item.article_url} target="_blank" rel="noopener noreferrer"
                     className="text-xs text-[var(--indigo-deep)] font-medium hover:underline text-left mt-auto flex items-center gap-1">
                    Read full article <Icon name="arrow_forward" size={13} style={{ verticalAlign: 'middle' }} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="card-divine p-12 text-center">
          <Icon name="newspaper" size={44} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="font-semibold text-[var(--indigo-deep)]">Coverage is being compiled</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Press features will appear here as they are published.
          </p>
        </div>
      )}

      {awards.length > 0 && (
        <div className="mt-14">
          <h2 className="text-2xl font-bold text-[var(--indigo-deep)] mb-6 text-center">
            Awards &amp; Recognition
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {awards.map(a => (
              <div key={a.id}
                   className="flex items-center gap-4 p-4 border border-[var(--warm-sand)] rounded-xl bg-[var(--kutch-white)]">
                <Icon name={a.icon} size={36} className="text-[var(--saffron)]" />
                <div>
                  <p className="font-bold text-[var(--indigo-deep)]">{a.title}</p>
                  {a.organisation && <p className="text-sm text-[var(--text-secondary)]">{a.organisation}</p>}
                  {a.year && <p className="text-xs text-[var(--text-muted)] mt-0.5">{a.year}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

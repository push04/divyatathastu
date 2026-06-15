'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SudarshanLoader from '@/components/SudarshanLoader'

interface Purchase {
  id: string
  download_count: number
  max_downloads: number
  purchased_at: string
  ebooks: {
    id: string
    title: string
    author: string | null
    description: string | null
    file_url: string
    language: string | null
    tags: string[]
  } | null
}

const TAG_ICONS: Record<string, string> = {
  astrology: 'brightness_7', chakra: 'spa', numerology: 'tag',
  vastu: 'house', mantra: 'mic', ayurveda: 'eco', default: 'menu_book',
}

function coverIcon(tags: string[]): string {
  for (const tag of tags) {
    const key = Object.keys(TAG_ICONS).find(k => tag.toLowerCase().includes(k))
    if (key) return TAG_ICONS[key]
  }
  return TAG_ICONS.default
}

export default function MyLibraryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [active, setActive] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('ebook_purchases')
        .select('id,download_count,max_downloads,purchased_at,ebooks(id,title,author,description,file_url,language,tags)')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false })
      const rows = (data || []) as unknown as Purchase[]
      setPurchases(rows)
      if (rows.length > 0) setActive(rows[0])
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openReader(ebookId: string) {
    router.push(`/my-library/${ebookId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SudarshanLoader size="lg" />
      </div>
    )
  }

  if (purchases.length === 0) {
    return (
      <div className="p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)]">My Ebook Library</h1>
          <Link href="/shop?category=ebook" className="btn-divine text-sm">Browse Ebooks</Link>
        </div>
        <div className="card-divine p-16 text-center">
          <span className="material-symbols-outlined text-[64px] text-[var(--warm-sand)] block mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
          <h2 className="text-xl font-semibold text-[var(--indigo-deep)] mb-2">No ebooks yet</h2>
          <p className="text-sm text-[var(--warm-charcoal)]/60 mb-6">Purchase an ebook from the store to start reading.</p>
          <Link href="/shop?category=ebook" className="btn-divine text-sm">Browse Ebooks</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)]">My Ebook Library</h1>
          <p className="text-sm text-[var(--warm-charcoal)]/60">{purchases.length} book{purchases.length !== 1 ? 's' : ''} purchased</p>
        </div>
        <Link href="/shop?category=ebook" className="btn-divine text-sm">Browse More</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Book list */}
        <div className="lg:col-span-1 space-y-3">
          {purchases.map(p => {
            const ebook = p.ebooks
            if (!ebook) return null
            const tags: string[] = Array.isArray(ebook.tags) ? ebook.tags : []
            const icon = coverIcon(tags)
            return (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${active?.id === p.id ? 'border-[var(--indigo-deep)] bg-[var(--indigo-deep)]/5' : 'border-[var(--warm-sand)] bg-white hover:border-[var(--indigo-deep)]/40'}`}
              >
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-12 rounded-lg bg-gradient-to-br from-[var(--saffron)] to-[var(--indigo-deep)] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--indigo-deep)] leading-snug line-clamp-2">{ebook.title}</p>
                    <p className="text-xs text-[var(--warm-charcoal)]/50 mt-0.5">{ebook.author || 'MahaTathastu'}</p>
                    <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'rgba(28,30,74,0.4)' }}>
                      <span className="material-symbols-outlined text-[11px]">lock</span>
                      View-only
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail panel */}
        {active?.ebooks && (
          <div className="lg:col-span-2 card-divine p-6">
            {(() => {
              const ebook = active.ebooks!
              const tags: string[] = Array.isArray(ebook.tags) ? ebook.tags : []
              const icon = coverIcon(tags)
              return (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-[var(--saffron)] to-[var(--indigo-deep)] flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="material-symbols-outlined text-[36px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[var(--indigo-deep)]">{ebook.title}</h2>
                      <p className="text-sm text-[var(--warm-charcoal)]/60">by {ebook.author || 'MahaTathastu'}</p>
                      {ebook.language && (
                        <span className="text-xs bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 px-2 py-0.5 rounded-full mt-1 inline-block">{ebook.language}</span>
                      )}
                    </div>
                  </div>

                  {ebook.description && (
                    <p className="text-sm text-[var(--warm-charcoal)]/60 leading-relaxed mb-6">{ebook.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-[var(--kutch-white)] rounded-lg">
                      <p className="text-sm font-bold text-[var(--indigo-deep)]">{new Date(active.purchased_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs text-[var(--warm-charcoal)]/50">Purchased On</p>
                    </div>
                    <div className="text-center p-3 bg-[var(--kutch-white)] rounded-lg">
                      <p className="text-2xl font-bold text-[var(--indigo-deep)]">{active.download_count}</p>
                      <p className="text-xs text-[var(--warm-charcoal)]/50">Sessions</p>
                    </div>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {tags.map((tag: string) => (
                        <span key={tag} className="text-xs bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 px-2 py-0.5 rounded-full capitalize">{tag.replace(/-/g, ' ')}</span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => openReader(ebook.id)}
                    className="btn-divine w-full py-3 inline-flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                    Read Book
                  </button>
                  <p className="text-xs text-center text-[var(--warm-charcoal)]/40 mt-2 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    View-only · No download · Protected
                  </p>
                </>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

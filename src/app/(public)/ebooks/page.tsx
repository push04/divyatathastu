import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { EbookCard } from './EbookCardClient'

export const metadata: Metadata = {
  title: 'Ebooks | DivyaTathastu — Vedic Wisdom Library',
  description: 'Download premium ebooks on Vedic astrology, numerology, Vastu, meditation and spiritual sciences.',
}
export const revalidate = 3600

const FALLBACK_EBOOKS = [
  { id: '1', title: 'Complete Guide to Vedic Astrology', author: 'Dr. Rajesh Sharma', price: 299, original_price: 599, pages: 312, category: 'Astrology', description: 'Master the ancient science of Jyotish. Covers all 12 rashis, 9 grahas, 27 nakshatras, dashas and yogas with practical examples.', bestseller: true, rating: 4.8, reviews: 1247 },
  { id: '2', title: 'Numerology: Your Numbers Tell Your Story', author: 'Kavita Jain', price: 199, original_price: 399, pages: 186, category: 'Numerology', description: 'Unlock the power of your birth number, life path, destiny and soul urge numbers. Includes name correction formulas.', bestseller: false, rating: 4.6, reviews: 892 },
  { id: '3', title: 'Vastu Shastra for Modern Homes', author: 'Ar. Priya Vastu', price: 349, original_price: 699, pages: 248, category: 'Vastu', description: 'Transform your living space using ancient Vastu principles. Room-by-room guide with apartment adaptations.', bestseller: true, rating: 4.9, reviews: 2103 },
  { id: '4', title: '108 Mantras for Daily Practice', author: 'Swami Ananda', price: 149, original_price: 299, pages: 124, category: 'Spiritual', description: 'Curated collection of 108 powerful mantras with meaning, pronunciation guide, benefits and recommended practice times.', bestseller: false, rating: 4.7, reviews: 1567 },
  { id: '5', title: 'Chakra Healing: The Complete Manual', author: 'Dr. Meera Patel', price: 399, original_price: 799, pages: 356, category: 'Wellness', description: 'Deep dive into all 7 chakras — anatomy, imbalances, healing techniques, yoga poses, crystals and affirmations.', bestseller: false, rating: 4.5, reviews: 743 },
  { id: '6', title: 'Panchang & Muhurta: Auspicious Timing', author: 'Jyotishi Mohan Das', price: 249, original_price: 499, pages: 198, category: 'Astrology', description: 'Learn to read the Panchang and select auspicious muhurtas for marriage, business, travel and important decisions.', bestseller: false, rating: 4.7, reviews: 621 },
  { id: '7', title: 'Rudraksha & Gemstone Therapy', author: 'Gemologist Arjun Singh', price: 199, original_price: 399, pages: 156, category: 'Spiritual', description: 'Complete guide to selecting, energizing and wearing rudraksha beads and gemstones as per your kundli.', bestseller: false, rating: 4.4, reviews: 489 },
  { id: '8', title: 'Sanatan Dharma: Festivals & Rituals', author: 'Acharya Deepak Shastri', price: 0, original_price: 0, pages: 88, category: 'Spiritual', description: 'Free ebook covering 24 major Hindu festivals, their significance, puja vidhi and stories. A gift for every devotee.', bestseller: false, rating: 4.9, reviews: 5432, free: true },
]

const DOT_GRID = `radial-gradient(circle, rgba(212,160,67,0.08) 1px, transparent 1px)`

export default async function EbooksPage() {
  let ebooks = FALLBACK_EBOOKS
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('ebooks').select('*').order('created_at', { ascending: false }).limit(20)
    if (data?.length) ebooks = data as any
  } catch {}

  const free = ebooks.filter((e: any) => e.price === 0 || e.free)
  const paid = ebooks.filter((e: any) => e.price > 0 && !e.free)

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section
        className="px-6 lg:px-12 flex items-end"
        style={{
          background: '#0F1628',
          backgroundImage: DOT_GRID,
          backgroundSize: '28px 28px',
          minHeight: '280px',
          paddingTop: '64px',
          paddingBottom: '48px',
        }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-block w-5 border-t border-[var(--saffron)]/40" style={{ borderTopWidth: '1px' }} />
                <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "'Sora', sans-serif", color: 'var(--saffron)' }}>
                  Digital Library
                </span>
              </div>
              <h1 className="text-white mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 'clamp(40px, 6vw, 64px)' }}>
                Vedic Wisdom Library
              </h1>
              <p className="max-w-lg mb-6" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.55)' }}>
                Premium ebooks on astrology, numerology, Vastu, meditation and Sanatan philosophy
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="rgba(255,255,255,0.4)" />
                  <input
                    type="text"
                    placeholder="Search books, topics, authors..."
                    className="pl-9 pr-4 py-2.5 text-sm outline-none"
                    style={{
                      width: '320px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: 'rgba(255,255,255,0.8)',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>
                {['All', 'Spiritual', 'Wellness', 'Astrology'].map(cat => (
                  <button
                    key={cat}
                    className="px-4 py-2 text-sm transition-colors"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                      color: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] whitespace-nowrap" style={{ fontFamily: "'Sora', sans-serif", color: 'rgba(255,255,255,0.3)' }}>
              12 Books · 4 Free Downloads · Updated Monthly
            </p>
          </div>
        </div>
      </section>

      {/* ── Free downloads ── */}
      {free.length > 0 && (
        <section className="py-12 px-6 lg:px-12 bg-[var(--kutch-white)]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="inline-block w-8 border-t-2 border-[var(--terracotta)]" />
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: 'var(--indigo-deep)', fontWeight: 600 }}>
                Free Downloads
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {free.map((book: any) => <EbookCard key={book.id} book={book} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Premium library ── */}
      <section className="py-12 px-6 lg:px-12 bg-[var(--kutch-white)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-block w-8 border-t-2 border-[var(--terracotta)]" />
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: 'var(--indigo-deep)', fontWeight: 600 }}>
              Premium Library
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paid.map((book: any) => <EbookCard key={book.id} book={book} />)}
          </div>
        </div>
      </section>

      {/* ── Library CTA ── */}
      <section className="py-8 px-6 bg-[var(--warm-sand)] text-center">
        <p className="text-sm mb-3" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(28,30,74,0.55)' }}>Already purchased?</p>
        <Link
          href="/my-library"
          className="inline-flex items-center font-semibold text-sm"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            background: 'var(--indigo-deep)',
            color: 'white',
            borderRadius: '8px',
            padding: '10px 24px',
          }}
        >
          Access My Library
        </Link>
      </section>

    </div>
  )
}

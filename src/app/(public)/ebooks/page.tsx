import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { EbookCard } from './EbookCardClient'

export const metadata: Metadata = {
  title: 'Ebooks | MahaTathastu - Vedic Wisdom Library',
  description: 'Download premium ebooks on Vedic astrology, numerology, Vastu, meditation and spiritual sciences.',
}
export const revalidate = 3600

function deriveCategory(text: string): string {
  const t = text.toLowerCase()
  if (/astrology|jyotish|kundli|panchang|nakshatra|rashi|graha|planet/.test(t)) return 'Astrology'
  if (/numerolog|number|life path/.test(t)) return 'Numerology'
  if (/vastu/.test(t)) return 'Vastu'
  if (/chakra/.test(t)) return 'Wellness'
  if (/ayurveda|prakriti|dosha|vata|pitta|kapha/.test(t)) return 'Wellness'
  return 'Spiritual'
}

function mapProduct(p: any) {
  const currentPrice = p.sale_price ?? p.price
  return {
    id: p.id,
    title: p.name,
    author: 'MahaTathastu',
    price: currentPrice,
    original_price: p.sale_price != null ? p.price : 0,
    pages: null as null,
    category: deriveCategory((p.name || '') + ' ' + (p.description || '')),
    description: p.description || '',
    bestseller: p.is_featured || false,
    rating: null as null,
    reviews: null as null,
    free: currentPrice === 0,
    slug: p.slug,
    images: p.images,
  }
}

const DOT_GRID = `radial-gradient(circle, rgba(212,160,67,0.08) 1px, transparent 1px)`

export default async function EbooksPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id,name,description,price,sale_price,slug,is_active,is_featured,images,created_at')
    .eq('product_type', 'ebook')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const ebooks = (data || []).map(mapProduct)
  const free = ebooks.filter(e => e.free)
  const paid = ebooks.filter(e => !e.free)

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section
        className="px-6 lg:px-12 flex items-end"
        style={{
          background: '#0F1628',
          backgroundImage: DOT_GRID,
          backgroundSize: '28px 28px',
          minHeight: '240px',
          paddingTop: '64px',
          paddingBottom: '44px',
        }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-end justify-between gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-3 text-[var(--saffron)]" style={{ fontFamily: "'Sora', sans-serif" }}>Digital Library</p>
              <h1 className="text-white mb-3 leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 'clamp(36px, 5vw, 58px)' }}>
                Vedic Wisdom Library
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.50)', maxWidth: '480px' }}>
                Premium ebooks on Jyotish, Numerology, Vastu, Mantra and Sanatan philosophy
              </p>
            </div>
            <p className="text-[11px] whitespace-nowrap hidden sm:block" style={{ fontFamily: "'Sora', sans-serif", color: 'rgba(255,255,255,0.25)' }}>
              {ebooks.length} {ebooks.length === 1 ? 'Book' : 'Books'}{free.length > 0 ? ` · ${free.length} Free` : ''}
            </p>
          </div>
        </div>
      </section>

      {ebooks.length === 0 ? (
        <section className="py-20 px-6 bg-[var(--kutch-white)] text-center">
          <span className="material-symbols-outlined text-[56px] text-[var(--indigo-deep)]/20 block mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
          <h2 className="text-xl font-bold text-[var(--indigo-deep)]/50 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Library Coming Soon</h2>
          <p className="text-sm text-[var(--warm-charcoal)]/50">Our collection of Vedic wisdom ebooks is being curated. Check back soon.</p>
        </section>
      ) : (
        <>
          {free.length > 0 && (
            <section className="py-12 px-6 lg:px-12 bg-[var(--kutch-white)]">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <span className="inline-block w-8 border-t-2 border-[var(--terracotta)]" />
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: 'var(--indigo-deep)', fontWeight: 600 }}>Free Downloads</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {free.map(book => <EbookCard key={book.id} book={book} />)}
                </div>
              </div>
            </section>
          )}

          {paid.length > 0 && (
            <section className="py-12 px-6 lg:px-12 bg-[var(--kutch-white)]">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <span className="inline-block w-8 border-t-2 border-[var(--terracotta)]" />
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: 'var(--indigo-deep)', fontWeight: 600 }}>Premium Library</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paid.map(book => <EbookCard key={book.id} book={book} />)}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <section className="py-8 px-6 bg-[var(--warm-sand)] text-center">
        <p className="text-sm mb-3" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(28,30,74,0.55)' }}>Already purchased an ebook?</p>
        <Link
          href="/my-library"
          className="inline-flex items-center gap-2 font-semibold text-sm"
          style={{ fontFamily: "'DM Sans', sans-serif", background: 'var(--indigo-deep)', color: 'white', borderRadius: '8px', padding: '10px 24px' }}
        >
          <span className="material-symbols-outlined text-[16px]">library_books</span>
          Access My Library
        </Link>
      </section>

    </div>
  )
}

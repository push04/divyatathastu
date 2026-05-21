import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog | DivyaTathastu - Vedic Wisdom & Spiritual Guidance',
  description: 'Read articles on Vedic astrology, numerology, yoga, Ayurveda, and spiritual practices.',
}

export const revalidate = 3600

const FALLBACK_POSTS = [
  { id: '1', slug: 'what-is-your-life-path-number', title: 'What is Your Life Path Number and Why It Matters', excerpt: 'Discover how your birth date reveals your soul purpose, karmic lessons, and the unique path your life was meant to take.', category: 'Numerology', read_time: 5, created_at: '2025-01-15' },
  { id: '2', slug: 'understanding-nakshatra', title: 'Your Nakshatra: The Star That Governs Your Soul', excerpt: 'The 27 nakshatras of Vedic astrology reveal far more about your personality than just your sun sign. Learn which star rules your destiny.', category: 'Astrology', read_time: 7, created_at: '2025-01-20' },
  { id: '3', slug: 'vastu-home-guide', title: 'Vastu Shastra: Transform Your Home into a Temple', excerpt: 'Simple Vastu remedies that can bring peace, prosperity and positive energy to your living space without major renovation.', category: 'Vastu', read_time: 8, created_at: '2025-01-25' },
  { id: '4', slug: 'chakra-healing-guide', title: 'Complete Guide to Chakra Healing for Beginners', excerpt: 'Learn to identify blocked chakras and heal them through mantras, crystals, yoga, and diet adjustments aligned with your birth chart.', category: 'Chakra', read_time: 10, created_at: '2025-02-01' },
  { id: '5', slug: 'pradosh-vrat-significance', title: 'Pradosh Vrat: The Most Powerful Shiva Fast', excerpt: 'Why Pradosh Vrat is considered the most auspicious Shiva puja day and how to perform it correctly for maximum blessings.', category: 'Spirituality', read_time: 6, created_at: '2025-02-05' },
  { id: '6', slug: 'prakriti-ayurveda', title: 'Know Your Dosha: Vata, Pitta or Kapha?', excerpt: 'Ayurveda says your body-mind constitution determines your health, relationships, and spiritual path. Find your Prakriti today.', category: 'Ayurveda', read_time: 9, created_at: '2025-02-10' },
]

const CATEGORY_COLORS: Record<string, string> = {
  Numerology: 'bg-violet-100 text-violet-700',
  Astrology: 'bg-amber-100 text-amber-700',
  Vastu: 'bg-teal-100 text-teal-700',
  Chakra: 'bg-pink-100 text-pink-700',
  Spirituality: 'bg-orange-100 text-orange-700',
  Ayurveda: 'bg-green-100 text-green-700',
}

export default async function BlogPage() {
  let posts = FALLBACK_POSTS

  try {
    const supabase = await createClient()
    const { data } = await supabase.from('blog_posts').select('id,slug,title,excerpt,category,read_time,created_at').eq('is_published', true).order('created_at', { ascending: false })
    if (data && data.length > 0) posts = data as any
  } catch {}

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="page-banner">
        <div className="page-banner-inner max-w-2xl mx-auto">
          <p className="text-[var(--saffron)] text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>Wisdom Writings</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Vedic Wisdom Blog</h1>
          <div className="ornate-divider">
            <span className="material-symbols-outlined text-[14px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
          </div>
          <p className="text-white/65 text-lg leading-relaxed">Ancient insights for modern life — astrology, numerology, Ayurveda, and spiritual practices explained clearly.</p>
        </div>
      </section>

      {/* Posts */}
      <section className="py-12 px-6 bg-[var(--kutch-white)]">
        <div className="max-w-5xl mx-auto">
          {/* Featured */}
          <div className="mb-8">
            <Link href={`/blog/${posts[0].slug}`} className="card-divine block p-6 sm:p-8 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[posts[0].category] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{posts[0].category}</span>
                  <h2 className="text-2xl font-bold text-[var(--indigo-deep)] mt-3 mb-2">{posts[0].title}</h2>
                  <p className="text-[var(--warm-charcoal)]/70">{posts[0].excerpt}</p>
                  <p className="text-sm text-[var(--warm-charcoal)]/40 mt-3">{posts[0].read_time} min read &middot; {new Date(posts[0].created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--plum)] flex items-center justify-center flex-shrink-0 hidden sm:flex">
                  <span className="material-symbols-outlined text-[56px] text-white/80" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.slice(1).map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="card-divine p-5 hover:shadow-md transition-all flex flex-col">
                <div className="flex-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{post.category}</span>
                  <h3 className="font-bold text-[var(--indigo-deep)] mt-2 mb-2 leading-snug">{post.title}</h3>
                  <p className="text-sm text-[var(--warm-charcoal)]/70 line-clamp-3">{post.excerpt}</p>
                </div>
                <p className="text-xs text-[var(--warm-charcoal)]/40 mt-3">{post.read_time} min read &middot; {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

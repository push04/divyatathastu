import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

import Icon from '@/components/ui/Icon'
export const metadata: Metadata = {
  title: 'Blog | MahaTathastu - Vedic Wisdom & Spiritual Guidance',
  description: 'Read articles on Vedic astrology, numerology, yoga, Ayurveda, and spiritual practices.',
  alternates: { canonical: '/blog' },
}
export const revalidate = 3600

const CATEGORY_COLORS: Record<string, string> = {
  Numerology: 'bg-violet-100 text-violet-700',
  Astrology: 'bg-amber-100 text-amber-700',
  Vastu: 'bg-teal-100 text-teal-700',
  Chakra: 'bg-pink-100 text-pink-700',
  Spirituality: 'bg-orange-100 text-orange-700',
  Ayurveda: 'bg-green-100 text-green-700',
}

export default async function BlogPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id,slug,title,excerpt,category,read_time,created_at,cover_image_url')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const posts = data || []

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="page-banner">
        <div className="page-banner-inner max-w-2xl mx-auto">
          <p className="t-eyebrow t-eyebrow-dark mb-4 inline-block">Wisdom Writings</p>
          <h1 className="t-display-2 text-[var(--text-on-dark)] mb-4">Vedic Wisdom Blog</h1>
          <div className="ornate-divider">
            <Icon name="yantra" size={16} className="text-[var(--gold-300)]" />
          </div>
          <p className="text-[var(--text-on-dark-secondary)] text-lg leading-relaxed">Ancient insights for modern life - astrology, numerology, Ayurveda, and spiritual practices explained clearly.</p>
        </div>
      </section>

      {/* Posts */}
      <section className="py-12 px-6 bg-[var(--kutch-white)]">
        <div className="max-w-5xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <Icon name="menu_book" size={56} className="text-[var(--indigo-deep)]/20 block mb-4" />
              <h2 className="text-xl font-bold text-[var(--text-muted)] mb-2" style={{ fontFamily: "var(--font-display)" }}>Articles Coming Soon</h2>
              <p className="text-sm text-[var(--text-muted)]">Our team of Vedic scholars is preparing deep-dive articles. Check back soon.</p>
            </div>
          ) : (
            <>
              {/* Featured post */}
              <div className="mb-8">
                <Link href={`/blog/${posts[0].slug}`} className="card-divine block p-6 sm:p-8 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[posts[0].category] || 'bg-[var(--warm-sand)] text-[var(--text-secondary)]'}`}>
                        {posts[0].category}
                      </span>
                      <h2 className="text-2xl font-bold text-[var(--indigo-deep)] mt-3 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                        {posts[0].title}
                      </h2>
                      <p className="text-[var(--text-secondary)]">{posts[0].excerpt}</p>
                      <p className="text-sm text-[var(--text-muted)] mt-3">
                        {posts[0].read_time} min read &middot; {new Date(posts[0].created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 hidden sm:block"
                      style={{ background: 'linear-gradient(135deg, var(--indigo-deep), #2E0C28)' }}>
                      {posts[0].cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={posts[0].cover_image_url} alt={posts[0].title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon name="menu_book" size={48} className="text-[var(--text-on-dark-secondary)]" />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>

              {/* Grid */}
              {posts.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.slice(1).map(post => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="card-divine p-5 hover:shadow-md transition-all flex flex-col">
                      {post.cover_image_url && (
                        <div className="w-full h-36 rounded-lg overflow-hidden mb-4 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] || 'bg-[var(--warm-sand)] text-[var(--text-secondary)]'}`}>
                          {post.category}
                        </span>
                        <h3 className="font-bold text-[var(--indigo-deep)] mt-2 mb-2 leading-snug text-base" style={{ fontFamily: "var(--font-display)" }}>
                          {post.title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-3">{post.excerpt}</p>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-3">
                        {post.read_time} min read &middot; {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

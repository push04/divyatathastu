import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const revalidate = 3600

// Static fallback content for demo
const STATIC_POSTS: Record<string, any> = {
  'what-is-your-life-path-number': {
    title: 'What is Your Life Path Number and Why It Matters',
    category: 'Numerology',
    read_time: 5,
    created_at: '2025-01-15',
    content: `<h2>The Ancient Science of Numbers</h2>
<p>In Vedic tradition, numbers are not mere mathematical symbols — they are cosmic vibrations that shape our destiny. Your Life Path Number, calculated from your date of birth, is the most significant number in your numerological chart.</p>
<h2>How to Calculate Your Life Path Number</h2>
<p>Add all digits of your birth date and reduce to a single digit (except master numbers 11 and 22).</p>
<p>Example: Born on 15 March 1990 → 1+5+0+3+1+9+9+0 = 28 → 2+8 = 10 → 1+0 = <strong>1</strong></p>
<h2>What Each Number Means</h2>
<ul>
<li><strong>1</strong> — The Leader: Independent, ambitious, pioneering spirit</li>
<li><strong>2</strong> — The Diplomat: Sensitive, cooperative, seeks harmony</li>
<li><strong>3</strong> — The Creative: Expressive, joyful, artistic</li>
<li><strong>4</strong> — The Builder: Practical, disciplined, systematic</li>
<li><strong>5</strong> — The Freedom Seeker: Adventurous, versatile, change-loving</li>
<li><strong>6</strong> — The Nurturer: Caring, responsible, family-oriented</li>
<li><strong>7</strong> — The Seeker: Introspective, spiritual, truth-seeking</li>
<li><strong>8</strong> — The Executive: Ambitious, business-minded, powerful</li>
<li><strong>9</strong> — The Humanitarian: Compassionate, wise, completion</li>
<li><strong>11</strong> — The Master Intuitive: Highly spiritual, inspirational</li>
<li><strong>22</strong> — The Master Builder: Vision + manifestation combined</li>
</ul>
<h2>How to Use Your Life Path Number</h2>
<p>Your Life Path Number reveals your strengths, challenges, and the lessons your soul chose for this lifetime. Use it to make career decisions, understand relationship compatibility, and align with your highest potential.</p>`,
  },
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = STATIC_POSTS[params.slug]
  if (!post) return { title: 'Blog | DivyaTathastu' }
  return {
    title: `${post.title} | DivyaTathastu Blog`,
    description: post.excerpt || post.title,
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  let post = STATIC_POSTS[params.slug] || null

  if (!post) {
    try {
      const supabase = await createClient()
      const { data } = await supabase.from('blog_posts').select('*').eq('slug', params.slug).eq('is_published', true).single()
      post = data
    } catch {}
  }

  if (!post) notFound()

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">
      {/* Header */}
      <div className="page-banner text-left py-12">
        <div className="max-w-3xl mx-auto page-banner-inner">
          <Link href="/blog" className="text-white/60 hover:text-white text-sm mb-6 inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Blog</Link>
          <span className="text-xs font-bold text-[var(--saffron)] bg-white/10 px-3 py-1 rounded-full block w-fit mb-3">{post.category}</span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{post.title}</h1>
          <p className="text-white/60 text-sm">{post.read_time} min read · {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="card-divine p-6 md:p-8 prose prose-lg max-w-none"
          style={{ '--tw-prose-headings': 'var(--indigo-deep)', '--tw-prose-body': 'var(--warm-charcoal)' } as any}
          dangerouslySetInnerHTML={{ __html: post.content || '<p>Content coming soon...</p>' }}
        />

        {/* CTA */}
        <div className="card-divine p-6 mt-8 text-center">
          <p className="text-xl font-bold text-[var(--indigo-deep)] mb-2">Discover Your Personal {post.category} Report</p>
          <p className="text-[var(--warm-charcoal)]/60 mb-5">Get a detailed AI-generated report personalized for you and your family</p>
          <Link href="/reports/generate" className="btn-divine px-8 py-3">Generate My Report</Link>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('title,excerpt')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  if (!data) return { title: 'Blog | MahaTathastu' }
  return {
    title: `${data.title} | MahaTathastu Blog`,
    description: data.excerpt || data.title,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('id,title,slug,category,excerpt,content,read_time,created_at,cover_image_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!post) notFound()

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">
      {/* Header */}
      <div className="page-banner text-left py-12">
        <div className="max-w-3xl mx-auto page-banner-inner">
          <Link href="/blog" className="text-white/60 hover:text-white text-sm mb-6 inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Blog
          </Link>
          <span className="text-xs font-bold text-[var(--saffron)] bg-white/10 px-3 py-1 rounded-full block w-fit mb-3">
            {post.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {post.title}
          </h1>
          <p className="text-white/60 text-sm">
            {post.read_time} min read &middot; {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {post.cover_image_url && (
          <div className="w-full rounded-xl overflow-hidden mb-8" style={{ maxHeight: '360px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div
          className="card-divine p-6 md:p-8 prose prose-lg max-w-none"
          style={{ '--tw-prose-headings': 'var(--indigo-deep)', '--tw-prose-body': 'var(--warm-charcoal)' } as any}
          dangerouslySetInnerHTML={{ __html: post.content || '<p>Content coming soon.</p>' }}
        />

        {/* CTA */}
        <div className="card-divine p-6 mt-8 text-center">
          <p className="text-xl font-bold text-[var(--indigo-deep)] mb-2">
            Discover Your Personal {post.category} Report
          </p>
          <p className="text-[var(--warm-charcoal)]/60 mb-5">
            Get a detailed AI-generated report personalized for you and your family
          </p>
          <Link href="/reports/generate" className="btn-divine px-8 py-3">Generate My Report</Link>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Post {
  id: string
  title: string
  slug: string
  category: string
  is_published: boolean
  created_at: string
}

const CATEGORIES = ['Astrology', 'Numerology', 'Vastu', 'Chakra', 'Spirituality', 'Ayurveda', 'Mantra', 'Pilgrimage']

const CAT_COLORS: Record<string, string> = {
  Astrology: 'bg-violet-100 text-violet-700',
  Numerology: 'bg-purple-100 text-purple-700',
  Vastu: 'bg-teal-100 text-teal-700',
  Chakra: 'bg-pink-100 text-pink-700',
  Spirituality: 'bg-amber-100 text-amber-700',
  Ayurveda: 'bg-emerald-100 text-emerald-700',
  Mantra: 'bg-orange-100 text-orange-700',
  Pilgrimage: 'bg-blue-100 text-blue-700',
}

export default function AdminBlogPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', slug: '', category: 'Astrology', excerpt: '', content: '', read_time: 5 })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('blog_posts').select('id,title,slug,category,is_published,created_at').order('created_at', { ascending: false })
    if (data) setPosts(data)
    setLoading(false)
  }

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  }

  async function createPost() {
    if (!form.title || !form.content) { toast.error('Title and content required'); return }
    setCreating(true)
    const slug = form.slug || generateSlug(form.title)
    const { excerpt, content, category } = form
    const { error } = await supabase.from('blog_posts').insert({ title: form.title, slug, excerpt, content, category, is_published: false })
    if (error) toast.error('Failed: ' + error.message)
    else { toast.success('Post created (draft)!'); await load(); setForm({ title: '', slug: '', category: 'Astrology', excerpt: '', content: '', read_time: 5 }) }
    setCreating(false)
  }

  async function togglePublish(id: string, is_published: boolean) {
    await supabase.from('blog_posts').update({ is_published: !is_published }).eq('id', id)
    setPosts(prev => prev.map(p => p.id === id ? { ...p, is_published: !is_published } : p))
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
    toast.success('Deleted')
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow text-[var(--terracotta)]">ॐ</div></div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
        Blog Posts <span className="text-[var(--warm-charcoal)]/40 font-normal">({posts.length})</span>
      </h1>

      {/* Create form */}
      <div className="card-divine p-5 space-y-4">
        <h2 className="font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          New Post
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: generateSlug(e.target.value) }))} className={inputCls} placeholder="Enter post title..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Slug</label>
            <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Excerpt</label>
            <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="Short description for previews..." />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Content (HTML) *</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} className={`${inputCls} font-mono resize-none`} placeholder="<h2>Section</h2><p>Content...</p>" />
          </div>
        </div>
        <button onClick={createPost} disabled={creating} className="btn-divine px-6 py-2 text-sm disabled:opacity-50 inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{creating ? 'hourglass_empty' : 'publish'}</span>
          {creating ? 'Creating...' : 'Create Post (Draft)'}
        </button>
      </div>

      {/* List */}
      <div className="card-divine overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--warm-sand)]/40 border-b border-[var(--warm-sand)]">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Title</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--warm-sand)]/60">
            {posts.map(p => (
              <tr key={p.id} className="hover:bg-[var(--warm-sand)]/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--indigo-deep)]">{p.title}</p>
                  <p className="text-xs text-[var(--warm-charcoal)]/40 font-mono">/blog/{p.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[p.category] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{p.category}</span>
                </td>
                <td className="px-4 py-3 text-[var(--warm-charcoal)]/40 text-xs">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50'}`}>
                    {p.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => togglePublish(p.id, p.is_published)} className="text-xs text-[var(--indigo-deep)] hover:underline font-medium">
                      {p.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => deletePost(p.id)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[40px] text-[var(--warm-charcoal)]/20 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            <p className="text-[var(--warm-charcoal)]/40 text-sm">No posts yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

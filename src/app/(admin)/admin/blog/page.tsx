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
  cover_image_url: string | null
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
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', slug: '', category: 'Astrology', excerpt: '', content: '', read_time: 5,
    cover_image_url: '',
  })

  async function load() {
    const { data } = await supabase.from('blog_posts').select('id,title,slug,category,is_published,cover_image_url,created_at').order('created_at', { ascending: false })
    if (data) setPosts(data)
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  }

  async function handleAiWrite() {
    if (!form.title && !aiPrompt) { toast.error('Enter a title or prompt first'); return }
    setAiLoading(true)
    try {
      const prompt = aiPrompt || `Write a detailed, spiritually insightful blog post titled "${form.title}" for the ${form.category} category on MahaTathastu, an Indian holistic spiritual platform. Write in HTML with proper h2, h3, p tags. Be comprehensive, practical, and culturally authentic. Minimum 800 words.`
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: false,
          system: `You are a Vedic knowledge expert and blog writer for MahaTathastu, India's holistic spiritual platform. Write rich, authentic, well-structured blog content in HTML format. Include practical advice, mantras, and traditional wisdom. Do NOT include any markdown fences or explanatory text — output only the HTML content.`,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      if (data.content) {
        setForm(f => ({ ...f, content: data.content }))
        if (!form.excerpt && data.content) {
          const stripped = data.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
          setForm(f => ({ ...f, content: data.content, excerpt: stripped + '...' }))
        }
        toast.success('AI content generated!')
      }
    } catch {
      toast.error('AI generation failed')
    }
    setAiLoading(false)
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setCoverFile(f)
    setCoverPreview(URL.createObjectURL(f))
  }

  async function uploadCover(postId: string): Promise<string | null> {
    if (!coverFile) return form.cover_image_url || null
    const ext = coverFile.name.split('.').pop()
    const path = `blog/${postId}.${ext}`
    const { error } = await supabase.storage.from('blog-images').upload(path, coverFile, { upsert: true })
    if (error) { toast.error('Image upload failed: ' + error.message); return null }
    const { data } = supabase.storage.from('blog-images').getPublicUrl(path)
    return data.publicUrl
  }

  function resetForm() {
    setForm({ title: '', slug: '', category: 'Astrology', excerpt: '', content: '', read_time: 5, cover_image_url: '' })
    setCoverFile(null)
    setCoverPreview(null)
    setAiPrompt('')
    setEditingId(null)
  }

  async function openEdit(postId: string) {
    const { data } = await supabase.from('blog_posts').select('*').eq('id', postId).single()
    if (!data) return
    setEditingId(postId)
    setForm({
      title: data.title,
      slug: data.slug,
      category: data.category,
      excerpt: data.excerpt || '',
      content: data.content || '',
      read_time: data.read_time || 5,
      cover_image_url: data.cover_image_url || '',
    })
    setCoverPreview(data.cover_image_url || null)
    setCoverFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function savePost() {
    if (!form.title || !form.content) { toast.error('Title and content required'); return }
    setCreating(true)
    const slug = form.slug || generateSlug(form.title)
    const payload = { title: form.title, slug, excerpt: form.excerpt, content: form.content, category: form.category, read_time: form.read_time }

    if (editingId) {
      const cover_image_url = await uploadCover(editingId)
      const { error } = await supabase.from('blog_posts').update({
        ...payload,
        ...(cover_image_url ? { cover_image_url } : {}),
      }).eq('id', editingId)
      if (error) { toast.error('Update failed: ' + error.message); setCreating(false); return }
      toast.success('Post updated!')
    } else {
      const { data, error } = await supabase.from('blog_posts').insert({ ...payload, is_published: false }).select().single()
      if (error || !data) { toast.error('Failed: ' + error?.message); setCreating(false); return }
      const cover_image_url = await uploadCover(data.id)
      if (cover_image_url) await supabase.from('blog_posts').update({ cover_image_url }).eq('id', data.id)
      toast.success('Post created (draft)!')
    }

    await load()
    resetForm()
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

      {/* Create / Edit form */}
      <div className="card-divine p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[var(--indigo-deep)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{editingId ? 'edit' : 'add_circle'}</span>
            {editingId ? 'Edit Post' : 'New Post'}
          </h2>
          {editingId && (
            <button onClick={resetForm} className="text-xs text-[var(--warm-charcoal)]/50 hover:text-red-500 flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-[14px]">close</span>
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Cover image */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Cover Image</label>
            <div className="flex items-center gap-3">
              {coverPreview ? (
                <img src={coverPreview} alt="cover" className="w-32 h-20 object-cover rounded-lg border border-[var(--warm-sand)]" />
              ) : (
                <div className="w-32 h-20 rounded-lg bg-[var(--warm-sand)] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px] text-[var(--warm-charcoal)]/30">image</span>
                </div>
              )}
              <label className="cursor-pointer px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-xs font-medium text-[var(--indigo-deep)] hover:bg-[var(--warm-sand)]/50 transition-colors">
                Upload Cover
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </label>
            </div>
          </div>

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
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Read Time (min)</label>
            <input type="number" value={form.read_time} onChange={e => setForm(f => ({ ...f, read_time: Number(e.target.value) }))} className={inputCls} min={1} max={60} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Excerpt</label>
            <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="Short description for previews..." />
          </div>

          {/* AI writing section */}
          <div className="col-span-2 rounded-xl border border-[var(--saffron)]/30 bg-amber-50/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="text-sm font-semibold text-[var(--indigo-deep)]">Write with AI</span>
            </div>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              rows={2}
              className={`${inputCls} bg-white resize-none`}
              placeholder="Optional: custom prompt (leave blank to use title + category)"
            />
            <button
              onClick={handleAiWrite}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--saffron)] text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{aiLoading ? 'hourglass_empty' : 'auto_awesome'}</span>
              {aiLoading ? 'Generating...' : 'Generate Content'}
            </button>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Content (HTML) *</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} className={`${inputCls} font-mono resize-y`} placeholder="<h2>Section</h2><p>Content...</p>" />
          </div>
        </div>
        <button onClick={savePost} disabled={creating} className="btn-divine px-6 py-2 text-sm disabled:opacity-50 inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{creating ? 'hourglass_empty' : editingId ? 'save' : 'publish'}</span>
          {creating ? (editingId ? 'Saving...' : 'Creating...') : editingId ? 'Save Changes' : 'Create Post (Draft)'}
        </button>
      </div>

      {/* List */}
      <div className="card-divine overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
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
                    <div className="flex items-center gap-2">
                      {p.cover_image_url && <img src={p.cover_image_url} alt="" className="w-8 h-6 object-cover rounded flex-shrink-0" />}
                      <div>
                        <p className="font-medium text-[var(--indigo-deep)]">{p.title}</p>
                        <p className="text-xs text-[var(--warm-charcoal)]/40 font-mono">/blog/{p.slug}</p>
                      </div>
                    </div>
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
                      <button onClick={() => openEdit(p.id)} className="text-xs text-[var(--saffron)] hover:underline font-medium">Edit</button>
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
    </div>
  )
}

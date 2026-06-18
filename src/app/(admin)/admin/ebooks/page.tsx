'use client'

import SudarshanLoader from '@/components/SudarshanLoader'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Ebook {
  id: string
  name: string
  description: string | null
  price: number
  sale_price: number | null
  slug: string
  is_active: boolean
  is_featured: boolean
  images: any
  created_at: string
  ebook_file_url: string | null
  ebook_download_limit: number | null
}

const EMPTY_FORM = {
  name: '',
  author: '',
  description: '',
  price: 299,
  sale_price: '',
  slug: '',
  ebook_download_limit: 3,
  external_url: '',
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

export default function AdminEbooksPage() {
  const supabase = createClient()
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  async function load() {
    const { data } = await supabase
      .from('products')
      .select('id,name,description,price,sale_price,slug,is_active,is_featured,images,created_at,ebook_file_url,ebook_download_limit')
      .eq('product_type', 'ebook')
      .order('created_at', { ascending: false })
    if (data) setEbooks(data as Ebook[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  }

  function makeUniqueSlug(base: string, excludeId?: string): string {
    const taken = new Set(ebooks.filter(e => e.id !== excludeId).map(e => e.slug))
    if (!taken.has(base)) return base
    for (let i = 2; i <= 99; i++) {
      const candidate = `${base}-${i}`
      if (!taken.has(candidate)) return candidate
    }
    return `${base}-${Date.now().toString(36)}`
  }

  function openEdit(eb: Ebook) {
    setEditingId(eb.id)
    setForm({
      name: eb.name,
      author: '',
      description: eb.description || '',
      price: eb.price,
      sale_price: eb.sale_price?.toString() || '',
      slug: eb.slug,
      ebook_download_limit: eb.ebook_download_limit ?? 3,
      external_url: '',
    })
    setCoverPreview(getFirstImage(eb.images))
    setCoverFile(null)
    setPdfFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setPdfFile(null)
    setCoverFile(null)
    setCoverPreview(null)
    setUploadProgress(0)
  }

  function getFirstImage(images: any): string | null {
    if (!images) return null
    if (Array.isArray(images) && images.length > 0) {
      const img = images[0]
      if (typeof img === 'string') return img
      if (img?.url) return img.url
    }
    return null
  }

  async function uploadPdf(ebookId: string): Promise<string | null> {
    if (!pdfFile) return null
    const ext = pdfFile.name.split('.').pop()
    const path = `${ebookId}/ebook.${ext}`
    const { error } = await supabase.storage.from('ebooks').upload(path, pdfFile, { upsert: true })
    if (error) { toast.error('PDF upload failed: ' + error.message); return null }
    const { data } = supabase.storage.from('ebooks').getPublicUrl(path)
    return data.publicUrl
  }

  async function uploadCover(ebookId: string): Promise<string | null> {
    if (!coverFile) return null
    const ext = coverFile.name.split('.').pop()
    const path = `ebook-covers/${ebookId}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, coverFile, { upsert: true })
    if (error) { toast.error('Cover upload failed: ' + error.message); return null }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function saveEbook() {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    setUploadProgress(20)

    const baseSlug = form.slug || generateSlug(form.name)
    const slug = makeUniqueSlug(baseSlug, editingId ?? undefined)
    const payload: any = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      slug,
      product_type: 'ebook',
      ebook_download_limit: Number(form.ebook_download_limit) || 3,
    }

    let targetId = editingId

    if (editingId) {
      setUploadProgress(30)
      const { error } = await supabase.from('products').update(payload).eq('id', editingId)
      if (error) { toast.error('Update failed: ' + error.message); setSaving(false); setUploadProgress(0); return }
    } else {
      setUploadProgress(30)
      const { data, error } = await supabase.from('products').insert({ ...payload, is_active: true, is_featured: false }).select().single()
      if (error || !data) { toast.error('Failed: ' + error?.message); setSaving(false); setUploadProgress(0); return }
      targetId = data.id
    }

    setUploadProgress(50)
    const [pdfUrl, coverUrl] = await Promise.all([
      uploadPdf(targetId!),
      uploadCover(targetId!),
    ])
    setUploadProgress(85)

    const updates: any = {}
    if (pdfUrl) updates.ebook_file_url = pdfUrl
    if (coverUrl) updates.images = [{ url: coverUrl }]
    if (Object.keys(updates).length > 0) {
      await supabase.from('products').update(updates).eq('id', targetId!)
    }

    // If external URL provided and no PDF uploaded, save it as file URL
    const externalUrl = form.external_url.trim()
    if (externalUrl && !pdfUrl) {
      await supabase.from('products').update({ ebook_file_url: externalUrl }).eq('id', targetId!)
    }

    // Sync ebooks table so my-library can find this ebook after purchase
    const finalFileUrl = pdfUrl ?? externalUrl ?? (editingId ? ebooks.find(e => e.id === editingId)?.ebook_file_url : null)
    if (finalFileUrl) {
      const { error: ebErr } = await (supabase as any).from('ebooks').upsert({
        id: targetId!,
        title: form.name.trim(),
        slug: slug,
        file_url: finalFileUrl,
        price: Number(form.price),
        description: form.description?.trim() || null,
        author: form.author.trim() || 'MahaTathastu',
        language: 'Hindi',
        tags: [],
      }, { onConflict: 'id' })
      if (ebErr) toast.error('Ebook library sync failed: ' + ebErr.message)
    }

    setUploadProgress(100)
    toast.success(editingId ? 'Ebook updated!' : 'Ebook created!')
    await load()
    resetForm()
    setSaving(false)
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('products').update({ is_active: !active }).eq('id', id)
    setEbooks(prev => prev.map(e => e.id === id ? { ...e, is_active: !active } : e))
    toast.success(!active ? 'Activated' : 'Deactivated')
  }

  async function toggleFeatured(id: string, featured: boolean) {
    await supabase.from('products').update({ is_featured: !featured }).eq('id', id)
    setEbooks(prev => prev.map(e => e.id === id ? { ...e, is_featured: !featured } : e))
    toast.success(!featured ? 'Featured on homepage' : 'Removed from homepage')
  }

  async function deleteEbook(id: string) {
    if (!confirm('Delete this ebook?')) return
    await supabase.from('products').delete().eq('id', id)
    setEbooks(prev => prev.filter(e => e.id !== id))
    if (editingId === id) resetForm()
    toast.success('Ebook deleted')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
        Ebooks <span className="text-[var(--warm-charcoal)]/40 font-normal">({ebooks.length})</span>
      </h1>

      {/* Create / Edit form */}
      <div className="card-divine p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[var(--indigo-deep)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{editingId ? 'edit' : 'add_circle'}</span>
            {editingId ? 'Edit Ebook' : 'Add New Ebook'}
          </h2>
          {editingId && (
            <button onClick={resetForm} className="text-xs text-[var(--warm-charcoal)]/50 hover:text-red-500 flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-[14px]">close</span> Cancel
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cover */}
          <div className="col-span-2 flex items-center gap-3">
            {coverPreview ? (
              <img src={coverPreview} alt="cover" className="w-20 h-24 object-cover rounded-lg border border-[var(--warm-sand)] flex-shrink-0" />
            ) : (
              <div className="w-20 h-24 rounded-lg bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--terracotta)] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[28px] text-white/40" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-[var(--warm-sand)] text-xs font-medium text-[var(--indigo-deep)] hover:bg-[var(--warm-sand)]/50 transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">image</span>
                Upload Cover
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) } }} />
              </label>
              <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-[var(--warm-sand)] text-xs font-medium text-[var(--indigo-deep)] hover:bg-[var(--warm-sand)]/50 transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">upload_file</span>
                {pdfFile ? pdfFile.name.slice(0, 20) + '...' : 'Upload PDF'}
                <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setPdfFile(f) }} />
              </label>
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">
              Or — Paste External PDF URL
            </label>
            <input
              type="url"
              value={form.external_url}
              onChange={e => setForm(f => ({ ...f, external_url: e.target.value }))}
              className={inputCls}
              placeholder="https://drive.google.com/... or any direct PDF link"
            />
            <p className="text-[10px] text-[var(--warm-charcoal)]/40 mt-1">Used only if no PDF file is uploaded above. Direct PDF links work best.</p>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Ebook Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))} className={inputCls} placeholder="Vedic Astrology for Beginners" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Author</label>
            <input type="text" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} className={inputCls} placeholder="MahaTathastu" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Price (₹) *</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className={inputCls} min={0} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Sale Price (₹)</label>
            <input type="number" value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} className={inputCls} placeholder="Leave blank for no sale" min={0} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Slug</label>
            <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Download Limit</label>
            <input type="number" value={form.ebook_download_limit} onChange={e => setForm(f => ({ ...f, ebook_download_limit: Number(e.target.value) }))} className={inputCls} min={1} max={100} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="Brief description of the ebook..." />
          </div>
        </div>

        {saving && uploadProgress > 0 && (
          <div className="space-y-1">
            <div className="bg-[var(--warm-sand)] rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-[var(--terracotta)] transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-xs text-[var(--warm-charcoal)]/50">{uploadProgress < 50 ? 'Saving...' : uploadProgress < 90 ? 'Uploading files...' : 'Finalizing...'}</p>
          </div>
        )}

        <button onClick={saveEbook} disabled={saving} className="btn-divine px-6 py-2 text-sm disabled:opacity-50 inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{saving ? 'hourglass_empty' : editingId ? 'save' : 'add'}</span>
          {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Ebook'}
        </button>
      </div>

      {/* Ebooks table */}
      <div className="card-divine overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[var(--warm-sand)]/40 border-b border-[var(--warm-sand)]">
              <tr>
                {['Ebook', 'Price', 'Downloads', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--warm-sand)]/60">
              {ebooks.map(eb => (
                <tr key={eb.id} className={`hover:bg-[var(--warm-sand)]/20 transition-colors ${editingId === eb.id ? 'bg-amber-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getFirstImage(eb.images) ? (
                        <img src={getFirstImage(eb.images)!} alt="" className="w-8 h-10 object-cover rounded flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-10 rounded bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--terracotta)] flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-[12px] text-white/60" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[var(--indigo-deep)]">{eb.name}</p>
                        <p className="text-xs text-[var(--warm-charcoal)]/40 font-mono">{eb.slug}</p>
                        {eb.ebook_file_url && <p className="text-xs text-emerald-600 flex items-center gap-0.5"><span className="material-symbols-outlined text-[10px]">check_circle</span> PDF uploaded</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-[var(--indigo-deep)]">₹{(eb.sale_price ?? eb.price).toLocaleString('en-IN')}</p>
                    {eb.sale_price && <p className="text-xs text-[var(--warm-charcoal)]/40 line-through">₹{eb.price.toLocaleString('en-IN')}</p>}
                  </td>
                  <td className="px-4 py-3 text-[var(--warm-charcoal)]/60 text-sm">{eb.ebook_download_limit ?? '-'} per order</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${eb.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50'}`}>
                        {eb.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {eb.is_featured && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 w-fit">Featured</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openEdit(eb)} className="text-xs text-[var(--saffron)] hover:underline font-medium">Edit</button>
                      <button onClick={() => toggleActive(eb.id, eb.is_active)} className="text-xs text-[var(--indigo-deep)] hover:underline font-medium">{eb.is_active ? 'Deactivate' : 'Activate'}</button>
                      <button onClick={() => toggleFeatured(eb.id, eb.is_featured)} className="text-xs text-amber-600 hover:underline font-medium">{eb.is_featured ? 'Unfeature' : 'Feature'}</button>
                      <button onClick={() => deleteEbook(eb.id)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ebooks.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[40px] text-[var(--warm-charcoal)]/20 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
              <p className="text-[var(--warm-charcoal)]/40 text-sm">No ebooks yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

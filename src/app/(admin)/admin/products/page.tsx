'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Product {
  id: string; name: string; slug: string; description: string | null
  price: number; sale_price: number | null; stock_count: number
  is_active: boolean; product_type: string | null; created_at: string
  images: any
}

interface ProductForm {
  name: string; description: string; product_type: string
  price: string; sale_price: string; stock_count: string
}

const PRODUCT_TYPES = ['report','ebook','consultation','yantra','gemstone','course','bundle','physical','herbal']
const TYPE_ICON: Record<string, string> = {
  report: 'description', ebook: 'menu_book', consultation: 'support_agent',
  yantra: 'hexagon', gemstone: 'diamond', physical: 'temple_hindu',
  course: 'school', bundle: 'auto_awesome', herbal: 'eco',
}
const TYPE_GRADIENT: Record<string, string> = {
  report: 'from-[#2F2A44] to-[#460B2F]', ebook: 'from-[#B9986B] to-[#C67D53]',
  consultation: 'from-emerald-600 to-teal-700', yantra: 'from-amber-500 to-orange-600',
  gemstone: 'from-blue-500 to-purple-700', physical: 'from-[#C67D53] to-rose-700',
  course: 'from-violet-600 to-purple-800', bundle: 'from-[#2F2A44] to-[#B9986B]',
  herbal: 'from-green-600 to-emerald-800',
}

const emptyForm: ProductForm = { name: '', description: '', product_type: 'physical', price: '', sale_price: '', stock_count: '-1' }

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)] transition-colors'

function getFirstImage(images: any): string | null {
  if (!images) return null
  if (Array.isArray(images) && images.length > 0) {
    const img = images[0]
    if (typeof img === 'string') return img
    if (img?.url) return img.url
  }
  return null
}

function getImages(images: any): { url: string; alt?: string }[] {
  if (!Array.isArray(images)) return []
  return images.map(img => typeof img === 'string' ? { url: img } : img).filter(Boolean)
}

export default function AdminProductsPage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // Modal state
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Image upload
  const [images, setImages] = useState<{ url: string; alt?: string }[]>([])
  const [uploading, setUploading] = useState(false)

  async function load() {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,slug,description,price,sale_price,stock_count,is_active,product_type,created_at,images')
      .order('created_at', { ascending: false })
    if (error) toast.error('Failed to load products')
    else setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setForm(emptyForm)
    setImages([])
    setEditProduct(null)
    setModal('create')
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name, description: p.description || '',
      product_type: p.product_type || 'physical',
      price: String(p.price),
      sale_price: p.sale_price ? String(p.sale_price) : '',
      stock_count: String(p.stock_count),
    })
    setImages(getImages(p.images))
    setEditProduct(p)
    setModal('edit')
  }

  function closeModal() { setModal(null); setEditProduct(null); setImages([]) }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) { toast.error('Upload failed: ' + error.message); return null }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    setUploading(true)
    const url = await uploadImage(file)
    if (url) {
      setImages(prev => [...prev, { url, alt: form.name || 'Product image' }])
      toast.success('Image uploaded')
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }

  async function save() {
    if (!form.name.trim()) { toast.error('Product name is required'); return }
    if (!form.price || isNaN(Number(form.price))) { toast.error('Valid price is required'); return }
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      product_type: form.product_type as any,
      price: Number(form.price),
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      stock_count: Number(form.stock_count) || -1,
      images: images,
      is_active: true,
    }

    if (modal === 'create') {
      const slug = slugify(form.name)
      const { data, error } = await supabase.from('products').insert({ ...payload, slug }).select().single()
      if (error) toast.error('Create failed: ' + error.message)
      else { setProducts(p => [data as Product, ...p]); toast.success('Product created!'); closeModal() }
    } else if (editProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editProduct.id)
      if (error) toast.error('Update failed: ' + error.message)
      else {
        setProducts(p => p.map(x => x.id === editProduct.id ? { ...x, ...payload } : x))
        toast.success('Product updated!'); closeModal()
      }
    }
    setSaving(false)
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('products').update({ is_active: !active }).eq('id', id)
    setProducts(p => p.map(x => x.id === id ? { ...x, is_active: !active } : x))
    toast.success(active ? 'Deactivated' : 'Activated')
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) toast.error('Delete failed')
    else { setProducts(p => p.filter(x => x.id !== id)); toast.success('Deleted') }
  }

  const filtered = products.filter(p => {
    if (typeFilter !== 'all' && p.product_type !== typeFilter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-3xl animate-spin-slow" style={{ color: 'var(--terracotta)', fontFamily: "'Playfair Display', serif" }}>ॐ</div>
    </div>
  )

  return (
    <>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1", color: 'var(--terracotta)' }}>storefront</span>
            Products
            <span className="text-[var(--warm-charcoal)]/40 font-normal text-base">({products.length})</span>
          </h1>
          <button onClick={openCreate} className="btn-divine px-4 py-2 text-sm inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Product
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--warm-charcoal)]/40">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
              className="pl-8 pr-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm w-full focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm bg-white text-[var(--warm-charcoal)] focus:outline-none">
            <option value="all">All Types</option>
            {PRODUCT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card-divine overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-[var(--warm-sand)]/40 border-b border-[var(--warm-sand)]">
                <tr>
                  {['Image', 'Product', 'Type', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--warm-sand)]/50">
                {filtered.map(p => {
                  const imgUrl = getFirstImage(p.images)
                  const typeKey = p.product_type || 'report'
                  const discount = p.sale_price ? Math.round((1 - p.sale_price / p.price) * 100) : 0
                  return (
                    <tr key={p.id} className="hover:bg-[var(--warm-sand)]/20 transition-colors">
                      <td className="px-4 py-3 w-16">
                        {imgUrl ? (
                          <img src={imgUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${TYPE_GRADIENT[typeKey] || TYPE_GRADIENT.report} flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-[16px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{TYPE_ICON[typeKey] || 'storefront'}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--indigo-deep)] line-clamp-1">{p.name}</p>
                        <p className="text-xs text-[var(--warm-charcoal)]/40 font-mono mt-0.5">{p.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium" style={{ background: 'var(--warm-sand)', color: 'rgba(61,52,80,0.7)' }}>
                          {p.product_type || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-[var(--indigo-deep)]">₹{Number(p.price).toLocaleString('en-IN')}</p>
                        {p.sale_price && (
                          <p className="text-xs text-emerald-600 font-medium">₹{Number(p.sale_price).toLocaleString('en-IN')} <span className="text-[var(--warm-charcoal)]/40">({discount}% off)</span></p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${p.stock_count === 0 ? 'text-red-500' : p.stock_count !== -1 && p.stock_count < 5 ? 'text-amber-600' : 'text-[var(--warm-charcoal)]'}`}>
                          {p.stock_count === -1 ? '∞ Unlimited' : p.stock_count}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(p.id, p.is_active)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${p.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50 hover:bg-[var(--warm-sand)]/80'}`}>
                          {p.is_active ? '● Active' : '○ Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(p)} className="text-xs text-[var(--indigo-deep)] hover:underline font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">edit</span>Edit
                          </button>
                          <button onClick={() => deleteProduct(p.id)} className="text-xs text-red-500 hover:underline font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">delete</span>Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-[40px] text-[var(--warm-charcoal)]/20 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
                <p className="text-[var(--warm-charcoal)]/40 text-sm">{search || typeFilter !== 'all' ? 'No products match your filter' : 'No products yet'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--warm-sand)] flex-shrink-0">
              <h2 className="font-bold text-[var(--indigo-deep)] text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1", color: 'var(--terracotta)' }}>
                  {modal === 'create' ? 'add_circle' : 'edit'}
                </span>
                {modal === 'create' ? 'Create New Product' : 'Edit Product'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-[var(--warm-sand)] transition-colors">
                <span className="material-symbols-outlined text-[20px] text-[var(--warm-charcoal)]/60">close</span>
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-2 uppercase tracking-wide">Product Images</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img.url} alt={img.alt || ''} className="w-20 h-20 rounded-xl object-cover border border-[var(--warm-sand)]" />
                      <button onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center text-[10px] hidden group-hover:flex">
                        ✕
                      </button>
                      {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1 rounded">Main</span>}
                    </div>
                  ))}

                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--warm-sand)] flex flex-col items-center justify-center gap-1 hover:border-[var(--saffron)] hover:bg-[var(--warm-sand)]/30 transition-all disabled:opacity-50 cursor-pointer">
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-[var(--saffron)] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[22px] text-[var(--warm-charcoal)]/40">upload</span>
                        <span className="text-[10px] text-[var(--warm-charcoal)]/40">Upload</span>
                      </>
                    )}
                  </button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                </div>
                <p className="text-xs text-[var(--warm-charcoal)]/40">JPEG/PNG/WEBP · Max 5 MB · First image is the main display image</p>
              </div>

              {/* Name + Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1.5 uppercase tracking-wide">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={inputCls} placeholder="Product name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1.5 uppercase tracking-wide">Type *</label>
                  <select value={form.product_type} onChange={e => setForm(f => ({ ...f, product_type: e.target.value }))} className={inputCls}>
                    {PRODUCT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={inputCls + ' resize-none'} rows={3} placeholder="Detailed product description..." />
              </div>

              {/* Price + Sale Price + Stock */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1.5 uppercase tracking-wide">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className={inputCls} placeholder="999" min="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1.5 uppercase tracking-wide">Sale Price (₹)</label>
                  <input type="number" value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))}
                    className={inputCls} placeholder="799 (optional)" min="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1.5 uppercase tracking-wide">Stock</label>
                  <input type="number" value={form.stock_count} onChange={e => setForm(f => ({ ...f, stock_count: e.target.value }))}
                    className={inputCls} placeholder="-1 = unlimited" />
                  <p className="text-[10px] text-[var(--warm-charcoal)]/40 mt-1">-1 = unlimited</p>
                </div>
              </div>

              {/* Preview */}
              {form.price && (
                <div className="p-4 rounded-xl" style={{ background: 'var(--kutch-white)', border: '1px solid var(--warm-sand)' }}>
                  <p className="text-xs font-semibold text-[var(--warm-charcoal)]/50 mb-2 uppercase tracking-wide">Price Preview</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold" style={{ color: 'var(--indigo-deep)', fontFamily: "'Playfair Display', serif" }}>
                      ₹{Number(form.sale_price || form.price).toLocaleString('en-IN')}
                    </span>
                    {form.sale_price && (
                      <>
                        <span className="text-sm line-through" style={{ color: 'rgba(61,52,80,0.35)' }}>₹{Number(form.price).toLocaleString('en-IN')}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--terracotta)' }}>
                          {Math.round((1 - Number(form.sale_price) / Number(form.price)) * 100)}% OFF
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--warm-sand)] flex-shrink-0">
              <button onClick={closeModal} className="px-5 py-2 text-sm text-[var(--warm-charcoal)]/50 hover:text-[var(--warm-charcoal)] transition-colors">Cancel</button>
              <button onClick={save} disabled={saving || uploading}
                className="btn-divine px-6 py-2.5 text-sm disabled:opacity-60 flex items-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {modal === 'create' ? (saving ? 'Creating…' : 'Create Product') : (saving ? 'Saving…' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

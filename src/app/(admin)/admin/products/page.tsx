'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Product {
  id: string; name: string; slug: string; description: string | null
  price: number; sale_price: number | null; stock_count: number
  is_active: boolean; product_type: string | null; created_at: string
}

const PRODUCT_TYPES = ['report', 'ebook', 'consultation', 'yantra', 'gemstone', 'course', 'bundle']
const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

const emptyForm = { name: '', price: '', sale_price: '', stock_count: '0', product_type: 'report', description: '' }

export default function AdminProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ price: '', sale_price: '', stock_count: '' })
  const [search, setSearch] = useState('')

  async function load() {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,slug,description,price,sale_price,stock_count,is_active,product_type,created_at')
      .order('created_at', { ascending: false })
    if (error) toast.error('Load failed')
    else setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function createProduct() {
    if (!form.name || !form.price) { toast.error('Name and price required'); return }
    setCreating(true)
    const slug = form.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
    const { data, error } = await supabase.from('products').insert({
      name: form.name, slug, description: form.description || null,
      price: Number(form.price), sale_price: form.sale_price ? Number(form.sale_price) : null,
      stock_count: Number(form.stock_count) || 0, product_type: form.product_type as any,
      is_active: true,
    }).select().single()
    if (error) toast.error('Failed: ' + error.message)
    else { setProducts(p => [data as Product, ...p]); toast.success('Product created'); setShowForm(false); setForm(emptyForm) }
    setCreating(false)
  }

  async function saveEdit(id: string) {
    const { error } = await supabase.from('products').update({
      price: Number(editData.price),
      sale_price: editData.sale_price ? Number(editData.sale_price) : null,
      stock_count: Number(editData.stock_count),
    }).eq('id', id)
    if (error) toast.error('Update failed')
    else {
      setProducts(p => p.map(x => x.id === id ? { ...x, price: Number(editData.price), sale_price: editData.sale_price ? Number(editData.sale_price) : null, stock_count: Number(editData.stock_count) } : x))
      toast.success('Updated'); setEditId(null)
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('products').update({ is_active: !active }).eq('id', id)
    setProducts(p => p.map(x => x.id === id ? { ...x, is_active: !active } : x))
    toast.success(active ? 'Deactivated' : 'Activated')
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) toast.error('Delete failed')
    else { setProducts(p => p.filter(x => x.id !== id)); toast.success('Deleted') }
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow text-[var(--terracotta)]">ॐ</div></div>

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
          Products <span className="text-[var(--warm-charcoal)]/40 font-normal">({products.length})</span>
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-divine px-4 py-2 text-sm inline-flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">add</span>New Product
        </button>
      </div>

      {showForm && (
        <div className="card-divine p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Product name" /></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Type</label>
            <select value={form.product_type} onChange={e => setForm(f => ({ ...f, product_type: e.target.value }))} className={inputCls}>
              {PRODUCT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Price (₹) *</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inputCls} placeholder="999" /></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Sale Price (₹)</label>
            <input type="number" value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} className={inputCls} placeholder="799 (optional)" /></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Stock (-1 = unlimited)</label>
            <input type="number" value={form.stock_count} onChange={e => setForm(f => ({ ...f, stock_count: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Short description..." /></div>
          <div className="sm:col-span-2 flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-[var(--warm-charcoal)]/50 hover:text-[var(--warm-charcoal)]">Cancel</button>
            <button onClick={createProduct} disabled={creating} className="btn-divine px-6 py-2 text-sm disabled:opacity-60">{creating ? 'Creating...' : 'Create'}</button>
          </div>
        </div>
      )}

      <div className="relative w-full sm:w-72">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--warm-charcoal)]/40">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
          className="pl-8 pr-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm w-full focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]" />
      </div>

      <div className="card-divine overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-[var(--warm-sand)]/40 border-b border-[var(--warm-sand)]">
              <tr>
                {['Name', 'Type', 'Price', 'Sale', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--warm-sand)]/60">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-[var(--warm-sand)]/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--indigo-deep)]">{p.name}</p>
                    <p className="text-xs text-[var(--warm-charcoal)]/40 font-mono">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--warm-charcoal)]/60 capitalize text-xs">{p.product_type || '—'}</td>
                  <td className="px-4 py-3">
                    {editId === p.id
                      ? <input type="number" value={editData.price} onChange={e => setEditData(d => ({ ...d, price: e.target.value }))} className="w-20 px-2 py-1 border border-[var(--saffron)] rounded text-xs" />
                      : <span className="font-bold text-[var(--indigo-deep)]">₹{Number(p.price).toLocaleString('en-IN')}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {editId === p.id
                      ? <input type="number" value={editData.sale_price} onChange={e => setEditData(d => ({ ...d, sale_price: e.target.value }))} className="w-20 px-2 py-1 border border-[var(--saffron)] rounded text-xs" placeholder="—" />
                      : <span className="text-[var(--warm-charcoal)]/60">{p.sale_price ? `₹${Number(p.sale_price).toLocaleString('en-IN')}` : '—'}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {editId === p.id
                      ? <input type="number" value={editData.stock_count} onChange={e => setEditData(d => ({ ...d, stock_count: e.target.value }))} className="w-16 px-2 py-1 border border-[var(--saffron)] rounded text-xs" />
                      : <span className={`font-medium ${p.stock_count === 0 ? 'text-red-500' : p.stock_count < 5 && p.stock_count !== -1 ? 'text-amber-600' : 'text-[var(--warm-charcoal)]'}`}>
                          {p.stock_count === -1 ? '∞' : p.stock_count}
                        </span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p.id, p.is_active)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${p.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50 hover:bg-[var(--warm-sand)]/80'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      {editId === p.id
                        ? <>
                            <button onClick={() => saveEdit(p.id)} className="text-xs text-emerald-600 hover:underline font-medium">Save</button>
                            <button onClick={() => setEditId(null)} className="text-xs text-[var(--warm-charcoal)]/40 hover:underline">Cancel</button>
                          </>
                        : <button onClick={() => { setEditId(p.id); setEditData({ price: String(p.price), sale_price: p.sale_price ? String(p.sale_price) : '', stock_count: String(p.stock_count) }) }}
                            className="text-xs text-[var(--indigo-deep)] hover:underline font-medium">Edit</button>}
                      <button onClick={() => deleteProduct(p.id)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[40px] text-[var(--warm-charcoal)]/20 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
              <p className="text-[var(--warm-charcoal)]/40 text-sm">No products yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

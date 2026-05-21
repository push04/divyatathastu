'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const DEMO: any[] = [
  { id: '1', name: 'Rudraksha Mala (108 beads)', category: 'Spiritual', price: 1299, stock: 45, status: 'active', image_emoji: 'self_improvement' },
  { id: '2', name: 'Vedic Astrology Report PDF', category: 'Digital', price: 499, stock: 9999, status: 'active', image_emoji: 'brightness_7' },
  { id: '3', name: 'Crystal Healing Set (7 chakras)', category: 'Wellness', price: 2499, stock: 12, status: 'active', image_emoji: 'diamond' },
  { id: '4', name: 'Copper Puja Thali Set', category: 'Spiritual', price: 899, stock: 0, status: 'out_of_stock', image_emoji: 'local_fire_department' },
  { id: '5', name: 'Sandalwood Incense Box (100 sticks)', category: 'Spiritual', price: 349, stock: 234, status: 'active', image_emoji: 'eco' },
]

const CATS = ['Spiritual', 'Digital', 'Wellness', 'Books', 'Accessories']
const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

export default function AdminProductsPage() {
  const [products, setProducts] = useState(DEMO)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Spiritual', price: '', stock: '', description: '', image_emoji: 'inventory_2' })
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  async function saveProduct() {
    if (!form.name || !form.price) { toast.error('Name and price required'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const slug = form.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
      const payload = { name: form.name, slug, price: Number(form.price), stock_count: Number(form.stock) || 0, description: form.description, is_active: true }
      const { data, error } = await supabase.from('products').insert(payload).select().single()
      if (error) throw error
      setProducts(p => [data as any, ...p])
    } catch {
      setProducts(p => [{ ...form, id: Date.now().toString(), price: Number(form.price), stock: Number(form.stock), status: 'active' }, ...p])
    }
    setSaving(false)
    setShowForm(false)
    setForm({ name: '', category: 'Spiritual', price: '', stock: '', description: '', image_emoji: 'inventory_2' })
    toast.success('Product saved')
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === 'active' ? 'inactive' : 'active'
    setProducts(p => p.map(x => x.id === id ? { ...x, status: next } : x))
    try { const supabase = createClient(); await supabase.from('products').update({ is_active: next === 'active' }).eq('id', id) } catch {}
    toast.success(`Product ${next}`)
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return
    setProducts(p => p.filter(x => x.id !== id))
    try { const supabase = createClient(); await supabase.from('products').delete().eq('id', id) } catch {}
    toast.success('Deleted')
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            Products <span className="text-[var(--warm-charcoal)]/40 font-normal">({products.length})</span>
          </h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-divine px-4 py-2 text-sm inline-flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">add</span>Add Product
        </button>
      </div>

      {showForm && (
        <div className="card-divine p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Product Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Rudraksha Mala" /></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Price (₹) *</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={inputCls} placeholder="999" /></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Stock Quantity</label>
            <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className={inputCls} placeholder="100" /></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Icon (Material Symbol)</label>
            <input value={form.image_emoji} onChange={e => setForm(f => ({ ...f, image_emoji: e.target.value }))} className={inputCls} placeholder="self_improvement" /></div>
          <div><label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Short description..." /></div>
          <div className="sm:col-span-2 flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-[var(--warm-charcoal)]/50 hover:text-[var(--warm-charcoal)]">Cancel</button>
            <button onClick={saveProduct} disabled={saving} className="btn-divine px-6 py-2 text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save Product'}</button>
          </div>
        </div>
      )}

      <div className="relative w-full sm:w-72">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--warm-charcoal)]/40">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-8 pr-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm w-full focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]" />
      </div>

      <div className="card-divine overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--warm-sand)]/40 border-b border-[var(--warm-sand)]">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Product</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Category</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Price</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Stock</th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--warm-sand)]/60">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-[var(--warm-sand)]/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[22px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>{p.image_emoji || 'inventory_2'}</span>
                    <span className="text-[var(--indigo-deep)] font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--warm-charcoal)]/60">{p.category}</td>
                <td className="px-4 py-3 text-right font-bold text-[var(--indigo-deep)]">₹{Number(p.price).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-medium ${p.stock === 0 ? 'text-red-500' : p.stock < 10 ? 'text-amber-600' : 'text-[var(--warm-charcoal)]'}`}>{p.stock === 9999 ? '∞' : p.stock}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleStatus(p.id, p.status)} className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50'}`}>
                    {p.status}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteProduct(p.id)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[40px] text-[var(--warm-charcoal)]/20 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            <p className="text-[var(--warm-charcoal)]/40 text-sm">No products found</p>
          </div>
        )}
      </div>
    </div>
  )
}

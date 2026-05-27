'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Coupon {
  id: string; code: string; discount_type: 'percentage' | 'flat'; discount_value: number
  min_order_amount: number; max_uses: number | null; used_count: number
  is_active: boolean; expires_at: string | null; created_at: string
}

const EMPTY_FORM = { code: '', discount_type: 'percentage', discount_value: 10, min_order_amount: 0, max_uses: '', expires_at: '' }
const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

export default function AdminCouponsPage() {
  const supabase = createClient()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  async function load() {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    if (data) setCoupons(data)
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openEdit(c: Coupon) {
    setEditingId(c.id)
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount,
      max_uses: c.max_uses?.toString() || '',
      expires_at: c.expires_at ? c.expires_at.split('T')[0] : '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function saveCoupon() {
    if (!form.code.trim()) { toast.error('Enter coupon code'); return }
    setSaving(true)
    const payload = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type as 'flat' | 'percentage',
      discount_value: Number(form.discount_value),
      min_order_amount: Number(form.min_order_amount),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
    }

    if (editingId) {
      const { error } = await supabase.from('coupons').update(payload).eq('id', editingId)
      if (error) toast.error('Failed: ' + error.message)
      else { toast.success('Coupon updated!'); resetForm(); await load() }
    } else {
      const { error } = await supabase.from('coupons').insert({ ...payload, is_active: true, used_count: 0 })
      if (error) toast.error('Failed: ' + error.message)
      else { toast.success('Coupon created!'); resetForm(); await load() }
    }
    setSaving(false)
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('coupons').update({ is_active: !active }).eq('id', id)
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !active } : c))
  }

  async function deleteCoupon(id: string) {
    if (!confirm('Delete this coupon?')) return
    await supabase.from('coupons').delete().eq('id', id)
    setCoupons(prev => prev.filter(c => c.id !== id))
    if (editingId === id) resetForm()
    toast.success('Coupon deleted')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow text-[var(--terracotta)]">ॐ</div></div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
        Coupons <span className="text-[var(--warm-charcoal)]/40 font-normal">({coupons.length})</span>
      </h1>

      {/* Create / Edit form */}
      <div className="card-divine p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--indigo-deep)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{editingId ? 'edit' : 'add_circle'}</span>
            {editingId ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          {editingId && (
            <button onClick={resetForm} className="text-xs text-[var(--warm-charcoal)]/50 hover:text-red-500 flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-[14px]">close</span> Cancel
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Code *</label>
            <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" className={`${inputCls} uppercase font-mono`} disabled={!!editingId} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Type</label>
            <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))} className={inputCls}>
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Fixed Amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Value</label>
            <input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Min Order (₹)</label>
            <input type="number" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: Number(e.target.value) }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Max Uses (blank = unlimited)</label>
            <input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Expires At</label>
            <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} min={new Date().toISOString().split('T')[0]} className={inputCls} />
          </div>
        </div>
        <button onClick={saveCoupon} disabled={saving} className="mt-4 btn-divine px-6 py-2 text-sm disabled:opacity-50 inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{saving ? 'hourglass_empty' : editingId ? 'save' : 'redeem'}</span>
          {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Coupon'}
        </button>
      </div>

      <div className="card-divine overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--warm-sand)]/40 border-b border-[var(--warm-sand)]">
            <tr>
              {['Code', 'Discount', 'Min Order', 'Used', 'Expires', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--warm-sand)]/60">
            {coupons.map(c => (
              <tr key={c.id} className={`hover:bg-[var(--warm-sand)]/20 transition-colors ${editingId === c.id ? 'bg-amber-50' : ''}`}>
                <td className="px-4 py-3 font-bold text-[var(--indigo-deep)] font-mono tracking-wider">{c.code}</td>
                <td className="px-4 py-3 text-[var(--warm-charcoal)]">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                <td className="px-4 py-3 text-[var(--warm-charcoal)]/60">₹{c.min_order_amount}</td>
                <td className="px-4 py-3 text-[var(--warm-charcoal)]/60">{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                <td className="px-4 py-3 text-[var(--warm-charcoal)]/60 text-xs">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-IN') : 'Never'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(c)} className="text-xs text-[var(--saffron)] hover:underline font-medium">Edit</button>
                    <button onClick={() => toggleActive(c.id, c.is_active)} className="text-xs text-[var(--indigo-deep)] hover:underline font-medium">{c.is_active ? 'Disable' : 'Enable'}</button>
                    <button onClick={() => deleteCoupon(c.id)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <div className="text-center py-12"><p className="text-[var(--warm-charcoal)]/40 text-sm">No coupons yet</p></div>}
      </div>
    </div>
  )
}

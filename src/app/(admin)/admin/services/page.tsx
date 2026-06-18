'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ServiceItem, ServiceCategory } from '@/lib/hooks/useServiceItems'

const CATEGORIES: { value: ServiceCategory; label: string; emoji: string }[] = [
  { value: 'gyanampeetham', label: 'Gyanampeetham', emoji: '🕉️' },
  { value: 'vastu_painting', label: 'Vastu Paintings', emoji: '🖼️' },
  { value: 'sadhana', label: 'Saadhana', emoji: '🙏' },
  { value: 'mahaganpati', label: 'Mahaganpati', emoji: '🐘' },
  { value: 'puja_ritual', label: 'Pooja & Rituals', emoji: '🪔' },
  { value: 'ardra_jalam', label: 'Ardra Jalam', emoji: '💧' },
  { value: 'ayurveda', label: 'Ayurveda & Med Astro', emoji: '🌿' },
  { value: 'course', label: 'Learning Courses', emoji: '📚' },
]

const EMPTY_FORM: Partial<ServiceItem> = {
  category: 'gyanampeetham',
  title: '', subtitle: '', description: '', long_description: '',
  price: undefined, original_price: undefined, currency: 'INR',
  duration: '', level: '', image_url: '', video_url: '',
  instructor_name: '', instructor_bio: '',
  is_featured: false, is_active: true, is_bookable: false, is_live: false,
  max_participants: 1, tags: [], badge_text: '', badge_color: '',
  metadata: {}, display_order: 0,
}

export default function AdminServicesPage() {
  const supabase = createClient()
  const [items, setItems] = useState<ServiceItem[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'items' | 'bookings'>('items')
  const [catFilter, setCatFilter] = useState<ServiceCategory | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ServiceItem | null>(null)
  const [form, setForm] = useState<Partial<ServiceItem>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: its }, { data: bks }] = await Promise.all([
      (supabase as any).from('service_items').select('*').order('category').order('display_order'),
      (supabase as any).from('service_bookings')
        .select('*, service_items(title,category), profiles(full_name,email)')
        .order('created_at', { ascending: false })
        .limit(200),
    ])
    if (its) setItems(its as ServiceItem[])
    if (bks) setBookings(bks)
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  function openEdit(item: ServiceItem) {
    setEditing(item)
    setForm({ ...item })
    setShowForm(true)
  }

  async function saveItem() {
    if (!form.title?.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    const payload = {
      category: form.category, title: form.title, subtitle: form.subtitle || null,
      description: form.description || null, long_description: form.long_description || null,
      price: form.price ?? null, original_price: form.original_price ?? null, currency: form.currency || 'INR',
      duration: form.duration || null, level: form.level || null,
      image_url: form.image_url || null, video_url: form.video_url || null,
      instructor_name: form.instructor_name || null, instructor_bio: form.instructor_bio || null,
      is_featured: !!form.is_featured, is_active: !!form.is_active,
      is_bookable: !!form.is_bookable, is_live: !!form.is_live,
      max_participants: form.max_participants || 1,
      tags: form.tags || [], badge_text: form.badge_text || null, badge_color: form.badge_color || null,
      metadata: form.metadata || {}, display_order: form.display_order || 0,
    }
    let err
    if (editing) {
      const res = await (supabase as any).from('service_items').update(payload).eq('id', editing.id)
      err = res.error
    } else {
      const res = await (supabase as any).from('service_items').insert(payload)
      err = res.error
    }
    if (err) { toast.error(err.message); setSaving(false); return }
    toast.success(editing ? 'Updated!' : 'Created!')
    setShowForm(false)
    await loadAll()
    setSaving(false)
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return
    setDeleting(id)
    const { error } = await (supabase as any).from('service_items').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Deleted'); await loadAll() }
    setDeleting(null)
  }

  async function toggleActive(item: ServiceItem) {
    await (supabase as any).from('service_items').update({ is_active: !item.is_active }).eq('id', item.id)
    await loadAll()
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    const { error } = await (supabase as any).from('service_bookings').update({ status }).eq('id', bookingId)
    if (error) toast.error(error.message)
    else { toast.success('Status updated'); await loadAll() }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[var(--saffron)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const filtered = (catFilter === 'all' ? items : items.filter(i => i.category === catFilter))
    .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()) || (i.subtitle || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Divine Services
          </h1>
          <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">
            Manage all service items, bookings, and content across all 8 categories
          </p>
        </div>
        <button onClick={openNew} className="btn-divine px-5 py-2.5 text-sm inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add New Item
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Items', value: items.length, icon: 'inventory_2', color: 'text-[var(--indigo-deep)]' },
          { label: 'Active', value: items.filter(i => i.is_active).length, icon: 'check_circle', color: 'text-emerald-600' },
          { label: 'Bookable', value: items.filter(i => i.is_bookable).length, icon: 'event_available', color: 'text-[var(--terracotta)]' },
          { label: 'Bookings', value: bookings.length, icon: 'book_online', color: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="bento-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`material-symbols-outlined text-[20px] ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <span className="text-xs text-[var(--warm-charcoal)]/50 uppercase tracking-widest" style={{ fontFamily: "'Sora', sans-serif" }}>{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['items', 'bookings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all ${tab === t ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:border-[var(--indigo-deep)]'}`}>
            {t === 'items' ? `Service Items (${items.length})` : `Bookings (${bookings.length})`}
          </button>
        ))}
      </div>

      {tab === 'items' && (
        <>
          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title…"
              className="border border-[var(--warm-sand)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--indigo-deep)] w-full sm:w-64"
            />
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setCatFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${catFilter === 'all' ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                All ({items.length})
              </button>
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCatFilter(c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${catFilter === c.value ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                  {c.emoji} {c.label} ({items.filter(i => i.category === c.value).length})
                </button>
              ))}
            </div>
          </div>

          {/* Items table */}
          <div className="bento-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--outline-variant)]/20 bg-[var(--warm-sand)]/50">
                    {['Category', 'Title', 'Price', 'Status', 'Flags', 'Order', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--warm-charcoal)]/50 font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-[var(--warm-charcoal)]/40">No items found</td></tr>
                  ) : filtered.map(item => {
                    const cat = CATEGORIES.find(c => c.value === item.category)
                    return (
                      <tr key={item.id} className="border-b border-[var(--outline-variant)]/10 hover:bg-[var(--warm-sand)]/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-[var(--warm-sand)] text-[var(--indigo-deep)] font-medium whitespace-nowrap">
                            {cat?.emoji} {cat?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          <p className="font-semibold text-[var(--indigo-deep)] truncate">{item.title}</p>
                          {item.subtitle && <p className="text-[11px] text-[var(--warm-charcoal)]/50 truncate">{item.subtitle}</p>}
                          {item.instructor_name && <p className="text-[11px] text-[var(--saffron)] truncate">👤 {item.instructor_name}</p>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.price ? (
                            <div>
                              <span className="font-bold text-[var(--terracotta)]">₹{item.price.toLocaleString('en-IN')}</span>
                              {item.original_price && <span className="text-[11px] text-[var(--warm-charcoal)]/40 line-through ml-1">₹{item.original_price.toLocaleString('en-IN')}</span>}
                            </div>
                          ) : <span className="text-[var(--warm-charcoal)]/30 text-xs">Free</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleActive(item)}
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition-all ${item.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                            {item.is_active ? '● Active' : '○ Off'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap min-w-[80px]">
                            {item.is_featured && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">⭐</span>}
                            {item.is_bookable && <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full">📅</span>}
                            {item.is_live && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">🔴</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--warm-charcoal)]/50 font-mono">{item.display_order}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(item)}
                              className="w-8 h-8 rounded-lg bg-[var(--indigo-deep)]/10 hover:bg-[var(--indigo-deep)] hover:text-white text-[var(--indigo-deep)] flex items-center justify-center transition-all"
                              title="Edit">
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button onClick={() => deleteItem(item.id)} disabled={deleting === item.id}
                              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center transition-all disabled:opacity-50"
                              title="Delete">
                              <span className="material-symbols-outlined text-[16px]">{deleting === item.id ? 'hourglass_empty' : 'delete'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'bookings' && (
        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--outline-variant)]/20 bg-[var(--warm-sand)]/50">
                  {['User', 'Service', 'Date', 'Amount', 'Payment', 'Status', 'Notes', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--warm-charcoal)]/50 font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-[var(--warm-charcoal)]/40">No bookings yet</td></tr>
                ) : bookings.map((b: any) => (
                  <tr key={b.id} className="border-b border-[var(--outline-variant)]/10 hover:bg-[var(--warm-sand)]/20">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[var(--indigo-deep)] text-xs">{b.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-[11px] text-[var(--warm-charcoal)]/40">{b.profiles?.email}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="text-xs font-medium text-[var(--indigo-deep)] truncate">{b.service_items?.title || '-'}</p>
                      <p className="text-[11px] text-[var(--warm-charcoal)]/40 capitalize">{(b.service_items?.category || '').replace(/_/g, ' ')}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--warm-charcoal)]/60 whitespace-nowrap">
                      {new Date(b.preferred_date || b.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-[var(--terracotta)] whitespace-nowrap">
                      {b.amount ? `₹${Number(b.amount).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${b.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : b.payment_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select value={b.status} onChange={e => updateBookingStatus(b.id, e.target.value)}
                        className="text-xs border border-[var(--warm-sand)] rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[var(--indigo-deep)]">
                        {['pending','confirmed','in_progress','completed','cancelled','refunded'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 max-w-[140px]">
                      <p className="text-[11px] text-[var(--warm-charcoal)]/50 truncate">{b.notes || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigator.clipboard.writeText(b.id)}
                        className="w-8 h-8 rounded-lg bg-[var(--warm-sand)] hover:bg-[var(--indigo-deep)] hover:text-white text-[var(--indigo-deep)]/50 flex items-center justify-center transition-all"
                        title="Copy booking ID">
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FORM MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[var(--outline-variant)]/20 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="font-bold text-[var(--indigo-deep)] text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                {editing ? 'Edit Service Item' : 'Add New Service Item'}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-[var(--warm-sand)] flex items-center justify-center hover:bg-[var(--warm-sand)]/70">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ServiceCategory }))}
                  className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)] bg-white">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                </select>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Title *</label>
                  <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" placeholder="Service title" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Subtitle</label>
                  <input value={form.subtitle || ''} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                    className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" placeholder="Short tagline" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Short Description</label>
                <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)] resize-none" placeholder="Brief description shown on cards" />
              </div>

              {/* Long Description */}
              <div>
                <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Full Description (Markdown supported)</label>
                <textarea value={form.long_description || ''} onChange={e => setForm(f => ({ ...f, long_description: e.target.value }))} rows={6}
                  className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)] resize-none font-mono" placeholder="Detailed description for the service page…" />
              </div>

              {/* Price row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Price (₹)</label>
                  <input type="number" value={form.price ?? ''} onChange={e => setForm(f => ({ ...f, price: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" placeholder="2999" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Original Price</label>
                  <input type="number" value={form.original_price ?? ''} onChange={e => setForm(f => ({ ...f, original_price: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" placeholder="4999" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Duration</label>
                  <input value={form.duration || ''} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" placeholder="8 Weeks" />
                </div>
              </div>

              {/* Level & Instructor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Level</label>
                  <select value={form.level || ''} onChange={e => setForm(f => ({ ...f, level: e.target.value || undefined }))}
                    className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)] bg-white">
                    <option value="">- None -</option>
                    {['Beginner','Intermediate','Advanced','All Levels'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Instructor Name</label>
                  <input value={form.instructor_name || ''} onChange={e => setForm(f => ({ ...f, instructor_name: e.target.value }))}
                    className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" placeholder="Acharya Name" />
                </div>
              </div>

              {/* Instructor bio */}
              <div>
                <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Instructor Bio</label>
                <textarea value={form.instructor_bio || ''} onChange={e => setForm(f => ({ ...f, instructor_bio: e.target.value }))} rows={2}
                  className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)] resize-none" placeholder="Brief instructor background" />
              </div>

              {/* Image & Video URL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Image URL</label>
                  <input value={form.image_url || ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                    className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" placeholder="https://…" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Video URL</label>
                  <input value={form.video_url || ''} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                    className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" placeholder="https://youtube.com/…" />
                </div>
              </div>

              {/* Badge & Order */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Badge Text</label>
                  <input value={form.badge_text || ''} onChange={e => setForm(f => ({ ...f, badge_text: e.target.value }))}
                    className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" placeholder="New / Limited" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Badge Color</label>
                  <input value={form.badge_color || ''} onChange={e => setForm(f => ({ ...f, badge_color: e.target.value }))}
                    className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" placeholder="#cc2200" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Display Order</label>
                  <input type="number" value={form.display_order ?? 0} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                    className="w-full border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                </div>
              </div>

              {/* Max participants */}
              <div>
                <label className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-widest mb-1.5 block">Max Participants</label>
                <input type="number" min={1} value={form.max_participants ?? 1} onChange={e => setForm(f => ({ ...f, max_participants: Number(e.target.value) }))}
                  className="w-48 border border-[var(--warm-sand)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'is_active', label: 'Active', icon: 'check_circle' },
                  { key: 'is_featured', label: 'Featured', icon: 'star' },
                  { key: 'is_bookable', label: 'Bookable', icon: 'event_available' },
                  { key: 'is_live', label: 'Live Session', icon: 'live_tv' },
                ].map(t => (
                  <label key={t.key} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${(form as any)[t.key] ? 'border-[var(--indigo-deep)] bg-[var(--indigo-deep)]/5' : 'border-[var(--warm-sand)]'}`}>
                    <input type="checkbox" checked={!!(form as any)[t.key]} onChange={e => setForm(f => ({ ...f, [t.key]: e.target.checked }))} className="hidden" />
                    <span className={`material-symbols-outlined text-[18px] ${(form as any)[t.key] ? 'text-[var(--indigo-deep)]' : 'text-[var(--warm-charcoal)]/30'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                    <span className="text-xs font-semibold text-[var(--warm-charcoal)]/60">{t.label}</span>
                  </label>
                ))}
              </div>

              {/* Save */}
              <div className="flex gap-3 pt-2">
                <button onClick={saveItem} disabled={saving} className="btn-divine flex-1 py-3 font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
                  {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : editing ? 'Update Item' : 'Create Item'}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-outline-divine px-6 py-3">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

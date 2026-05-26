'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Event {
  id: string
  title: string
  type: string
  description: string | null
  start_datetime: string
  end_datetime: string | null
  location: string | null
  meeting_link: string | null
  price: number
  max_attendees: number | null
  cover_image_url: string | null
  is_free: boolean
  is_published: boolean
  created_at: string
}

const EVENT_TYPES = ['satsang', 'workshop', 'webinar', 'pilgrimage', 'puja', 'other']
const TYPE_COLORS: Record<string, string> = {
  satsang: 'bg-amber-100 text-amber-700',
  workshop: 'bg-blue-100 text-blue-700',
  webinar: 'bg-violet-100 text-violet-700',
  pilgrimage: 'bg-emerald-100 text-emerald-700',
  puja: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
}

const EMPTY_FORM = {
  title: '', type: 'satsang', description: '', start_datetime: '', end_datetime: '',
  location: '', meeting_link: '', price: 0, max_attendees: '', is_free: true, is_published: false,
}

export default function AdminEventsPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Event | null>(null)
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  async function load() {
    const { data } = await supabase.from('events').select('*').order('start_datetime', { ascending: false })
    if (data) setEvents(data)
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setCoverFile(null)
    setCoverPreview(null)
    setModal('create')
  }

  function openEdit(ev: Event) {
    setEditing(ev)
    setForm({
      title: ev.title, type: ev.type, description: ev.description || '',
      start_datetime: ev.start_datetime ? ev.start_datetime.slice(0, 16) : '',
      end_datetime: ev.end_datetime ? ev.end_datetime.slice(0, 16) : '',
      location: ev.location || '', meeting_link: ev.meeting_link || '',
      price: ev.price, max_attendees: ev.max_attendees?.toString() || '',
      is_free: ev.is_free, is_published: ev.is_published,
    })
    setCoverFile(null)
    setCoverPreview(ev.cover_image_url)
    setModal('edit')
  }

  async function uploadCover(eventId: string): Promise<string | null> {
    if (!coverFile) return editing?.cover_image_url || null
    const ext = coverFile.name.split('.').pop()
    const path = `events/${eventId}.${ext}`
    const { error } = await supabase.storage.from('blog-images').upload(path, coverFile, { upsert: true })
    if (error) { toast.error('Image upload failed'); return null }
    const { data } = supabase.storage.from('blog-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!form.title || !form.start_datetime) { toast.error('Title and start date are required'); return }
    setSaving(true)
    const payload = {
      title: form.title, type: form.type,
      description: form.description || null,
      start_datetime: form.start_datetime,
      end_datetime: form.end_datetime || null,
      location: form.location || null,
      meeting_link: form.meeting_link || null,
      price: form.is_free ? 0 : Number(form.price),
      max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
      is_free: form.is_free, is_published: form.is_published,
      updated_at: new Date().toISOString(),
    }

    if (modal === 'create') {
      const { data, error } = await supabase.from('events').insert(payload).select().single()
      if (error || !data) { toast.error('Failed: ' + error?.message); setSaving(false); return }
      const cover_image_url = await uploadCover(data.id)
      if (cover_image_url) await supabase.from('events').update({ cover_image_url }).eq('id', data.id)
      toast.success('Event created!')
    } else if (editing) {
      const cover_image_url = await uploadCover(editing.id)
      const { error } = await supabase.from('events').update({ ...payload, cover_image_url }).eq('id', editing.id)
      if (error) { toast.error('Failed: ' + error.message); setSaving(false); return }
      toast.success('Event updated!')
    }

    setSaving(false)
    setModal(null)
    await load()
  }

  async function togglePublish(ev: Event) {
    await supabase.from('events').update({ is_published: !ev.is_published }).eq('id', ev.id)
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_published: !ev.is_published } : e))
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return
    await supabase.from('events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
    toast.success('Deleted')
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setCoverFile(f)
    setCoverPreview(URL.createObjectURL(f))
  }

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)
  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow text-[var(--terracotta)]">ॐ</div></div>

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>event_note</span>
          Events <span className="text-[var(--warm-charcoal)]/40 font-normal">({events.length})</span>
        </h1>
        <button onClick={openCreate} className="btn-divine px-4 py-2 text-sm inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">add</span>
          Create Event
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...EVENT_TYPES].map(t => (
          <button key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${filter === t ? 'bg-[var(--indigo-deep)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:bg-[var(--warm-sand)]/80'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-3">
        {filtered.map(ev => (
          <div key={ev.id} className="card-divine p-4 flex gap-4">
            {ev.cover_image_url ? (
              <img src={ev.cover_image_url} alt={ev.title} className="w-20 h-16 object-cover rounded-lg flex-shrink-0" />
            ) : (
              <div className="w-20 h-16 rounded-lg bg-[var(--indigo-deep)]/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[24px] text-[var(--indigo-deep)]/30" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-semibold text-[var(--indigo-deep)]">{ev.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_COLORS[ev.type] || 'bg-gray-100 text-gray-600'}`}>{ev.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ev.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50'}`}>
                      {ev.is_published ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-xs text-[var(--warm-charcoal)]/40">
                      {new Date(ev.start_datetime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {ev.is_free ? (
                      <span className="text-xs text-emerald-600 font-medium">Free</span>
                    ) : (
                      <span className="text-xs text-[var(--terracotta)] font-medium">₹{ev.price?.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  {ev.location && <p className="text-xs text-[var(--warm-charcoal)]/50 mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">location_on</span>{ev.location}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => togglePublish(ev)} className="text-xs text-[var(--indigo-deep)] hover:underline font-medium">{ev.is_published ? 'Unpublish' : 'Publish'}</button>
                  <button onClick={() => openEdit(ev)} className="text-xs text-[var(--saffron)] hover:underline font-medium">Edit</button>
                  <button onClick={() => deleteEvent(ev.id)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 card-divine">
            <span className="material-symbols-outlined text-[48px] text-[var(--warm-charcoal)]/20 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>event_note</span>
            <p className="text-[var(--warm-charcoal)]/40 text-sm">No events yet. Create your first event.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--warm-sand)]">
              <h2 className="font-bold text-[var(--indigo-deep)] text-lg">{modal === 'create' ? 'Create Event' : 'Edit Event'}</h2>
              <button onClick={() => setModal(null)} className="text-[var(--warm-charcoal)]/40 hover:text-[var(--warm-charcoal)] p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Cover image */}
              <div>
                <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Cover Image</label>
                <div className="flex items-center gap-3">
                  {coverPreview ? (
                    <img src={coverPreview} alt="cover" className="w-24 h-16 object-cover rounded-lg border border-[var(--warm-sand)]" />
                  ) : (
                    <div className="w-24 h-16 rounded-lg bg-[var(--warm-sand)] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px] text-[var(--warm-charcoal)]/30">image</span>
                    </div>
                  )}
                  <label className="cursor-pointer px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-xs font-medium text-[var(--indigo-deep)] hover:bg-[var(--warm-sand)]/50 transition-colors">
                    Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="Event title..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                    {EVENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Max Attendees</label>
                  <input type="number" value={form.max_attendees} onChange={e => setForm(f => ({ ...f, max_attendees: e.target.value }))} className={inputCls} placeholder="Unlimited" min="1" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Start Date & Time *</label>
                  <input type="datetime-local" value={form.start_datetime} onChange={e => setForm(f => ({ ...f, start_datetime: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">End Date & Time</label>
                  <input type="datetime-local" value={form.end_datetime} onChange={e => setForm(f => ({ ...f, end_datetime: e.target.value }))} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Location</label>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputCls} placeholder="Physical location or 'Online'" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Meeting Link (for online events)</label>
                  <input type="url" value={form.meeting_link} onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))} className={inputCls} placeholder="https://meet.google.com/..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${inputCls} resize-none`} placeholder="Event description..." />
                </div>

                {/* Pricing */}
                <div className="col-span-2 flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_free} onChange={e => setForm(f => ({ ...f, is_free: e.target.checked, price: 0 }))} className="rounded" />
                    <span className="text-sm font-medium text-[var(--warm-charcoal)]">Free Event</span>
                  </label>
                  {!form.is_free && (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-[var(--warm-charcoal)]/60">₹</span>
                      <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className={inputCls} min="0" placeholder="Price" />
                    </div>
                  )}
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="rounded" />
                    <span className="text-sm font-medium text-[var(--warm-charcoal)]">Publish immediately</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-[var(--warm-sand)]">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 rounded-xl border border-[var(--warm-sand)] text-sm font-medium text-[var(--warm-charcoal)]/60 hover:bg-[var(--warm-sand)]/40 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 btn-divine px-4 py-2 text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[16px]">{saving ? 'hourglass_empty' : 'save'}</span>
                {saving ? 'Saving...' : (modal === 'create' ? 'Create Event' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

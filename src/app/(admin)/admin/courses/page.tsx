'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import SudarshanLoader from '@/components/SudarshanLoader'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels']

interface Course {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  long_description: string | null
  price: number | null
  original_price: number | null
  duration: string | null
  level: string | null
  image_url: string | null
  video_url: string | null
  instructor_name: string | null
  instructor_bio: string | null
  is_featured: boolean
  is_active: boolean
  is_bookable: boolean
  is_live: boolean
  max_participants: number
  badge_text: string | null
  badge_color: string | null
  display_order: number
  created_at: string
}

interface Enrollment {
  id: string
  created_at: string
  amount: number
  status: string
  payment_status: string
  service_item_id: string
  user_id: string
}

const EMPTY_FORM: Partial<Course> = {
  title: '', subtitle: '', description: '', long_description: '',
  price: undefined, original_price: undefined,
  duration: '', level: 'Beginner',
  image_url: '', video_url: '',
  instructor_name: '', instructor_bio: '',
  is_featured: false, is_active: true, is_bookable: true, is_live: false,
  max_participants: 30, badge_text: '', badge_color: '#D4A017', display_order: 0,
}

export default function AdminCoursesPage() {
  const supabase = createClient()

  const [tab, setTab] = useState<'courses' | 'enrollments'>('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [form, setForm] = useState<Partial<Course>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [{ data: cs }, { data: enr }] = await Promise.all([
      (supabase as any)
        .from('service_items')
        .select('*')
        .eq('category', 'course')
        .order('display_order'),
      // No profiles join — avoids silent failure when FK isn't defined in DB
      (supabase as any)
        .from('service_bookings')
        .select('id, created_at, amount, status, payment_status, service_item_id, user_id')
        .order('created_at', { ascending: false })
        .limit(500),
    ])
    if (cs) setCourses(cs as Course[])
    if (enr) {
      const courseIds = new Set((cs || []).map((c: Course) => c.id))
      setEnrollments((enr as Enrollment[]).filter(e => courseIds.has(e.service_item_id)))
    }
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load + real-time subscription on service_bookings
  useEffect(() => {
    loadAll()
    const channel = supabase
      .channel('admin-enrollments-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_bookings' }, () => {
        loadAll()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadAll]) // eslint-disable-line react-hooks/exhaustive-deps

  function openNew() {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  function openEdit(c: Course) {
    setEditing(c)
    setForm({ ...c })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const sf = (k: keyof Course, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { toast.error('Course title is required'); return }
    setSaving(true)
    const payload = {
      category: 'course',
      title: form.title!.trim(),
      subtitle: form.subtitle?.trim() || null,
      description: form.description?.trim() || null,
      long_description: form.long_description?.trim() || null,
      price: form.price ?? null,
      original_price: form.original_price ?? null,
      currency: 'INR',
      duration: form.duration?.trim() || null,
      level: form.level || null,
      image_url: form.image_url?.trim() || null,
      video_url: form.video_url?.trim() || null,
      instructor_name: form.instructor_name?.trim() || null,
      instructor_bio: form.instructor_bio?.trim() || null,
      is_featured: !!form.is_featured,
      is_active: !!form.is_active,
      is_bookable: !!form.is_bookable,
      is_live: !!form.is_live,
      max_participants: Number(form.max_participants) || 30,
      tags: [],
      badge_text: form.badge_text?.trim() || null,
      badge_color: form.badge_color || null,
      metadata: {},
      display_order: Number(form.display_order) || 0,
    }
    let err: any
    if (editing) {
      const res = await (supabase as any).from('service_items').update(payload).eq('id', editing.id)
      err = res.error
    } else {
      const res = await (supabase as any).from('service_items').insert(payload)
      err = res.error
    }
    if (err) { toast.error(err.message); setSaving(false); return }
    toast.success(editing ? 'Course updated!' : 'Course created!')
    closeForm()
    await loadAll()
    setSaving(false)
  }

  async function deleteCourse(id: string) {
    if (!confirm('Delete this course? All enrollment records will also be removed.')) return
    setDeleting(id)
    const { error } = await (supabase as any).from('service_items').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Course deleted'); await loadAll() }
    setDeleting(null)
  }

  async function toggleField(id: string, field: 'is_active' | 'is_bookable' | 'is_live' | 'is_featured', val: boolean) {
    await (supabase as any).from('service_items').update({ [field]: val }).eq('id', id)
    await loadAll()
  }

  const filtered = courses.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.instructor_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const revenue = enrollments.filter(e => e.payment_status === 'paid').reduce((s, e) => s + (e.amount || 0), 0)

  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
    catch { return iso }
  }

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">

      {/* ── Form Drawer ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Form header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-bold text-[var(--indigo-deep)]">
                  {editing ? 'Edit Course' : 'New Course'}
                </h2>
                {editing && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{editing.title}</p>}
              </div>
              <button onClick={closeForm} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[18px] text-gray-500">close</span>
              </button>
            </div>

            <div className="flex-1 p-6 space-y-5">

              {/* Status toggles */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { k: 'is_active', label: 'Active', desc: 'Visible to users' },
                  { k: 'is_bookable', label: 'Enrollable', desc: 'Users can enroll' },
                  { k: 'is_live', label: 'Live Class', desc: 'Real-time sessions' },
                  { k: 'is_featured', label: 'Featured', desc: 'Show on homepage' },
                ] as const).map(({ k, label, desc }) => (
                  <button key={k} onClick={() => sf(k, !form[k])}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${form[k] ? 'border-[var(--indigo-deep)] bg-[var(--indigo-deep)]/5' : 'border-gray-200 bg-gray-50'}`}>
                    <div className={`w-9 h-5 rounded-full flex items-center transition-all ${form[k] ? 'bg-[var(--indigo-deep)]' : 'bg-gray-300'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full bg-white mx-0.5 transition-all ${form[k] ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">{label}</p>
                      <p className="text-[10px] text-gray-400">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Core info */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Course Info</h3>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Course Title *</label>
                  <input value={form.title || ''} onChange={e => sf('title', e.target.value)}
                    placeholder="e.g. Vedic Astrology Foundations"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Subtitle</label>
                  <input value={form.subtitle || ''} onChange={e => sf('subtitle', e.target.value)}
                    placeholder="Short tagline"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                  <textarea value={form.description || ''} onChange={e => sf('description', e.target.value)}
                    rows={3} placeholder="Short description shown on course cards"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)] resize-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Full Description</label>
                  <textarea value={form.long_description || ''} onChange={e => sf('long_description', e.target.value)}
                    rows={4} placeholder="Detailed curriculum, what students will learn…"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)] resize-none" />
                </div>
              </div>

              {/* Instructor */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Instructor</h3>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Instructor Name</label>
                  <input value={form.instructor_name || ''} onChange={e => sf('instructor_name', e.target.value)}
                    placeholder="e.g. Pt. Ramesh Sharma"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Instructor Bio</label>
                  <textarea value={form.instructor_bio || ''} onChange={e => sf('instructor_bio', e.target.value)}
                    rows={2} placeholder="Brief credentials and experience"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)] resize-none" />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Level</label>
                    <select value={form.level || 'Beginner'} onChange={e => sf('level', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]">
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Duration</label>
                    <input value={form.duration || ''} onChange={e => sf('duration', e.target.value)}
                      placeholder="e.g. 8 weeks · 24 hrs"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Max Students</label>
                    <input type="number" min={1} value={form.max_participants || 30} onChange={e => sf('max_participants', parseInt(e.target.value) || 30)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Display Order</label>
                    <input type="number" min={0} value={form.display_order || 0} onChange={e => sf('display_order', parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pricing</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Price (₹) <span className="text-gray-400 font-normal">— 0 for Free</span></label>
                    <input type="number" min={0} value={form.price ?? ''} onChange={e => sf('price', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Original Price (₹) <span className="text-gray-400 font-normal">for strike-through</span></label>
                    <input type="number" min={0} value={form.original_price ?? ''} onChange={e => sf('original_price', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="Optional"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Media</h3>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Cover Image URL</label>
                  <input value={form.image_url || ''} onChange={e => sf('image_url', e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                </div>
                {form.image_url && (
                  <img src={form.image_url} alt="preview"
                    className="w-full h-32 object-cover rounded-xl border border-gray-100"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">YouTube Video URL <span className="text-gray-400 font-normal">— intro / first session</span></label>
                  <input value={form.video_url || ''} onChange={e => sf('video_url', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                </div>
              </div>

              {/* Badge */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Badge</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Badge Text</label>
                    <input value={form.badge_text || ''} onChange={e => sf('badge_text', e.target.value)}
                      placeholder="e.g. Bestseller, New"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Badge Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.badge_color || '#D4A017'} onChange={e => sf('badge_color', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                      <input value={form.badge_color || '#D4A017'} onChange={e => sf('badge_color', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                    </div>
                  </div>
                </div>
                {form.badge_text && (
                  <span className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: `${form.badge_color || '#D4A017'}18`, color: form.badge_color || '#D4A017', border: `1px solid ${form.badge_color || '#D4A017'}40` }}>
                    {form.badge_text}
                  </span>
                )}
              </div>
            </div>

            {/* Save */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
              <button onClick={closeForm}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--indigo-deep), #4338ca)' }}>
                {saving ? <><SudarshanLoader px={16} />&nbsp;Saving…</> : editing ? 'Save Changes' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #312e81, #4338ca)' }}>
              <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-[var(--indigo-deep)]">Courses</h1>
              <p className="text-[11px] text-gray-400">{courses.length} courses · {enrollments.length} enrollments</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => loadAll()}
              className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all"
              title="Refresh data">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
            <button onClick={openNew}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, var(--indigo-deep), #4338ca)' }}>
              <span className="material-symbols-outlined text-[16px]">add</span>
              New Course
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="px-6 pb-3 flex gap-5 text-sm">
          {[
            { n: courses.filter(c => c.is_active).length, l: 'Active', color: 'text-emerald-600' },
            { n: courses.filter(c => c.is_live).length, l: 'Live', color: 'text-red-500' },
            { n: enrollments.filter(e => e.payment_status === 'paid').length, l: 'Enrollments', color: 'text-violet-600' },
            { n: `₹${revenue.toLocaleString('en-IN')}`, l: 'Revenue', color: 'text-[var(--saffron)]' },
          ].map(s => (
            <div key={s.l} className="flex items-baseline gap-1.5">
              <span className={`font-black text-base ${s.color}`}>{s.n}</span>
              <span className="text-[11px] text-gray-400">{s.l}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-1 border-t border-gray-100 pt-2 pb-0">
          {(['courses', 'enrollments'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg capitalize transition-all ${tab === t ? 'bg-[var(--indigo-deep)] text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'courses' ? `Courses (${courses.length})` : `Enrollments (${enrollments.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <SudarshanLoader size="sm" />
          </div>
        ) : tab === 'courses' ? (

          /* ── Courses list ── */
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1 max-w-xs">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-[17px]">search</span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search courses or instructors…"
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <span className="material-symbols-outlined text-[48px] mb-3 block text-gray-200" style={{ fontVariationSettings: "'FILL' 0" }}>school</span>
                {courses.length === 0
                  ? <><p className="font-semibold mb-1">No courses yet</p><p className="text-sm">Create your first course with the button above.</p></>
                  : <p>No courses match your search.</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(c => {
                  const enrollCount = enrollments.filter(e => e.service_item_id === c.id).length
                  return (
                    <div key={c.id}
                      className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 items-start hover:shadow-sm transition-all group">

                      {/* Cover thumbnail */}
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.title}
                          className="w-20 h-20 object-cover rounded-xl flex-shrink-0 border border-gray-100" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #312e81, #4338ca)' }}>
                          <span className="material-symbols-outlined text-white/40 text-[32px]" style={{ fontVariationSettings: "'FILL' 0" }}>menu_book</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex gap-1.5 flex-wrap mb-1.5">
                          {c.is_live && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">LIVE</span>}
                          {!c.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 font-semibold">Inactive</span>}
                          {!c.is_bookable && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Not enrollable</span>}
                          {c.level && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#3730a3' }}>{c.level}</span>}
                          {c.badge_text && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: `${c.badge_color || '#D4A017'}18`, color: c.badge_color || '#D4A017' }}>
                              {c.badge_text}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-gray-800 text-sm leading-snug truncate">{c.title}</h3>
                        {c.instructor_name && (
                          <p className="text-xs text-[var(--saffron)] mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                            {c.instructor_name}
                          </p>
                        )}

                        <div className="flex gap-3 mt-2 flex-wrap">
                          {c.duration && (
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>{c.duration}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">group</span>{enrollCount} enrolled
                          </span>
                          {c.price ? (
                            <span className="text-[11px] text-emerald-600 font-semibold">₹{c.price.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-[11px] text-blue-500 font-semibold">Free</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Quick toggles */}
                        <button onClick={() => toggleField(c.id, 'is_active', !c.is_active)}
                          title={c.is_active ? 'Deactivate' : 'Activate'}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[15px] transition-all ${c.is_active ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {c.is_active ? 'visibility' : 'visibility_off'}
                          </span>
                        </button>
                        <a href={`/admin/courses/${c.id}/curriculum`}
                          className="w-8 h-8 rounded-lg bg-violet-50 hover:bg-violet-100 flex items-center justify-center transition-all"
                          title="Manage Curriculum">
                          <span className="material-symbols-outlined text-[16px] text-violet-600">view_module</span>
                        </a>
                        <button onClick={() => openEdit(c)}
                          className="w-8 h-8 rounded-lg bg-[var(--indigo-deep)]/10 hover:bg-[var(--indigo-deep)]/20 flex items-center justify-center transition-all">
                          <span className="material-symbols-outlined text-[16px] text-[var(--indigo-deep)]">edit</span>
                        </button>
                        <button onClick={() => deleteCourse(c.id)} disabled={deleting === c.id}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all disabled:opacity-40">
                          {deleting === c.id
                            ? <SudarshanLoader px={14} />
                            : <span className="material-symbols-outlined text-[16px] text-red-500">delete</span>}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>

        ) : (

          /* ── Enrollments list ── */
          <>
            {enrollments.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <span className="material-symbols-outlined text-[48px] mb-3 block text-gray-200" style={{ fontVariationSettings: "'FILL' 0" }}>how_to_reg</span>
                <p className="font-semibold mb-1">No enrollments yet</p>
                <p className="text-sm">Students who enroll in courses will appear here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Student</th>
                      <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Course</th>
                      <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {enrollments.map(e => {
                      const course = courses.find(c => c.id === e.service_item_id)
                      return (
                        <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="font-mono text-[10px] text-gray-500 select-all">{e.user_id}</div>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-xs text-gray-700 font-medium line-clamp-1">{course?.title || 'Unknown'}</p>
                            {course?.instructor_name && (
                              <p className="text-[11px] text-gray-400">{course.instructor_name}</p>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {e.amount > 0
                              ? <span className="text-xs font-semibold text-emerald-600">₹{e.amount.toLocaleString('en-IN')}</span>
                              : <span className="text-xs text-blue-500 font-semibold">Free</span>}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              e.payment_status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {e.payment_status === 'paid' ? 'Confirmed' : e.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[11px] text-gray-400">{fmt(e.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

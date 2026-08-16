'use client'

import SudarshanLoader from '@/components/SudarshanLoader'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

import Icon from '@/components/ui/Icon'

interface GalleryItem {
  id: string
  title: string | null
  caption: string | null
  category: string
  image_url: string
  storage_path: string | null
  alt_text: string | null
  credit: string | null
  taken_at: string | null
  is_published: boolean
  in_carousel: boolean
  display_order: number
  width: number | null
  height: number | null
  created_at: string
}

const CATEGORIES = ['general', 'events', 'temples', 'pujas', 'team', 'media', 'products', 'pilgrimage'] as const

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-100 text-gray-700',
  events: 'bg-violet-100 text-violet-700',
  temples: 'bg-amber-100 text-amber-700',
  pujas: 'bg-orange-100 text-orange-700',
  team: 'bg-blue-100 text-blue-700',
  media: 'bg-rose-100 text-rose-700',
  products: 'bg-emerald-100 text-emerald-700',
  pilgrimage: 'bg-teal-100 text-teal-700',
}

const MAX_BYTES = 10 * 1024 * 1024 // must match the bucket's file_size_limit
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

const EMPTY_FORM = {
  title: '', caption: '', category: 'general', alt_text: '', credit: '',
  taken_at: '', is_published: false, in_carousel: false, display_order: 0,
}

/** Reads intrinsic dimensions so the public page can reserve space and avoid
 *  layout shift. Resolves to nulls rather than rejecting - a missing dimension
 *  must never block an upload. */
function readDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth || null, height: img.naturalHeight || null })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => { resolve({ width: null, height: null }); URL.revokeObjectURL(url) }
    img.src = url
  })
}

export default function AdminGalleryPage() {
  const supabase = createClient()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'carousel'>('all')
  const fileInput = useRef<HTMLInputElement | null>(null)

  async function load() {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) toast.error(`Could not load gallery: ${error.message}`)
    if (data) setItems(data as GalleryItem[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => items.filter(i => {
    if (catFilter !== 'all' && i.category !== catFilter) return false
    if (statusFilter === 'published' && !i.is_published) return false
    if (statusFilter === 'hidden' && i.is_published) return false
    if (statusFilter === 'carousel' && !i.in_carousel) return false
    return true
  }), [items, catFilter, statusFilter])

  const publishedCount = items.filter(i => i.is_published).length
  const carouselCount = items.filter(i => i.in_carousel && i.is_published).length

  // ── Upload ────────────────────────────────────────────────────────────────
  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return
    const list = Array.from(files)

    const rejected = list.filter(f => !ACCEPTED.includes(f.type) || f.size > MAX_BYTES)
    const accepted = list.filter(f => ACCEPTED.includes(f.type) && f.size <= MAX_BYTES)
    if (rejected.length) {
      toast.error(
        `${rejected.length} file${rejected.length > 1 ? 's' : ''} skipped - must be JPEG, PNG, WebP, AVIF or GIF under 10 MB`
      )
    }
    if (!accepted.length) return

    setUploading(true)
    setProgress({ done: 0, total: accepted.length })

    // Uploads are sequential on purpose: a parallel burst of large images
    // regularly trips Supabase's rate limit and the partial failure is far
    // harder to reason about than a slightly slower upload.
    let ok = 0
    const startOrder = items.length ? Math.max(...items.map(i => i.display_order)) + 1 : 0

    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i]
      try {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const safe = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40)
        const path = `${crypto.randomUUID()}-${safe}.${ext}`

        const { error: upErr } = await supabase.storage
          .from('gallery')
          .upload(path, file, { upsert: false, contentType: file.type, cacheControl: '31536000' })
        if (upErr) throw upErr

        const { data: pub } = supabase.storage.from('gallery').getPublicUrl(path)
        const dims = await readDimensions(file)

        const { error: insErr } = await supabase.from('gallery_items').insert({
          title: file.name.replace(/\.[^.]+$/, '').slice(0, 120),
          image_url: pub.publicUrl,
          storage_path: path,
          category: 'general',
          // Uploads land switched OFF. Nothing reaches the public site until an
          // admin deliberately publishes it.
          is_published: false,
          in_carousel: false,
          display_order: startOrder + i,
          width: dims.width,
          height: dims.height,
        })
        if (insErr) {
          // Roll back the orphaned object so the bucket does not accumulate
          // files with no row pointing at them.
          await supabase.storage.from('gallery').remove([path])
          throw insErr
        }
        ok++
      } catch (e: any) {
        toast.error(`${file.name}: ${e?.message || 'upload failed'}`)
      }
      setProgress({ done: i + 1, total: accepted.length })
    }

    setUploading(false)
    setProgress(null)
    if (fileInput.current) fileInput.current.value = ''
    if (ok) toast.success(`${ok} image${ok > 1 ? 's' : ''} uploaded - publish them to make them visible`)
    load()
  }

  // ── Toggles ───────────────────────────────────────────────────────────────
  async function toggle(item: GalleryItem, field: 'is_published' | 'in_carousel') {
    const next = !item[field]
    // Optimistic: the switch should feel instant, and we reload on failure.
    setItems(prev => prev.map(i => (i.id === item.id ? { ...i, [field]: next } : i)))
    // Built explicitly rather than with a computed key, so the payload keeps its
    // literal shape instead of widening to a string index signature.
    const patch = field === 'is_published'
      // Un-publishing must drop the image from the carousel too, otherwise a
      // hidden image keeps occupying a homepage slot.
      ? (next ? { is_published: true } : { is_published: false, in_carousel: false })
      : { in_carousel: next }
    const { error } = await supabase.from('gallery_items').update(patch).eq('id', item.id)
    if (error) {
      toast.error(error.message)
      load()
      return
    }
    // Reflect the cascade locally so the carousel checkbox clears immediately.
    if (field === 'is_published' && !next) {
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, in_carousel: false } : i)))
    }
    if (field === 'is_published') {
      toast.success(next ? 'Now visible on the gallery page' : 'Hidden from the public site')
    } else {
      toast.success(next ? 'Added to the homepage carousel' : 'Removed from the homepage carousel')
    }
  }

  async function move(item: GalleryItem, dir: -1 | 1) {
    const ordered = [...items].sort((a, b) => a.display_order - b.display_order)
    const idx = ordered.findIndex(i => i.id === item.id)
    const swap = ordered[idx + dir]
    if (!swap) return
    setItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, display_order: swap.display_order }
      : i.id === swap.id ? { ...i, display_order: item.display_order } : i
    ))
    const [a, b] = await Promise.all([
      supabase.from('gallery_items').update({ display_order: swap.display_order }).eq('id', item.id),
      supabase.from('gallery_items').update({ display_order: item.display_order }).eq('id', swap.id),
    ])
    if (a.error || b.error) { toast.error('Could not reorder'); load() }
  }

  async function remove(item: GalleryItem) {
    if (!confirm(`Delete "${item.title || 'this image'}" permanently? This also removes the file from storage.`)) return
    const { error } = await supabase.from('gallery_items').delete().eq('id', item.id)
    if (error) { toast.error(error.message); return }
    // Best effort: the row is the source of truth, so a failed object delete
    // leaves a harmless orphan rather than a broken gallery entry.
    if (item.storage_path) await supabase.storage.from('gallery').remove([item.storage_path])
    toast.success('Deleted')
    load()
  }

  function openEdit(item: GalleryItem) {
    setEditing(item)
    setForm({
      title: item.title || '', caption: item.caption || '', category: item.category,
      alt_text: item.alt_text || '', credit: item.credit || '',
      taken_at: item.taken_at || '', is_published: item.is_published,
      in_carousel: item.in_carousel, display_order: item.display_order,
    })
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    const { error } = await supabase.from('gallery_items').update({
      title: form.title.trim() || null,
      caption: form.caption.trim() || null,
      category: form.category,
      alt_text: form.alt_text.trim() || null,
      credit: form.credit.trim() || null,
      taken_at: form.taken_at || null,
      is_published: form.is_published,
      in_carousel: form.in_carousel,
      display_order: Number(form.display_order) || 0,
    }).eq('id', editing.id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Saved')
    setEditing(null)
    load()
  }

  if (loading) return <SudarshanLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: 'var(--font-display)' }}>
            Media &amp; Gallery
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {items.length} image{items.length === 1 ? '' : 's'} &middot; {publishedCount} published &middot; {carouselCount} in the homepage carousel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED.join(',')}
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="btn-divine text-sm px-5 py-2.5 disabled:opacity-60 flex items-center gap-2"
          >
            <Icon name={uploading ? 'progress_activity' : 'upload'} size={16} />
            {uploading && progress
              ? `Uploading ${progress.done}/${progress.total}...`
              : 'Upload images'}
          </button>
        </div>
      </div>

      {/* Nothing-published warning: the single most likely support question */}
      {items.length > 0 && publishedCount === 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <Icon name="info" size={18} className="text-amber-700 mt-0.5" />
          <p className="text-sm text-amber-900">
            You have uploaded images but none are published, so the public gallery page and the
            homepage carousel are both hidden. Turn on <strong>Published</strong> on an image to make
            the gallery appear.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="input-divine text-sm py-2"
        >
          <option value="all">All statuses</option>
          <option value="published">Published only</option>
          <option value="hidden">Hidden only</option>
          <option value="carousel">In carousel</option>
        </select>
        <button
          onClick={() => setCatFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            catFilter === 'all' ? 'bg-[var(--indigo-deep)] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
              catFilter === c ? 'bg-[var(--indigo-deep)] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      {!filtered.length ? (
        <div className="card-divine p-12 text-center">
          <Icon name="photo_library" size={44} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="font-semibold text-[var(--indigo-deep)]">
            {items.length ? 'No images match these filters' : 'No images yet'}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {items.length
              ? 'Try a different category or status.'
              : 'Upload images to build the gallery. They stay hidden until you publish them.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="card-divine overflow-hidden flex flex-col">
              <div className="relative h-44 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt={item.alt_text || item.title || 'Gallery image'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general}`}>
                  {item.category}
                </span>
                {!item.is_published && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800/85 text-white">
                    Hidden
                  </span>
                )}
                {item.in_carousel && item.is_published && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gold-300)] text-[var(--indigo-deep)] flex items-center gap-1">
                    <Icon name="view_carousel" size={11} /> Carousel
                  </span>
                )}
              </div>

              <div className="p-3 flex-1 flex flex-col gap-2">
                <p className="font-semibold text-sm text-[var(--indigo-deep)] line-clamp-1">
                  {item.title || <span className="text-[var(--text-muted)] italic">Untitled</span>}
                </p>
                {item.caption && (
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{item.caption}</p>
                )}

                {/* Toggles */}
                <div className="flex items-center gap-3 mt-auto pt-2">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.is_published}
                      onChange={() => toggle(item, 'is_published')}
                      className="accent-[var(--indigo-deep)] w-4 h-4"
                    />
                    Published
                  </label>
                  <label
                    className={`flex items-center gap-1.5 text-xs select-none ${
                      item.is_published ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                    }`}
                    title={item.is_published ? '' : 'Publish the image first'}
                  >
                    <input
                      type="checkbox"
                      checked={item.in_carousel}
                      disabled={!item.is_published}
                      onChange={() => toggle(item, 'in_carousel')}
                      className="accent-[var(--gold-300)] w-4 h-4"
                    />
                    Carousel
                  </label>
                </div>

                <div className="flex items-center gap-1 border-t border-[var(--border-subtle)] pt-2">
                  <button onClick={() => move(item, -1)} title="Move earlier"
                    className="p-1.5 rounded hover:bg-gray-100 text-[var(--text-secondary)]">
                    <Icon name="arrow_upward" size={15} />
                  </button>
                  <button onClick={() => move(item, 1)} title="Move later"
                    className="p-1.5 rounded hover:bg-gray-100 text-[var(--text-secondary)]">
                    <Icon name="arrow_downward" size={15} />
                  </button>
                  <button onClick={() => openEdit(item)} title="Edit details"
                    className="p-1.5 rounded hover:bg-gray-100 text-[var(--text-secondary)] ml-auto">
                    <Icon name="edit" size={15} />
                  </button>
                  <button onClick={() => remove(item)} title="Delete"
                    className="p-1.5 rounded hover:bg-red-50 text-red-600">
                    <Icon name="delete" size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
             onClick={() => !saving && setEditing(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h2 className="font-bold text-lg text-[var(--indigo-deep)]">Edit image</h2>
              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-gray-100">
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={editing.image_url} alt="" className="w-full h-48 object-cover" />

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                       className="input-divine w-full" placeholder="Ganesh Chaturthi 2026" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Caption</label>
                <textarea value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })}
                          rows={2} className="input-divine w-full" placeholder="Shown under the image on the gallery page" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                          className="input-divine w-full capitalize">
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Date taken</label>
                  <input type="date" value={form.taken_at}
                         onChange={e => setForm({ ...form, taken_at: e.target.value })}
                         className="input-divine w-full" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Alt text <span className="font-normal">- describes the image for screen readers</span>
                </label>
                <input value={form.alt_text} onChange={e => setForm({ ...form, alt_text: e.target.value })}
                       className="input-divine w-full" placeholder="Devotees offering flowers at the temple" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Credit</label>
                  <input value={form.credit} onChange={e => setForm({ ...form, credit: e.target.value })}
                         className="input-divine w-full" placeholder="Photo: name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Sort order</label>
                  <input type="number" value={form.display_order}
                         onChange={e => setForm({ ...form, display_order: Number(e.target.value) })}
                         className="input-divine w-full" />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_published}
                         onChange={e => setForm({
                           ...form,
                           is_published: e.target.checked,
                           // Un-publishing must also drop it from the carousel,
                           // otherwise a hidden image keeps a carousel slot.
                           in_carousel: e.target.checked ? form.in_carousel : false,
                         })}
                         className="accent-[var(--indigo-deep)] w-4 h-4" />
                  Published <span className="text-[var(--text-muted)]">- visible on /gallery</span>
                </label>
                <label className={`flex items-center gap-2 text-sm ${form.is_published ? 'cursor-pointer' : 'opacity-40'}`}>
                  <input type="checkbox" checked={form.in_carousel} disabled={!form.is_published}
                         onChange={e => setForm({ ...form, in_carousel: e.target.checked })}
                         className="accent-[var(--gold-300)] w-4 h-4" />
                  Show in homepage carousel
                </label>
              </div>
            </div>

            <div className="p-5 border-t border-[var(--border-subtle)] flex justify-end gap-2">
              <button onClick={() => setEditing(null)} disabled={saving}
                      className="px-4 py-2 text-sm rounded-lg border border-[var(--border-subtle)] hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="btn-divine text-sm px-5 py-2 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

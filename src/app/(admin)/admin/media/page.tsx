'use client'

import SudarshanLoader from '@/components/SudarshanLoader'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

import Icon from '@/components/ui/Icon'

interface Feature {
  id: string
  outlet: string
  logo_text: string | null
  logo_url: string | null
  logo_color: string
  headline: string
  excerpt: string | null
  category: string
  article_url: string | null
  published_on: string | null
  is_published: boolean
  display_order: number
}

interface Award {
  id: string
  title: string
  organisation: string | null
  year: string | null
  icon: string
  is_published: boolean
  display_order: number
}

const CATEGORIES = ['Feature', 'Interview', 'Startup', 'Technology', 'Business', 'Analysis', 'Opinion', 'Review']

const LOGO_COLORS = [
  { label: 'Indigo', value: 'bg-[var(--indigo-deep)]' },
  { label: 'Saffron', value: 'bg-[var(--saffron)]' },
  { label: 'Terracotta', value: 'bg-[var(--terracotta)]' },
  { label: 'Plum', value: 'bg-[var(--plum)]' },
  { label: 'Red', value: 'bg-red-600' },
  { label: 'Teal', value: 'bg-teal-700' },
  { label: 'Emerald', value: 'bg-emerald-700' },
  { label: 'Slate', value: 'bg-slate-700' },
]

const EMPTY_FEATURE = {
  outlet: '', logo_text: '', logo_url: '', logo_color: LOGO_COLORS[0].value,
  headline: '', excerpt: '', category: 'Feature', article_url: '',
  published_on: '', is_published: false, display_order: 0,
}
const EMPTY_AWARD = {
  title: '', organisation: '', year: '', icon: 'trophy',
  is_published: false, display_order: 0,
}

export default function AdminMediaPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'features' | 'awards'>('features')
  const [features, setFeatures] = useState<Feature[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [fModal, setFModal] = useState<'create' | 'edit' | null>(null)
  const [fEditing, setFEditing] = useState<Feature | null>(null)
  const [fForm, setFForm] = useState<typeof EMPTY_FEATURE>(EMPTY_FEATURE)

  const [aModal, setAModal] = useState<'create' | 'edit' | null>(null)
  const [aEditing, setAEditing] = useState<Award | null>(null)
  const [aForm, setAForm] = useState<typeof EMPTY_AWARD>(EMPTY_AWARD)

  async function load() {
    const [f, a] = await Promise.all([
      supabase.from('media_features').select('*')
        .order('display_order', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('media_awards').select('*')
        .order('display_order', { ascending: true }).order('created_at', { ascending: false }),
    ])
    if (f.error) toast.error(`Press: ${f.error.message}`)
    if (a.error) toast.error(`Awards: ${a.error.message}`)
    if (f.data) setFeatures(f.data as Feature[])
    if (a.data) setAwards(a.data as Award[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Press features ────────────────────────────────────────────────────────
  function openFeature(item?: Feature) {
    if (item) {
      setFEditing(item)
      setFForm({
        outlet: item.outlet, logo_text: item.logo_text || '', logo_url: item.logo_url || '',
        logo_color: item.logo_color, headline: item.headline, excerpt: item.excerpt || '',
        category: item.category, article_url: item.article_url || '',
        published_on: item.published_on || '', is_published: item.is_published,
        display_order: item.display_order,
      })
      setFModal('edit')
    } else {
      setFEditing(null)
      setFForm({ ...EMPTY_FEATURE, display_order: features.length })
      setFModal('create')
    }
  }

  async function saveFeature() {
    if (!fForm.outlet.trim() || !fForm.headline.trim()) {
      toast.error('Outlet and headline are required'); return
    }
    setSaving(true)
    const payload = {
      outlet: fForm.outlet.trim(),
      logo_text: fForm.logo_text.trim() || null,
      logo_url: fForm.logo_url.trim() || null,
      logo_color: fForm.logo_color,
      headline: fForm.headline.trim(),
      excerpt: fForm.excerpt.trim() || null,
      category: fForm.category,
      article_url: fForm.article_url.trim() || null,
      published_on: fForm.published_on || null,
      is_published: fForm.is_published,
      display_order: Number(fForm.display_order) || 0,
    }
    const { error } = fEditing
      ? await supabase.from('media_features').update(payload).eq('id', fEditing.id)
      : await supabase.from('media_features').insert(payload)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(fEditing ? 'Coverage updated' : 'Coverage added')
    setFModal(null); load()
  }

  async function toggleFeature(item: Feature) {
    const next = !item.is_published
    setFeatures(prev => prev.map(f => (f.id === item.id ? { ...f, is_published: next } : f)))
    const { error } = await supabase.from('media_features').update({ is_published: next }).eq('id', item.id)
    if (error) { toast.error(error.message); load(); return }
    toast.success(next ? 'Now live on /in-media' : 'Hidden from the public page')
  }

  async function deleteFeature(item: Feature) {
    if (!confirm(`Delete the ${item.outlet} coverage permanently?`)) return
    const { error } = await supabase.from('media_features').delete().eq('id', item.id)
    if (error) { toast.error(error.message); return }
    toast.success('Deleted'); load()
  }

  // ── Awards ────────────────────────────────────────────────────────────────
  function openAward(item?: Award) {
    if (item) {
      setAEditing(item)
      setAForm({
        title: item.title, organisation: item.organisation || '', year: item.year || '',
        icon: item.icon, is_published: item.is_published, display_order: item.display_order,
      })
      setAModal('edit')
    } else {
      setAEditing(null)
      setAForm({ ...EMPTY_AWARD, display_order: awards.length })
      setAModal('create')
    }
  }

  async function saveAward() {
    if (!aForm.title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    const payload = {
      title: aForm.title.trim(),
      organisation: aForm.organisation.trim() || null,
      year: aForm.year.trim() || null,
      icon: aForm.icon.trim() || 'trophy',
      is_published: aForm.is_published,
      display_order: Number(aForm.display_order) || 0,
    }
    const { error } = aEditing
      ? await supabase.from('media_awards').update(payload).eq('id', aEditing.id)
      : await supabase.from('media_awards').insert(payload)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(aEditing ? 'Award updated' : 'Award added')
    setAModal(null); load()
  }

  async function toggleAward(item: Award) {
    const next = !item.is_published
    setAwards(prev => prev.map(a => (a.id === item.id ? { ...a, is_published: next } : a)))
    const { error } = await supabase.from('media_awards').update({ is_published: next }).eq('id', item.id)
    if (error) { toast.error(error.message); load(); return }
    toast.success(next ? 'Award is now visible' : 'Award hidden')
  }

  async function deleteAward(item: Award) {
    if (!confirm(`Delete "${item.title}" permanently?`)) return
    const { error } = await supabase.from('media_awards').delete().eq('id', item.id)
    if (error) { toast.error(error.message); return }
    toast.success('Deleted'); load()
  }

  if (loading) return <SudarshanLoader />

  const livePress = features.filter(f => f.is_published).length
  const liveAwards = awards.filter(a => a.is_published).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: 'var(--font-display)' }}>
            Press &amp; Media
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Powers the <span className="font-medium">/in-media</span> page &middot; {livePress} live coverage {livePress === 1 ? 'item' : 'items'} &middot; {liveAwards} live {liveAwards === 1 ? 'award' : 'awards'}
          </p>
        </div>
        <button
          onClick={() => (tab === 'features' ? openFeature() : openAward())}
          className="btn-divine text-sm px-5 py-2.5 flex items-center gap-2"
        >
          <Icon name="add" size={16} />
          {tab === 'features' ? 'Add coverage' : 'Add award'}
        </button>
      </div>

      {features.length === 0 && awards.length === 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <Icon name="info" size={18} className="text-amber-700 mt-0.5" />
          <p className="text-sm text-amber-900">
            The <strong>/in-media</strong> page previously displayed six placeholder press articles that were
            written into the code. Those have been removed &mdash; the page now shows only what you add here,
            and shows a &ldquo;coverage is being compiled&rdquo; message until you publish something.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-subtle)]">
        {(['features', 'awards'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-[var(--indigo-deep)] text-[var(--indigo-deep)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--indigo-deep)]'
            }`}
          >
            {t === 'features' ? `Coverage (${features.length})` : `Awards (${awards.length})`}
          </button>
        ))}
      </div>

      {/* Coverage list */}
      {tab === 'features' && (
        !features.length ? (
          <div className="card-divine p-12 text-center">
            <Icon name="newspaper" size={44} className="text-[var(--text-muted)] mx-auto mb-3" />
            <p className="font-semibold text-[var(--indigo-deep)]">No press coverage yet</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Add real coverage as it is published.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {features.map(item => (
              <div key={item.id} className="card-divine p-4 flex items-start gap-4">
                {item.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.logo_url} alt="" className="w-11 h-11 rounded-lg object-contain bg-white border border-[var(--border-subtle)] shrink-0" />
                ) : (
                  <div className={`w-11 h-11 rounded-lg ${item.logo_color} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                    {item.logo_text || item.outlet.slice(0, 3).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-[var(--indigo-deep)]">{item.outlet}</p>
                    <span className="text-[10px] bg-[var(--warm-sand)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">{item.category}</span>
                    {!item.is_published && (
                      <span className="text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded-full">Hidden</span>
                    )}
                    {item.published_on && (
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {new Date(item.published_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[var(--indigo-deep)] mt-1 line-clamp-2">{item.headline}</p>
                  {item.excerpt && <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{item.excerpt}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer mr-2 select-none">
                    <input type="checkbox" checked={item.is_published} onChange={() => toggleFeature(item)}
                           className="accent-[var(--indigo-deep)] w-4 h-4" />
                    Live
                  </label>
                  <button onClick={() => openFeature(item)} className="p-1.5 rounded hover:bg-gray-100 text-[var(--text-secondary)]">
                    <Icon name="edit" size={15} />
                  </button>
                  <button onClick={() => deleteFeature(item)} className="p-1.5 rounded hover:bg-red-50 text-red-600">
                    <Icon name="delete" size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Awards list */}
      {tab === 'awards' && (
        !awards.length ? (
          <div className="card-divine p-12 text-center">
            <Icon name="trophy" size={44} className="text-[var(--text-muted)] mx-auto mb-3" />
            <p className="font-semibold text-[var(--indigo-deep)]">No awards yet</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">The awards block stays hidden until one is published.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {awards.map(item => (
              <div key={item.id} className="card-divine p-4 flex items-center gap-3">
                <Icon name={item.icon} size={30} className="text-[var(--saffron)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-[var(--indigo-deep)] truncate">{item.title}</p>
                    {!item.is_published && (
                      <span className="text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded-full shrink-0">Hidden</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {[item.organisation, item.year].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                    <input type="checkbox" checked={item.is_published} onChange={() => toggleAward(item)}
                           className="accent-[var(--indigo-deep)] w-4 h-4" />
                    Live
                  </label>
                  <button onClick={() => openAward(item)} className="p-1.5 rounded hover:bg-gray-100 text-[var(--text-secondary)]">
                    <Icon name="edit" size={15} />
                  </button>
                  <button onClick={() => deleteAward(item)} className="p-1.5 rounded hover:bg-red-50 text-red-600">
                    <Icon name="delete" size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Coverage modal */}
      {fModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
             onClick={() => !saving && setFModal(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h2 className="font-bold text-lg text-[var(--indigo-deep)]">
                {fModal === 'create' ? 'Add press coverage' : 'Edit coverage'}
              </h2>
              <button onClick={() => setFModal(null)} className="p-1 rounded hover:bg-gray-100"><Icon name="close" size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Outlet *</label>
                  <input value={fForm.outlet} onChange={e => setFForm({ ...fForm, outlet: e.target.value })}
                         className="input-divine w-full" placeholder="Times of India" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Date published</label>
                  <input type="date" value={fForm.published_on}
                         onChange={e => setFForm({ ...fForm, published_on: e.target.value })} className="input-divine w-full" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Headline *</label>
                <input value={fForm.headline} onChange={e => setFForm({ ...fForm, headline: e.target.value })}
                       className="input-divine w-full" placeholder="Exactly as published" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Excerpt</label>
                <textarea value={fForm.excerpt} onChange={e => setFForm({ ...fForm, excerpt: e.target.value })}
                          rows={3} className="input-divine w-full" placeholder="A short quote or summary from the article" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Article URL</label>
                <input value={fForm.article_url} onChange={e => setFForm({ ...fForm, article_url: e.target.value })}
                       className="input-divine w-full" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category</label>
                  <select value={fForm.category} onChange={e => setFForm({ ...fForm, category: e.target.value })}
                          className="input-divine w-full">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Sort order</label>
                  <input type="number" value={fForm.display_order}
                         onChange={e => setFForm({ ...fForm, display_order: Number(e.target.value) })}
                         className="input-divine w-full" />
                </div>
              </div>

              <div className="border-t border-[var(--border-subtle)] pt-4">
                <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">
                  Logo &mdash; paste an image URL, or use initials on a colour
                </p>
                <input value={fForm.logo_url} onChange={e => setFForm({ ...fForm, logo_url: e.target.value })}
                       className="input-divine w-full mb-3" placeholder="https://... (optional)" />
                {!fForm.logo_url && (
                  <div className="grid grid-cols-2 gap-3">
                    <input value={fForm.logo_text} onChange={e => setFForm({ ...fForm, logo_text: e.target.value })}
                           className="input-divine w-full" placeholder="TOI" maxLength={5} />
                    <select value={fForm.logo_color} onChange={e => setFForm({ ...fForm, logo_color: e.target.value })}
                            className="input-divine w-full">
                      {LOGO_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t border-[var(--border-subtle)]">
                <input type="checkbox" checked={fForm.is_published}
                       onChange={e => setFForm({ ...fForm, is_published: e.target.checked })}
                       className="accent-[var(--indigo-deep)] w-4 h-4" />
                Publish to /in-media
              </label>
            </div>
            <div className="p-5 border-t border-[var(--border-subtle)] flex justify-end gap-2">
              <button onClick={() => setFModal(null)} disabled={saving}
                      className="px-4 py-2 text-sm rounded-lg border border-[var(--border-subtle)] hover:bg-gray-50">Cancel</button>
              <button onClick={saveFeature} disabled={saving} className="btn-divine text-sm px-5 py-2 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Award modal */}
      {aModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
             onClick={() => !saving && setAModal(null)}>
          <div className="bg-white rounded-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h2 className="font-bold text-lg text-[var(--indigo-deep)]">
                {aModal === 'create' ? 'Add award' : 'Edit award'}
              </h2>
              <button onClick={() => setAModal(null)} className="p-1 rounded hover:bg-gray-100"><Icon name="close" size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Title *</label>
                <input value={aForm.title} onChange={e => setAForm({ ...aForm, title: e.target.value })}
                       className="input-divine w-full" placeholder="Best Spiritual Tech Platform" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Organisation</label>
                  <input value={aForm.organisation} onChange={e => setAForm({ ...aForm, organisation: e.target.value })}
                         className="input-divine w-full" placeholder="Awarding body" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Year</label>
                  <input value={aForm.year} onChange={e => setAForm({ ...aForm, year: e.target.value })}
                         className="input-divine w-full" placeholder="2026" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Icon name</label>
                  <input value={aForm.icon} onChange={e => setAForm({ ...aForm, icon: e.target.value })}
                         className="input-divine w-full" placeholder="trophy" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Sort order</label>
                  <input type="number" value={aForm.display_order}
                         onChange={e => setAForm({ ...aForm, display_order: Number(e.target.value) })}
                         className="input-divine w-full" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t border-[var(--border-subtle)]">
                <input type="checkbox" checked={aForm.is_published}
                       onChange={e => setAForm({ ...aForm, is_published: e.target.checked })}
                       className="accent-[var(--indigo-deep)] w-4 h-4" />
                Publish to /in-media
              </label>
            </div>
            <div className="p-5 border-t border-[var(--border-subtle)] flex justify-end gap-2">
              <button onClick={() => setAModal(null)} disabled={saving}
                      className="px-4 py-2 text-sm rounded-lg border border-[var(--border-subtle)] hover:bg-gray-50">Cancel</button>
              <button onClick={saveAward} disabled={saving} className="btn-divine text-sm px-5 py-2 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

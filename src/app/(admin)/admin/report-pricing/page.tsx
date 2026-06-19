'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import SudarshanLoader from '@/components/SudarshanLoader'

const DEFAULT_PRICES: Record<string, number> = {
  full_tathastu: 2999,
  astrology: 499,
  numerology: 299,
  shakti_chakra: 299,
  prakriti: 299,
  yantra_colour: 299,
  mantra_chanting: 299,
  mantra_writing: 199,
  astro_vastu: 399,
  child_development: 399,
  dmit: 499,
  colour_therapy: 299,
  psychology: 399,
}

const REPORT_META: Record<string, { label: string; icon: string; category: string }> = {
  full_tathastu:     { label: 'Full Tathastu Bundle',        icon: 'auto_awesome',   category: 'Bundle' },
  astrology:         { label: 'Kundli / Horoscope',          icon: 'brightness_7',   category: 'Astrology' },
  numerology:        { label: 'Numerology',                  icon: 'tag',            category: 'Numbers' },
  shakti_chakra:     { label: 'Chakra Analysis',             icon: 'local_florist',  category: 'Energy' },
  prakriti:          { label: 'Prakriti (Ayurveda)',         icon: 'eco',            category: 'Wellness' },
  yantra_colour:     { label: 'Yantra & Colour',             icon: 'palette',        category: 'Vastu' },
  mantra_chanting:   { label: 'Mantra Science',              icon: 'temple_hindu',   category: 'Spiritual' },
  mantra_writing:    { label: 'Likhit Japa (Mantra Lekhnan)', icon: 'edit_note',     category: 'Spiritual' },
  astro_vastu:       { label: 'Vastu Report',                icon: 'house',          category: 'Vastu' },
  child_development: { label: 'Child Development',           icon: 'child_care',     category: 'Family' },
  dmit:              { label: 'DMIT (Brain Mapping)',        icon: 'psychology',     category: 'Science' },
  colour_therapy:    { label: 'Colour Therapy',              icon: 'colorize',       category: 'Wellness' },
  psychology:        { label: 'Vedic Psychology',            icon: 'stars',          category: 'Mind' },
}

export default function ReportPricingPage() {
  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES)
  const [savedPrices, setSavedPrices] = useState<Record<string, number>>(DEFAULT_PRICES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  async function loadPrices() {
    const data = await fetch('/api/report-pricing', { cache: 'no-store' }).then(r => r.json()).catch(() => ({}))
    if (data && Object.keys(data).length > 0) {
      const merged = { ...DEFAULT_PRICES, ...data }
      setPrices(merged)
      setSavedPrices(merged)
    }
    setLoading(false)
  }

  useEffect(() => { loadPrices() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/report-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prices),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      await loadPrices()
      setLastSaved(new Date())
      toast.success('Prices saved successfully')
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    }
    setSaving(false)
  }

  function reset() {
    setPrices(savedPrices)
    toast.info('Changes discarded')
  }

  const hasChanges = Object.keys(prices).some(k => prices[k] !== savedPrices[k])
  const modifiedCount = Object.keys(prices).filter(k => prices[k] !== DEFAULT_PRICES[k]).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SudarshanLoader size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">
      {/* Header */}
      <div className="border-b border-[var(--warm-sand)] bg-white px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: 'var(--indigo-deep)' }}>
            Report Pricing
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(28,30,74,0.5)', marginTop: 3 }}>
            Prices update instantly on the generate page and payment flow.
            {lastSaved && <span className="ml-2 text-emerald-600 font-medium">Last saved {lastSaved.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {modifiedCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-700">
              {modifiedCount} custom {modifiedCount === 1 ? 'price' : 'prices'}
            </span>
          )}
          {hasChanges && (
            <button onClick={reset} className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:text-[var(--indigo-deep)] transition-colors"
              style={{ fontFamily: "'Sora', sans-serif" }}>
              Discard
            </button>
          )}
          <button
            onClick={save}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, var(--indigo-deep), var(--terracotta))', fontFamily: "'Sora', sans-serif" }}
          >
            {saving
              ? <><SudarshanLoader px={16} /><span>Saving…</span></>
              : <><span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>Save Prices</>
            }
          </button>
        </div>
      </div>

      {/* Price grid */}
      <div className="p-6 max-w-3xl">
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(REPORT_META).map(([id, { label, icon, category }]) => {
            const current = prices[id] ?? DEFAULT_PRICES[id]
            const defaultVal = DEFAULT_PRICES[id]
            const isModified = current !== defaultVal
            const unsaved = current !== savedPrices[id]

            return (
              <div key={id}
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-white transition-all"
                style={{ border: unsaved ? '1.5px solid rgba(198,125,83,0.5)' : '1px solid var(--warm-sand)' }}>
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isModified ? 'linear-gradient(135deg, var(--indigo-deep), var(--terracotta))' : 'var(--warm-sand)' }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1", color: isModified ? 'white' : 'var(--indigo-deep)' }}>{icon}</span>
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--indigo-deep)' }}>{label}</p>
                  <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 10, color: 'rgba(28,30,74,0.35)', letterSpacing: '0.04em' }}>{category} · default ₹{defaultVal}</p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {unsaved && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold">Unsaved</span>}
                  {isModified && !unsaved && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-bold">Custom</span>}
                </div>

                {/* Price input */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: 'rgba(28,30,74,0.4)' }}>₹</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={current}
                    onChange={e => setPrices(prev => ({ ...prev, [id]: Number(e.target.value) }))}
                    className="w-28 px-3 py-2 rounded-xl border text-right font-bold text-[var(--indigo-deep)] text-sm focus:outline-none transition-all"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      background: unsaved ? 'rgba(198,125,83,0.06)' : 'var(--kutch-white)',
                      borderColor: unsaved ? 'var(--terracotta)' : 'var(--warm-sand)',
                    }}
                  />
                </div>

                {/* Reset individual */}
                {isModified && (
                  <button
                    onClick={() => setPrices(prev => ({ ...prev, [id]: defaultVal }))}
                    title="Reset to default"
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--warm-sand)] transition-colors">
                    <span className="material-symbols-outlined text-[14px] text-[var(--warm-charcoal)]/40">restart_alt</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom save bar (sticky) */}
        {hasChanges && (
          <div className="fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl bg-[var(--indigo-deep)] text-white"
            style={{ backdropFilter: 'blur(10px)' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>You have unsaved changes</span>
            <button onClick={reset} className="text-white/60 hover:text-white text-sm font-semibold transition-colors"
              style={{ fontFamily: "'Sora', sans-serif" }}>Discard</button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[var(--indigo-deep)] bg-white font-bold text-sm transition-all disabled:opacity-50"
              style={{ fontFamily: "'Sora', sans-serif" }}>
              {saving ? <SudarshanLoader px={14} /> : <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>}
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

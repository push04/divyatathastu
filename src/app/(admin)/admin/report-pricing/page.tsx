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
  astro_vastu: 399,
  child_development: 399,
  dmit: 499,
  colour_therapy: 299,
  psychology: 399,
}

const LABELS: Record<string, { label: string; icon: string }> = {
  full_tathastu:     { label: 'Full Tathastu Bundle', icon: 'auto_awesome' },
  astrology:         { label: 'Kundli / Horoscope',   icon: 'brightness_7' },
  numerology:        { label: 'Numerology',            icon: 'tag' },
  shakti_chakra:     { label: 'Chakra Analysis',       icon: 'local_florist' },
  prakriti:          { label: 'Prakriti (Ayurveda)',   icon: 'eco' },
  yantra_colour:     { label: 'Yantra & Colour',       icon: 'palette' },
  mantra_chanting:   { label: 'Mantra Science',        icon: 'temple_hindu' },
  astro_vastu:       { label: 'Vastu Report',          icon: 'house' },
  child_development: { label: 'Child Development',     icon: 'child_care' },
  dmit:              { label: 'DMIT (Brain Mapping)',   icon: 'psychology' },
  colour_therapy:    { label: 'Colour Therapy',        icon: 'colorize' },
  psychology:        { label: 'Vedic Psychology',      icon: 'stars' },
}

export default function ReportPricingPage() {
  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/report-pricing')
      .then(r => r.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setPrices({ ...DEFAULT_PRICES, ...data })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/report-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prices),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Report prices saved')
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    }
    setSaving(false)
  }

  function reset() {
    setPrices(DEFAULT_PRICES)
    toast.info('Prices reset to defaults (not saved yet)')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SudarshanLoader size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>
          Report Pricing
        </h1>
        <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">
          Set prices for each report type. Changes apply immediately to checkout and report generation.
        </p>
        <div className="mt-3 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
          <span className="material-symbols-outlined text-[14px] mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          Requires a <code className="font-mono bg-amber-100 px-1 rounded">settings</code> table in Supabase with columns <code className="font-mono bg-amber-100 px-1 rounded">key TEXT PRIMARY KEY, value JSONB, updated_at TIMESTAMPTZ</code>. Run this SQL once in your Supabase SQL editor if not done yet.
        </div>
      </div>

      <div className="space-y-2.5 mb-6">
        {Object.entries(LABELS).map(([id, { label, icon }]) => (
          <div key={id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-[var(--warm-sand)]">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--indigo-deep), var(--terracotta))' }}>
              <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--indigo-deep)]">{label}</p>
              <p className="text-[10px] text-[var(--warm-charcoal)]/40 font-mono">{id}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-sm font-bold text-[var(--warm-charcoal)]/50">₹</span>
              <input
                type="number"
                min={0}
                step={1}
                value={prices[id] ?? DEFAULT_PRICES[id]}
                onChange={e => setPrices(prev => ({ ...prev, [id]: Number(e.target.value) }))}
                className="w-24 px-3 py-2 rounded-lg border border-[var(--warm-sand)] bg-[var(--kutch-white)] text-right font-bold text-[var(--indigo-deep)] text-sm focus:outline-none focus:border-[var(--saffron)] focus:ring-1 focus:ring-[var(--saffron)]"
              />
            </div>
            {prices[id] !== DEFAULT_PRICES[id] && (
              <span className="text-[10px] text-[var(--terracotta)] font-bold uppercase tracking-wider flex-shrink-0">Modified</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, var(--indigo-deep), var(--terracotta))' }}
        >
          {saving
            ? <><SudarshanLoader px={18} /><span>Saving…</span></>
            : <><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>Save Prices</>
          }
        </button>
        <button
          onClick={reset}
          className="px-5 py-3 rounded-xl font-bold text-sm border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:text-[var(--indigo-deep)] transition-colors"
        >
          Reset Defaults
        </button>
      </div>
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface FamilyMember {
  id: string
  full_name: string
  relation: string
  date_of_birth: string
  time_of_birth: string | null
  place_of_birth: string | null
  birth_latitude: number | null
  birth_longitude: number | null
  birth_timezone: string | null
}

const REPORT_TYPES = [
  { id: 'full_tathastu', label: 'Full Tathastu', icon: 'auto_awesome', desc: 'All 12 reports combined — complete life blueprint', price: 2999, badge: 'BEST VALUE' },
  { id: 'astrology', label: 'Kundli / Horoscope', icon: 'brightness_7', desc: 'Birth chart, planets, dashas, predictions', price: 499 },
  { id: 'numerology', label: 'Numerology', icon: 'tag', desc: 'Life path, destiny, lucky numbers & mobile compatibility', price: 299 },
  { id: 'shakti_chakra', label: 'Chakra Analysis', icon: 'local_florist', desc: 'All 7 chakras — balance, mantras, crystals', price: 299 },
  { id: 'prakriti', label: 'Prakriti (Ayurveda)', icon: 'eco', desc: 'Vata-Pitta-Kapha constitution + diet & herbs', price: 299 },
  { id: 'yantra_colour', label: 'Yantra & Colour', icon: 'palette', desc: 'Personal yantra, power colors, gemstone', price: 299 },
  { id: 'mantra_chanting', label: 'Mantra Science', icon: 'temple_hindu', desc: 'Personal beej mantra, likhit japa guidance', price: 299 },
  { id: 'astro_vastu', label: 'Vastu Report', icon: 'house', desc: 'Home/office direction analysis & remedies', price: 399 },
  { id: 'child_development', label: 'Child Development', icon: 'child_care', desc: 'Learning style, talents, education guidance', price: 399 },
  { id: 'dmit', label: 'DMIT (Brain Mapping)', icon: 'psychology', desc: 'Multiple intelligence profile, career fit', price: 499 },
  { id: 'colour_therapy', label: 'Colour Therapy', icon: 'colorize', desc: 'Healing colors for health, wealth & love', price: 299 },
  { id: 'psychology', label: 'Vedic Psychology', icon: 'self_improvement', desc: 'Moon sign personality, EQ, shadow work', price: 399 },
]

const STEPS = ['Select Member', 'Choose Report', 'Additional Info', 'Generate']

function GenerateReportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [selectedMember, setSelectedMember] = useState<string>(searchParams.get('member') || '')
  const [selectedReport, setSelectedReport] = useState<string>('')
  const [vastuData, setVastuData] = useState({ homeDirection: '', sleepDirection: 'south' })
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: family } = await supabase.from('families').select('id').eq('owner_id', user.id).single()
      if (!family) return
      const { data } = await supabase.from('family_members').select('id,full_name,relation,date_of_birth,time_of_birth,place_of_birth,birth_latitude,birth_longitude,birth_timezone').eq('family_id', family.id)
      if (data) setMembers(data)
    }
    load()
    if (searchParams.get('member')) setStep(1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate() {
    if (!selectedMember || !selectedReport) { toast.error('Select member and report type'); return }
    setGenerating(true)
    setProgress(10)

    const tick = setInterval(() => setProgress(p => Math.min(p + 6, 88)), 1500)

    try {
      const res = await fetch('/api/noxatra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'error',
        body: JSON.stringify({
          family_member_id: selectedMember,
          report_types: [selectedReport],
          vastu: selectedReport === 'astro_vastu' ? vastuData : undefined,
        }),
      })

      clearInterval(tick)
      setProgress(95)

      if (!res.ok) {
        let errMsg = 'Generation failed'
        try { const d = await res.json(); errMsg = d.error || errMsg } catch {}
        throw new Error(errMsg)
      }

      const data = await res.json()
      const reportId = data.results?.[0]?.report_id

      setProgress(100)
      toast.success('Report generated successfully!')
      setTimeout(() => {
        if (reportId) router.push(`/reports/${reportId}`)
        else router.push('/reports')
      }, 500)
    } catch (err: any) {
      clearInterval(tick)
      toast.error(err.message || 'Generation failed. Please try again.')
      setGenerating(false)
      setProgress(0)
    }
  }

  const canProceed = [
    selectedMember !== '',
    selectedReport !== '',
    true,
    true,
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)]">Generate Noxatra Report</h1>
        <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">AI-powered Vedic analysis in 60 seconds</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-[var(--indigo-deep)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50'}`}>
              {i < step ? <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-[var(--indigo-deep)]' : 'text-[var(--warm-charcoal)]/50'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-emerald-500' : 'bg-[var(--warm-sand)]'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Select Member */}
      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--indigo-deep)]">Select Family Member</h2>
          {members.length === 0 ? (
            <div className="card-divine p-8 text-center">
              <div className="flex justify-center mb-3"><span className="material-symbols-outlined text-[32px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>family_restroom</span></div>
              <p className="font-medium text-[var(--indigo-deep)] mb-1">No family members yet</p>
              <p className="text-sm text-[var(--warm-charcoal)]/60 mb-4">Add a family member first to generate reports</p>
              <Link href="/family/add" className="btn-divine px-6 py-2.5 text-sm">Add Member</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${selectedMember === m.id ? 'border-[var(--terracotta)] bg-[var(--warm-sand)]' : 'border-[var(--warm-sand)] bg-white hover:border-[var(--saffron)]'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${selectedMember === m.id ? 'bg-[var(--terracotta)]' : 'bg-[var(--indigo-deep)]'}`}>
                    {m.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--indigo-deep)]">{m.full_name}</p>
                    <p className="text-xs text-[var(--warm-charcoal)]/60 capitalize">{m.relation} · {new Date(m.date_of_birth).getFullYear()}</p>
                  </div>
                  {selectedMember === m.id && <span className="material-symbols-outlined text-[20px] text-[var(--terracotta)] ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Report Type */}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[var(--indigo-deep)]">Choose Report Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REPORT_TYPES.map(rt => (
              <button
                key={rt.id}
                onClick={() => setSelectedReport(rt.id)}
                className={`relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${selectedReport === rt.id ? 'border-[var(--terracotta)] bg-[var(--warm-sand)]' : 'border-[var(--warm-sand)] bg-white hover:border-[var(--saffron)]'}`}
              >
                {rt.badge && (
                  <span className="absolute top-2 right-2 text-xs bg-[var(--terracotta)] text-white px-2 py-0.5 rounded-full font-bold">{rt.badge}</span>
                )}
                <span className="material-symbols-outlined text-[24px] flex-shrink-0 text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>{rt.icon}</span>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="font-semibold text-[var(--indigo-deep)] text-sm">{rt.label}</p>
                  <p className="text-xs text-[var(--warm-charcoal)]/60 mt-0.5">{rt.desc}</p>
                  <p className="text-xs font-bold text-[var(--terracotta)] mt-1">₹{rt.price.toLocaleString('en-IN')}</p>
                </div>
                {selectedReport === rt.id && <span className="material-symbols-outlined text-[20px] text-[var(--terracotta)] ml-auto flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Additional Info */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--indigo-deep)]">Additional Information</h2>

          {selectedReport === 'astro_vastu' ? (
            <div className="card-divine p-6 space-y-4">
              <p className="text-sm text-[var(--warm-charcoal)]/70 mb-2">Vastu report requires a few details about your home.</p>
              <div>
                <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Main Door Direction</label>
                <select value={vastuData.homeDirection} onChange={e => setVastuData(v => ({ ...v, homeDirection: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)]">
                  <option value="">Select direction</option>
                  {['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Sleep Direction (head points to)</label>
                <select value={vastuData.sleepDirection} onChange={e => setVastuData(v => ({ ...v, sleepDirection: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm">
                  {['North', 'South', 'East', 'West'].map(d => <option key={d} value={d.toLowerCase()}>{d}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="card-divine p-6 text-center">
              <div className="flex justify-center mb-3"><span className="material-symbols-outlined text-[40px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span></div>
              <p className="font-medium text-[var(--indigo-deep)]">All set!</p>
              <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">No additional information needed for this report type.</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Generate */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--indigo-deep)]">Ready to Generate</h2>

          {!generating ? (
            <>
              <div className="card-divine p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--warm-charcoal)]/60">Member</span>
                  <span className="font-medium text-[var(--indigo-deep)]">{members.find(m => m.id === selectedMember)?.full_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--warm-charcoal)]/60">Report Type</span>
                  <span className="font-medium text-[var(--indigo-deep)]">{REPORT_TYPES.find(r => r.id === selectedReport)?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--warm-charcoal)]/60">Powered by</span>
                  <span className="font-medium text-[var(--indigo-deep)]">Noxatra AI</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--warm-charcoal)]/60">Est. Time</span>
                  <span className="font-medium text-[var(--indigo-deep)]">~30-60 seconds</span>
                </div>
              </div>

              <button onClick={handleGenerate} className="btn-divine w-full py-4 text-base font-bold inline-flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> Generate Report Now
              </button>
            </>
          ) : (
            <div className="card-divine p-8 text-center space-y-4">
              <div className="text-5xl animate-spin-slow">ॐ</div>
              <div>
                <p className="font-bold text-[var(--indigo-deep)] text-lg">Calculating divine insights...</p>
                <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">Analysing birth chart · Computing dashas · Generating predictions</p>
              </div>
              <div className="bg-[var(--warm-sand)] rounded-full h-2.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--terracotta)] to-[var(--saffron)] transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-sm font-medium text-[var(--terracotta)]">{progress}%</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      {!generating && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 rounded-lg border border-[var(--warm-sand)] text-sm font-medium text-[var(--warm-charcoal)]/60 hover:border-[var(--indigo-deep)] hover:text-[var(--indigo-deep)] disabled:opacity-30 transition-all"
          >
            <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">arrow_back</span>Back</span>
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed[step]}
              className="btn-divine px-6 py-2 text-sm disabled:opacity-40 inline-flex items-center gap-1"
            >
              Continue <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default function GenerateReportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow">ॐ</div></div>}>
      <GenerateReportContent />
    </Suspense>
  )
}

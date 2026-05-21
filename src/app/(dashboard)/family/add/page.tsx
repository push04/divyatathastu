'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

const RELATIONS = ['Self', 'Wife', 'Husband', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other']

const TIMEZONES = [
  { label: 'India Standard Time (IST, UTC+5:30)', value: 'Asia/Kolkata' },
  { label: 'UTC', value: 'UTC' },
  { label: 'US Eastern (EST, UTC-5)', value: 'America/New_York' },
  { label: 'US Pacific (PST, UTC-8)', value: 'America/Los_Angeles' },
  { label: 'UK (GMT, UTC+0)', value: 'Europe/London' },
  { label: 'Dubai (GST, UTC+4)', value: 'Asia/Dubai' },
  { label: 'Singapore (SGT, UTC+8)', value: 'Asia/Singapore' },
  { label: 'Australia (AEST, UTC+10)', value: 'Australia/Sydney' },
]

export default function AddMemberPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    relation: 'Self',
    gender: 'male',
    dob: '',
    birth_time: '',
    birth_city: '',
    birth_state: '',
    birth_country: 'India',
    birth_lat: '',
    birth_lng: '',
    timezone: 'Asia/Kolkata',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.dob || !form.relation) {
      toast.error('Please fill all required fields')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let { data: family } = await supabase.from('families').select('id').eq('owner_id', user.id).single()

      if (!family) {
        const { data: newFamily } = await supabase.from('families').insert({
          owner_id: user.id,
          family_name: `${form.name}'s Family`,
        }).select().single()
        family = newFamily
      }

      if (!family) throw new Error('Family not found')

      // Geocode city if lat/lng not provided
      let lat = parseFloat(form.birth_lat) || null
      let lng = parseFloat(form.birth_lng) || null

      if (!lat && form.birth_city) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.birth_city + ', ' + form.birth_country)}&format=json&limit=1`)
          const data = await res.json()
          if (data[0]) { lat = parseFloat(data[0].lat); lng = parseFloat(data[0].lon) }
        } catch {}
      }

      const { data: member, error } = await supabase.from('family_members').insert({
        family_id: family.id,
        full_name: form.name,
        relation: form.relation.toLowerCase(),
        gender: form.gender as 'male' | 'female' | 'other',
        date_of_birth: form.dob,
        time_of_birth: form.birth_time || null,
        place_of_birth: [form.birth_city, form.birth_state, form.birth_country].filter(Boolean).join(', '),
        birth_latitude: lat,
        birth_longitude: lng,
        birth_timezone: form.timezone,
      }).select().single()

      if (error) throw error
      if (!member) throw new Error('Failed to create family member')

      toast.success(`${form.name} added to your family!`)
      router.push(`/family/${member.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/family" className="text-sm text-[var(--terracotta)] hover:underline inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Family</Link>
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)] mt-3">Add Family Member</h1>
        <p className="text-sm text-[var(--warm-charcoal)]/60 mt-1">Birth details help generate accurate Vedic astrology reports</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card-divine p-6 space-y-4">
          <h2 className="font-bold text-[var(--indigo-deep)] text-sm uppercase tracking-wider">Basic Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Rajesh Kumar Sharma"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)] focus:ring-1 focus:ring-[var(--saffron)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Relation *</label>
              <select
                value={form.relation}
                onChange={e => set('relation', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)]"
                required
              >
                {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Gender</label>
            <div className="flex gap-3">
              {['male', 'female', 'other'].map(g => (
                <button
                  type="button"
                  key={g}
                  onClick={() => set('gender', g)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium capitalize transition-all ${form.gender === g ? 'bg-[var(--indigo-deep)] text-white border-[var(--indigo-deep)]' : 'bg-white text-[var(--warm-charcoal)] border-[var(--warm-sand)] hover:border-[var(--indigo-deep)]'}`}
                >
                  {g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Other'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Birth Details */}
        <div className="card-divine p-6 space-y-4">
          <h2 className="font-bold text-[var(--indigo-deep)] text-sm uppercase tracking-wider">Birth Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Date of Birth *</label>
              <input
                type="date"
                value={form.dob}
                onChange={e => set('dob', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">
                Birth Time <span className="text-[var(--warm-charcoal)]/40 font-normal">(for Kundli)</span>
              </label>
              <input
                type="time"
                value={form.birth_time}
                onChange={e => set('birth_time', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Birth City</label>
            <input
              type="text"
              value={form.birth_city}
              onChange={e => set('birth_city', e.target.value)}
              placeholder="e.g. Varanasi"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)]"
            />
            <p className="text-xs text-[var(--warm-charcoal)]/40 mt-1">We'll automatically find the coordinates</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">State / Province</label>
              <input
                type="text"
                value={form.birth_state}
                onChange={e => set('birth_state', e.target.value)}
                placeholder="e.g. Uttar Pradesh"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Country</label>
              <input
                type="text"
                value={form.birth_country}
                onChange={e => set('birth_country', e.target.value)}
                placeholder="India"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Timezone</label>
            <select
              value={form.timezone}
              onChange={e => set('timezone', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)]"
            >
              {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </select>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-[var(--warm-sand)] rounded-xl p-4 text-sm text-[var(--warm-charcoal)]/70">
          <p className="font-medium text-[var(--indigo-deep)] mb-1 inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span> Privacy & Security</p>
          <p>Birth details are encrypted and used only for generating personalized Vedic reports. We never share your data.</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-divine w-full py-3 text-base font-semibold disabled:opacity-50"
        >
          {saving ? 'Adding Member...' : 'Add to Family'}
        </button>
      </form>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CITIES, getSavedCity, saveCity, type CityCoords } from '@/lib/utils/getLocation'
import { useBundlePrice } from '@/lib/hooks/useBundlePrice'

interface Profile {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: string
  created_at: string
}

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [preferredCity, setPreferredCity] = useState<CityCoords | null>(null)
  const { price: bundlePrice, sale_price: bundleSalePrice } = useBundlePrice()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) { setProfile(data); setForm({ full_name: data.full_name, phone: data.phone || '' }) }
      setPreferredCity(getSavedCity())
      setLoading(false)
    }
    load()
  }, [])

  async function saveProfile() {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone }).eq('id', profile!.id)
    if (error) toast.error('Failed to save'); else toast.success('Profile updated!')
    setSaving(false)
  }

  async function changePassword() {
    if (passwordForm.newPass !== passwordForm.confirm) { toast.error('Passwords do not match'); return }
    if (passwordForm.newPass.length < 8) { toast.error('Password must be at least 8 characters'); return }
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass })
    if (error) toast.error(error.message); else { toast.success('Password changed!'); setPasswordForm({ current: '', newPass: '', confirm: '' }) }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function deleteAccount() {
    const confirmed = prompt('Type DELETE to permanently delete your account and all data. This cannot be undone:')
    if (confirmed !== 'DELETE') return
    const res = await fetch('/api/user/delete-account', { method: 'DELETE' })
    if (res.ok) {
      toast.success('Account deleted.')
      await supabase.auth.signOut()
      router.push('/')
    } else {
      const d = await res.json()
      toast.error(d.error || 'Deletion failed. Contact support@mahatathastu.com')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow">ॐ</div></div>

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
          Settings
        </h1>
        <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="card-divine p-6 space-y-4">
        <h2 className="font-bold text-[var(--indigo-deep)]">Profile Information</h2>

        <div className="flex items-center gap-4 pb-4 border-b border-[var(--warm-sand)]">
          <div className="w-16 h-16 rounded-full bg-[var(--indigo-deep)] flex items-center justify-center text-white text-2xl font-bold">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-bold text-[var(--indigo-deep)]">{profile?.full_name}</p>
            <p className="text-sm text-[var(--warm-charcoal)]/60">{userEmail}</p>
            <span className="text-xs bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 px-2 py-0.5 rounded-full capitalize">{profile?.role} plan</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Full Name</label>
            <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXXXXXXX" className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)]" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Email</label>
          <input type="email" value={userEmail} disabled className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] text-sm bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/50" />
          <p className="text-xs text-[var(--warm-charcoal)]/40 mt-1">Email cannot be changed</p>
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-divine px-6 py-2.5 text-sm disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Panchang City */}
      <div className="card-divine p-6 space-y-4">
        <div>
          <h2 className="font-bold text-[var(--indigo-deep)]">Panchang Location</h2>
          <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">
            Panchang timings (sunrise, Rahu Kaal etc.) are calculated for your preferred city.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Preferred City</label>
          <select
            value={preferredCity?.name || ''}
            onChange={e => {
              const found = CITIES.find(c => c.name === e.target.value) || null
              if (found) { saveCity(found); setPreferredCity(found); toast.success(`Location set to ${found.name}`) }
            }}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]"
          >
            <option value="">— Use device location —</option>
            {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          {preferredCity && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-[var(--warm-charcoal)]/40">
                Saved: {preferredCity.name} ({preferredCity.lat.toFixed(4)}, {preferredCity.lng.toFixed(4)})
              </p>
              <button
                onClick={() => {
                  localStorage.removeItem('dt_preferred_city')
                  setPreferredCity(null)
                  toast.success('Reset to device location')
                }}
                className="text-xs text-[var(--terracotta)] hover:underline"
              >
                Reset to GPS
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Password */}
      <div className="card-divine p-6 space-y-4">
        <h2 className="font-bold text-[var(--indigo-deep)]">Change Password</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">New Password</label>
            <input type="password" value={passwordForm.newPass} onChange={e => setPasswordForm(f => ({ ...f, newPass: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--indigo-deep)] mb-1.5">Confirm Password</label>
            <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)]" />
          </div>
        </div>
        <button onClick={changePassword} className="px-6 py-2.5 text-sm rounded-lg border border-[var(--indigo-deep)] text-[var(--indigo-deep)] hover:bg-[var(--indigo-deep)] hover:text-white transition-all">
          Update Password
        </button>
      </div>

      {/* Plan */}
      {profile?.role === 'user' && (
        <div className="card-divine p-6">
          <h2 className="font-bold text-[var(--indigo-deep)] mb-1">Upgrade Plan</h2>
          <p className="text-sm text-[var(--warm-charcoal)]/60 mb-4">Get unlimited reports for your entire family</p>
          <div className="bg-gradient-to-r from-[var(--indigo-deep)] to-[var(--plum)] rounded-xl p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold">Full Tathastu</p>
              <p className="text-sm text-white/70">14 reports · Lifetime access · All family members</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">₹{(bundlePrice ?? 2999).toLocaleString('en-IN')}</p>
              {bundleSalePrice !== null && bundleSalePrice !== bundlePrice && (
                <p className="text-xs text-white/50 line-through">₹{bundleSalePrice.toLocaleString('en-IN')}</p>
              )}
            </div>
          </div>
          <a href="/shop" className="btn-divine w-full py-2.5 text-sm mt-3 block text-center">Upgrade Now</a>
        </div>
      )}

      {/* Account */}
      <div className="card-divine p-6 space-y-3">
        <h2 className="font-bold text-[var(--indigo-deep)]">Account</h2>
        <p className="text-sm text-[var(--warm-charcoal)]/60">Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}</p>
        <button onClick={signOut} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--warm-sand)] text-sm text-[var(--warm-charcoal)]/70 hover:border-[var(--indigo-deep)] hover:text-[var(--indigo-deep)] transition-all">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sign Out
        </button>
      </div>

      {/* Danger */}
      <div className="border border-red-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-red-700 mb-1">Danger Zone</h3>
        <p className="text-xs text-red-600/70 mb-3">Permanently delete your account and all associated data.</p>
        <button onClick={deleteAccount} className="text-sm text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50">Delete Account</button>
      </div>
    </div>
  )
}
